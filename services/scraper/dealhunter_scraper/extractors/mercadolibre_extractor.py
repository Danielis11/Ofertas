import re
from typing import List, Dict, Any
from .base_extractor import BaseExtractor
from ..normalizers.price_normalizer import PriceNormalizer
from ..normalizers.text_normalizer import TextNormalizer

class MercadoLibreExtractor(BaseExtractor):
    """Extracts product offers from Mercado Libre search and category pages."""

    STORE_SLUG = "mercado-libre-mx"

    def extract_items(self, response) -> List[Dict[str, Any]]:
        items = []

        # Support both standard search results layout and new poly-card layout
        cards = response.css('.ui-search-layout__item, .poly-card, .ui-search-result__wrapper')

        for card in cards:
            title_raw = card.css('.ui-search-item__title::text, .poly-component__title a::text, .poly-component__title::text').get()
            if not title_raw:
                continue

            title = TextNormalizer.clean_title(title_raw)

            # URL
            url = card.css('a.ui-search-link::attr(href), a.poly-component__title::attr(href), a::attr(href)').get()
            if not url:
                continue
            url = url.split('#')[0].split('?')[0]  # clean tracking parameters

            # External ID (e.g. MLM12345678)
            id_match = re.search(r'(MLM-?\d+)', url, re.IGNORECASE)
            external_id = id_match.group(1).replace('-', '') if id_match else None
            if not external_id:
                continue

            # Price extraction (fraction + cents)
            fraction = card.css('.andes-money-amount__fraction::text').get()
            cents = card.css('.andes-money-amount__cents::text').get()

            if fraction:
                price_str = fraction
                if cents:
                    price_str += f".{cents}"
                price, currency = PriceNormalizer.normalize(price_str, default_currency='MXN')
            else:
                continue

            if not price:
                continue

            # Image
            image_url = card.css('img.ui-search-result-image__element::attr(data-src), img::attr(src)').get()

            items.append({
                'title': title,
                'price': price,
                'currency': currency or 'MXN',
                'store_slug': self.STORE_SLUG,
                'external_id': external_id,
                'url': url,
                'image_url': image_url,
                'availability': True,
                'identifiers': {
                    'MLM_ID': external_id,
                }
            })

        return items
