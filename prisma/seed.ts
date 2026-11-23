import { PrismaClient } from '@prisma/client';
import { upsertPricing } from '../src/common/pricing.util';
import { benchmarks, capabilities, labs, models, providers, SCORE_ORDER } from './data/seed-data';

const prisma = new PrismaClient();

/** Idempotent: safe to run repeatedly (everything is upserted by slug). */
async function main() {
  console.time('seed');

  for (const l of labs) await prisma.lab.upsert({ where: { slug: l.slug }, create: l, update: l });
  for (const p of providers) await prisma.provider.upsert({ where: { slug: p.slug }, create: p, update: p });
  for (const c of capabilities) await prisma.capability.upsert({ where: { slug: c.slug }, create: c, update: c });
  for (const b of benchmarks) await prisma.benchmark.upsert({ where: { slug: b.slug }, create: b, update: b });

  const [labRows, provRows, capRows, benchRows] = await Promise.all([
    prisma.lab.findMany(), prisma.provider.findMany(), prisma.capability.findMany(), prisma.benchmark.findMany(),
  ]);
  const labId = new Map(labRows.map((x) => [x.slug, x.id]));
  const provId = new Map(provRows.map((x) => [x.slug, x.id]));
  const capId = new Map(capRows.map((x) => [x.slug, x.id]));
  const benchId = new Map(benchRows.map((x) => [x.slug, x.id]));
  const need = <T>(v: T | undefined, what: string): T => {
    if (v === undefined) throw new Error(`Seed data references unknown ${what}`);
    return v;
  };

  for (const m of models) {
    await prisma.$transaction(
      async (tx) => {
        const data = {
          name: m.name,
          labId: need(labId.get(m.lab), `lab ${m.lab}`),
          type: m.type,
          description: m.description,
          contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens,
          releaseDate: new Date(m.releaseDate),
          inputModalities: m.inputModalities,
          outputModalities: m.outputModalities,
          isOpenSource: m.isOpenSource,
          parameterCount: m.parameterCount,
        };
        const model = await tx.atlasModel.upsert({ where: { slug: m.slug }, create: { slug: m.slug, ...data }, update: data });

        await tx.modelCapability.deleteMany({ where: { modelId: model.id } });
        await tx.modelCapability.createMany({
          data: m.capabilities.map((c) => ({ modelId: model.id, capabilityId: need(capId.get(c), `capability ${c}`) })),
        });

        for (const p of m.providers) {
          await upsertPricing(tx, {
            modelId: model.id,
            providerId: need(provId.get(p.provider), `provider ${p.provider}`),
            inputPricePerMTok: p.input,
            outputPricePerMTok: p.output,
            maxOutputTokens: m.maxOutputTokens,
          });
        }

        for (let i = 0; i < m.scores.length; i++) {
          const score = m.scores[i];
          if (score === null) continue;
          const benchmarkId = need(benchId.get(SCORE_ORDER[i]), `benchmark ${SCORE_ORDER[i]}`);
          const row = { score, source: 'Vendor-reported / illustrative', measuredAt: new Date(m.releaseDate) };
          await tx.benchmarkScore.upsert({
            where: { modelId_benchmarkId: { modelId: model.id, benchmarkId } },
            create: { modelId: model.id, benchmarkId, ...row },
            update: row,
          });
        }
      },
      { timeout: 30_000 },
    );
  }

  const [nm, nl, np] = await Promise.all([prisma.atlasModel.count(), prisma.lab.count(), prisma.provider.count()]);
  console.log(`Seeded: ${nm} models, ${nl} labs, ${np} providers`);
  console.timeEnd('seed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
