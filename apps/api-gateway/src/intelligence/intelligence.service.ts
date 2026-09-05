import { Injectable, NotFoundException } from '@nestjs/common';
import { PricesService } from '../prices/prices.service';
import { OffersService } from '../offers/offers.service';
import { RedisService } from '../redis/redis.service';
import {
  PricePredictionDto,
  PriceTrend,
  PurchaseRecommendation,
  DiscountAuthenticity,
  FakeDiscountAnalysisDto,
} from './dto/price-prediction.dto';

@Injectable()
export class IntelligenceService {
  constructor(
    private readonly pricesService: PricesService,
    private readonly offersService: OffersService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Evaluates historical trends using regression to predict next price movement
   * and audits whether discounts are genuine or artificially inflated.
   */
  async predictPriceAndAuditDeal(offerId: string): Promise<PricePredictionDto> {
    const cacheKey = `intelligence:pred:${offerId}`;
    const cached = await this.redisService.get<PricePredictionDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const offer = await this.offersService.findById(offerId);
    if (!offer) {
      throw new NotFoundException(`Offer with ID "${offerId}" not found`);
    }

    const currentPrice = Number(offer.price);
    const stats = await this.pricesService.getOfferStatistics(offerId);
    const history = await this.pricesService.getHistoryByOffer(offerId, 100);

    // 1. Compute Linear Regression Trend
    const trendAnalysis = this.calculateRegressionTrend(history, currentPrice);

    // 2. Compute Fake Discount & Inflation Analysis
    const fakeDiscountAnalysis = this.analyzeDiscountAuthenticity(stats, currentPrice);

    // 3. Purchase Recommendation Logic
    const { recommendation, recommendationReason } = this.determineRecommendation(
      currentPrice,
      stats,
      trendAnalysis,
      fakeDiscountAnalysis,
    );

    const result: PricePredictionDto = {
      offerId,
      currentPrice,
      trend: trendAnalysis.trend,
      predictedNextPrice: trendAnalysis.predictedNextPrice,
      confidenceScore: trendAnalysis.confidenceScore,
      recommendation,
      recommendationReason,
      fakeDiscountAnalysis,
    };

    // Cache prediction for 5 minutes
    await this.redisService.set(cacheKey, result, 300);

    return result;
  }

  private calculateRegressionTrend(
    history: any[],
    currentPrice: number,
  ): { trend: PriceTrend; predictedNextPrice: number; confidenceScore: number } {
    if (!history || history.length < 2) {
      return {
        trend: PriceTrend.STABLE,
        predictedNextPrice: currentPrice,
        confidenceScore: 50,
      };
    }

    const n = history.length;
    // t_i = 0, 1, ..., n-1
    let sumT = 0;
    let sumP = 0;
    let sumTP = 0;
    let sumT2 = 0;

    for (let i = 0; i < n; i++) {
      const p = Number(history[i].price);
      sumT += i;
      sumP += p;
      sumTP += i * p;
      sumT2 += i * i;
    }

    const meanT = sumT / n;
    const meanP = sumP / n;

    const denominator = sumT2 - n * meanT * meanT;
    const slope = denominator !== 0 ? (sumTP - n * meanT * meanP) / denominator : 0;
    const intercept = meanP - slope * meanT;

    // Projected price at step n
    const predictedNextPrice = Math.max(0, Number((slope * n + intercept).toFixed(2)));

    // Trend determination based on slope relative to price
    const relativeChange = (slope / currentPrice) * 100;
    let trend: PriceTrend;
    if (relativeChange < -1) {
      trend = PriceTrend.DOWNWARD;
    } else if (relativeChange > 1) {
      trend = PriceTrend.UPWARD;
    } else {
      trend = PriceTrend.STABLE;
    }

    // Model Confidence based on sample size and slope stability
    const confidenceScore = Math.min(95, Math.max(55, 50 + n * 5));

    return {
      trend,
      predictedNextPrice,
      confidenceScore,
    };
  }

  private analyzeDiscountAuthenticity(
    stats: any,
    currentPrice: number,
  ): FakeDiscountAnalysisDto {
    const avgPrice = stats.avgPrice || currentPrice;
    const maxPrice = stats.maxPrice || currentPrice;

    // Genuine savings compared to historical average
    const genuineSavingsPercentage = avgPrice > 0
      ? Number(Math.max(0, ((avgPrice - currentPrice) / avgPrice) * 100).toFixed(1))
      : 0;

    // Advertised savings compared to max price
    const advertisedSavingsPercentage = maxPrice > 0
      ? Number(Math.max(0, ((maxPrice - currentPrice) / maxPrice) * 100).toFixed(1))
      : 0;

    // Artificial inflation detection:
    // If the difference between max advertised discount and genuine savings is > 25%,
    // it signals the price was artificially jacked up before discounting
    const inflationGap = advertisedSavingsPercentage - genuineSavingsPercentage;
    const isInflatedOriginalPrice = inflationGap > 25 && advertisedSavingsPercentage > 35;

    let confidence: DiscountAuthenticity;
    let explanation: string;

    if (isInflatedOriginalPrice) {
      confidence = DiscountAuthenticity.SUSPECTED_INFLATION;
      explanation = `El precio máximo de referencia ($${maxPrice}) muestra una subida atípica de ${inflationGap.toFixed(0)}% antes de la rebaja. Tu ahorro real comprobado es de ${genuineSavingsPercentage}%.`;
    } else if (genuineSavingsPercentage >= 15) {
      confidence = DiscountAuthenticity.GENUINE_DEAL;
      explanation = `Descuento 100% auténtico verificado frente a la media de precios histórica ($${avgPrice.toFixed(0)}).`;
    } else {
      confidence = DiscountAuthenticity.VERIFIED_DROP;
      explanation = `Variación regular de mercado acorde al promedio habitual.`;
    }

    return {
      isInflatedOriginalPrice,
      genuineSavingsPercentage,
      advertisedSavingsPercentage,
      confidence,
      explanation,
    };
  }

  private determineRecommendation(
    currentPrice: number,
    stats: any,
    trendAnalysis: { trend: PriceTrend; predictedNextPrice: number; confidenceScore: number },
    fakeDiscount: FakeDiscountAnalysisDto,
  ): { recommendation: PurchaseRecommendation; recommendationReason: string } {
    // 1. Historical Lowest
    if (currentPrice <= stats.minPrice) {
      return {
        recommendation: PurchaseRecommendation.BUY_NOW,
        recommendationReason: `¡Mínimo Histórico Absoluto! El producto nunca había estado tan barato ($${currentPrice} MXN).`,
      };
    }

    // 2. High Genuine Discount
    if (fakeDiscount.genuineSavingsPercentage >= 20) {
      return {
        recommendation: PurchaseRecommendation.BUY_NOW,
        recommendationReason: `Ahorro genuino verificado del ${fakeDiscount.genuineSavingsPercentage}% sobre el promedio histórico.`,
      };
    }

    // 3. Overpriced vs average
    if (currentPrice > stats.avgPrice * 1.05) {
      return {
        recommendation: PurchaseRecommendation.OVERPRICED,
        recommendationReason: `Precio un ${(((currentPrice - stats.avgPrice) / stats.avgPrice) * 100).toFixed(0)}% por encima de su valor promedio de mercado ($${stats.avgPrice.toFixed(0)} MXN). Conviene esperar.`,
      };
    }

    // 4. Falling trend with room to drop
    if (trendAnalysis.trend === PriceTrend.DOWNWARD && currentPrice > stats.minPrice) {
      return {
        recommendation: PurchaseRecommendation.WAIT,
        recommendationReason: `Tendencia de precio a la baja detectada. La proyección matemática estima que podría bajar hasta $${trendAnalysis.predictedNextPrice} MXN.`,
      };
    }

    // 5. Fair price
    return {
      recommendation: PurchaseRecommendation.FAIR_PRICE,
      recommendationReason: `Precio justo y estable acorde al comportamiento habitual de la tienda.`,
    };
  }
}
