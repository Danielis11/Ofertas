import json
import logging
import os
import sys
import subprocess
import time
from typing import Dict, Any, Optional

import pika

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TaskConsumer")

DIRECT_RUNNERS = {
    "elektra-mx": ("elektra_direct.py", "--query"),
    "amazon-mx": ("amazon_direct_scraper.py", "--query"),
    "mercado-libre-mx": ("mercadolibre_direct_scraper.py", "--query"),
}

VTEX_STORES = ["marti-mx", "levis-mx", "guess-mx", "tommy-mx", "miniso-mx"]

SPIDER_MAPPING = {
    "amazon-mx": "amazon",
    "mercado-libre-mx": "mercadolibre",
    "walmart-mx": "walmart",
    "elektra-mx": "elektra",
    "sears-mx": "sears",
    "cyberpuerta-mx": "cyberpuerta",
}

class TaskConsumer:
    """
    Consumes SCRAPE_TASK_REQUESTED events from RabbitMQ and triggers
    appropriate spiders or direct scrapers.
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

    def _get_connection(self):
        """Create a fresh RabbitMQ connection with heartbeat=0 to avoid timeouts during long crawls."""
        credentials = pika.PlainCredentials(self.user, self.password)
        parameters = pika.ConnectionParameters(
            host=self.host,
            port=self.port,
            credentials=credentials,
            heartbeat=0,
            blocked_connection_timeout=300,
        )
        return pika.BlockingConnection(parameters)

    def process_task(self, task_payload: Dict[str, Any]):
        store_slug = task_payload.get("storeSlug")
        search_query = task_payload.get("searchQuery", "laptop")
        priority = task_payload.get("priority", "NORMAL")

        logger.info(
            f"🎯 Processing task for [{store_slug}] | Query: '{search_query}' | Priority: {priority}"
        )

        current_dir = os.path.dirname(os.path.abspath(__file__))
        scraper_project_dir = os.path.dirname(current_dir)

        # 1. Direct Runner (High Performance / Proxy Direct)
        if store_slug in DIRECT_RUNNERS:
            script_name, query_flag = DIRECT_RUNNERS[store_slug]
            script_path = os.path.join(current_dir, script_name)
            cmd = [sys.executable, script_path]
            if search_query:
                cmd.extend([query_flag, search_query])

        # 2. VTEX Universal Stores (Fashion, Lifestyle, Sports)
        elif store_slug in VTEX_STORES:
            script_path = os.path.join(current_dir, "universal_vtex_scraper.py")
            cmd = [sys.executable, script_path, "--store", store_slug]

        # 3. Fallback to Scrapy Spiders
        elif store_slug in SPIDER_MAPPING:
            spider_name = SPIDER_MAPPING[store_slug]
            cmd = [sys.executable, "-m", "scrapy", "crawl", spider_name]
            if search_query:
                cmd.extend(["-a", f"query={search_query}"])
        else:
            raise ValueError(f"Unknown store slug: {store_slug}")

        logger.info(f"🚀 Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, cwd=scraper_project_dir, capture_output=True, text=True)

        if result.returncode == 0:
            logger.info(f"✅ Scraper [{store_slug}] finished successfully.")
        else:
            logger.error(f"❌ Scraper [{store_slug}] failed (code {result.returncode})")
            if result.stderr:
                logger.error(f"Stderr: {result.stderr[-500:]}")

    def start_consuming(self):
        """Connects to RabbitMQ and begins consuming tasks. Auto-reconnects on failure."""
        while True:
            try:
                logger.info("🔌 Connecting to RabbitMQ...")
                connection = self._get_connection()
                channel = connection.channel()

                channel.exchange_declare(exchange=self.exchange, exchange_type="topic", durable=True)
                channel.queue_declare(queue=self.queue_name, durable=True)
                channel.queue_bind(
                    exchange=self.exchange,
                    queue=self.queue_name,
                    routing_key=self.routing_key,
                )

                logger.info(
                    f"🚀 Scraper Task Consumer started on queue '{self.queue_name}'"
                )

                for method_frame, properties, body in channel.consume(self.queue_name):
                    try:
                        event = json.loads(body.decode("utf-8"))
                        event_name = event.get("eventName")

                        if event_name == "SCRAPE_TASK_REQUESTED":
                            self.process_task(event.get("payload", {}))

                        channel.basic_ack(delivery_tag=method_frame.delivery_tag)
                    except Exception as e:
                        logger.error(f"Error handling task: {e}")
                        channel.basic_nack(delivery_tag=method_frame.delivery_tag, requeue=False)

            except (pika.exceptions.AMQPConnectionError, Exception) as e:
                logger.warning(f"RabbitMQ connection lost ({e}). Reconnecting in 10s...")
                time.sleep(10)


if __name__ == "__main__":
    consumer = TaskConsumer()
    consumer.start_consuming()
