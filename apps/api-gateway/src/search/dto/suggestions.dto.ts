import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class SuggestionsQueryDto {
  @ApiProperty({ description: 'Search term prefix for autocomplete', minLength: 1 })
  @IsString()
  @MinLength(1)
  q!: string;

  @ApiPropertyOptional({ description: 'Limit number of suggestions per category', default: 5 })
  @IsOptional()
  limit?: number = 5;
}

export class ProductSuggestionDto {
  @ApiProperty({ description: 'Product ID' })
  id!: string;

  @ApiProperty({ description: 'Product title' })
  name!: string;

  @ApiProperty({ description: 'Product brand' })
  brand!: string;

  @ApiPropertyOptional({ description: 'Product image thumbnail' })
  image?: string;
}

export class CategorySuggestionDto {
  @ApiProperty({ description: 'Category ID' })
  id!: string;

  @ApiProperty({ description: 'Category name' })
  name!: string;

  @ApiProperty({ description: 'Category slug' })
  slug!: string;
}

export class SuggestionsResultDto {
  @ApiProperty({ type: [ProductSuggestionDto], description: 'Suggested products matching query' })
  products!: ProductSuggestionDto[];

  @ApiProperty({ type: [String], description: 'Suggested brands matching query' })
  brands!: string[];

  @ApiProperty({ type: [CategorySuggestionDto], description: 'Suggested categories matching query' })
  categories!: CategorySuggestionDto[];
}
