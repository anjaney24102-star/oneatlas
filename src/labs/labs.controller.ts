import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LabsService } from './labs.service';
import { QueryLabsDto } from './labs.dto';

@ApiTags('labs')
@UseInterceptors(CacheInterceptor)
@Controller('labs')
export class LabsController {
  constructor(private readonly labs: LabsService) {}

  @Get()
  @ApiOperation({ summary: 'Browse AI labs / companies' })
  list(@Query() q: QueryLabsDto) {
    return this.labs.list(q);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Lab detail with its models (newest first) and the providers hosting them' })
  detail(@Param('slug') slug: string) {
    return this.labs.findBySlug(slug.toLowerCase());
  }
}
