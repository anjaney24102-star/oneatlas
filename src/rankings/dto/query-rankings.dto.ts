import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ModelType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ToUpper, Trim } from '../../common/dto/transforms';

export class QueryRankingsDto extends PaginationDto {
  /** Benchmark slug. Ranks models on that single benchmark. Mutually exclusive with `category`. */
  @IsOptional() @Trim() @IsString() @MaxLength(60)
  benchmark?: string;

  /** Category slug (e.g. `coding`). Ranks by mean score across the category's benchmarks. Omit both for an overall ranking. */
  @IsOptional() @Trim() @IsString() @MaxLength(60)
  category?: string;

  @IsOptional() @Trim() @IsString() @MaxLength(60)
  lab?: string;

  @IsOptional() @ToUpper() @IsEnum(ModelType)
  type?: ModelType;

  /** For aggregated rankings: only include models scored on at least this many benchmarks (avoids unfair averages). */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  minBenchmarks: number = 1;
}
