from typing import List, Dict, Any
from urllib.parse import urljoin
from .base_extractor import BaseExtractor
from ..normalizers.price_normalizer import PriceNormalizer
from ..normalizers.text_normalizer import TextNormalizer

class AmazonExtractor(BaseExtractor):
    """Extracts product offers from Amazon search and category pages."""

    STORE_SLUG = "amazon-mx"
    BASE_URL = "https://www.amazon.com.mx"

    def extract_items(self, response) -> List[Dict[str, Any]]:
        items = []
        cards = response.css('div[data-component-type="s-search-result"]')

        for card in cards:
            asin = card.attrib.get('data-asin')
            if not asin:
                continue

            # Title
            title_raw = card.css('h2 a span::text, h2 span::text').get()
            if not title_raw:
                continue
            title = TextNormalizer.clean_title(title_raw)

            # URL
            rel_url = card.css('h2 a::attr(href)').get()
            if not rel_url:
                continue
            url = urljoin(self.BASE_URL, rel_url).split('/ref=')[0].split('?')[0]

            # Price
            whole = card.css('.a-price-whole::text').get()
            fraction = card.css('.a-price-fraction::text').get()

            if whole:
                price_str = whole.replace('.', '').replace(',', '')
                if fraction:
                    price_str += f".{fraction}"
                price, currency = PriceNormalizer.normalize(price_str, default_currency='MXN')
            else:
                continue

            if not price:
                continue

            # Image
            image_url = card.css('img.s-image::attr(src)').get()

            items.append({
                'title': title,
                'price': price,
                'currency': currency or 'MXN',
                'store_slug': self.STORE_SLUG,
                'external_id': asin,
                'url': url,
                'image_url': image_url,
                'availability': True,
                'identifiers': {
                    'ASIN': asin,
                }
            })

        return items
