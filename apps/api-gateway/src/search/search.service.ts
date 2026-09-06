import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../offers/entities/offer.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { DealsService } from '../deals/deals.service';
import { RedisService } from '../redis/redis.service';
import { SearchQueryDto, SearchSortBy } from './dto/search-query.dto';
import { SearchResultDto, SearchFacetsDto } from './dto/search-result.dto';
import { SuggestionsResultDto } from './dto/suggestions.dto';
import { DealScoreDto } from '../deals/dto/deal-score.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly dealsService: DealsService,
    private readonly redisService: RedisService,
  ) {}

  private normalizeString(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Search offers and products with multi-criteria filters, full-text matching,
   * deal score grading, sorting, pagination, and dynamic facet aggregations.
   */
  async search(queryDto: SearchQueryDto): Promise<SearchResultDto> {
    const cacheKey = `search:${JSON.stringify(queryDto)}`;
    const cached = await this.redisService.get<SearchResultDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const page = queryDto.page && queryDto.page > 0 ? queryDto.page : 1;
    const limit = queryDto.limit && queryDto.limit > 0 ? queryDto.limit : 20;

    const qb = this.offerRepo
      .createQueryBuilder('offer')
      .innerJoinAndSelect('offer.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoinAndSelect('offer.store', 'store');

    // 1. In stock filter
    if (queryDto.inStockOnly !== false) {
      qb.andWhere('offer.availability = :availability', { availability: true });
    }

    // 2. Text Search (q) with Alias Expansion
    if (queryDto.q && queryDto.q.trim().length > 0) {
      const qLower = queryDto.q.toLowerCase().trim();
      const aliasMap: Record<string, string> = {
        ps5: 'playstation 5',
        ps4: 'playstation 4',
        switch: 'nintendo switch',
      };
      const expanded = aliasMap[qLower] || qLower;
      const rawTerm = `%${queryDto.q.trim()}%`;
      const normTerm = `%${this.normalizeString(queryDto.q)}%`;
      const expTerm = `%${expanded}%`;
      qb.andWhere(
        '(' +
          'product.normalizedName ILIKE :normTerm OR ' +
          'product.normalizedName ILIKE :expTerm OR ' +
          'product.name ILIKE :rawTerm OR ' +
          'product.name ILIKE :expTerm OR ' +
          'product.brand ILIKE :rawTerm OR ' +
          'product.model ILIKE :rawTerm OR ' +
          'product.model ILIKE :expTerm OR ' +
          'product.description ILIKE :rawTerm OR ' +
          'category.name ILIKE :rawTerm OR ' +
          'store.name ILIKE :rawTerm' +
        ')',
        { rawTerm, normTerm, expTerm },
      );
    }


    // 3. Category filters
    if (queryDto.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: queryDto.categoryId });
    }
    if (queryDto.categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug: queryDto.categorySlug.toLowerCase().trim() });
    }

    // 4. Store filters
    if (queryDto.storeId) {
      qb.andWhere('offer.storeId = :storeId', { storeId: queryDto.storeId });
    }
    if (queryDto.storeSlug) {
      qb.andWhere('store.slug = :storeSlug', { storeSlug: queryDto.storeSlug.toLowerCase().trim() });
    }

    // 5. Brand filter
    if (queryDto.brand && queryDto.brand.trim().length > 0) {
      qb.andWhere('LOWER(product.brand) = LOWER(:brand)', { brand: queryDto.brand.trim() });
    }

    // 6. Price range filters
    if (queryDto.minPrice !== undefined) {
      qb.andWhere('offer.price >= :minPrice', { minPrice: queryDto.minPrice });
    }
    if (queryDto.maxPrice !== undefined) {
      qb.andWhere('offer.price <= :maxPrice', { maxPrice: queryDto.maxPrice });
    }

    const matchedOffers = await qb.getMany();

    // 7. Calculate dynamic facets from matched offers
    const facets = this.calculateFacets(matchedOffers);

    // 8. Evaluate deal scores for each matching offer
    const scoredDeals: DealScoreDto[] = [];
    for (const offer of matchedOffers) {
      try {
        const evaluation = await this.dealsService.evaluateOffer(offer.id);
        
        // Filter by minScore
        if (queryDto.minScore !== undefined && evaluation.score < queryDto.minScore) {
          continue;
        }

        // Filter by grade
        if (queryDto.grade && evaluation.grade !== queryDto.grade) {
          continue;
        }

        scoredDeals.push(evaluation);
      } catch {
        continue;
      }
    }

    // 9. Sorting
    const sortBy = queryDto.sortBy || SearchSortBy.SCORE_DESC;
    this.sortDeals(scoredDeals, sortBy);

    // 10. Pagination
    const total = scoredDeals.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = scoredDeals.slice(startIndex, startIndex + limit);

    const result: SearchResultDto = {
      data: paginatedData,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      facets,
    };

    // Cache search result for 60 seconds
    await this.redisService.set(cacheKey, result, 60);

    return result;
  }

  /**
   * Fast autocomplete suggestions for search bar dropdown.
   */
  async getSuggestions(q: string, limit = 5): Promise<SuggestionsResultDto> {
    if (!q || q.trim().length === 0) {
      return { products: [], brands: [], categories: [] };
    }

    const trimmed = q.trim();
    const cacheKey = `suggestions:${trimmed.toLowerCase()}:${limit}`;
    const cached = await this.redisService.get<SuggestionsResultDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const rawTerm = `%${trimmed}%`;
    const normTerm = `%${this.normalizeString(trimmed)}%`;

    // 1. Matching Products
    const products = await this.productRepo
      .createQueryBuilder('product')
      .where('product.normalizedName ILIKE :normTerm OR product.name ILIKE :rawTerm', { normTerm, rawTerm })
      .orderBy('product.createdAt', 'DESC')
      .take(limit)
      .getMany();

    // 2. Matching Brands
    const brandRows = await this.productRepo
      .createQueryBuilder('product')
      .select('DISTINCT product.brand', 'brand')
      .where('product.brand ILIKE :rawTerm', { rawTerm })
      .take(limit)
      .getRawMany();

    // 3. Matching Categories
    const categories = await this.categoryRepo
      .createQueryBuilder('category')
      .where('category.name ILIKE :rawTerm OR category.slug ILIKE :rawTerm', { rawTerm })
      .take(limit)
      .getMany();

    const result: SuggestionsResultDto = {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        image: p.image,
      })),
      brands: brandRows.map((b) => b.brand).filter(Boolean),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    };

    await this.redisService.set(cacheKey, result, 120);
    return result;
  }

  private calculateFacets(offers: Offer[]): SearchFacetsDto {
    const categoryMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    const storeMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    const brandMap = new Map<string, number>();

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let totalPrice = 0;

    for (const offer of offers) {
      const price = Number(offer.price);
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
      totalPrice += price;

      // Category facet
      if (offer.product?.category) {
        const cat = offer.product.category;
        const existing = categoryMap.get(cat.id);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, count: 1 });
        }
      }

      // Store facet
      if (offer.store) {
        const st = offer.store;
        const existing = storeMap.get(st.id);
        if (existing) {
          existing.count++;
        } else {
          storeMap.set(st.id, { id: st.id, name: st.name, slug: st.slug, count: 1 });
        }
      }

      // Brand facet
      if (offer.product?.brand) {
        const brand = offer.product.brand;
        brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
      }
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
    const stores = Array.from(storeMap.values()).sort((a, b) => b.count - a.count);
    const brands = Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const priceRange = {
      min: offers.length > 0 ? minPrice : 0,
      max: offers.length > 0 ? maxPrice : 0,
      avg: offers.length > 0 ? Number((totalPrice / offers.length).toFixed(2)) : 0,
    };

    return {
      categories,
      stores,
      brands,
      priceRange,
    };
  }

  private sortDeals(deals: DealScoreDto[], sortBy: SearchSortBy): void {
    switch (sortBy) {
      case SearchSortBy.SCORE_DESC:
        deals.sort((a, b) => b.score - a.score);
        break;
      case SearchSortBy.PRICE_ASC:
        deals.sort((a, b) => Number(a.offer.price) - Number(b.offer.price));
        break;
      case SearchSortBy.PRICE_DESC:
        deals.sort((a, b) => Number(b.offer.price) - Number(a.offer.price));
        break;
      case SearchSortBy.DISCOUNT_DESC:
        deals.sort((a, b) => b.savingsPercentage - a.savingsPercentage);
        break;
      case SearchSortBy.NEWEST:
        deals.sort((a, b) => {
          const timeA = a.offer.updatedAt ? new Date(a.offer.updatedAt).getTime() : 0;
          const timeB = b.offer.updatedAt ? new Date(b.offer.updatedAt).getTime() : 0;
          return timeB - timeA;
        });
        break;
    }
  }
}
