export enum DealHunterEvents {
  PRODUCT_FOUND = 'PRODUCT_FOUND',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  OFFER_SCRAPED = 'OFFER_SCRAPED',
  PRICE_CHANGED = 'PRICE_CHANGED',
  PRICE_DROPPED = 'PRICE_DROPPED',
  DEAL_DETECTED = 'DEAL_DETECTED',
  ALERT_CREATED = 'ALERT_CREATED',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  NOTIFICATION_REQUESTED = 'NOTIFICATION_REQUESTED',
}

export interface BaseEvent<T = any> {
  eventId: string;
  eventName: DealHunterEvents;
  timestamp: string;
  source: string;
  payload: T;
}

export interface OfferScrapedPayload {
  title: string;
  brand?: string;
  model?: string;
  price: number;
  currency: string;
  originalPrice?: number;
  storeSlug: string;
  externalId: string;
  url: string;
  imageUrl?: string;
  availability: boolean;
  identifiers?: Record<string, string>;
}

export interface PriceChangedPayload {
  productId: string;
  offerId: string;
  storeSlug: string;
  oldPrice: number;
  newPrice: number;
  priceDifference: number;
  percentageChange: number;
  currency: string;
  url: string;
}

export interface DealDetectedPayload {
  productId: string;
  offerId: string;
  storeSlug: string;
  currentPrice: number;
  averageHistoricalPrice: number;
  lowestHistoricalPrice: number;
  dealScore: number;
  status: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'POOR';
  currency: string;
}

export const RABBITMQ_EXCHANGES = {
  EVENTS: 'dealhunter.events',
};

export const RABBITMQ_ROUTING_KEYS = {
  OFFER_SCRAPED: 'scraper.offer.detected',
  PRICE_CHANGED: 'price.changed',
  PRICE_DROPPED: 'price.dropped',
  DEAL_DETECTED: 'deal.detected',
  ALERT_TRIGGERED: 'alert.triggered',
};

export const RABBITMQ_QUEUES = {
  SCRAPER_OFFERS: 'dealhunter.queue.scraper_offers',
  PRICE_UPDATES: 'dealhunter.queue.price_updates',
  DEAL_ANALYSIS: 'dealhunter.queue.deal_analysis',
};
