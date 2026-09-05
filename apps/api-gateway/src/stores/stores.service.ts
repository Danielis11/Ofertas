import { Injectable, NotFoundException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService implements OnModuleInit {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultStores();
  }

  async seedDefaultStores(): Promise<void> {
    const count = await this.storeRepo.count();
    if (count > 0) return;

    const defaultStores: CreateStoreDto[] = [
      {
        name: 'Amazon México',
        slug: 'amazon-mx',
        domain: 'amazon.com.mx',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        status: StoreStatus.ACTIVE,
      },
      {
        name: 'Mercado Libre México',
        slug: 'mercado-libre-mx',
        domain: 'mercadolibre.com.mx',
        logo: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadolibre/logo__large_plus.png',
        status: StoreStatus.ACTIVE,
      },
      {
        name: 'Walmart México',
        slug: 'walmart-mx',
        domain: 'walmart.com.mx',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Walmart_logo.svg',
        status: StoreStatus.ACTIVE,
      },
    ];

    for (const storeData of defaultStores) {
      const store = this.storeRepo.create(storeData);
      await this.storeRepo.save(store);
    }
    this.logger.log(`Initialized ${defaultStores.length} default commercial stores.`);
  }

  async create(createDto: CreateStoreDto): Promise<Store> {
    const existing = await this.storeRepo.findOne({ where: { slug: createDto.slug } });
    if (existing) {
      throw new ConflictException(`Store with slug "${createDto.slug}" already exists`);
    }

    const store = this.storeRepo.create(createDto);
    return this.storeRepo.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storeRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Store> {
    const store = await this.storeRepo.findOne({
      where: { id },
      relations: { offers: true },
    });
    if (!store) {
      throw new NotFoundException(`Store with ID "${id}" not found`);
    }
    return store;
  }

  async findBySlug(slug: string): Promise<Store> {
    const store = await this.storeRepo.findOne({
      where: { slug },
      relations: { offers: true },
    });
    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found`);
    }
    return store;
  }

  async update(id: string, updateDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findById(id);
    Object.assign(store, updateDto);
    return this.storeRepo.save(store);
  }
}
