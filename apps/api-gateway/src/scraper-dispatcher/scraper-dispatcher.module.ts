import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { StoresModule } from '../stores/stores.module';
import { RedisModule } from '../redis/redis.module';
import { ScraperDispatcherService } from './scraper-dispatcher.service';
import { ScraperDispatcherController } from './scraper-dispatcher.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RabbitMQModule,
    StoresModule,
    RedisModule,
  ],
  controllers: [ScraperDispatcherController],
  providers: [ScraperDispatcherService],
  exports: [ScraperDispatcherService],
})
export class ScraperDispatcherModule {}
