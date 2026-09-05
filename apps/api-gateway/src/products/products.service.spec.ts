import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductIdentifier, IdentifierType } from './entities/product-identifier.entity';
import { Category } from './entities/category.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductRepo: any;
  let mockIdentifierRepo: any;
  let mockCategoryRepo: any;

  beforeEach(async () => {
    mockProductRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'prod-uuid-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
    };

    mockIdentifierRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'ident-uuid-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    };

    mockCategoryRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
        {
          provide: getRepositoryToken(ProductIdentifier),
          useValue: mockIdentifierRepo,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepo,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a product with normalized name', async () => {
    const createdEntity = {
      id: 'prod-uuid-1',
      name: 'Nintendo Switch OLED Blanca 64 GB',
      normalizedName: 'nintendo switch oled blanca 64 gb',
      brand: 'Nintendo',
      identifiers: [],
    };

    mockProductRepo.findOne.mockResolvedValue(createdEntity);

    const result = await service.create({
      name: 'Nintendo Switch OLED Blanca 64 GB',
      brand: 'Nintendo',
      identifiers: [
        {
          type: IdentifierType.ASIN,
          value: 'B098RKWH1Q',
        },
      ],
    });

    expect(mockProductRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nintendo Switch OLED Blanca 64 GB',
        normalizedName: 'nintendo switch oled blanca 64 gb',
        brand: 'Nintendo',
      }),
    );
    expect(mockIdentifierRepo.save).toHaveBeenCalled();
    expect(result.id).toBe('prod-uuid-1');
  });

  it('should throw NotFoundException when product does not exist', async () => {
    mockProductRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
  });

  it('should find product by identifier', async () => {
    const mockFound = {
      id: 'ident-1',
      type: IdentifierType.ASIN,
      value: 'B098RKWH1Q',
      product: {
        id: 'prod-uuid-1',
        name: 'Nintendo Switch OLED',
      },
    };

    mockIdentifierRepo.findOne.mockResolvedValue(mockFound);

    const result = await service.findByIdentifier(IdentifierType.ASIN, 'B098RKWH1Q');
    expect(result).toBeDefined();
    expect(result?.id).toBe('prod-uuid-1');
  });
});
