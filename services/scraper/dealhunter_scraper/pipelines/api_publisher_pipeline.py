import os
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

class ApiPublisherPipeline:
    """Optionally publishes valid scraped offers to the DealHunter API Gateway."""

    def __init__(self, api_url: Optional[str] = None):
        self.api_url = api_url or os.getenv('API_GATEWAY_URL', 'http://localhost:3000/api/v1')

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            api_url=crawler.settings.get('API_GATEWAY_URL')
        )

    def process_item(self, item, spider):
        # In testing / offline mode, simply log the validated item
        spider.logger.info(f"Scraped valid offer: [{item.get('store_slug')}] {item.get('title')} - ${item.get('price')} {item.get('currency')}")
        return item
