import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';
import { OffersModule } from './offers/offers.module';
import { PricesModule } from './prices/prices.module';
import { DealsModule } from './deals/deals.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import { SearchModule } from './search/search.module';
import { ScraperDispatcherModule } from './scraper-dispatcher/scraper-dispatcher.module';
import { WebsocketModule } from './websocket/websocket.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: Number(config.get<number>('POSTGRES_PORT', 5433)),
        username: config.get<string>('POSTGRES_USER', 'dealhunter_user'),
        password: config.get<string>('POSTGRES_PASSWORD', 'dealhunter_password'),
        database: config.get<string>('POSTGRES_DB', 'dealhunter'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development' ? ['error', 'warn', 'schema'] : false,
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL') || 60000,
          limit: configService.get<number>('THROTTLE_LIMIT') || 60,
        },
      ],
    }),
    RedisModule,
    HealthModule,
    ProductsModule,
    StoresModule,
    OffersModule,
    PricesModule,
    DealsModule,
    UsersModule,
    AuthModule,
    AlertsModule,
    NotificationsModule,
    RabbitMQModule,
    SearchModule,
    ScraperDispatcherModule,
    WebsocketModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
