import { Injectable, NotFoundException } from '@nestjs/common';
import { OffersService } from '../offers/offers.service';
import { PricesService } from '../prices/prices.service';
import { RedisService } from '../redis/redis.service';
import { DealGrade, DealScoreResult } from './interfaces/deal-score.interface';
import { DealScoreDto } from './dto/deal-score.dto';

@Injectable()
export class DealsService {
  constructor(
    private readonly offersService: OffersService,
    private readonly pricesService: PricesService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Calculate deal score for a specific offer.
   * Total Score: 0 to 100 points
   * Factors:
   * 1. Discount vs Historical Average (0 - 40 pts)
   * 2. Discount vs Historical Max (0 - 25 pts)
   * 3. Historical Lowest bonus (20 pts if price <= minPrice, else scaled)
   * 4. Cross-store competitiveness advantage (0 - 15 pts)
   */
  async evaluateOffer(offerId: string): Promise<DealScoreDto> {
    const cacheKey = `deals:offer:${offerId}`;
    const cached = await this.redisService.get<DealScoreDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const offer = await this.offersService.findById(offerId);
    if (!offer) {
      throw new NotFoundException(`Offer with ID "${offerId}" not found`);
    }

    const currentPrice = Number(offer.price);

    // 1. Get price statistics for this offer
    const stats = await this.pricesService.getOfferStatistics(offerId);

    // Factor 1: Discount from average (max 40 pts)
    // 25% discount or more gives full 40 pts
    const avgDiscountPct = stats.avgPrice > 0
      ? Math.max(0, ((stats.avgPrice - currentPrice) / stats.avgPrice) * 100)
      : 0;
    const factorAvgScore = Math.min(40, (avgDiscountPct / 25) * 40);

    // Factor 2: Discount from historical max (max 25 pts)
    // 35% discount or more gives full 25 pts
    const maxDiscountPct = stats.maxPrice > 0
      ? Math.max(0, ((stats.maxPrice - currentPrice) / stats.maxPrice) * 100)
      : 0;
    const factorMaxScore = Math.min(25, (maxDiscountPct / 35) * 25);

    // Factor 3: Is it historical lowest? (max 20 pts)
    const isLowest = currentPrice <= stats.minPrice;
    let factorLowestScore = 0;
    if (isLowest) {
      factorLowestScore = 20;
    } else {
      // Proximity to lowest
      const diffFromLowest = ((currentPrice - stats.minPrice) / stats.minPrice) * 100;
      if (diffFromLowest <= 5) factorLowestScore = 12;
      else if (diffFromLowest <= 10) factorLowestScore = 6;
    }

    // Factor 4: Cross-store competitiveness (max 15 pts)
    // Compare against other active offers for the same product
    let crossStoreAdvantage = 0;
    let factorStoreScore = 0;

    let otherStores: any[] = [];
    if (offer.productId) {
      const allProductOffers = await this.offersService.findByProductId(offer.productId);
      const activeCompetitors = allProductOffers.filter((o) => o.id !== offer.id && o.availability);
      const otherOffers = activeCompetitors
        .map((o) => Number(o.price))
        .sort((a, b) => a - b);

      otherStores = activeCompetitors
        .map((o) => ({
          storeName: o.store?.name || 'Tienda',
          storeSlug: o.store?.slug || '',
          price: Number(o.price),
          url: o.url,
          isOfficialStore: o.isOfficialStore,
          sellerName: o.sellerName,
        }))
        .sort((a, b) => a.price - b.price);

      if (otherOffers.length > 0) {
        const nextCheapest = otherOffers[0];
        if (currentPrice < nextCheapest) {
          crossStoreAdvantage = Number((((nextCheapest - currentPrice) / nextCheapest) * 100).toFixed(2));
          // 15% or more cheaper gives full 15 pts
          factorStoreScore = Math.min(15, (crossStoreAdvantage / 15) * 15);
        }
      } else {
        // No competitor data, assign neutral middle score (7.5 pts)
        factorStoreScore = 7.5;
      }
    }

    const rawScore = factorAvgScore + factorMaxScore + factorLowestScore + factorStoreScore;
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    let grade: DealGrade;
    if (score >= 85) grade = DealGrade.SUPER_DEAL;
    else if (score >= 70) grade = DealGrade.GREAT_DEAL;
    else if (score >= 50) grade = DealGrade.GOOD_DEAL;
    else if (score >= 30) grade = DealGrade.FAIR;
    else grade = DealGrade.POOR;

    const savingsPercentage = Number(avgDiscountPct.toFixed(2));

    const result: DealScoreDto = {
      score,
      grade,
      savingsPercentage,
      factors: {
        discountFromAverage: Number(avgDiscountPct.toFixed(2)),
        discountFromHistoricalMax: Number(maxDiscountPct.toFixed(2)),
        isHistoricalLowest: isLowest,
        crossStoreAdvantage,
      },
      offer,
      otherStores,
    };

    // Cache deal evaluation for 5 minutes
    await this.redisService.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Find top scored deals across all products with minScore filter
   */
  async getTopDeals(minScore: number = 70, limit: number = 20): Promise<DealScoreDto[]> {
    const cacheKey = `deals:top:${minScore}:${limit}`;
    const cached = await this.redisService.get<DealScoreDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Evaluate offers that are currently available
    const activeOffers = await this.offersService.findAll({ limit: 100 });
    const scoredDeals: DealScoreDto[] = [];

    for (const offer of activeOffers.data) {
      if (!offer.availability) continue;
      try {
        const evaluation = await this.evaluateOffer(offer.id);
        if (evaluation.score >= minScore) {
          scoredDeals.push(evaluation);
        }
      } catch {
        continue;
      }
    }

    // Sort descending by score
    scoredDeals.sort((a, b) => b.score - a.score);
    const topDeals = scoredDeals.slice(0, limit);

    // Cache top deals for 2 minutes
    await this.redisService.set(cacheKey, topDeals, 120);

    return topDeals;
  }
}
