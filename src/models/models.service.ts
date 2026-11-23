import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginationMeta, skipOf } from '../common/dto/pagination.dto';
import { QueryModelsDto, ModelSort } from './dto/query-models.dto';
import { modelCardSelect, modelDetailSelect, toCard, toDetail } from './model.mapper';

type OrderBy = Prisma.AtlasModelOrderByWithRelationInput[];

/** Every ordering ends with a unique tiebreaker so pagination is stable. Models w/o price/date sort last. */
const ORDER_BY: Record<ModelSort, OrderBy> = {
  [ModelSort.RELEASE_DESC]: [{ releaseDate: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
  [ModelSort.RELEASE_ASC]: [{ releaseDate: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
  [ModelSort.PRICE_ASC]: [{ minInputPrice: { sort: 'asc', nulls: 'last' } }, { minOutputPrice: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
  [ModelSort.PRICE_DESC]: [{ minInputPrice: { sort: 'desc', nulls: 'last' } }, { minOutputPrice: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
  [ModelSort.CONTEXT_DESC]: [{ contextWindow: 'desc' }, { id: 'asc' }],
  [ModelSort.CONTEXT_ASC]: [{ contextWindow: 'asc' }, { id: 'asc' }],
  [ModelSort.NAME_ASC]: [{ name: 'asc' }, { id: 'asc' }],
};

@Injectable()
export class ModelsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(q: QueryModelsDto): Prisma.AtlasModelWhereInput {
    const and: Prisma.AtlasModelWhereInput[] = [];
    if (q.q) {
      const contains = { contains: q.q, mode: 'insensitive' as const };
      and.push({ OR: [{ name: contains }, { slug: contains }, { lab: { name: contains } }] });
    }
    if (q.lab?.length) and.push({ lab: { slug: { in: q.lab } } });
    if (q.provider?.length) and.push({ providers: { some: { isActive: true, provider: { slug: { in: q.provider } } } } });
    q.capability?.forEach((c) => and.push({ capabilities: { some: { capability: { slug: c } } } }));
    if (q.type) and.push({ type: q.type });
    if (q.modality) and.push({ inputModalities: { has: q.modality } });
    if (q.openSource !== undefined) and.push({ isOpenSource: q.openSource });
    if (q.minContext !== undefined) and.push({ contextWindow: { gte: q.minContext } });
    if (q.maxInputPrice !== undefined) and.push({ minInputPrice: { lte: q.maxInputPrice } });
    return and.length ? { AND: and } : {};
  }

  async list(q: QueryModelsDto) {
    const where = this.buildWhere(q);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.atlasModel.findMany({
        where,
        orderBy: ORDER_BY[q.sort],
        skip: skipOf(q),
        take: q.limit,
        select: modelCardSelect,
      }),
      this.prisma.atlasModel.count({ where }),
    ]);
    return { data: rows.map(toCard), meta: paginationMeta(total, q.page, q.limit) };
  }

  async findBySlug(slug: string) {
    const m = await this.prisma.atlasModel.findUnique({ where: { slug }, select: modelDetailSelect });
    if (!m) throw new NotFoundException(`Model '${slug}' not found`);
    return toDetail(m);
  }

  async priceHistory(slug: string) {
    const model = await this.prisma.atlasModel.findUnique({ where: { slug }, select: { id: true } });
    if (!model) throw new NotFoundException(`Model '${slug}' not found`);
    const rows = await this.prisma.priceHistory.findMany({
      where: { modelProvider: { modelId: model.id } },
      orderBy: { recordedAt: 'desc' },
      take: 200,
      select: {
        recordedAt: true,
        inputPricePerMTok: true,
        outputPricePerMTok: true,
        modelProvider: { select: { provider: { select: { slug: true, name: true } } } },
      },
    });
    return {
      data: rows.map((r) => ({
        provider: r.modelProvider.provider,
        recordedAt: r.recordedAt,
        inputPricePerMTok: r.inputPricePerMTok.toNumber(),
        outputPricePerMTok: r.outputPricePerMTok.toNumber(),
      })),
    };
  }

  async compare(slugs: string[]) {
    const rows = await this.prisma.atlasModel.findMany({ where: { slug: { in: slugs } }, select: modelDetailSelect });
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    const missing = slugs.filter((s) => !bySlug.has(s));
    if (missing.length) throw new NotFoundException(`Models not found: ${missing.join(', ')}`);

    const models = slugs.map((s) => toDetail(bySlug.get(s)!)); // keeps the order the caller asked for

    // Benchmarks: union across models, null where a model has no score, winner respects higherIsBetter.
    const bench = new Map<string, { slug: string; name: string; category: string; unit: string; higherIsBetter: boolean }>();
    models.forEach((m) => m.benchmarks.forEach((b) => bench.set(b.slug, b)));
    const benchmarks = [...bench.values()].map((b) => {
      const scores: Record<string, number | null> = {};
      let best: string | null = null;
      for (const m of models) {
        const s = m.benchmarks.find((x) => x.slug === b.slug)?.score ?? null;
        scores[m.slug] = s;
        if (s !== null && (best === null || (b.higherIsBetter ? s > scores[best]! : s < scores[best]!))) best = m.slug;
      }
      return { ...b, scores, best };
    });

    const capSlugs = [...new Set(models.flatMap((m) => m.capabilities))].sort();
    const capabilities = capSlugs.map((c) => ({
      capability: c,
      support: Object.fromEntries(models.map((m) => [m.slug, m.capabilities.includes(c)])),
    }));

    const pick = <T>(vals: (T | null)[], better: (a: T, b: T) => boolean) => {
      let idx = -1;
      vals.forEach((v, i) => { if (v !== null && (idx === -1 || better(v, vals[idx] as T))) idx = i; });
      return idx === -1 ? null : models[idx].slug;
    };
    const highlights = {
      cheapestInput: pick(models.map((m) => m.pricing.minInputPricePerMTok), (a, b) => a < b),
      cheapestOutput: pick(models.map((m) => m.pricing.minOutputPricePerMTok), (a, b) => a < b),
      largestContext: pick(models.map((m) => m.contextWindow), (a, b) => a > b),
      newest: pick(models.map((m) => (m.releaseDate ? m.releaseDate.getTime() : null)), (a, b) => a > b),
    };

    return { models, benchmarks, capabilities, highlights };
  }
}
