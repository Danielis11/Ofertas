import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductIdentifier, IdentifierType } from './entities/product-identifier.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductIdentifier)
    private readonly identifierRepo: Repository<ProductIdentifier>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  /**
   * Helper to normalize product names for fuzzy matching and comparisons.
   */
  private normalizeString(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  async create(createDto: CreateProductDto): Promise<Product> {
    const normalizedName = this.normalizeString(createDto.name);

    // Verify category if provided
    if (createDto.categoryId) {
      const categoryExists = await this.categoryRepo.findOne({
        where: { id: createDto.categoryId },
      });
      if (!categoryExists) {
        throw new NotFoundException(`Category with ID ${createDto.categoryId} not found`);
      }
    }

    const product = this.productRepo.create({
      name: createDto.name,
      normalizedName,
      brand: createDto.brand,
      model: createDto.model,
      description: createDto.description,
      image: createDto.image,
      categoryId: createDto.categoryId,
    });

    const savedProduct = await this.productRepo.save(product);

    // Save identifiers if provided
    if (createDto.identifiers && createDto.identifiers.length > 0) {
      const identifiers = createDto.identifiers.map((ident) =>
        this.identifierRepo.create({
          productId: savedProduct.id,
          type: ident.type,
          value: ident.value.trim(),
        }),
      );
      try {
        await this.identifierRepo.save(identifiers);
      } catch (err: any) {
        if (err?.code === '23505') {
          throw new ConflictException('One or more product identifiers already exist in the database');
        }
        throw err;
      }
    }

    return this.findById(savedProduct.id);
  }

  async findAll(queryDto: QueryProductDto) {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.identifiers', 'identifiers');

    if (queryDto.brand) {
      qb.andWhere('LOWER(product.brand) = LOWER(:brand)', { brand: queryDto.brand });
    }

    if (queryDto.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: queryDto.categoryId });
    }

    if (queryDto.search) {
      const normalizedSearch = `%${this.normalizeString(queryDto.search)}%`;
      const rawSearch = `%${queryDto.search}%`;

      qb.andWhere(
        '(product.normalizedName ILIKE :normalizedSearch OR product.brand ILIKE :rawSearch OR product.model ILIKE :rawSearch)',
        { normalizedSearch, rawSearch },
      );
    }

    qb.orderBy('product.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: {
        category: true,
        identifiers: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async findByIdentifier(type: IdentifierType, value: string): Promise<Product | null> {
    const identifier = await this.identifierRepo.findOne({
      where: { type, value: value.trim() },
      relations: {
        product: {
          category: true,
          identifiers: true,
        },
      },
    });

    return identifier ? identifier.product : null;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.productRepo.remove(product);
  }
}
