import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchSortBy } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';
import { SuggestionsQueryDto, SuggestionsResultDto } from './dto/suggestions.dto';
import { DealGrade } from '../deals/interfaces/deal-score.interface';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search products and deals with advanced multi-criteria filters, faceting and sorting',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search term' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Category UUID' })
  @ApiQuery({ name: 'categorySlug', required: false, description: 'Category slug' })
  @ApiQuery({ name: 'storeId', required: false, description: 'Store UUID' })
  @ApiQuery({ name: 'storeSlug', required: false, description: 'Store slug' })
  @ApiQuery({ name: 'brand', required: false, description: 'Brand name' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' })
  @ApiQuery({ name: 'minScore', required: false, type: Number, description: 'Minimum Deal Score (0-100)' })
  @ApiQuery({ name: 'grade', required: false, enum: DealGrade, description: 'Deal Grade' })
  @ApiQuery({ name: 'sortBy', required: false, enum: SearchSortBy, description: 'Sorting order' })
  @ApiQuery({ name: 'inStockOnly', required: false, type: Boolean, description: 'Only available items' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
  @ApiResponse({
    status: 200,
    description: 'Search results returned with matching deals, pagination, and dynamic facets',
    type: SearchResultDto,
  })
  async search(@Query() queryDto: SearchQueryDto): Promise<SearchResultDto> {
    return this.searchService.search(queryDto);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Instant autocomplete suggestions for products, brands, and categories' })
  @ApiQuery({ name: 'q', required: true, description: 'Search prefix/term' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max suggestions per type' })
  @ApiResponse({
    status: 200,
    description: 'Autocomplete suggestions',
    type: SuggestionsResultDto,
  })
  async getSuggestions(@Query() queryDto: SuggestionsQueryDto): Promise<SuggestionsResultDto> {
    return this.searchService.getSuggestions(queryDto.q, queryDto.limit ? Number(queryDto.limit) : 5);
  }
}
