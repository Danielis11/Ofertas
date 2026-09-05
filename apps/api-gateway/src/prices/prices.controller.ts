import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PricesService } from './prices.service';
import { PriceHistory } from './entities/price-history.entity';
import { PriceStatisticsDto } from './dto/price-statistics.dto';

@ApiTags('Prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get('offer/:offerId/history')
  @ApiOperation({ summary: 'Get price history timeline for an offer' })
  @ApiParam({ name: 'offerId', description: 'Offer UUID', type: String })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to retrieve (default 50)', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Price history records retrieved successfully',
    type: [PriceHistory],
  })
  async getHistory(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Query('limit') limit?: number,
  ): Promise<PriceHistory[]> {
    return this.pricesService.getHistoryByOffer(offerId, limit ? Number(limit) : 50);
  }

  @Get('offer/:offerId/statistics')
  @ApiOperation({ summary: 'Get aggregate price statistics (min, max, avg, volatility) for an offer' })
  @ApiParam({ name: 'offerId', description: 'Offer UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Price statistics calculated successfully',
    type: PriceStatisticsDto,
  })
  async getStatistics(@Param('offerId', ParseUUIDPipe) offerId: string): Promise<PriceStatisticsDto> {
    return this.pricesService.getOfferStatistics(offerId);
  }
}
