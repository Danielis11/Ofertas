export enum DealGrade {
  SUPER_DEAL = 'SUPER_DEAL', // Score >= 85
  GREAT_DEAL = 'GREAT_DEAL', // Score 70 - 84
  GOOD_DEAL = 'GOOD_DEAL',   // Score 50 - 69
  FAIR = 'FAIR',             // Score 30 - 49
  POOR = 'POOR',             // Score < 30
}

export interface DealCalculationFactors {
  discountFromAverage: number;       // Discount vs average (%)
  discountFromHistoricalMax: number; // Discount vs max (%)
  isHistoricalLowest: boolean;       // Is lowest recorded
  crossStoreAdvantage: number;       // Difference vs 2nd cheapest store (%)
}

export interface DealScoreResult {
  score: number; // 0 - 100
  grade: DealGrade;
  savingsPercentage: number;
  factors: DealCalculationFactors;
}
