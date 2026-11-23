import { Prisma } from '@prisma/client';

export interface PricingInput {
  modelId: string;
  providerId: string;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  maxOutputTokens?: number | null;
  throughputTps?: number | null;
  latencyMs?: number | null;
  quantization?: string | null;
  isActive?: boolean;
}

/** Recompute the denormalised cheapest price on a model from its active provider offerings. */
export async function recomputeModelPricing(tx: Prisma.TransactionClient, modelId: string) {
  const agg = await tx.modelProvider.aggregate({
    where: { modelId, isActive: true },
    _min: { inputPricePerMTok: true, outputPricePerMTok: true },
  });
  await tx.atlasModel.update({
    where: { id: modelId },
    data: {
      minInputPrice: agg._min.inputPricePerMTok,
      minOutputPrice: agg._min.outputPricePerMTok,
    },
  });
}

/**
 * Single write path for provider pricing. In one transaction it:
 *  1. upserts the ModelProvider row,
 *  2. appends a PriceHistory row if the price actually changed,
 *  3. refreshes the model's denormalised min prices.
 * Used by the admin API, the seed script and the ingestion script so all of them stay consistent.
 */
export async function upsertPricing(tx: Prisma.TransactionClient, p: PricingInput) {
  const where = { modelId_providerId: { modelId: p.modelId, providerId: p.providerId } };
  const existing = await tx.modelProvider.findUnique({ where });

  const data = {
    inputPricePerMTok: p.inputPricePerMTok,
    outputPricePerMTok: p.outputPricePerMTok,
    maxOutputTokens: p.maxOutputTokens ?? null,
    throughputTps: p.throughputTps ?? null,
    latencyMs: p.latencyMs ?? null,
    quantization: p.quantization ?? null,
    isActive: p.isActive ?? true,
  };

  const row = await tx.modelProvider.upsert({
    where,
    create: { modelId: p.modelId, providerId: p.providerId, ...data },
    update: data,
  });

  const changed =
    !existing ||
    existing.inputPricePerMTok.toNumber() !== p.inputPricePerMTok ||
    existing.outputPricePerMTok.toNumber() !== p.outputPricePerMTok;
  if (changed) {
    await tx.priceHistory.create({
      data: {
        modelProviderId: row.id,
        inputPricePerMTok: p.inputPricePerMTok,
        outputPricePerMTok: p.outputPricePerMTok,
      },
    });
  }

  await recomputeModelPricing(tx, p.modelId);
  return row;
}
