import { ApiProperty } from '@nestjs/swagger';
import { DealScoreDto } from '../../deals/dto/deal-score.dto';

export class CategoryFacetDto {
  @ApiProperty({ description: 'Category ID' })
  id!: string;

  @ApiProperty({ description: 'Category name' })
  name!: string;

  @ApiProperty({ description: 'Category slug' })
  slug!: string;

  @ApiProperty({ description: 'Number of matching offers' })
  count!: number;
}

export class StoreFacetDto {
  @ApiProperty({ description: 'Store ID' })
  id!: string;

  @ApiProperty({ description: 'Store name' })
  name!: string;

  @ApiProperty({ description: 'Store slug' })
  slug!: string;

  @ApiProperty({ description: 'Number of matching offers' })
  count!: number;
}

export class BrandFacetDto {
  @ApiProperty({ description: 'Brand name' })
  name!: string;

  @ApiProperty({ description: 'Number of matching offers' })
  count!: number;
}

export class PriceRangeFacetDto {
  @ApiProperty({ description: 'Minimum price found in results' })
  min!: number;

  @ApiProperty({ description: 'Maximum price found in results' })
  max!: number;

  @ApiProperty({ description: 'Average price of results' })
  avg!: number;
}

export class SearchFacetsDto {
  @ApiProperty({ type: [CategoryFacetDto], description: 'Category facet distribution' })
  categories!: CategoryFacetDto[];

  @ApiProperty({ type: [StoreFacetDto], description: 'Store facet distribution' })
  stores!: StoreFacetDto[];

  @ApiProperty({ type: [BrandFacetDto], description: 'Brand facet distribution' })
  brands!: BrandFacetDto[];

  @ApiProperty({ type: PriceRangeFacetDto, description: 'Price distribution statistics' })
  priceRange!: PriceRangeFacetDto;
}

export class SearchPaginationDto {
  @ApiProperty({ description: 'Total matching results count' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Results per page' })
  limit!: number;

  @ApiProperty({ description: 'Total available pages' })
  totalPages!: number;
}

export class SearchResultDto {
  @ApiProperty({ type: [DealScoreDto], description: 'Array of scored deal items' })
  data!: DealScoreDto[];

  @ApiProperty({ type: SearchPaginationDto, description: 'Pagination details' })
  pagination!: SearchPaginationDto;

  @ApiProperty({ type: SearchFacetsDto, description: 'Aggregated facets for dynamic filtering' })
  facets!: SearchFacetsDto;
}
