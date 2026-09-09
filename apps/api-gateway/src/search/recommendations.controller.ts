import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RecommendationsService, RecommendationResponse } from './recommendations.service';

@ApiTags('Recommendations')
@Controller('search/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized product deal recommendations based on user recent search intent' })
  @ApiQuery({ name: 'intent', required: false, enum: ['RUNNING', 'BASKETBALL', 'CASUAL_SNEAKERS', 'SMARTPHONES'] })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecommendations(
    @Query('intent') intent?: string,
    @Query('brand') brand?: string,
    @Query('limit') limit?: number,
  ): Promise<RecommendationResponse> {
    return this.recommendationsService.getPersonalizedRecommendations(
      intent || 'RUNNING',
      brand,
      limit ? Number(limit) : 8,
    );
  }
}
