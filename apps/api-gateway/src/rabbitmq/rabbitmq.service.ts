import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import {
  DealHunterEvents,
  BaseEvent,
  OfferScrapedPayload,
  PriceChangedPayload,
  RABBITMQ_EXCHANGES,
  RABBITMQ_ROUTING_KEYS,
  RABBITMQ_QUEUES,
} from '@dealhunter/shared-events';
import { OffersService } from '../offers/offers.service';
import { ProductsService } from '../products/products.service';
import { StoresService } from '../stores/stores.service';
import { PricesService } from '../prices/prices.service';
import { AlertsService } from '../alerts/alerts.service';
import { IdentifierType } from '../products/entities/product-identifier.entity';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly offersService: OffersService,
    private readonly productsService: ProductsService,
    private readonly storesService: StoresService,
    private readonly pricesService: PricesService,
    private readonly alertsService: AlertsService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupConsumer();
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (err: any) {
      this.logger.error(`Error closing RabbitMQ connection: ${err.message}`);
    }
  }

  private async connect(): Promise<void> {
    const host = this.configService.get<string>('RABBITMQ_HOST', 'localhost');
    const port = this.configService.get<number>('RABBITMQ_PORT', 5672);
    const user = this.configService.get<string>('RABBITMQ_DEFAULT_USER', 'dealhunter_admin');
    const pass = this.configService.get<string>('RABBITMQ_DEFAULT_PASS', 'dealhunter_admin_pass');

    const url = `amqp://${user}:${pass}@${host}:${port}`;

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(RABBITMQ_EXCHANGES.EVENTS, 'topic', {
        durable: true,
      });

      this.logger.log(`Connected to RabbitMQ on ${host}:${port} with exchange '${RABBITMQ_EXCHANGES.EVENTS}'`);
    } catch (err: any) {
      this.logger.warn(`Could not connect to RabbitMQ broker: ${err.message}. Event messaging disabled.`);
    }
  }

  async publishEvent<T>(routingKey: string, event: BaseEvent<T>): Promise<boolean> {
    if (!this.channel) {
      this.logger.warn(`Cannot publish event '${event.eventName}': RabbitMQ channel not available.`);
      return false;
    }

    try {
      const buffer = Buffer.from(JSON.stringify(event));
      this.channel.publish(RABBITMQ_EXCHANGES.EVENTS, routingKey, buffer, {
        persistent: true,
        contentType: 'application/json',
      });
      this.logger.log(`[Event Published] -> Exchange: '${RABBITMQ_EXCHANGES.EVENTS}' | Key: '${routingKey}' | Event: ${event.eventName}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to publish event: ${err.message}`);
      return false;
    }
  }

  private async setupConsumer(): Promise<void> {
    if (!this.channel) return;

    try {
      await this.channel.assertQueue(RABBITMQ_QUEUES.SCRAPER_OFFERS, {
        durable: true,
      });

      await this.channel.bindQueue(
        RABBITMQ_QUEUES.SCRAPER_OFFERS,
        RABBITMQ_EXCHANGES.EVENTS,
        'scraper.offer.*',
      );

      this.channel.consume(
        RABBITMQ_QUEUES.SCRAPER_OFFERS,
        async (msg: any) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString()) as BaseEvent<OfferScrapedPayload>;
            await this.handleOfferScraped(content);
            this.channel.ack(msg);
          } catch (err: any) {
            this.logger.error(`Error processing RabbitMQ message: ${err.message}`);
            // Reject and don't requeue corrupted payloads
            this.channel.nack(msg, false, false);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consumer listening on queue '${RABBITMQ_QUEUES.SCRAPER_OFFERS}' for 'scraper.offer.*'`);
    } catch (err: any) {
      this.logger.error(`Failed to setup RabbitMQ consumer: ${err.message}`);
    }
  }

  private async handleOfferScraped(event: BaseEvent<OfferScrapedPayload>): Promise<void> {
    const payload = event.payload;
    this.logger.log(`Processing OFFER_SCRAPED event: ${payload.title} from [${payload.storeSlug}]`);

    // 1. Resolve store
    let store;
    try {
      store = await this.storesService.findBySlug(payload.storeSlug);
    } catch {
      this.logger.warn(`Store '${payload.storeSlug}' not found in database. Skipping.`);
      return;
    }

    // 2. Resolve product by identifier or search
    let product = null;
    if (payload.identifiers) {
      for (const [key, val] of Object.entries(payload.identifiers)) {
        const idType = key.toUpperCase() as IdentifierType;
        if (Object.values(IdentifierType).includes(idType)) {
          product = await this.productsService.findByIdentifier(idType, String(val));
          if (product) break;
        }
      }
    }

    // If still not found, search by title
    if (!product) {
      const searchRes = await this.productsService.findAll({ search: payload.title, limit: 1, page: 1 });
      if (searchRes.data.length > 0) {
        product = searchRes.data[0];
      }
    }

    // Auto-create product if new
    if (!product) {
      product = await this.productsService.create({
        name: payload.title,
        brand: payload.brand || 'Desconocida',
        model: payload.model,
        image: payload.imageUrl,
        identifiers: payload.identifiers
          ? Object.entries(payload.identifiers).map(([k, v]) => ({
              type: (k.toUpperCase() as IdentifierType),
              value: String(v),
            }))
          : undefined,
      });
      this.logger.log(`Auto-created new canonical product: ${product.name} (${product.id})`);
    }

    // 3. Check previous offer price for PRICE_CHANGED detection
    const existingOffers = await this.offersService.findByProductId(product.id);
    const existing = existingOffers.find((o) => o.storeId === store.id && o.externalId === payload.externalId);
    const oldPrice = existing ? Number(existing.price) : null;

    // 4. Upsert Offer in PostgreSQL
    const savedOffer = await this.offersService.upsertOffer({
      productId: product.id,
      storeId: store.id,
      externalId: payload.externalId,
      url: payload.url,
      price: payload.price,
      currency: payload.currency || 'MXN',
      availability: payload.availability,
    });

    // 5. Record price in history if it's a new offer or price has changed
    if (oldPrice === null || oldPrice !== payload.price) {
      await this.pricesService.recordPrice(savedOffer.id, payload.price, payload.currency || 'MXN');
      this.logger.log(`Recorded price entry: Offer ${savedOffer.id} -> $${payload.price}`);
    }

    // 6. Emit PRICE_CHANGED event if price differed
    if (oldPrice !== null && oldPrice !== payload.price) {
      const diff = payload.price - oldPrice;
      const pct = (diff / oldPrice) * 100;

      const priceChangedEvent: BaseEvent<PriceChangedPayload> = {
        eventId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        eventName: diff < 0 ? DealHunterEvents.PRICE_DROPPED : DealHunterEvents.PRICE_CHANGED,
        timestamp: new Date().toISOString(),
        source: 'backend.price_detector',
        payload: {
          productId: product.id,
          offerId: savedOffer.id,
          storeSlug: payload.storeSlug,
          oldPrice,
          newPrice: payload.price,
          priceDifference: Number(diff.toFixed(2)),
          percentageChange: Number(pct.toFixed(2)),
          currency: payload.currency || 'MXN',
          url: payload.url,
        },
      };

      const routingKey = diff < 0 ? RABBITMQ_ROUTING_KEYS.PRICE_DROPPED : RABBITMQ_ROUTING_KEYS.PRICE_CHANGED;
      await this.publishEvent(routingKey, priceChangedEvent);

      // Check user alerts if price dropped
      if (diff < 0) {
        await this.alertsService.checkAlertsForProductPrice(product.id, payload.price);
      }
    }
  }
}
