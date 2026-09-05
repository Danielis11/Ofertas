import os
import json
import uuid
import logging
from datetime import datetime, timezone
import pika

logger = logging.getLogger(__name__)

class RabbitMQPipeline:
    """Publishes scraped offers as events to RabbitMQ topic exchange."""

    EXCHANGE_NAME = "dealhunter.events"
    ROUTING_KEY = "scraper.offer.detected"

    def __init__(self, host='localhost', port=5672, user='dealhunter_admin', password='dealhunter_admin_pass', enabled=True):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.enabled = enabled
        self.connection = None
        self.channel = None

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            host=os.getenv('RABBITMQ_HOST', 'localhost'),
            port=int(os.getenv('RABBITMQ_PORT', 5672)),
            user=os.getenv('RABBITMQ_DEFAULT_USER', 'dealhunter_admin'),
            password=os.getenv('RABBITMQ_DEFAULT_PASS', 'dealhunter_admin_pass'),
            enabled=crawler.settings.getbool('RABBITMQ_ENABLED', True),
        )

    def open_spider(self, spider):
        if not self.enabled:
            return
        try:
            credentials = pika.PlainCredentials(self.user, self.password)
            parameters = pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                credentials=credentials,
                connection_attempts=3,
                retry_delay=2,
            )
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            self.channel.exchange_declare(
                exchange=self.EXCHANGE_NAME,
                exchange_type='topic',
                durable=True,
            )
            logger.info(f"Connected to RabbitMQ on {self.host}:{self.port} with exchange '{self.EXCHANGE_NAME}'")
        except Exception as e:
            logger.warning(f"Could not connect to RabbitMQ ({e}). Continuing in standalone mode.")
            self.connection = None
            self.channel = None

    def close_spider(self, spider):
        if self.connection and not self.connection.is_closed:
            self.connection.close()

    def process_item(self, item, spider):
        if not self.channel:
            return item

        event_payload = {
            "eventId": str(uuid.uuid4()),
            "eventName": "OFFER_SCRAPED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": f"scraper.{item.get('store_slug')}",
            "payload": {
                "title": item.get('title'),
                "brand": item.get('brand'),
                "model": item.get('model'),
                "price": item.get('price'),
                "currency": item.get('currency', 'MXN'),
                "originalPrice": item.get('original_price'),
                "storeSlug": item.get('store_slug'),
                "externalId": item.get('external_id'),
                "url": item.get('url'),
                "imageUrl": item.get('image_url'),
                "availability": item.get('availability', True),
                "identifiers": item.get('identifiers', {}),
            }
        }

        try:
            self.channel.basic_publish(
                exchange=self.EXCHANGE_NAME,
                routing_key=self.ROUTING_KEY,
                body=json.dumps(event_payload),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # make message persistent
                    content_type='application/json',
                )
            )
            logger.info(f"Published OFFER_SCRAPED event for '{item.get('external_id')}' to exchange '{self.EXCHANGE_NAME}'")
        except Exception as e:
            logger.error(f"Failed to publish event to RabbitMQ: {e}")

        return item
