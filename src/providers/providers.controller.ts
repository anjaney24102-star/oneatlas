import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { QueryProvidersDto } from './providers.dto';

@ApiTags('providers')
@UseInterceptors(CacheInterceptor)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'Browse inference providers' })
  list(@Query() q: QueryProvidersDto) {
    return this.providers.list(q);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Provider detail with the models it serves and its per-model pricing' })
  detail(@Param('slug') slug: string) {
    return this.providers.findBySlug(slug.toLowerCase());
  }
}
