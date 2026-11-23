/**
 * Data ingestion & normalisation demo.
 * Pulls OpenRouter's public model catalogue (https://openrouter.ai/api/v1/models) and normalises it into our schema:
 *   - price per *token* (string)  ->  USD per *million* tokens (number, 4dp)
 *   - "vendor/model-name" id      ->  lab + url-safe unique slug
 *   - architecture modalities     ->  Modality enum
 *   - supported_parameters        ->  capability slugs
 *   - unix `created`              ->  Date
 * Idempotent (upserts), validates every record, skips junk instead of failing the run, and prints a report.
 *
 * Usage: npm run ingest:openrouter            (needs network + a seeded DB)
 */
import { Modality, ModelType, PrismaClient } from '@prisma/client';
import { upsertPricing } from '../src/common/pricing.util';

const prisma = new PrismaClient();
const URL = 'https://openrouter.ai/api/v1/models';

// OpenRouter vendor prefix -> our lab slug
const LAB_ALIASES: Record<string, string> = {
  openai: 'openai', anthropic: 'anthropic', google: 'google-deepmind', 'meta-llama': 'meta', mistralai: 'mistral',
  deepseek: 'deepseek', qwen: 'alibaba-qwen', 'x-ai': 'xai', cohere: 'cohere', microsoft: 'microsoft', nvidia: 'nvidia',
  moonshotai: 'moonshot-ai', 'z-ai': 'zhipu-ai', amazon: 'amazon', ai21: 'ai21-labs',
};

interface ORModel {
  id: string; name?: string; description?: string; created?: number; context_length?: number;
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
  pricing?: { prompt?: string; completion?: string };
  top_provider?: { max_completion_tokens?: number | null };
  supported_parameters?: string[];
}

const MODALITY: Record<string, Modality> = { text: 'TEXT', image: 'IMAGE', audio: 'AUDIO', video: 'VIDEO', file: 'FILE' };
const toModalities = (xs?: string[]): Modality[] => [...new Set((xs ?? []).map((x) => MODALITY[x]).filter(Boolean))];
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
const titleCase = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** USD/token string -> USD per 1M tokens, or null if missing / negative (OpenRouter uses -1 for "variable") / NaN. */
function perMTok(v?: string): number | null {
  if (v === undefined || v === null) return null;
  const n = Number(v) * 1_000_000;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10_000) / 10_000;
}

async function main() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`OpenRouter responded ${res.status}`);
  const { data } = (await res.json()) as { data: ORModel[] };

  const provider = await prisma.provider.upsert({
    where: { slug: 'openrouter' },
    create: { slug: 'openrouter', name: 'OpenRouter', websiteUrl: 'https://openrouter.ai' },
    update: {},
  });
  const caps = new Map((await prisma.capability.findMany()).map((c) => [c.slug, c.id]));
  const stats = { created: 0, updated: 0, skipped: 0, conflicts: 0 };

  for (const raw of data) {
    try {
      const [vendor, rest] = raw.id.split('/');
      const input = perMTok(raw.pricing?.prompt);
      const output = perMTok(raw.pricing?.completion);
      // skip variants (":free", ":nitro"), unpriced/free-tier duplicates and malformed records
      if (!rest || raw.id.includes(':') || input === null || output === null || !raw.context_length || raw.context_length < 1) {
        stats.skipped++;
        continue;
      }

      const labSlug = LAB_ALIASES[vendor] ?? slugify(vendor);
      const lab = await prisma.lab.upsert({
        where: { slug: labSlug },
        create: { slug: labSlug, name: titleCase(vendor) },
        update: {},
      });

      const slug = slugify(rest);
      const inMods = toModalities(raw.architecture?.input_modalities);
      const outMods = toModalities(raw.architecture?.output_modalities);
      const type: ModelType = outMods.includes('IMAGE') ? 'IMAGE' : inMods.length > 1 ? 'MULTIMODAL' : 'LLM';
      const params = raw.supported_parameters ?? [];
      const capSlugs = [
        params.includes('tools') && 'tool-calling',
        (params.includes('response_format') || params.includes('structured_outputs')) && 'json-mode',
        (params.includes('reasoning') || params.includes('include_reasoning')) && 'reasoning',
        inMods.includes('IMAGE') && 'vision',
        inMods.includes('AUDIO') && 'audio-input',
      ].filter((x): x is string => !!x && caps.has(x));

      const existing = await prisma.atlasModel.findUnique({ where: { slug } });
      if (existing && existing.labId !== lab.id) {
        stats.conflicts++; // same slug owned by another lab: never overwrite
        continue;
      }
      const maxOut = raw.top_provider?.max_completion_tokens ?? null;
      const fields = {
        name: raw.name?.replace(/^[^:]+:\s*/, '') || titleCase(rest),
        description: raw.description?.slice(0, 2000),
        contextWindow: raw.context_length,
        maxOutputTokens: maxOut && maxOut <= raw.context_length ? maxOut : null,
        releaseDate: raw.created ? new Date(raw.created * 1000) : undefined,
        inputModalities: inMods.length ? inMods : (['TEXT'] as Modality[]),
        outputModalities: outMods.length ? outMods : (['TEXT'] as Modality[]),
      };

      await prisma.$transaction(async (tx) => {
        // For models we already curate (seed), only refresh price; for new ones create the full record.
        const model = existing
          ? existing
          : await tx.atlasModel.create({ data: { slug, labId: lab.id, type, ...fields } });
        if (!existing) {
          await tx.modelCapability.createMany({ data: capSlugs.map((c) => ({ modelId: model.id, capabilityId: caps.get(c)! })), skipDuplicates: true });
        }
        await upsertPricing(tx, { modelId: model.id, providerId: provider.id, inputPricePerMTok: input, outputPricePerMTok: output, maxOutputTokens: fields.maxOutputTokens });
      }, { timeout: 20_000 });

      existing ? stats.updated++ : stats.created++;
    } catch (e) {
      stats.skipped++;
      console.warn(`skip ${raw.id}: ${(e as Error).message.split('\n').pop()}`);
    }
  }
  console.log('Ingestion complete:', stats);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
