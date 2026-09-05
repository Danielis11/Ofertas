import { ApiProperty } from '@nestjs/swagger';
import { DealGrade } from '../interfaces/deal-score.interface';
import { Offer } from '../../offers/entities/offer.entity';

export class DealScoreFactorsDto {
  @ApiProperty({ example: 15.5, description: 'Discount percentage vs historical average' })
  discountFromAverage!: number;

  @ApiProperty({ example: 25.0, description: 'Discount percentage vs historical maximum' })
  discountFromHistoricalMax!: number;

  @ApiProperty({ example: true, description: 'Whether this price is the all-time lowest recorded' })
  isHistoricalLowest!: boolean;

  @ApiProperty({ example: 10.0, description: 'Percentage advantage vs closest competitor store' })
  crossStoreAdvantage!: number;
}

export class DealScoreDto {
  @ApiProperty({ example: 88, description: 'Deal score from 0 to 100' })
  score!: number;

  @ApiProperty({ enum: DealGrade, example: DealGrade.SUPER_DEAL, description: 'Classification grade of the deal' })
  grade!: DealGrade;

  @ApiProperty({ example: 25.0, description: 'Total calculated savings percentage' })
  savingsPercentage!: number;

  @ApiProperty({ type: DealScoreFactorsDto, description: 'Component breakdown of the score' })
  factors!: DealScoreFactorsDto;

  @ApiProperty({ description: 'The analyzed offer details' })
  offer!: Partial<Offer>;
}
