import {
  ArrayUnique, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString,
  Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { OmitType, PartialType } from '@nestjs/swagger';
import { Modality, ModelType } from '@prisma/client';

const SLUG = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export class CreateModelDto {
  @Matches(SLUG, { message: 'slug must be lowercase alphanumerics separated by "-" or "."' }) @MaxLength(100)
  slug: string;

  @IsString() @MinLength(1) @MaxLength(150)
  name: string;

  @IsString()
  labSlug: string;

  @IsEnum(ModelType)
  type: ModelType;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsInt() @Min(1) @Max(100_000_000)
  contextWindow: number;

  @IsOptional() @IsInt() @Min(1) @Max(100_000_000)
  maxOutputTokens?: number;

  @IsOptional() @IsDateString()
  releaseDate?: string;

  @IsArray() @ArrayUnique() @IsEnum(Modality, { each: true })
  inputModalities: Modality[];

  @IsArray() @ArrayUnique() @IsEnum(Modality, { each: true })
  outputModalities: Modality[];

  @IsOptional() @IsBoolean()
  isOpenSource?: boolean;

  @IsOptional() @IsString() @MaxLength(30)
  parameterCount?: string;

  /** Capability slugs; must already exist. */
  @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true })
  capabilities?: string[];
}

export class UpdateModelDto extends PartialType(OmitType(CreateModelDto, ['slug'] as const)) {}

export class UpsertPricingDto {
  /** USD per 1M input tokens */
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Max(100_000)
  inputPricePerMTok: number;

  /** USD per 1M output tokens */
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Max(100_000)
  outputPricePerMTok: number;

  @IsOptional() @IsInt() @Min(1)
  maxOutputTokens?: number;

  @IsOptional() @IsNumber() @Min(0)
  throughputTps?: number;

  @IsOptional() @IsInt() @Min(0)
  latencyMs?: number;

  @IsOptional() @IsString() @MaxLength(20)
  quantization?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpsertScoreDto {
  @IsNumber() @Min(0)
  score: number;

  @IsOptional() @IsString() @MaxLength(300)
  source?: string;

  @IsOptional() @IsDateString()
  measuredAt?: string;
}
