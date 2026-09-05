import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { PriceAlert, AlertStatus } from './entities/price-alert.entity';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

describe('AlertsService', () => {
  let service: AlertsService;
  let mockAlertRepo: any;
  let mockProductsService: any;
  let mockNotifService: any;

  const sampleAlert = {
    id: 'alert-1',
    userId: 'user-1',
    productId: 'prod-1',
    targetPrice: 5000,
    currency: 'MXN',
    status: AlertStatus.ACTIVE,
  };

  beforeEach(async () => {
    mockAlertRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((alert) => Promise.resolve({ id: 'alert-1', ...alert })),
      find: jest.fn().mockResolvedValue([sampleAlert]),
      findOne: jest.fn().mockResolvedValue(sampleAlert),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    mockProductsService = {
      findById: jest.fn().mockResolvedValue({ id: 'prod-1', name: 'Test Product' }),
    };

    mockNotifService = {
      send: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: getRepositoryToken(PriceAlert), useValue: mockAlertRepo },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: NotificationsService, useValue: mockNotifService },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an active price alert', async () => {
      const res = await service.create('user-1', {
        productId: 'prod-1',
        targetPrice: 4800,
      });

      expect(mockProductsService.findById).toHaveBeenCalledWith('prod-1');
      expect(mockAlertRepo.create).toHaveBeenCalled();
      expect(res.status).toBe(AlertStatus.ACTIVE);
    });
  });

  describe('findByUser', () => {
    it('should return user alerts', async () => {
      const res = await service.findByUser('user-1');
      expect(res).toHaveLength(1);
      expect(mockAlertRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: { product: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('checkAlertsForProductPrice', () => {
    it('should trigger alert when newPrice is <= targetPrice', async () => {
      const activeAlert = { ...sampleAlert, targetPrice: 5000, status: AlertStatus.ACTIVE };
      mockAlertRepo.find.mockResolvedValueOnce([activeAlert]);

      const triggered = await service.checkAlertsForProductPrice('prod-1', 4800);
      expect(triggered).toHaveLength(1);
      expect(triggered[0].status).toBe(AlertStatus.TRIGGERED);
      expect(triggered[0].triggeredAt).toBeDefined();
    });

    it('should NOT trigger alert when newPrice is > targetPrice', async () => {
      const activeAlert = { ...sampleAlert, targetPrice: 5000, status: AlertStatus.ACTIVE };
      mockAlertRepo.find.mockResolvedValueOnce([activeAlert]);

      const triggered = await service.checkAlertsForProductPrice('prod-1', 5200);
      expect(triggered).toHaveLength(0);
    });
  });
});
