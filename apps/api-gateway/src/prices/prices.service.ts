import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { Offer } from '../offers/entities/offer.entity';
import { PriceStatisticsDto } from './dto/price-statistics.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PricesService {
  constructor(
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepo: Repository<PriceHistory>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    private readonly redisService: RedisService,
  ) {}

  async recordPrice(offerId: string, price: number, currency: string = 'MXN'): Promise<PriceHistory> {
    const entry = this.priceHistoryRepo.create({
      offerId,
      price,
      currency,
    });
    const saved = await this.priceHistoryRepo.save(entry);

    // Invalidate cached statistics and deals when new price is recorded
    await this.redisService.del(`prices:stats:${offerId}`);
    await this.redisService.del(`deals:offer:${offerId}`);
    await this.redisService.delByPattern('deals:top:*');

    return saved;
  }

  async getHistoryByOffer(offerId: string, limit: number = 50): Promise<PriceHistory[]> {
    return this.priceHistoryRepo.find({
      where: { offerId },
      order: { recordedAt: 'ASC' },
      take: limit,
    });
  }

  async getOfferStatistics(offerId: string): Promise<PriceStatisticsDto> {
    const cacheKey = `prices:stats:${offerId}`;
    const cached = await this.redisService.get<PriceStatisticsDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const offer = await this.offerRepo.findOne({
      where: { id: offerId },
      relations: { store: true, product: true },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID "${offerId}" not found`);
    }

    const history = await this.getHistoryByOffer(offerId, 100);

    const prices = history.map((h) => Number(h.price));
    // Include current price in the analysis
    prices.push(Number(offer.price));

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const sum = prices.reduce((acc, p) => acc + p, 0);
    const avgPrice = Number((sum / prices.length).toFixed(2));

    const result: PriceStatisticsDto = {
      offerId: offer.id,
      currentPrice: Number(offer.price),
      minPrice,
      maxPrice,
      avgPrice,
      currency: offer.currency,
      totalRecords: prices.length,
      history: history.map((h) => ({
        price: Number(h.price),
        currency: h.currency,
        recordedAt: h.recordedAt,
      })),
    };

    // Cache for 5 minutes
    await this.redisService.set(cacheKey, result, 300);

    return result;
  }
}
