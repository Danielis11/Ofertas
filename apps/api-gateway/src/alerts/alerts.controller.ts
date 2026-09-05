import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreatePriceAlertDto } from './dto/create-alert.dto';
import { PriceAlert } from './entities/price-alert.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new price drop alert for a product' })
  @ApiResponse({ status: 201, description: 'Alert created successfully', type: PriceAlert })
  async create(
    @CurrentUser() user: any,
    @Body() createAlertDto: CreatePriceAlertDto,
  ): Promise<PriceAlert> {
    return this.alertsService.create(user.id, createAlertDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all price alerts for the current user' })
  @ApiResponse({ status: 200, description: 'List of alerts', type: [PriceAlert] })
  async getMyAlerts(@CurrentUser() user: any): Promise<PriceAlert[]> {
    return this.alertsService.findByUser(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a price alert' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 204, description: 'Alert deleted successfully' })
  async remove(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.alertsService.remove(user.id, id);
  }
}
