import { Module } from '@nestjs/common';
import { OffersModule } from '../offers/offers.module';
import { PricesModule } from '../prices/prices.module';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';

@Module({
  imports: [OffersModule, PricesModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
