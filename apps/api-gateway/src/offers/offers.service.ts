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
    if (!createDto.externalId || !createDto.externalId.trim()) {
      throw new Error(`externalId is required for upsertOffer`);
    }

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
        externalId: createDto.externalId.trim(),
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

  /**
   * Automatically deactivates offers whose last_seen timestamp is older than maxAgeHours.
   * This prevents dead links or expired promo prices from being displayed to users.
   */
  async cleanStaleOffers(maxAgeHours = 48): Promise<{ markedUnavailable: number; cutoff: Date }> {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const result = await this.offerRepo
      .createQueryBuilder()
      .update(Offer)
      .set({ availability: false })
      .where('last_seen < :cutoff AND availability = true', { cutoff })
      .execute();

    return {
      markedUnavailable: result.affected || 0,
      cutoff,
    };
  }

  /**
   * Check if a specific offer is fresh (seen within the last 24h).
   */
  async checkOfferFreshness(id: string): Promise<{ isFresh: boolean; lastSeen: Date }> {
    const offer = await this.findById(id);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return {
      isFresh: offer.lastSeen ? new Date(offer.lastSeen) >= dayAgo : false,
      lastSeen: offer.lastSeen,
    };
  }
}
