import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OffersModule } from '../offers/offers.module';
import { ProductsModule } from '../products/products.module';
import { StoresModule } from '../stores/stores.module';
import { PricesModule } from '../prices/prices.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [OffersModule, ProductsModule, StoresModule, PricesModule, AlertsModule],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
