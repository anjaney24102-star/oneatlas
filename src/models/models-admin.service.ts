import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { upsertPricing } from '../common/pricing.util';
import { CreateModelDto, UpdateModelDto, UpsertPricingDto, UpsertScoreDto } from './dto/admin.dto';
import { modelDetailSelect, toDetail } from './model.mapper';

/** Write-side operations. Every multi-row mutation runs inside a transaction to keep data consistent. */
@Injectable()
export class ModelsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCapabilities(slugs?: string[]) {
    if (!slugs) return undefined;
    const caps = await this.prisma.capability.findMany({ where: { slug: { in: slugs } } });
    const missing = slugs.filter((s) => !caps.some((c) => c.slug === s));
    if (missing.length) throw new BadRequestException(`Unknown capabilities: ${missing.join(', ')}`);
    return caps;
  }

  private async resolveLab(slug: string) {
    const lab = await this.prisma.lab.findUnique({ where: { slug } });
    if (!lab) throw new BadRequestException(`Unknown lab '${slug}'`);
    return lab;
  }

  private assertTokens(ctx?: number, out?: number) {
    if (ctx !== undefined && out !== undefined && out > ctx)
      throw new BadRequestException('maxOutputTokens cannot exceed contextWindow');
  }

  async create(dto: CreateModelDto) {
    this.assertTokens(dto.contextWindow, dto.maxOutputTokens);
    const lab = await this.resolveLab(dto.labSlug);
    const caps = (await this.resolveCapabilities(dto.capabilities)) ?? [];
    const created = await this.prisma.atlasModel.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        labId: lab.id,
        type: dto.type,
        description: dto.description,
        contextWindow: dto.contextWindow,
        maxOutputTokens: dto.maxOutputTokens,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
        inputModalities: dto.inputModalities,
        outputModalities: dto.outputModalities,
        isOpenSource: dto.isOpenSource ?? false,
        parameterCount: dto.parameterCount,
        capabilities: { create: caps.map((c) => ({ capabilityId: c.id })) },
      },
      select: modelDetailSelect,
    });
    return toDetail(created); // duplicate slug -> Prisma P2002 -> 409 via exception filter
  }

  async update(slug: string, dto: UpdateModelDto) {
    const existing = await this.prisma.atlasModel.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException(`Model '${slug}' not found`);
    this.assertTokens(dto.contextWindow ?? existing.contextWindow, dto.maxOutputTokens ?? existing.maxOutputTokens ?? undefined);
    const lab = dto.labSlug ? await this.resolveLab(dto.labSlug) : null;
    const caps = await this.resolveCapabilities(dto.capabilities);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (caps) {
        await tx.modelCapability.deleteMany({ where: { modelId: existing.id } });
        await tx.modelCapability.createMany({ data: caps.map((c) => ({ modelId: existing.id, capabilityId: c.id })) });
      }
      return tx.atlasModel.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          labId: lab?.id,
          type: dto.type,
          description: dto.description,
          contextWindow: dto.contextWindow,
          maxOutputTokens: dto.maxOutputTokens,
          releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
          inputModalities: dto.inputModalities,
          outputModalities: dto.outputModalities,
          isOpenSource: dto.isOpenSource,
          parameterCount: dto.parameterCount,
        },
        select: modelDetailSelect,
      });
    });
    return toDetail(updated);
  }

  async remove(slug: string) {
    const existing = await this.prisma.atlasModel.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Model '${slug}' not found`);
    await this.prisma.atlasModel.delete({ where: { id: existing.id } }); // cascades to pricing/scores/capabilities
  }

  async setPricing(slug: string, providerSlug: string, dto: UpsertPricingDto) {
    return this.prisma.$transaction(async (tx) => {
      const model = await tx.atlasModel.findUnique({ where: { slug }, select: { id: true, maxOutputTokens: true } });
      if (!model) throw new NotFoundException(`Model '${slug}' not found`);
      const provider = await tx.provider.findUnique({ where: { slug: providerSlug }, select: { id: true } });
      if (!provider) throw new NotFoundException(`Provider '${providerSlug}' not found`);
      const row = await upsertPricing(tx, { modelId: model.id, providerId: provider.id, ...dto });
      return {
        model: slug,
        provider: providerSlug,
        inputPricePerMTok: row.inputPricePerMTok.toNumber(),
        outputPricePerMTok: row.outputPricePerMTok.toNumber(),
        isActive: row.isActive,
      };
    });
  }

  async setScore(slug: string, benchmarkSlug: string, dto: UpsertScoreDto) {
    const [model, benchmark] = await Promise.all([
      this.prisma.atlasModel.findUnique({ where: { slug }, select: { id: true } }),
      this.prisma.benchmark.findUnique({ where: { slug: benchmarkSlug } }),
    ]);
    if (!model) throw new NotFoundException(`Model '${slug}' not found`);
    if (!benchmark) throw new NotFoundException(`Benchmark '${benchmarkSlug}' not found`);
    if (benchmark.maxScore !== null && dto.score > benchmark.maxScore)
      throw new BadRequestException(`score cannot exceed ${benchmark.maxScore} for benchmark '${benchmarkSlug}'`);

    const data = { score: dto.score, source: dto.source ?? null, measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : null };
    const row = await this.prisma.benchmarkScore.upsert({
      where: { modelId_benchmarkId: { modelId: model.id, benchmarkId: benchmark.id } },
      create: { modelId: model.id, benchmarkId: benchmark.id, ...data },
      update: data,
    });
    return { model: slug, benchmark: benchmarkSlug, score: row.score, source: row.source, measuredAt: row.measuredAt };
  }
}
