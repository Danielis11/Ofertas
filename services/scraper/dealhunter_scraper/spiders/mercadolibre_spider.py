import scrapy
from urllib.parse import quote_plus
from ..items import ScrapedProductOfferItem
from ..extractors.mercadolibre_extractor import MercadoLibreExtractor

class MercadoLibreSpider(scrapy.Spider):
    name = "mercadolibre"
    allowed_domains = ["mercadolibre.com.mx", "listado.mercadolibre.com.mx"]
    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 2.0,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 2,
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.query = kwargs.get('query', 'samsung-galaxy-s23')
        self.extractor = MercadoLibreExtractor()
        
        slug = self.query.strip().replace(' ', '-')
        self.start_urls = [f"https://listado.mercadolibre.com.mx/{slug}"]

    def start_requests(self):
        self.logger.info(f"🚀 start_requests called with query: {self.query}")
        slug = self.query.strip().replace(' ', '-')
        url = f"https://listado.mercadolibre.com.mx/{slug}"
        yield scrapy.Request(
            url=url,
            callback=self.parse,
            dont_filter=True,
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
