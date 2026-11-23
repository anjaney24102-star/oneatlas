import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Trim } from '../common/dto/transforms';

export class QueryLabsDto extends PaginationDto {
  @IsOptional() @Trim() @IsString() @MaxLength(100)
  q?: string;

  @IsOptional() @Trim() @IsString() @MaxLength(60)
  country?: string;
}
