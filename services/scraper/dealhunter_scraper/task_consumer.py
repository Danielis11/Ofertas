import json
import logging
import os
import pika
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TaskConsumer")

SPIDER_MAPPING = {
    "amazon-mx": "amazon",
    "mercado-libre-mx": "mercadolibre",
    "walmart-mx": "walmart",
}

class TaskConsumer:
    """
    Consumes SCRAPE_TASK_REQUESTED events from RabbitMQ and triggers
    appropriate Scrapy spiders or crawls.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
    ):
        self.host = host or os.getenv("RABBITMQ_HOST", "localhost")
        self.port = int(port or os.getenv("RABBITMQ_PORT", "5672"))
        self.user = user or os.getenv("RABBITMQ_DEFAULT_USER", "dealhunter_admin")
        self.password = password or os.getenv("RABBITMQ_DEFAULT_PASS", "dealhunter_admin_pass")
        self.exchange = "dealhunter.events"
        self.queue_name = "dealhunter.queue.scraper_tasks"
        self.routing_key = "scraper.task.*"

    def process_task(self, task_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes a single task payload and resolves target spider execution arguments.
        """
        store_slug = task_payload.get("storeSlug")
        spider_name = SPIDER_MAPPING.get(store_slug)

        if not spider_name:
            raise ValueError(f"Unknown store slug: {store_slug}")

        search_query = task_payload.get("searchQuery")
        category = task_payload.get("category")
        urls = task_payload.get("urls", [])
        priority = task_payload.get("priority", "NORMAL")
        max_items = task_payload.get("maxItems", 50)
        triggered_by = task_payload.get("triggeredBy", "MANUAL")

        logger.info(
            f"🎯 Processing task for spider [{spider_name}] | Query: '{search_query}' | Priority: {priority}"
        )

        # Build execution parameters
        spider_args = {
            "spider": spider_name,
            "store_slug": store_slug,
            "search_query": search_query,
            "category": category,
            "urls": urls,
            "priority": priority,
            "max_items": max_items,
            "triggered_by": triggered_by,
            "status": "QUEUED_FOR_EXECUTION",
        }

        return spider_args

    def start_consuming(self, max_messages: Optional[int] = None):
        """
        Connects to RabbitMQ and begins consuming tasks.
        """
        credentials = pika.PlainCredentials(self.user, self.password)
        parameters = pika.ConnectionParameters(
            host=self.host, port=self.port, credentials=credentials
        )
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Declare exchange and queue
        channel.exchange_declare(exchange=self.exchange, exchange_type="topic", durable=True)
        channel.queue_declare(queue=self.queue_name, durable=True)
        channel.queue_bind(
            exchange=self.exchange,
            queue=self.queue_name,
            routing_key=self.routing_key,
        )

        logger.info(
            f"🚀 Scraper Task Consumer started on queue '{self.queue_name}' bound to '{self.routing_key}'"
        )

        count = 0

        for method_frame, properties, body in channel.consume(self.queue_name):
            try:
                event = json.loads(body.decode("utf-8"))
                payload = event.get("payload", {})
                self.process_task(payload)
                channel.basic_ack(delivery_tag=method_frame.delivery_tag)
                count += 1
                if max_messages and count >= max_messages:
                    break
            except Exception as e:
                logger.error(f"Error handling task: {e}")
                channel.basic_nack(delivery_tag=method_frame.delivery_tag, requeue=False)

        connection.close()

if __name__ == "__main__":
    consumer = TaskConsumer()
    consumer.start_consuming()
