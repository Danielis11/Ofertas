import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { OffersService } from './offers.service';
import { Offer } from './entities/offer.entity';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';

describe('OffersService', () => {
  let service: OffersService;
  let mockOfferRepo: any;
  let mockProductRepo: any;
  let mockStoreRepo: any;

  beforeEach(async () => {
    mockOfferRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'offer-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    mockProductRepo = {
      findOne: jest.fn(),
    };

    mockStoreRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        {
          provide: getRepositoryToken(Offer),
          useValue: mockOfferRepo,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepo,
        },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upsert an offer when product and store exist', async () => {
    mockProductRepo.findOne.mockResolvedValue({ id: 'prod-1' });
    mockStoreRepo.findOne.mockResolvedValue({ id: 'store-1' });
    mockOfferRepo.findOne.mockResolvedValue(null);

    const result = await service.upsertOffer({
      productId: 'prod-1',
      storeId: 'store-1',
      externalId: 'B098RKWH1Q',
      url: 'https://amazon.com.mx/dp/B098RKWH1Q',
      price: 6499,
    });

    expect(mockOfferRepo.create).toHaveBeenCalled();
    expect(mockOfferRepo.save).toHaveBeenCalled();
    expect(result.price).toBe(6499);
  });

  it('should throw NotFoundException if product does not exist on upsert', async () => {
    mockProductRepo.findOne.mockResolvedValue(null);

    await expect(
      service.upsertOffer({
        productId: 'non-existent-prod',
        storeId: 'store-1',
        externalId: 'B098RKWH1Q',
        url: 'https://amazon.com.mx/dp/B098RKWH1Q',
        price: 6499,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
