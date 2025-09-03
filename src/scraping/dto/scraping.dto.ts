import { IsArray, IsOptional, IsString, IsNumber, Min, Max, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchScrapeDto {
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  products?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searchQueries?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ScrapeCategoryDto {
  @IsString()
  @IsUrl()
  categoryUrl: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SearchProductsDto {
  @IsString()
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
