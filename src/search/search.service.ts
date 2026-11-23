import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchDto } from './search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Global search across models, labs and providers (trigram-indexed ILIKE), run in parallel. */
  async search({ q, limit }: SearchDto) {
    const contains = { contains: q, mode: 'insensitive' as const };
    const [models, labs, providers] = await Promise.all([
      this.prisma.atlasModel.findMany({
        where: { OR: [{ name: contains }, { slug: contains }, { lab: { name: contains } }] },
        orderBy: [{ releaseDate: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
        take: limit,
        select: { slug: true, name: true, type: true, lab: { select: { slug: true, name: true } } },
      }),
      this.prisma.lab.findMany({ where: { name: contains }, orderBy: { name: 'asc' }, take: limit, select: { slug: true, name: true, country: true } }),
      this.prisma.provider.findMany({ where: { name: contains }, orderBy: { name: 'asc' }, take: limit, select: { slug: true, name: true } }),
    ]);
    return { query: q, models, labs, providers, total: models.length + labs.length + providers.length };
  }
}
