import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { ModelsAdminService } from './models-admin.service';
import { QueryModelsDto } from './dto/query-models.dto';
import { CompareModelsDto } from './dto/compare-models.dto';
import { CreateModelDto, UpdateModelDto, UpsertPricingDto, UpsertScoreDto } from './dto/admin.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('models')
@Controller('models')
export class ModelsController {
  constructor(private readonly models: ModelsService, private readonly admin: ModelsAdminService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Browse / search / filter / sort models (paginated)' })
  list(@Query() q: QueryModelsDto) {
    return this.models.list(q);
  }

  // NOTE: must be declared before ':slug' so "compare" is not captured as a slug.
  @Get('compare')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Compare 2-5 models side by side (pricing, context, capabilities, benchmarks)' })
  compare(@Query() q: CompareModelsDto) {
    return this.models.compare(q.slugs);
  }

  @Get(':slug')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Model detail: specs, providers + pricing, capabilities, benchmarks' })
  detail(@Param('slug') slug: string) {
    return this.models.findBySlug(slug.toLowerCase());
  }

  @Get(':slug/price-history')
  @ApiOperation({ summary: 'Historical price changes per provider' })
  priceHistory(@Param('slug') slug: string) {
    return this.models.priceHistory(slug.toLowerCase());
  }

  // ------------- write endpoints (x-api-key) -------------
  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Create a model' })
  create(@Body() dto: CreateModelDto) {
    return this.admin.create(dto);
  }

  @Patch(':slug')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Update a model' })
  update(@Param('slug') slug: string, @Body() dto: UpdateModelDto) {
    return this.admin.update(slug.toLowerCase(), dto);
  }

  @Delete(':slug')
  @HttpCode(204)
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Delete a model (cascades to pricing and scores)' })
  async remove(@Param('slug') slug: string) {
    await this.admin.remove(slug.toLowerCase());
  }

  @Put(':slug/providers/:providerSlug')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Upsert a provider price for a model (records history, refreshes min price)' })
  setPricing(@Param('slug') slug: string, @Param('providerSlug') providerSlug: string, @Body() dto: UpsertPricingDto) {
    return this.admin.setPricing(slug.toLowerCase(), providerSlug.toLowerCase(), dto);
  }

  @Put(':slug/benchmarks/:benchmarkSlug')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Upsert a benchmark score for a model' })
  setScore(@Param('slug') slug: string, @Param('benchmarkSlug') benchmarkSlug: string, @Body() dto: UpsertScoreDto) {
    return this.admin.setScore(slug.toLowerCase(), benchmarkSlug.toLowerCase(), dto);
  }
}
