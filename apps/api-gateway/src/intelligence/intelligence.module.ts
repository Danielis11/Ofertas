import { Module } from '@nestjs/common';
import { PricesModule } from '../prices/prices.module';
import { OffersModule } from '../offers/offers.module';
import { RedisModule } from '../redis/redis.module';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';

@Module({
  imports: [PricesModule, OffersModule, RedisModule],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
