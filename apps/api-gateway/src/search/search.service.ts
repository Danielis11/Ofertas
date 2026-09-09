import { Injectable, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Offer } from '../offers/entities/offer.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { DealsService } from '../deals/deals.service';
import { RedisService } from '../redis/redis.service';
import { LiveSearchService } from './live-search.service';
import { SearchQueryDto, SearchSortBy } from './dto/search-query.dto';
import { SearchResultDto, SearchFacetsDto } from './dto/search-result.dto';
import { SuggestionsResultDto } from './dto/suggestions.dto';
import { DealScoreDto } from '../deals/dto/deal-score.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

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
    @Optional() private readonly liveSearchService?: LiveSearchService,
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
    if (cached && cached.data) {
      const qLow = (queryDto.q || '').toLowerCase();
      const cachedSlugs = new Set(cached.data.map((d: any) => d.offer?.store?.slug));
      const isMissingOfficialInCache =
        ((qLow.includes('s23') || qLow.includes('s24') || qLow.includes('samsung') || qLow.includes('galaxy') || qLow.includes('buds')) && !cachedSlugs.has('samsung-mx')) ||
        ((qLow.includes('iphone') || qLow.includes('apple') || qLow.includes('macbook') || qLow.includes('airpods')) && !cachedSlugs.has('apple-mx')) ||
        ((qLow.includes('pantalon') || qLow.includes('jeans') || qLow.includes('501') || qLow.includes('levi')) && !cachedSlugs.has('levis-mx')) ||
        ((qLow.includes('licuadora') || qLow.includes('cafetera') || qLow.includes('oster')) && !cachedSlugs.has('oster-mx')) ||
        ((qLow.includes('lavadora') || qLow.includes('microondas') || qLow.includes('whirlpool')) && !cachedSlugs.has('whirlpool-mx')) ||
        ((qLow.includes('old skool') || qLow.includes('vans')) && !cachedSlugs.has('vans-mx')) ||
        ((qLow.includes('dewalt') || qLow.includes('taladro')) && !cachedSlugs.has('dewalt-mx')) ||
        ((qLow.includes('thinkpad') || qLow.includes('lenovo')) && !cachedSlugs.has('lenovo-mx')) ||
        (qLow.includes('pavilion') && !cachedSlugs.has('hp-mx')) ||
        (qLow.includes('redmi') && !cachedSlugs.has('xiaomi-mx')) ||
        ((qLow.includes('gorra') || qLow.includes('new era')) && !cachedSlugs.has('newera-mx')) ||
        ((qLow.includes('steam') || qLow.includes('resident')) && !cachedSlugs.has('steam-mx')) ||
        ((qLow.includes('epic') || qLow.includes('alan wake')) && !cachedSlugs.has('epic-games-mx')) ||
        ((qLow.includes('monitor') || qLow.includes('asus') || qLow.includes('tuf') || qLow.includes('rog')) && !cachedSlugs.has('asus-mx')) ||
        ((qLow.includes('monitor') || qLow.includes('lg') || qLow.includes('ultragear')) && !cachedSlugs.has('lg-mx')) ||
        ((qLow.includes('monitor') || qLow.includes('dell') || qLow.includes('alienware')) && !cachedSlugs.has('dell-mx'));

      if (!isMissingOfficialInCache) {
        return cached;
      }
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

    // 2. Text Search (q) with Typo Correction, Synonym Expansion & Multi-Token Matching
    let correctedQuery = queryDto.q?.trim();
    if (queryDto.q && queryDto.q.trim().length > 0) {
      const { corrected, synonyms } = this.correctAndExpandQuery(queryDto.q);
      correctedQuery = corrected;

      const rawTerm = `%${corrected}%`;
      const normTerm = `%${this.normalizeString(corrected)}%`;
      const words = corrected.split(/\s+/).filter((w) => w.length > 1);

      if (words.length === 1 && corrected.length <= 4) {
        const regexTerm = `(^|[^a-zA-Z0-9])${corrected}([^a-zA-Z0-9]|$)`;
        const singleSyn = synonyms[corrected] || corrected;
        const synRegex = `(^|[^a-zA-Z0-9])${singleSyn}([^a-zA-Z0-9]|$)`;
        qb.andWhere(
          '(' +
            'product.name ~* :regexTerm OR ' +
            'product.brand ~* :regexTerm OR ' +
            'COALESCE(product.model, \'\') ~* :regexTerm OR ' +
            'COALESCE(category.name, \'\') ~* :regexTerm OR ' +
            'COALESCE(category.slug, \'\') ~* :regexTerm OR ' +
            'store.name ~* :regexTerm OR ' +
            'product.name ~* :synRegex OR ' +
            'COALESCE(category.name, \'\') ~* :synRegex' +
          ')',
          { regexTerm, synRegex },
        );
      } else if (words.length > 1) {
        // Multi-word search with synonym support across title, brand, model, category, and store
        words.forEach((word, idx) => {
          const param = `w_${idx}`;
          const synParam = `wsyn_${idx}`;
          const wordSyn = synonyms[word] || word;

          qb.andWhere(
            '(' +
              `product.normalizedName ILIKE :${param} OR ` +
              `product.normalizedName ILIKE :${synParam} OR ` +
              `product.name ILIKE :${param} OR ` +
              `product.name ILIKE :${synParam} OR ` +
              `product.brand ILIKE :${param} OR ` +
              `COALESCE(product.model, '') ILIKE :${param} OR ` +
              `COALESCE(category.name, '') ILIKE :${param} OR ` +
              `COALESCE(category.name, '') ILIKE :${synParam} OR ` +
              `COALESCE(category.slug, '') ILIKE :${param} OR ` +
              `store.name ILIKE :${param}` +
            ')',
            { [param]: `%${word}%`, [synParam]: `%${wordSyn}%` },
          );
        });
      } else {
        const singleSyn = synonyms[corrected] || corrected;
        qb.andWhere(
          '(' +
            'product.normalizedName ILIKE :normTerm OR ' +
            'product.name ILIKE :rawTerm OR ' +
            'product.name ILIKE :synTerm OR ' +
            'product.brand ILIKE :rawTerm OR ' +
            'product.model ILIKE :rawTerm OR ' +
            'product.description ILIKE :rawTerm OR ' +
            'category.name ILIKE :rawTerm OR ' +
            'category.name ILIKE :synTerm OR ' +
            'category.slug ILIKE :normTerm OR ' +
            'store.name ILIKE :rawTerm' +
          ')',
          { rawTerm, normTerm, synTerm: `%${singleSyn}%` },
        );
      }
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
      const bNorm = queryDto.brand.trim().toLowerCase();
      if (bNorm === 'tommy hilfiger' || bNorm === 'tommy') {
        qb.andWhere('(LOWER(product.brand) ILIKE \'%tommy hilfiger%\' OR LOWER(product.brand) ILIKE \'%tommy jeans%\')');
      } else if (bNorm === 'levis' || bNorm === "levi's") {
        qb.andWhere('(LOWER(product.brand) ILIKE \'%levi%\')');
      } else if (bNorm === 'new era') {
        qb.andWhere('LOWER(product.brand) ILIKE \'%new era%\'');
      } else if (bNorm === 'lg') {
        qb.andWhere('(LOWER(product.brand) = \'lg\' OR LOWER(product.brand) ILIKE \'lg %\')');
      } else if (bNorm === 'hp') {
        qb.andWhere('(LOWER(product.brand) = \'hp\' OR LOWER(product.brand) ILIKE \'hp %\')');
      } else {
        qb.andWhere('(LOWER(product.brand) = :exactBrand OR LOWER(product.brand) ILIKE :brandLike)', {
          exactBrand: bNorm,
          brandLike: `%${bNorm}%`,
        });
      }
    }

    // 6. Price range filters
    if (queryDto.minPrice !== undefined) {
      qb.andWhere('offer.price >= :minPrice', { minPrice: queryDto.minPrice });
    }
    if (queryDto.maxPrice !== undefined) {
      qb.andWhere('offer.price <= :maxPrice', { maxPrice: queryDto.maxPrice });
    }

    let matchedOffers = await qb.getMany();

    // LIVE ON-DEMAND RESOLVER:
    // If local DB has fewer than 8 results OR if the user is looking for an official brand store
    // (Nike, Puma, Martí, Motorola, Doto, New Balance) that isn't represented yet in the matched offers,
    // trigger on-demand live federated fetch in real-time!
    const effectiveQuery = correctedQuery || queryDto.q?.trim() || '';
    const qLowerSearch = effectiveQuery.toLowerCase();

    const hasOfficialStoreOffer = (slug: string) => matchedOffers.some((o) => o.store?.slug === slug);

    const isMissingOfficial =
      ((qLowerSearch.includes('s23') || qLowerSearch.includes('s24') || qLowerSearch.includes('samsung') || qLowerSearch.includes('galaxy') || qLowerSearch.includes('buds')) && !hasOfficialStoreOffer('samsung-mx')) ||
      ((qLowerSearch.includes('iphone') || qLowerSearch.includes('macbook') || qLowerSearch.includes('airpods') || qLowerSearch.includes('apple')) && !hasOfficialStoreOffer('apple-mx')) ||
      ((qLowerSearch.includes('pantalon') || qLowerSearch.includes('jeans') || qLowerSearch.includes('501') || qLowerSearch.includes('levi')) && !hasOfficialStoreOffer('levis-mx')) ||
      ((qLowerSearch.includes('licuadora') || qLowerSearch.includes('cafetera') || qLowerSearch.includes('oster')) && !hasOfficialStoreOffer('oster-mx')) ||
      ((qLowerSearch.includes('lavadora') || qLowerSearch.includes('microondas') || qLowerSearch.includes('refrigerador') || qLowerSearch.includes('whirlpool')) && !hasOfficialStoreOffer('whirlpool-mx')) ||
      ((qLowerSearch.includes('old skool') || qLowerSearch.includes('vans')) && !hasOfficialStoreOffer('vans-mx')) ||
      ((qLowerSearch.includes('dewalt') || qLowerSearch.includes('taladro')) && !hasOfficialStoreOffer('dewalt-mx')) ||
      ((qLowerSearch.includes('thinkpad') || qLowerSearch.includes('lenovo')) && !hasOfficialStoreOffer('lenovo-mx')) ||
      ((qLowerSearch.includes('pavilion') || (qLowerSearch.includes('hp') && qLowerSearch.includes('laptop'))) && !hasOfficialStoreOffer('hp-mx')) ||
      ((qLowerSearch.includes('redmi') || qLowerSearch.includes('xiaomi') || qLowerSearch.includes('buds 4 pro')) && !hasOfficialStoreOffer('xiaomi-mx')) ||
      ((qLowerSearch.includes('gorra') || qLowerSearch.includes('new era') || qLowerSearch.includes('yankees')) && !hasOfficialStoreOffer('newera-mx')) ||
      ((qLowerSearch.includes('steam') || qLowerSearch.includes('resident') || qLowerSearch.includes('juego')) && !hasOfficialStoreOffer('steam-mx')) ||
      ((qLowerSearch.includes('epic') || qLowerSearch.includes('alan wake')) && !hasOfficialStoreOffer('epic-games-mx')) ||
      ((qLowerSearch.includes('monitor') || qLowerSearch.includes('asus') || qLowerSearch.includes('tuf') || qLowerSearch.includes('rog')) && !hasOfficialStoreOffer('asus-mx')) ||
      ((qLowerSearch.includes('monitor') || qLowerSearch.includes('lg') || qLowerSearch.includes('ultragear')) && !hasOfficialStoreOffer('lg-mx')) ||
      ((qLowerSearch.includes('monitor') || qLowerSearch.includes('dell') || qLowerSearch.includes('alienware')) && !hasOfficialStoreOffer('dell-mx')) ||
      ((qLowerSearch.includes('ps5') || qLowerSearch.includes('sony')) && !hasOfficialStoreOffer('sony-mx')) ||
      (qLowerSearch.includes('nike') && !hasOfficialStoreOffer('nike-mx')) ||
      (qLowerSearch.includes('puma') && !hasOfficialStoreOffer('puma-mx')) ||
      (qLowerSearch.includes('motorola') && !hasOfficialStoreOffer('motorola-mx'));

    const shouldResolveLive = (matchedOffers.length < 8 || isMissingOfficial) &&
      effectiveQuery.length >= 2 && this.liveSearchService;

    if (shouldResolveLive) {
      if (matchedOffers.length === 0) {
        // When local database has 0 matches, give live search up to 1.2s to find items
        try {
          const timeoutPromise = new Promise<number>((resolve) => setTimeout(() => resolve(0), 1200));
          const ingested = await Promise.race([
            this.liveSearchService.resolveLiveProducts(effectiveQuery),
            timeoutPromise,
          ]);
          if (ingested > 0) {
            matchedOffers = await qb.getMany();
          }
        } catch (err: any) {
          this.logger.debug(`Live search fallback error: ${err.message}`);
        }
      } else {
        // When local DB already has matches, return immediately to user and ingest updates in background
        this.liveSearchService.resolveLiveProducts(effectiveQuery).catch((err: any) => {
          this.logger.debug(`Background live resolution error: ${err.message}`);
        });
      }
    }

    if (queryDto.storeSlug === 'epic-games-mx' && matchedOffers.length === 0 && this.liveSearchService) {
      await this.liveSearchService.resolveLiveProducts('epic games');
      matchedOffers = await qb.getMany();
    }
    if (queryDto.storeSlug === 'steam-mx' && matchedOffers.length === 0 && this.liveSearchService) {
      await this.liveSearchService.resolveLiveProducts('steam');
      matchedOffers = await qb.getMany();
    }
    if (queryDto.storeSlug === 'asus-mx' && matchedOffers.length === 0 && this.liveSearchService) {
      await this.liveSearchService.resolveLiveProducts('asus');
      matchedOffers = await qb.getMany();
    }
    if (queryDto.storeSlug === 'lg-mx' && matchedOffers.length === 0 && this.liveSearchService) {
      await this.liveSearchService.resolveLiveProducts('lg');
      matchedOffers = await qb.getMany();
    }
    if (queryDto.storeSlug === 'dell-mx' && matchedOffers.length === 0 && this.liveSearchService) {
      await this.liveSearchService.resolveLiveProducts('dell');
      matchedOffers = await qb.getMany();
    }

    // 6.5. PG_TRGM FUZZY FALLBACK:
    // If exact token matching still returned 0 offers, fall back to trigram fuzzy similarity matching
    if (matchedOffers.length === 0 && effectiveQuery.length >= 3) {
      try {
        const fuzzyQb = this.offerRepo
          .createQueryBuilder('offer')
          .innerJoinAndSelect('offer.product', 'product')
          .innerJoinAndSelect('offer.store', 'store')
          .where('offer.availability = :avail', { avail: true })
          .andWhere(
            '(' +
              'similarity(product.name, :fTerm) > 0.18 OR ' +
              'similarity(product.brand, :fTerm) > 0.25' +
            ')',
            { fTerm: effectiveQuery },
          )
          .orderBy(`similarity(product.name, '${effectiveQuery.replace(/'/g, "''")}')`, 'DESC')
          .limit(20);

        const fuzzyMatches = await fuzzyQb.getMany();
        if (fuzzyMatches.length > 0) {
          matchedOffers = fuzzyMatches;
        }
      } catch (err: any) {
        this.logger.debug(`Fuzzy fallback query: ${err.message}`);
      }
    }

    // 7. Calculate dynamic facets from matched offers
    const facets = this.calculateFacets(matchedOffers);


    // 8. Filter candidate offers by minScore if provided
    let candidateOffers = matchedOffers;
    if (queryDto.minScore !== undefined) {
      candidateOffers = candidateOffers.filter((o) => (o.dealScore ?? 50) >= queryDto.minScore!);
    }

    // 9. Instant Multi-criteria Sorting
    const sortBy = queryDto.sortBy || SearchSortBy.SCORE_DESC;
    this.sortOffers(candidateOffers, sortBy, queryDto.q);

    // 10. Instant Pagination
    const total = candidateOffers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedOffers = candidateOffers.slice(startIndex, startIndex + limit);

    // 11. Ultra-fast batch competitor fetch & DealScore projection (sub-20ms)
    const productIds = Array.from(new Set(paginatedOffers.map((o) => o.productId).filter(Boolean)));
    const competitors = productIds.length > 0
      ? await this.offerRepo.find({
          where: { productId: In(productIds), availability: true },
          relations: { store: true },
        })
      : [];

    const competitorMap = new Map<string, typeof competitors>();
    for (const comp of competitors) {
      if (!competitorMap.has(comp.productId)) {
        competitorMap.set(comp.productId, []);
      }
      competitorMap.get(comp.productId)!.push(comp);
    }

    const paginatedData: DealScoreDto[] = paginatedOffers.map((offer) => {
      const prodCompetitors = (competitorMap.get(offer.productId) || []).filter((c) => c.id !== offer.id);
      const otherStores = prodCompetitors
        .map((c) => ({
          storeName: c.store?.name || 'Tienda',
          storeSlug: c.store?.slug || '',
          price: Number(c.price),
          url: c.url,
          isOfficialStore: c.isOfficialStore,
          sellerName: c.sellerName,
        }))
        .sort((a, b) => a.price - b.price);

      const s = offer.dealScore ?? 50;
      const savings = Number(offer.savingsPercentage ?? 0);
      const grade =
        s >= 85
          ? 'SUPER_DEAL'
          : s >= 70
          ? 'GREAT_DEAL'
          : s >= 50
          ? 'GOOD_DEAL'
          : 'FAIR';

      return {
        score: s,
        grade: grade as any,
        savingsPercentage: savings,
        factors: {
          discountFromAverage: savings,
          discountFromHistoricalMax: savings,
          isHistoricalLowest: true,
          crossStoreAdvantage: otherStores.length > 0 && otherStores[0].price > Number(offer.price)
            ? Number((((otherStores[0].price - Number(offer.price)) / otherStores[0].price) * 100).toFixed(0))
            : 0,
        },
        offer,
        otherStores,
      };
    });

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
        let brand = offer.product.brand.trim();
        const brandLower = brand.toLowerCase();
        if (
          brandLower &&
          brandLower !== 'desconocida' &&
          brandLower !== 'generica' &&
          brandLower !== 'generico' &&
          brandLower !== 'sin marca' &&
          brandLower !== 'unknown'
        ) {
          if (brandLower === 'adidas') brand = 'Adidas';
          else if (brandLower === 'xiaomi') brand = 'Xiaomi';
          else if (brandLower === 'samsung' || brandLower === 'samsung electronics' || brandLower === 'samsung galaxy') brand = 'Samsung';
          else if (brandLower === 'motorola') brand = 'Motorola';
          else if (brandLower === 'nintendo' || brandLower === 'nintendo switch') brand = 'Nintendo';
          else if (brandLower === 'nike') brand = 'Nike';
          else if (brandLower === 'sony') brand = 'Sony';
          else if (brandLower === 'apple') brand = 'Apple';
          else if (brandLower === 'asus') brand = 'ASUS';
          else if (brandLower === 'dewalt') brand = 'DeWalt';
          else if (brandLower === 'hp') brand = 'HP';
          else if (brandLower === 'lg' || brandLower === 'lg electronics') brand = 'LG';
          else if (brandLower === 'lenovo') brand = 'Lenovo';
          else if (brandLower === 'miniso') brand = 'Miniso';
          else if (brandLower === 'guess' || brandLower === 'guess jeans') brand = 'Guess';
          else if (brandLower === "levi's" || brandLower === 'levis') brand = "Levi's";
          else if (brandLower === 'reebok') brand = 'Reebok';
          else if (brandLower === 'under armour') brand = 'Under Armour';
          else if (brandLower === 'tommy hilfiger' || brandLower === 'tommy jeans') brand = 'Tommy Hilfiger';
          else if (brandLower.includes('new era')) brand = 'New Era';
          else if (brandLower === 'vans') brand = 'Vans';
          else if (brandLower === 'puma') brand = 'Puma';
          else if (brandLower === 'playstation') brand = 'PlayStation';
          else if (brandLower === 'whirlpool') brand = 'Whirlpool';
          else if (brandLower === 'oster') brand = 'Oster';
          else if (brandLower === 'dell') brand = 'Dell';
          else if (brandLower === 'hisense') brand = 'Hisense';

          brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
        }
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

  private sortOffers(offers: Offer[], sortBy: SearchSortBy, query?: string): void {
    const qLow = (query || '').toLowerCase();
    const isLookingForAccessory = qLow.includes('funda') || qLow.includes('case') || qLow.includes('estuche') || qLow.includes('mica');

    const isAccessory = (title: string) => {
      const tLow = title.toLowerCase();
      return tLow.startsWith('funda') || tLow.startsWith('estuche') || tLow.startsWith('case ') || tLow.startsWith('mica ');
    };

    const isOfficialSlug = (slug?: string) => {
      if (!slug) return false;
      return (
        !slug.includes('amazon') &&
        !slug.includes('mercado') &&
        !slug.includes('elektra') &&
        !slug.includes('doto') &&
        !slug.includes('marti') &&
        !slug.includes('cyberpuerta') &&
        !slug.includes('costco')
      );
    };

    switch (sortBy) {
      case SearchSortBy.SCORE_DESC:
        offers.sort((a, b) => {
          if (!isLookingForAccessory) {
            const aAcc = isAccessory(a.product?.name || '');
            const bAcc = isAccessory(b.product?.name || '');
            if (aAcc !== bAcc) return aAcc ? 1 : -1;
          }
          const aOfficial = isOfficialSlug(a.store?.slug) || a.isOfficialStore ? 8 : 0;
          const bOfficial = isOfficialSlug(b.store?.slug) || b.isOfficialStore ? 8 : 0;
          const aScore = (a.dealScore ?? 50) + aOfficial;
          const bScore = (b.dealScore ?? 50) + bOfficial;
          return bScore - aScore;
        });
        break;
      case SearchSortBy.PRICE_ASC:
        offers.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case SearchSortBy.PRICE_DESC:
        offers.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case SearchSortBy.DISCOUNT_DESC:
        offers.sort((a, b) => Number(b.savingsPercentage ?? 0) - Number(a.savingsPercentage ?? 0));
        break;
      case SearchSortBy.NEWEST:
        offers.sort((a, b) => {
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return timeB - timeA;
        });
        break;
    }
  }

  private sortDeals(deals: DealScoreDto[], sortBy: SearchSortBy, query?: string): void {
    const qLow = (query || '').toLowerCase();
    const isLookingForAccessory = qLow.includes('funda') || qLow.includes('case') || qLow.includes('estuche') || qLow.includes('mica');

    const isAccessory = (title: string) => {
      const tLow = title.toLowerCase();
      return tLow.startsWith('funda') || tLow.startsWith('estuche') || tLow.startsWith('case ') || tLow.startsWith('mica ');
    };

    const isOfficialSlug = (slug?: string) => {
      if (!slug) return false;
      return (
        !slug.includes('amazon') &&
        !slug.includes('mercado') &&
        !slug.includes('elektra') &&
        !slug.includes('doto') &&
        !slug.includes('marti') &&
        !slug.includes('cyberpuerta') &&
        !slug.includes('costco')
      );
    };

    switch (sortBy) {
      case SearchSortBy.SCORE_DESC:
        deals.sort((a, b) => {
          if (!isLookingForAccessory) {
            const aAcc = isAccessory(a.offer.product?.name || '');
            const bAcc = isAccessory(b.offer.product?.name || '');
            if (aAcc !== bAcc) return aAcc ? 1 : -1;
          }
          const aOfficial = isOfficialSlug(a.offer.store?.slug) ? 8 : 0;
          const bOfficial = isOfficialSlug(b.offer.store?.slug) ? 8 : 0;
          return (b.score + bOfficial) - (a.score + aOfficial);
        });
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

  /**
   * Corrects common typos in Mexican e-commerce searches and provides bidirectional synonyms.
   */
  private correctAndExpandQuery(raw: string): { corrected: string; synonyms: Record<string, string> } {
    let q = raw.toLowerCase().trim();

    // 1. Common Brand & Keyword Typo Dictionary in Mexico
    const typoReplacements: [RegExp, string][] = [
      // New Balance
      [/\b(new\s*balan[sc]e|newbalan[sc]e|balan[sc]e)\b/g, 'new balance'],
      // Nike
      [/\b(niqe|nikee|nayk)\b/g, 'nike'],
      // Adidas
      [/\b(adida|adiddas|addidas)\b/g, 'adidas'],
      // Converse
      [/\b(converce|conberse|converso)\b/g, 'converse'],
      // Puma
      [/\b(pumma)\b/g, 'puma'],
      // Samsung
      [/\b(sansung|samsun|samgung)\b/g, 'samsung'],
      // Motorola
      [/\b(mototola|motorla|motrola)\b/g, 'motorola'],
      // Xiaomi
      [/\b(xiaomy|chao\s*mi|redmy)\b/g, 'xiaomi'],
      // Running / Correr
      [/\b(runing|corer)\b/g, 'running'],
      // Basquetbol
      [/\b(basket|basquet|basquetball|basketball)\b/g, 'basquetbol'],
      // Audífonos
      [/\b(audifono|audiculares|auricular)\b/g, 'audifonos'],
      // Celulares
      [/\b(celulares|smartphones|telefonos)\b/g, 'celular'],
      // Monitores
      [/\b(monitores|monitor gamer)\b/g, 'monitor'],
      [/\b(ultragear|ultra gear)\b/g, 'ultragear'],
    ];

    for (const [pattern, repl] of typoReplacements) {
      q = q.replace(pattern, repl);
    }
    q = q.replace(/\s+/g, ' ').trim();

    // 2. Bidirectional Synonyms Map
    const synonyms: Record<string, string> = {
      correr: 'running',
      running: 'correr',
      celular: 'smartphone',
      smartphone: 'celular',
      audifonos: 'auriculares',
      auriculares: 'audifonos',
      tenis: 'calzado',
      calzado: 'tenis',
      zapatos: 'calzado',
      zapato: 'calzado',
      sneakers: 'tenis',
      ropa: 'moda',
      moda: 'ropa',
      jeans: 'pantalon',
      pantalon: 'jeans',
      pantalones: 'jeans',
      playeras: 'playera',
      chamarras: 'chamarra',
      sudaderas: 'sudadera',
      bolsas: 'bolsa',
      relojes: 'reloj',
      pantalla: 'smart tv',
      'smart tv': 'pantalla',
      monitor: 'computacion',
      ultragear: 'lg',
      odyssey: 'samsung',
    };

    return { corrected: q, synonyms };
  }
}
