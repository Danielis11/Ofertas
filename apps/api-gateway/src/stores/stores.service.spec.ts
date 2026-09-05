import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { StoresService } from './stores.service';
import { Store, StoreStatus } from './entities/store.entity';

describe('StoresService', () => {
  let service: StoresService;
  let mockStoreRepo: any;

  beforeEach(async () => {
    mockStoreRepo = {
      count: jest.fn().mockResolvedValue(1),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ id: 'store-uuid-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepo,
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all stores', async () => {
    const mockStores = [
      { id: '1', name: 'Amazon México', slug: 'amazon-mx', status: StoreStatus.ACTIVE },
    ];
    mockStoreRepo.find.mockResolvedValue(mockStores);

    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Amazon México');
  });

  it('should throw NotFoundException when store not found by ID', async () => {
    mockStoreRepo.findOne.mockResolvedValue(null);
    await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
  });
});
