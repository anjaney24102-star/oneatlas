import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Modality, ModelType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CsvArray, ToBool, ToUpper, Trim } from '../../common/dto/transforms';

export enum ModelSort {
  RELEASE_DESC = 'release_desc',
  RELEASE_ASC = 'release_asc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  CONTEXT_DESC = 'context_desc',
  CONTEXT_ASC = 'context_asc',
  NAME_ASC = 'name_asc',
}

export class QueryModelsDto extends PaginationDto {
  /** Free-text search over model name, slug and lab name (trigram-indexed). */
  @IsOptional() @Trim() @IsString() @MaxLength(100)
  q?: string;

  /** Comma-separated lab slugs (OR). e.g. `openai,anthropic` */
  @IsOptional() @CsvArray() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  lab?: string[];

  /** Comma-separated provider slugs (OR): models hosted by any of them. */
  @IsOptional() @CsvArray() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  provider?: string[];

  /** Comma-separated capability slugs (AND): model must support all. e.g. `tool-calling,vision` */
  @IsOptional() @CsvArray() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  capability?: string[];

  @IsOptional() @ToUpper() @IsEnum(ModelType)
  type?: ModelType;

  /** Required input modality. */
  @IsOptional() @ToUpper() @IsEnum(Modality)
  modality?: Modality;

  @IsOptional() @ToBool() @IsBoolean()
  openSource?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  minContext?: number;

  /** Max cheapest-provider input price, USD per 1M tokens. */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxInputPrice?: number;

  @IsOptional() @IsEnum(ModelSort)
  sort: ModelSort = ModelSort.RELEASE_DESC;
}
