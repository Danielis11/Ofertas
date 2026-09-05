import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import { OffersService } from '../offers/offers.service';
import { ProductsService } from '../products/products.service';
import { StoresService } from '../stores/stores.service';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let mockOffersService: any;
  let mockProductsService: any;
  let mockStoresService: any;

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
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
