import { Test, TestingModule } from '@nestjs/testing';
import { DealsService } from './deals.service';
import { OffersService } from '../offers/offers.service';
import { PricesService } from '../prices/prices.service';
import { RedisService } from '../redis/redis.service';
import { DealGrade } from './interfaces/deal-score.interface';
import { NotFoundException } from '@nestjs/common';

describe('DealsService', () => {
  let service: DealsService;
  let mockOffersService: any;
  let mockPricesService: any;
  let mockRedisService: any;

  const sampleOffer = {
    id: 'offer-1',
    productId: 'prod-1',
    price: 4500,
    availability: true,
    currency: 'MXN',
  };

  beforeEach(async () => {
    mockOffersService = {
      findById: jest.fn().mockResolvedValue(sampleOffer),
      findByProductId: jest.fn().mockResolvedValue([
        sampleOffer,
        { id: 'offer-2', productId: 'prod-1', price: 6000, availability: true },
      ]),
      findAll: jest.fn().mockResolvedValue({
        data: [sampleOffer],
        total: 1,
      }),
    };

    mockPricesService = {
      getOfferStatistics: jest.fn().mockResolvedValue({
        offerId: 'offer-1',
        currentPrice: 4500,
        minPrice: 4500,
        maxPrice: 6500,
        avgPrice: 5500,
        currency: 'MXN',
        totalRecords: 3,
        history: [],
      }),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      delByPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        { provide: OffersService, useValue: mockOffersService },
        { provide: PricesService, useValue: mockPricesService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateOffer', () => {
    it('should compute high score and GREAT/SUPER_DEAL grade for deep discount', async () => {
      const res = await service.evaluateOffer('offer-1');

      expect(res.score).toBeGreaterThanOrEqual(70);
      expect([DealGrade.GREAT_DEAL, DealGrade.SUPER_DEAL]).toContain(res.grade);
      expect(res.factors.isHistoricalLowest).toBe(true);
      expect(res.factors.crossStoreAdvantage).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if offer does not exist', async () => {
      mockOffersService.findById.mockResolvedValueOnce(null);
      await expect(service.evaluateOffer('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTopDeals', () => {
    it('should return sorted top deals matching minScore threshold', async () => {
      const deals = await service.getTopDeals(50, 10);
      expect(Array.isArray(deals)).toBe(true);
      if (deals.length > 0) {
        expect(deals[0].score).toBeGreaterThanOrEqual(50);
      }
    });
  });
});
