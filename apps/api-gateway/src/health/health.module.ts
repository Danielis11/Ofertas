import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RedisModule } from '../redis/redis.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [RedisModule, RabbitMQModule, WebsocketModule],
  controllers: [HealthController],
})
export class HealthModule {}

