import { ApiProperty } from '@nestjs/swagger';

export class PriceHistoryPointDto {
  @ApiProperty({ example: 6499.0, description: 'Price recorded at point in time' })
  price!: number;

  @ApiProperty({ example: 'MXN', description: 'Currency code' })
  currency!: string;

  @ApiProperty({ example: '2026-09-05T12:00:00.000Z', description: 'Timestamp of price record' })
  recordedAt!: Date;
}

export class PriceStatisticsDto {
  @ApiProperty({ example: '5057dfb9-b845-421e-9332-5b08ccea9039', description: 'UUID of the offer' })
  offerId!: string;

  @ApiProperty({ example: 5999.0, description: 'Current active price' })
  currentPrice!: number;

  @ApiProperty({ example: 5999.0, description: 'Lowest price recorded historically' })
  minPrice!: number;

  @ApiProperty({ example: 7499.0, description: 'Highest price recorded historically' })
  maxPrice!: number;

  @ApiProperty({ example: 6665.67, description: 'Average historical price' })
  avgPrice!: number;

  @ApiProperty({ example: 'MXN', description: 'Currency' })
  currency!: string;

  @ApiProperty({ example: 3, description: 'Total historical price records' })
  totalRecords!: number;

  @ApiProperty({ type: [PriceHistoryPointDto], description: 'Chronological price timeline' })
  history!: PriceHistoryPointDto[];
}
