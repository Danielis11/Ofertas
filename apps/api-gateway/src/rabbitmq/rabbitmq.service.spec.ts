import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import { OffersService } from '../offers/offers.service';
import { ProductsService } from '../products/products.service';
import { StoresService } from '../stores/stores.service';
import { PricesService } from '../prices/prices.service';
import { AlertsService } from '../alerts/alerts.service';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let mockOffersService: any;
  let mockProductsService: any;
  let mockStoresService: any;
  let mockPricesService: any;
  let mockAlertsService: any;

  beforeEach(async () => {
    mockOffersService = {
      upsertOffer: jest.fn(),
      findByProductId: jest.fn().mockResolvedValue([]),
    };
    mockProductsService = {
      findByIdentifier: jest.fn(),
      findAll: jest.fn().mockResolvedValue({ data: [] }),
      create: jest.fn(),
    };
    mockStoresService = {
      findBySlug: jest.fn(),
    };
    mockPricesService = {
      recordPrice: jest.fn().mockResolvedValue({}),
      getHistoryByOffer: jest.fn(),
      getOfferStatistics: jest.fn(),
    };
    mockAlertsService = {
      checkAlertsForProductPrice: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('localhost'),
          },
        },
        { provide: OffersService, useValue: mockOffersService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: StoresService, useValue: mockStoresService },
        { provide: PricesService, useValue: mockPricesService },
        { provide: AlertsService, useValue: mockAlertsService },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
