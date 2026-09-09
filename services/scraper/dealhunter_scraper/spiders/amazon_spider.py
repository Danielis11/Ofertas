import scrapy
from urllib.parse import quote_plus
from ..items import ScrapedProductOfferItem
from ..extractors.amazon_extractor import AmazonExtractor

class AmazonSpider(scrapy.Spider):
    name = "amazon"
    allowed_domains = ["amazon.com.mx"]
    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 2.5,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 2,
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.query = kwargs.get('query', 'nintendo switch oled')
        self.extractor = AmazonExtractor()
        
        encoded_query = quote_plus(self.query)
        self.start_urls = [f"https://www.amazon.com.mx/s?k={encoded_query}"]

    def start_requests(self):
        encoded_query = quote_plus(self.query)
        url = f"https://www.amazon.com.mx/s?k={encoded_query}"
        yield scrapy.Request(
            url=url,
            callback=self.parse,
            meta={"playwright": True},
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'es-MX,es;q=0.9',
            }
        )

    def parse(self, response):
        items_data = self.extractor.extract_items(response)
        for data in items_data:
            item = ScrapedProductOfferItem(**data)
            yield item
