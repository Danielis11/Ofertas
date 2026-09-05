import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OffersModule } from '../offers/offers.module';
import { ProductsModule } from '../products/products.module';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [OffersModule, ProductsModule, StoresModule],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
