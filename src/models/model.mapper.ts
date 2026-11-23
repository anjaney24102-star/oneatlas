import { Prisma } from '@prisma/client';

/** Prisma Decimal -> JSON number (prices are < 1e5 with 4 dp, so safe for doubles). */
export const num = (d: Prisma.Decimal | null | undefined): number | null => (d == null ? null : d.toNumber());

/** Compact projection used by list endpoints (browse, lab detail, provider detail, search). */
export const modelCardSelect = {
  slug: true,
  name: true,
  type: true,
  description: true,
  contextWindow: true,
  maxOutputTokens: true,
  releaseDate: true,
  isOpenSource: true,
  parameterCount: true,
  inputModalities: true,
  outputModalities: true,
  minInputPrice: true,
  minOutputPrice: true,
  lab: { select: { slug: true, name: true } },
  capabilities: { select: { capability: { select: { slug: true, name: true } } } },
  _count: { select: { providers: true } },
} satisfies Prisma.AtlasModelSelect;

/** Full projection for detail + compare endpoints. */
export const modelDetailSelect = {
  ...modelCardSelect,
  providers: {
    where: { isActive: true },
    orderBy: { inputPricePerMTok: 'asc' },
    select: {
      inputPricePerMTok: true,
      outputPricePerMTok: true,
      maxOutputTokens: true,
      throughputTps: true,
      latencyMs: true,
      quantization: true,
      provider: { select: { slug: true, name: true, websiteUrl: true } },
    },
  },
  benchmarkScores: {
    select: {
      score: true,
      source: true,
      measuredAt: true,
      benchmark: { select: { slug: true, name: true, category: true, unit: true, higherIsBetter: true } },
    },
  },
} satisfies Prisma.AtlasModelSelect;

export type CardModel = Prisma.AtlasModelGetPayload<{ select: typeof modelCardSelect }>;
export type DetailModel = Prisma.AtlasModelGetPayload<{ select: typeof modelDetailSelect }>;

export function toCard(m: CardModel) {
  const { minInputPrice, minOutputPrice, capabilities, _count, ...rest } = m;
  return {
    ...rest,
    pricing: { minInputPricePerMTok: num(minInputPrice), minOutputPricePerMTok: num(minOutputPrice) },
    capabilities: capabilities.map((c) => c.capability.slug),
    providerCount: _count.providers,
  };
}

export function toDetail(m: DetailModel) {
  const { providers, benchmarkScores, ...card } = m;
  return {
    ...toCard(card),
    providers: providers.map((p) => ({
      provider: p.provider,
      pricing: { inputPricePerMTok: num(p.inputPricePerMTok), outputPricePerMTok: num(p.outputPricePerMTok) },
      maxOutputTokens: p.maxOutputTokens,
      throughputTps: p.throughputTps,
      latencyMs: p.latencyMs,
      quantization: p.quantization,
    })),
    benchmarks: benchmarkScores.map((b) => ({
      ...b.benchmark,
      score: b.score,
      source: b.source,
      measuredAt: b.measuredAt,
    })),
  };
}
