import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Trim } from '../common/dto/transforms';

export class SearchDto {
  @Trim() @IsString() @IsNotEmpty() @MaxLength(100)
  q: string;

  /** Max results per entity type */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20)
  limit: number = 5;
}
