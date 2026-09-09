import scrapy
from urllib.parse import quote_plus
from ..items import ScrapedProductOfferItem
from ..extractors.elektra_extractor import ElektraExtractor

DEFAULT_QUERIES = [
    "xbox",
    "playstation",
    "nintendo switch",
    "samsung galaxy",
    "laptop",
    "television",
    "iphone",
    "licuadora",
    "lavadora",
    "refrigerador",
]

class ElektraSpider(scrapy.Spider):
    name = "elektra"
    allowed_domains = ["elektra.mx"]
    custom_settings = {
        "ROBOTSTXT_OBEY": False,
        "DOWNLOAD_DELAY": 0.5,
        "CONCURRENT_REQUESTS_PER_DOMAIN": 2,
    }

    PAGE_SIZE = 50

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        query_arg = kwargs.get("query")
        if query_arg:
            self.queries = [query_arg]
        else:
            self.queries = DEFAULT_QUERIES
        self.extractor = ElektraExtractor()

    def start_requests(self):
        for query in self.queries:
            encoded = quote_plus(query)
            url = f"https://www.elektra.mx/api/catalog_system/pub/products/search/{encoded}?_from=0&_to=49"
            yield scrapy.Request(
                url=url,
                callback=self.parse,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Accept": "application/json",
                },
                meta={"query": query, "page": 0},
            )

    def parse(self, response):
        items_data = self.extractor.extract_items(response)
        for data in items_data:
            item = ScrapedProductOfferItem(**data)
            yield item

        # If full page returned, fetch next page
        if len(items_data) >= self.PAGE_SIZE:
            query = response.meta["query"]
            page = response.meta["page"] + 1
            encoded = quote_plus(query)
            from_idx = page * self.PAGE_SIZE
            to_idx = from_idx + self.PAGE_SIZE - 1
            next_url = f"https://www.elektra.mx/api/catalog_system/pub/products/search/{encoded}?_from={from_idx}&_to={to_idx}"
            yield scrapy.Request(
                url=next_url,
                callback=self.parse,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Accept": "application/json",
                },
                meta={"query": query, "page": page},
            )
