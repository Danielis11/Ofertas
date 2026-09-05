import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PriceTrend {
  DOWNWARD = 'DOWNWARD',
  UPWARD = 'UPWARD',
  STABLE = 'STABLE',
}

export enum PurchaseRecommendation {
  BUY_NOW = 'BUY_NOW',
  WAIT = 'WAIT',
  FAIR_PRICE = 'FAIR_PRICE',
  OVERPRICED = 'OVERPRICED',
}

export enum DiscountAuthenticity {
  GENUINE_DEAL = 'GENUINE_DEAL',
  VERIFIED_DROP = 'VERIFIED_DROP',
  SUSPECTED_INFLATION = 'SUSPECTED_INFLATION',
}

export class FakeDiscountAnalysisDto {
  @ApiProperty({ description: 'Whether the advertised original price was inflated prior to discount' })
  isInflatedOriginalPrice!: boolean;

  @ApiProperty({ description: 'Real verified savings percentage vs 90-day historical baseline' })
  genuineSavingsPercentage!: number;

  @ApiPropertyOptional({ description: 'Advertised strike-through discount percentage' })
  advertisedSavingsPercentage?: number;

  @ApiProperty({ description: 'Authenticity status', enum: DiscountAuthenticity })
  confidence!: DiscountAuthenticity;

  @ApiProperty({ description: 'Human readable rationale' })
  explanation!: string;
}

export class PricePredictionDto {
  @ApiProperty({ description: 'Offer ID' })
  offerId!: string;

  @ApiProperty({ description: 'Current price' })
  currentPrice!: number;

  @ApiProperty({ description: 'Identified price trajectory trend', enum: PriceTrend })
  trend!: PriceTrend;

  @ApiProperty({ description: 'Algorithmic predicted price target' })
  predictedNextPrice!: number;

  @ApiProperty({ description: 'Model confidence score (0 to 100%)' })
  confidenceScore!: number;

  @ApiProperty({ description: 'AI Purchase recommendation', enum: PurchaseRecommendation })
  recommendation!: PurchaseRecommendation;

  @ApiProperty({ description: 'Actionable reason for the recommendation' })
  recommendationReason!: string;

  @ApiProperty({ type: FakeDiscountAnalysisDto, description: 'Anti-fake discount audit analysis' })
  fakeDiscountAnalysis!: FakeDiscountAnalysisDto;
}
