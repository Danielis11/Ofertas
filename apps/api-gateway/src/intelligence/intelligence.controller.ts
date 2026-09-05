import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IntelligenceService } from './intelligence.service';
import { PricePredictionDto } from './dto/price-prediction.dto';

@ApiTags('Deal Intelligence')
@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get('prediction/:offerId')
  @ApiOperation({
    summary: 'Predict future price movement using regression and audit discount authenticity',
  })
  @ApiParam({ name: 'offerId', description: 'Offer UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Price prediction and fake discount audit computed successfully',
    type: PricePredictionDto,
  })
  async getPrediction(
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ): Promise<PricePredictionDto> {
    return this.intelligenceService.predictPriceAndAuditDeal(offerId);
  }

  @Get('audit/:offerId')
  @ApiOperation({
    summary: 'Quick fake discount & artificial price inflation verification',
  })
  @ApiParam({ name: 'offerId', description: 'Offer UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Fake discount audit result',
  })
  async getAudit(@Param('offerId', ParseUUIDPipe) offerId: string) {
    const full = await this.intelligenceService.predictPriceAndAuditDeal(offerId);
    return full.fakeDiscountAnalysis;
  }
}
