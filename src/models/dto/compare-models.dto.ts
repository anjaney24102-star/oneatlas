import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsString } from 'class-validator';
import { CsvArray } from '../../common/dto/transforms';

export class CompareModelsDto {
  /** 2-5 comma-separated model slugs. e.g. `gpt-4o,claude-3-5-sonnet,gemini-2-5-pro` */
  @CsvArray() @IsArray() @ArrayMinSize(2, { message: 'slugs must contain at least 2 models' })
  @ArrayMaxSize(5, { message: 'slugs must contain at most 5 models' }) @ArrayUnique() @IsString({ each: true })
  slugs: string[];
}
