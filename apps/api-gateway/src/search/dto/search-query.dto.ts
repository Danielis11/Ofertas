import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { DealGrade } from '../../deals/interfaces/deal-score.interface';

export enum SearchSortBy {
  SCORE_DESC = 'score_desc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DISCOUNT_DESC = 'discount_desc',
  NEWEST = 'newest',
}

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Text search query matching product name, brand, model, or description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by category slug (e.g. electronica)' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Filter by store UUID' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by store slug (e.g. amazon-mx, mercado-libre-mx)' })
  @IsOptional()
  @IsString()
  storeSlug?: string;

  @ApiPropertyOptional({ description: 'Filter by product brand (e.g. Apple, Sony)' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum deal score threshold (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number;

  @ApiPropertyOptional({ description: 'Filter by deal grade', enum: DealGrade })
  @IsOptional()
  @IsEnum(DealGrade)
  grade?: DealGrade;

  @ApiPropertyOptional({
    description: 'Sorting criteria',
    enum: SearchSortBy,
    default: SearchSortBy.SCORE_DESC,
  })
  @IsOptional()
  @IsEnum(SearchSortBy)
  sortBy?: SearchSortBy = SearchSortBy.SCORE_DESC;

  @ApiPropertyOptional({ description: 'Filter only available/in-stock offers', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStockOnly?: boolean = true;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
