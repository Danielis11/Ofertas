import scrapy

class ScrapedProductOfferItem(scrapy.Item):
    title = scrapy.Field()
    brand = scrapy.Field()
    model = scrapy.Field()
    price = scrapy.Field()
    currency = scrapy.Field()
    original_price = scrapy.Field()
    store_slug = scrapy.Field()
    external_id = scrapy.Field()
    url = scrapy.Field()
    image_url = scrapy.Field()
    availability = scrapy.Field()
    identifiers = scrapy.Field()
    scraped_at = scrapy.Field()
