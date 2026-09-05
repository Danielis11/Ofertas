import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateOfferDto } from './dto/create-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  async upsertOffer(createDto: CreateOfferDto): Promise<Offer> {
    const product = await this.productRepo.findOne({ where: { id: createDto.productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${createDto.productId}" not found`);
    }

    const store = await this.storeRepo.findOne({ where: { id: createDto.storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID "${createDto.storeId}" not found`);
    }

    let offer = await this.offerRepo.findOne({
      where: {
        storeId: createDto.storeId,
        externalId: createDto.externalId,
      },
    });

    if (offer) {
      offer.price = createDto.price;
      offer.url = createDto.url;
      offer.availability = createDto.availability ?? true;
      offer.currency = createDto.currency || 'MXN';
      offer.lastSeen = new Date();
    } else {
      offer = this.offerRepo.create({
        productId: createDto.productId,
        storeId: createDto.storeId,
        externalId: createDto.externalId,
        url: createDto.url,
        price: createDto.price,
        currency: createDto.currency || 'MXN',
        availability: createDto.availability ?? true,
        lastSeen: new Date(),
      });
    }

    return this.offerRepo.save(offer);
  }

  async findByProductId(productId: string): Promise<Offer[]> {
    return this.offerRepo.find({
      where: { productId, availability: true },
      relations: { store: true },
      order: { price: 'ASC' },
    });
  }

  async findById(id: string): Promise<Offer> {
    const offer = await this.offerRepo.findOne({
      where: { id },
      relations: { store: true, product: true },
    });
    if (!offer) {
      throw new NotFoundException(`Offer with ID "${id}" not found`);
    }
    return offer;
  }

  async findAll(options?: { limit?: number }): Promise<{ data: Offer[]; total: number }> {
    const limit = options?.limit || 50;
    const [data, total] = await this.offerRepo.findAndCount({
      relations: { store: true, product: true },
      take: limit,
      order: { updatedAt: 'DESC' },
    });
    return { data, total };
  }

  async remove(id: string): Promise<void> {
    const offer = await this.findById(id);
    await this.offerRepo.remove(offer);
  }
}
