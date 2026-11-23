import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export const skipOf = (p: PaginationDto) => (p.page - 1) * p.limit;

export function paginationMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
