import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginationMeta, skipOf } from '../common/dto/pagination.dto';
import { QueryRankingsDto } from './dto/query-rankings.dto';

interface Row {
  slug: string; name: string; labSlug: string; labName: string; score: number; rank: number; total: number;
  source?: string | null; benchmarksScored?: number;
}

@Injectable()
export class RankingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBenchmarks() {
    const rows = await this.prisma.benchmark.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: { slug: true, name: true, category: true, description: true, unit: true, higherIsBetter: true, maxScore: true, _count: { select: { scores: true } } },
    });
    const data = rows.map(({ _count, ...b }) => ({ ...b, modelsScored: _count.scores }));
    return { data, categories: [...new Set(data.map((b) => b.category))] };
  }

  /**
   * Leaderboards are computed in SQL with RANK(): tied scores share a rank (1,2,2,4), the rank is computed
   * *after* filters (so "best open-weights coding model" is rank 1), models without a score are simply absent,
   * and direction honours Benchmark.higherIsBetter.
   */
  async leaderboard(q: QueryRankingsDto) {
    if (q.benchmark && q.category) throw new BadRequestException('Provide either `benchmark` or `category`, not both');
    const labF = q.lab ? Prisma.sql`AND l.slug = ${q.lab}` : Prisma.empty;
    const typeF = q.type ? Prisma.sql`AND m.type = ${q.type}::"ModelType"` : Prisma.empty;
    const offset = skipOf(q);

    if (q.benchmark) {
      const bench = await this.prisma.benchmark.findUnique({ where: { slug: q.benchmark.toLowerCase() } });
      if (!bench) throw new NotFoundException(`Benchmark '${q.benchmark}' not found`);
      const dir = bench.higherIsBetter ? Prisma.sql`DESC` : Prisma.sql`ASC`;
      const rows = await this.prisma.$queryRaw<Row[]>`
        SELECT m.slug, m.name, l.slug AS "labSlug", l.name AS "labName", bs.score, bs.source,
               RANK() OVER (ORDER BY bs.score ${dir})::int AS "rank",
               COUNT(*) OVER ()::int AS total
        FROM benchmark_scores bs
        JOIN benchmarks b ON b.id = bs."benchmarkId"
        JOIN models m ON m.id = bs."modelId"
        JOIN labs l ON l.id = m."labId"
        WHERE b.id = ${bench.id} ${labF} ${typeF}
        ORDER BY "rank", m.name
        LIMIT ${q.limit} OFFSET ${offset}`;
      return this.format(rows, q, {
        scope: 'benchmark',
        benchmark: { slug: bench.slug, name: bench.name, category: bench.category, unit: bench.unit, higherIsBetter: bench.higherIsBetter },
      });
    }

    // Aggregate (category or overall): mean of scores over higher-is-better benchmarks (all on a comparable 0-100 scale).
    const catF = q.category ? Prisma.sql`AND b.category = ${q.category.toLowerCase()}` : Prisma.empty;
    if (q.category) {
      const exists = await this.prisma.benchmark.count({ where: { category: q.category.toLowerCase() } });
      if (!exists) throw new NotFoundException(`Category '${q.category}' not found`);
    }
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT m.slug, m.name, l.slug AS "labSlug", l.name AS "labName",
             ROUND(AVG(bs.score)::numeric, 2)::float AS score,
             COUNT(*)::int AS "benchmarksScored",
             RANK() OVER (ORDER BY ROUND(AVG(bs.score)::numeric, 2) DESC)::int AS "rank",
             COUNT(*) OVER ()::int AS total
      FROM benchmark_scores bs
      JOIN benchmarks b ON b.id = bs."benchmarkId"
      JOIN models m ON m.id = bs."modelId"
      JOIN labs l ON l.id = m."labId"
      WHERE b."higherIsBetter" = true ${catF} ${labF} ${typeF}
      GROUP BY m.id, l.id
      HAVING COUNT(*) >= ${q.minBenchmarks}
      ORDER BY "rank", m.name
      LIMIT ${q.limit} OFFSET ${offset}`;
    return this.format(rows, q, { scope: q.category ? 'category' : 'overall', category: q.category?.toLowerCase() ?? null });
  }

  private format(rows: Row[], q: QueryRankingsDto, extra: Record<string, unknown>) {
    const total = rows[0]?.total ?? 0;
    return {
      ...extra,
      data: rows.map(({ total: _t, labSlug, labName, ...r }) => ({ ...r, lab: { slug: labSlug, name: labName } })),
      meta: paginationMeta(total, q.page, q.limit),
    };
  }
}
