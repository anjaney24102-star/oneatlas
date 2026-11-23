import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginationMeta, skipOf } from '../common/dto/pagination.dto';
import { num, modelCardSelect } from '../models/model.mapper';
import { QueryProvidersDto } from './providers.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: QueryProvidersDto) {
    const where: Prisma.ProviderWhereInput = q.q ? { name: { contains: q.q, mode: 'insensitive' } } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.provider.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: skipOf(q),
        take: q.limit,
        select: { slug: true, name: true, description: true, websiteUrl: true, _count: { select: { models: { where: { isActive: true } } } } },
      }),
      this.prisma.provider.count({ where }),
    ]);
    return {
      data: rows.map(({ _count, ...p }) => ({ ...p, modelCount: _count.models })),
      meta: paginationMeta(total, q.page, q.limit),
    };
  }

  async findBySlug(slug: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, description: true, websiteUrl: true },
    });
    if (!provider) throw new NotFoundException(`Provider '${slug}' not found`);

    const offers = await this.prisma.modelProvider.findMany({
      where: { providerId: provider.id, isActive: true },
      orderBy: [{ model: { name: 'asc' } }],
      take: 500,
      select: {
        inputPricePerMTok: true,
        outputPricePerMTok: true,
        maxOutputTokens: true,
        throughputTps: true,
        latencyMs: true,
        quantization: true,
        model: { select: { slug: true, name: true, type: true, contextWindow: true, releaseDate: true, isOpenSource: true, lab: { select: { slug: true, name: true } } } },
      },
    });

    const { id, ...rest } = provider;
    return {
      ...rest,
      modelCount: offers.length,
      models: offers.map((o) => ({
        ...o.model,
        pricing: { inputPricePerMTok: num(o.inputPricePerMTok), outputPricePerMTok: num(o.outputPricePerMTok) },
        maxOutputTokens: o.maxOutputTokens,
        throughputTps: o.throughputTps,
        latencyMs: o.latencyMs,
        quantization: o.quantization,
      })),
    };
  }
}
