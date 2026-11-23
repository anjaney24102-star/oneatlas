import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RankingsService } from './rankings.service';
import { QueryRankingsDto } from './dto/query-rankings.dto';

@ApiTags('rankings')
@UseInterceptors(CacheInterceptor)
@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankings: RankingsService) {}

  @Get()
  @ApiOperation({ summary: 'Leaderboard for a benchmark, a category (mean score) or overall' })
  leaderboard(@Query() q: QueryRankingsDto) {
    return this.rankings.leaderboard(q);
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'List benchmarks and categories available for ranking filters' })
  benchmarks() {
    return this.rankings.listBenchmarks();
  }
}
