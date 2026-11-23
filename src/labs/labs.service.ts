import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginationMeta, skipOf } from '../common/dto/pagination.dto';
import { modelCardSelect, toCard } from '../models/model.mapper';
import { QueryLabsDto } from './labs.dto';

@Injectable()
export class LabsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: QueryLabsDto) {
    const where: Prisma.LabWhereInput = {
      ...(q.q ? { name: { contains: q.q, mode: 'insensitive' } } : {}),
      ...(q.country ? { country: { equals: q.country, mode: 'insensitive' } } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.lab.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: skipOf(q),
        take: q.limit,
        select: { slug: true, name: true, description: true, websiteUrl: true, country: true, foundedYear: true, logoUrl: true, _count: { select: { models: true } } },
      }),
      this.prisma.lab.count({ where }),
    ]);
    return {
      data: rows.map(({ _count, ...l }) => ({ ...l, modelCount: _count.models })),
      meta: paginationMeta(total, q.page, q.limit),
    };
  }

  async findBySlug(slug: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, name: true, description: true, websiteUrl: true, country: true, foundedYear: true, logoUrl: true,
        models: {
          orderBy: [{ releaseDate: { sort: 'desc', nulls: 'last' } }, { name: 'asc' }],
          select: modelCardSelect,
        },
      },
    });
    if (!lab) throw new NotFoundException(`Lab '${slug}' not found`);
    const { id, models, ...rest } = lab;
    // Providers that host at least one of this lab's models.
    const providers = await this.prisma.provider.findMany({
      where: { models: { some: { isActive: true, model: { labId: id } } } },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true },
    });
    return { ...rest, modelCount: models.length, models: models.map(toCard), providers };
  }
}
