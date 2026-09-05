import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { Offer } from '../offers/entities/offer.entity';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PriceHistory, Offer])],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
