from scrapy.exceptions import DropItem

class ValidationPipeline:
    """Validates that scraped items satisfy data integrity requirements."""

    REQUIRED_FIELDS = ['title', 'price', 'store_slug', 'external_id', 'url']

    def process_item(self, item, spider):
        for field in self.REQUIRED_FIELDS:
            val = item.get(field)
            if val is None or (isinstance(val, str) and not val.strip()):
                raise DropItem(f"Missing required field '{field}' in item: {item}")

        price = item.get('price')
        if not isinstance(price, (int, float)) or price <= 0:
            raise DropItem(f"Invalid price value: {price}")

        return item
