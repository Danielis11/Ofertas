import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { PricesService } from '../prices/prices.service';
import { OffersService } from '../offers/offers.service';
import { RedisService } from '../redis/redis.service';
import {
  PriceTrend,
  PurchaseRecommendation,
  DiscountAuthenticity,
} from './dto/price-prediction.dto';

describe('IntelligenceService', () => {
  let service: IntelligenceService;
  let mockPricesService: any;
  let mockOffersService: any;
  let mockRedisService: any;

  const mockOffer = {
    id: 'offer-1',
    productId: 'prod-1',
    storeId: 'store-1',
    price: 4500,
    currency: 'MXN',
  };

  beforeEach(async () => {
    mockPricesService = {
      getOfferStatistics: jest.fn().mockResolvedValue({
        offerId: 'offer-1',
        currentPrice: 4500,
        minPrice: 4500,
        maxPrice: 6500,
        avgPrice: 5800,
        priceDropsCount: 3,
        totalDataPoints: 5,
      }),
      getHistoryByOffer: jest.fn().mockResolvedValue([
        { price: 6500, recordedAt: '2026-08-01' },
        { price: 6200, recordedAt: '2026-08-10' },
        { price: 5800, recordedAt: '2026-08-20' },
        { price: 5200, recordedAt: '2026-08-30' },
        { price: 4500, recordedAt: '2026-09-05' },
      ]),
    };

    mockOffersService = {
      findById: jest.fn((id: string) => {
        if (id === 'offer-1') return Promise.resolve(mockOffer);
        return Promise.resolve(null);
      }),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligenceService,
        { provide: PricesService, useValue: mockPricesService },
        { provide: OffersService, useValue: mockOffersService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<IntelligenceService>(IntelligenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('predictPriceAndAuditDeal', () => {
    it('should return cached prediction if available in Redis', async () => {
      const cached = { offerId: 'offer-1', recommendation: PurchaseRecommendation.BUY_NOW };
      mockRedisService.get.mockResolvedValueOnce(cached);

      const result = await service.predictPriceAndAuditDeal('offer-1');

      expect(mockRedisService.get).toHaveBeenCalledWith('intelligence:pred:offer-1');
      expect(mockOffersService.findById).not.toHaveBeenCalled();
      expect(result).toBe(cached);
    });

    it('should calculate regression and recommend BUY_NOW when at historical lowest', async () => {
      const result = await service.predictPriceAndAuditDeal('offer-1');

      expect(result.offerId).toBe('offer-1');
      expect(result.currentPrice).toBe(4500);
      expect(result.trend).toBe(PriceTrend.DOWNWARD);
      expect(result.recommendation).toBe(PurchaseRecommendation.BUY_NOW);
      expect(result.fakeDiscountAnalysis.confidence).toBe(DiscountAuthenticity.GENUINE_DEAL);
      expect(result.fakeDiscountAnalysis.genuineSavingsPercentage).toBeGreaterThan(20);

      // Verify cache write
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'intelligence:pred:offer-1',
        result,
        300,
      );
    });

    it('should flag SUSPECTED_INFLATION when price was artificially raised', async () => {
      mockPricesService.getOfferStatistics.mockResolvedValueOnce({
        offerId: 'offer-1',
        currentPrice: 4900,
        minPrice: 4200,
        maxPrice: 8500, // Inflated max price
        avgPrice: 5000,
        priceDropsCount: 1,
        totalDataPoints: 3,
      });

      const result = await service.predictPriceAndAuditDeal('offer-1');

      expect(result.fakeDiscountAnalysis.isInflatedOriginalPrice).toBe(true);
      expect(result.fakeDiscountAnalysis.confidence).toBe(DiscountAuthenticity.SUSPECTED_INFLATION);
    });

    it('should recommend OVERPRICED when price is significantly above average', async () => {
      mockPricesService.getOfferStatistics.mockResolvedValueOnce({
        offerId: 'offer-1',
        currentPrice: 7000,
        minPrice: 4000,
        maxPrice: 7500,
        avgPrice: 5000,
        priceDropsCount: 1,
        totalDataPoints: 4,
      });

      mockOffersService.findById.mockResolvedValueOnce({ ...mockOffer, price: 7000 });

      const result = await service.predictPriceAndAuditDeal('offer-1');

      expect(result.recommendation).toBe(PurchaseRecommendation.OVERPRICED);
    });

    it('should throw NotFoundException if offer does not exist', async () => {
      await expect(service.predictPriceAndAuditDeal('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
