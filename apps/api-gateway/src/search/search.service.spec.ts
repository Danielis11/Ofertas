import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { Offer } from '../offers/entities/offer.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { DealsService } from '../deals/deals.service';
import { RedisService } from '../redis/redis.service';
import { SearchSortBy } from './dto/search-query.dto';
import { DealGrade } from '../deals/interfaces/deal-score.interface';

describe('SearchService', () => {
  let service: SearchService;
  let mockOfferRepo: any;
  let mockProductRepo: any;
  let mockCategoryRepo: any;
  let mockStoreRepo: any;
  let mockDealsService: any;
  let mockRedisService: any;

  const mockCategory1 = { id: 'cat-1', name: 'Electrónica', slug: 'electronica' };
  const mockCategory2 = { id: 'cat-2', name: 'Hogar', slug: 'hogar' };

  const mockStore1 = { id: 'store-1', name: 'Amazon México', slug: 'amazon-mx' };
  const mockStore2 = { id: 'store-2', name: 'Mercado Libre', slug: 'mercado-libre-mx' };

  const mockOffers: any[] = [
    {
      id: 'offer-1',
      productId: 'prod-1',
      storeId: 'store-1',
      price: 15000,
      availability: true,
      updatedAt: new Date('2026-09-01T10:00:00Z'),
      product: {
        id: 'prod-1',
        name: 'Apple iPhone 15 Pro 128GB',
        normalizedName: 'apple iphone 15 pro 128gb',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        categoryId: 'cat-1',
        category: mockCategory1,
      },
      store: mockStore1,
    },
    {
      id: 'offer-2',
      productId: 'prod-2',
      storeId: 'store-2',
      price: 8500,
      availability: true,
      updatedAt: new Date('2026-09-02T12:00:00Z'),
      product: {
        id: 'prod-2',
        name: 'Sony PlayStation 5 Slim Digital',
        normalizedName: 'sony playstation 5 slim digital',
        brand: 'Sony',
        model: 'PS5 Slim',
        categoryId: 'cat-1',
        category: mockCategory1,
      },
      store: mockStore2,
    },
    {
      id: 'offer-3',
      productId: 'prod-3',
      storeId: 'store-1',
      price: 3200,
      availability: true,
      updatedAt: new Date('2026-09-03T15:00:00Z'),
      product: {
        id: 'prod-3',
        name: 'Cafetera Nespresso Vertuo Pop',
        normalizedName: 'cafetera nespresso vertuo pop',
        brand: 'Nespresso',
        model: 'Vertuo Pop',
        categoryId: 'cat-2',
        category: mockCategory2,
      },
      store: mockStore1,
    },
  ];

  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockOffers),
      getRawMany: jest.fn().mockResolvedValue([{ brand: 'Apple' }, { brand: 'Sony' }]),
    };

    mockOfferRepo = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    mockProductRepo = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    mockCategoryRepo = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    mockStoreRepo = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    mockDealsService = {
      evaluateOffer: jest.fn((offerId: string) => {
        if (offerId === 'offer-1') {
          return Promise.resolve({
            score: 92,
            grade: DealGrade.SUPER_DEAL,
            savingsPercentage: 28.5,
            factors: {
              discountFromAverage: 28.5,
              discountFromHistoricalMax: 35,
              isHistoricalLowest: true,
              crossStoreAdvantage: 10,
            },
            offer: mockOffers[0],
          });
        }
        if (offerId === 'offer-2') {
          return Promise.resolve({
            score: 75,
            grade: DealGrade.GREAT_DEAL,
            savingsPercentage: 18.0,
            factors: {
              discountFromAverage: 18.0,
              discountFromHistoricalMax: 22,
              isHistoricalLowest: false,
              crossStoreAdvantage: 5,
            },
            offer: mockOffers[1],
          });
        }
        return Promise.resolve({
          score: 45,
          grade: DealGrade.FAIR,
          savingsPercentage: 5.0,
          factors: {
            discountFromAverage: 5.0,
            discountFromHistoricalMax: 8,
            isHistoricalLowest: false,
            crossStoreAdvantage: 0,
          },
          offer: mockOffers[2],
        });
      }),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(Offer), useValue: mockOfferRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(Store), useValue: mockStoreRepo },
        { provide: DealsService, useValue: mockDealsService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return cached results if available in Redis', async () => {
      const cachedResult = {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        facets: { categories: [], stores: [], brands: [], priceRange: { min: 0, max: 0, avg: 0 } },
      };
      mockRedisService.get.mockResolvedValueOnce(cachedResult);

      const result = await service.search({ q: 'iphone' });

      expect(mockRedisService.get).toHaveBeenCalledWith(expect.stringContaining('search:'));
      expect(mockOfferRepo.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toBe(cachedResult);
    });

    it('should query DB and compute deal scores, facets and pagination', async () => {
      const result = await service.search({ q: 'sony' });

      expect(mockOfferRepo.createQueryBuilder).toHaveBeenCalledWith('offer');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('product.normalizedName ILIKE :normTerm'),
        expect.objectContaining({ rawTerm: '%sony%' }),
      );

      // Verify evaluated offers
      expect(mockDealsService.evaluateOffer).toHaveBeenCalledTimes(3);

      // Result items
      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);

      // Default sorting is SCORE_DESC
      expect(result.data[0].score).toBe(92);
      expect(result.data[1].score).toBe(75);
      expect(result.data[2].score).toBe(45);

      // Facets
      expect(result.facets.categories).toHaveLength(2);
      expect(result.facets.categories[0]).toEqual({
        id: 'cat-1',
        name: 'Electrónica',
        slug: 'electronica',
        count: 2,
      });

      expect(result.facets.stores).toHaveLength(2);
      expect(result.facets.brands).toEqual(
        expect.arrayContaining([
          { name: 'Apple', count: 1 },
          { name: 'Sony', count: 1 },
          { name: 'Nespresso', count: 1 },
        ]),
      );

      expect(result.facets.priceRange.min).toBe(3200);
      expect(result.facets.priceRange.max).toBe(15000);

      // Should save to cache
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('search:'),
        result,
        60,
      );
    });

    it('should filter by minScore', async () => {
      const result = await service.search({ minScore: 70 });

      // Offer-3 has score 45, so it should be excluded
      expect(result.data).toHaveLength(2);
      expect(result.data[0].score).toBe(92);
      expect(result.data[1].score).toBe(75);
    });

    it('should filter by grade', async () => {
      const result = await service.search({ grade: DealGrade.SUPER_DEAL });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].grade).toBe(DealGrade.SUPER_DEAL);
      expect(result.data[0].score).toBe(92);
    });

    it('should filter by category and store and brand', async () => {
      await service.search({
        categoryId: 'cat-1',
        categorySlug: 'electronica',
        storeId: 'store-1',
        storeSlug: 'amazon-mx',
        brand: 'Apple',
        minPrice: 1000,
        maxPrice: 20000,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.categoryId = :categoryId', {
        categoryId: 'cat-1',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('category.slug = :categorySlug', {
        categorySlug: 'electronica',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('offer.storeId = :storeId', {
        storeId: 'store-1',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('store.slug = :storeSlug', {
        storeSlug: 'amazon-mx',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('LOWER(product.brand) = LOWER(:brand)', {
        brand: 'Apple',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('offer.price >= :minPrice', {
        minPrice: 1000,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('offer.price <= :maxPrice', {
        maxPrice: 20000,
      });
    });

    it('should sort by PRICE_ASC', async () => {
      const result = await service.search({ sortBy: SearchSortBy.PRICE_ASC });

      expect(Number(result.data[0].offer.price)).toBe(3200);
      expect(Number(result.data[1].offer.price)).toBe(8500);
      expect(Number(result.data[2].offer.price)).toBe(15000);
    });

    it('should sort by PRICE_DESC', async () => {
      const result = await service.search({ sortBy: SearchSortBy.PRICE_DESC });

      expect(Number(result.data[0].offer.price)).toBe(15000);
      expect(Number(result.data[1].offer.price)).toBe(8500);
      expect(Number(result.data[2].offer.price)).toBe(3200);
    });

    it('should sort by DISCOUNT_DESC', async () => {
      const result = await service.search({ sortBy: SearchSortBy.DISCOUNT_DESC });

      expect(result.data[0].savingsPercentage).toBe(28.5);
      expect(result.data[1].savingsPercentage).toBe(18.0);
      expect(result.data[2].savingsPercentage).toBe(5.0);
    });

    it('should sort by NEWEST', async () => {
      const result = await service.search({ sortBy: SearchSortBy.NEWEST });

      expect(result.data[0].offer.id).toBe('offer-3'); // 2026-09-03
      expect(result.data[1].offer.id).toBe('offer-2'); // 2026-09-02
      expect(result.data[2].offer.id).toBe('offer-1'); // 2026-09-01
    });
  });

  describe('getSuggestions', () => {
    it('should return empty suggestions if query is empty', async () => {
      const result = await service.getSuggestions('   ');
      expect(result).toEqual({ products: [], brands: [], categories: [] });
    });

    it('should return cached suggestions if available', async () => {
      const cached = { products: [], brands: ['Apple'], categories: [] };
      mockRedisService.get.mockResolvedValueOnce(cached);

      const result = await service.getSuggestions('app');
      expect(result).toBe(cached);
    });

    it('should query products, brands, and categories for suggestions', async () => {
      queryBuilder.getMany
        .mockResolvedValueOnce([{ id: 'p1', name: 'Apple iPhone', brand: 'Apple', image: 'img.jpg' }])
        .mockResolvedValueOnce([{ id: 'c1', name: 'Electrónica', slug: 'electronica' }]);
      queryBuilder.getRawMany.mockResolvedValueOnce([{ brand: 'Apple' }]);

      const result = await service.getSuggestions('app', 5);

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Apple iPhone');
      expect(result.brands).toEqual(['Apple']);
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].slug).toBe('electronica');

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'suggestions:app:5',
        result,
        120,
      );
    });
  });
});
