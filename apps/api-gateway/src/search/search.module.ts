import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from '../offers/entities/offer.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { PriceHistory } from '../prices/entities/price-history.entity';
import { DealsModule } from '../deals/deals.module';
import { RedisModule } from '../redis/redis.module';
import { SearchService } from './search.service';
import { LiveSearchService } from './live-search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, Product, Category, Store, PriceHistory]),
    DealsModule,
    RedisModule,
  ],
  controllers: [SearchController],
  providers: [SearchService, LiveSearchService],
  exports: [SearchService, LiveSearchService],
})
export class SearchModule {}

