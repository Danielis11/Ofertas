import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PricesService } from './prices.service';
import { PriceHistory } from './entities/price-history.entity';
import { Offer } from '../offers/entities/offer.entity';
import { NotFoundException } from '@nestjs/common';

describe('PricesService', () => {
  let service: PricesService;
  let priceHistoryRepo: any;
  let offerRepo: any;

  const mockPriceHistory = {
    id: 'ph-1',
    offerId: 'offer-1',
    price: 5999,
    currency: 'MXN',
    recordedAt: new Date('2026-09-01'),
  };

  const mockOffer = {
    id: 'offer-1',
    price: 5499,
    currency: 'MXN',
    store: { name: 'Amazon MX' },
    product: { name: 'Test Product' },
  };

  beforeEach(async () => {
    priceHistoryRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entry) => Promise.resolve({ id: 'ph-new', ...entry, recordedAt: new Date() })),
      find: jest.fn().mockResolvedValue([mockPriceHistory]),
    };

    offerRepo = {
      findOne: jest.fn().mockResolvedValue(mockOffer),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        { provide: getRepositoryToken(PriceHistory), useValue: priceHistoryRepo },
        { provide: getRepositoryToken(Offer), useValue: offerRepo },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordPrice', () => {
    it('should create and save a price history record', async () => {
      const res = await service.recordPrice('offer-1', 4999, 'MXN');
      expect(priceHistoryRepo.create).toHaveBeenCalledWith({
        offerId: 'offer-1',
        price: 4999,
        currency: 'MXN',
      });
      expect(res.price).toBe(4999);
    });
  });

  describe('getHistoryByOffer', () => {
    it('should return chronological history for an offer', async () => {
      const res = await service.getHistoryByOffer('offer-1', 10);
      expect(priceHistoryRepo.find).toHaveBeenCalledWith({
        where: { offerId: 'offer-1' },
        order: { recordedAt: 'ASC' },
        take: 10,
      });
      expect(res).toHaveLength(1);
    });
  });

  describe('getOfferStatistics', () => {
    it('should compute min, max, avg and return stats', async () => {
      // Mock history with prices: 6000 and 7000; offer current price: 5000
      priceHistoryRepo.find.mockResolvedValueOnce([
        { price: 6000, currency: 'MXN', recordedAt: new Date('2026-09-01') },
        { price: 7000, currency: 'MXN', recordedAt: new Date('2026-09-02') },
      ]);
      offerRepo.findOne.mockResolvedValueOnce({
        id: 'offer-1',
        price: 5000,
        currency: 'MXN',
      });

      const stats = await service.getOfferStatistics('offer-1');
      expect(stats.offerId).toBe('offer-1');
      expect(stats.currentPrice).toBe(5000);
      expect(stats.minPrice).toBe(5000);
      expect(stats.maxPrice).toBe(7000);
      expect(stats.avgPrice).toBe(6000);
      expect(stats.totalRecords).toBe(3); // 2 history + 1 current
    });

    it('should throw NotFoundException if offer does not exist', async () => {
      offerRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getOfferStatistics('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
