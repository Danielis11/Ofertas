import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceAlert } from './entities/price-alert.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([PriceAlert]), ProductsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
