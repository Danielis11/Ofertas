import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { DealScoreDto } from './dto/deal-score.dto';

@ApiTags('Deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get('top')
  @ApiOperation({ summary: 'Get top algorithmic deals ranked by Deal Score (0-100)' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum deal score threshold (default 70)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum deals to return (default 20)', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Top ranked deals retrieved successfully',
    type: [DealScoreDto],
  })
  async getTopDeals(
    @Query('minScore') minScore?: number,
    @Query('limit') limit?: number,
  ): Promise<DealScoreDto[]> {
    return this.dealsService.getTopDeals(
      minScore !== undefined ? Number(minScore) : 70,
      limit !== undefined ? Number(limit) : 20,
    );
  }

  @Get('offer/:offerId')
  @ApiOperation({ summary: 'Calculate real-time deal score and factors for an offer' })
  @ApiParam({ name: 'offerId', description: 'Offer UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Deal score calculated successfully',
    type: DealScoreDto,
  })
  async evaluateOffer(@Param('offerId', ParseUUIDPipe) offerId: string): Promise<DealScoreDto> {
    return this.dealsService.evaluateOffer(offerId);
  }
}
