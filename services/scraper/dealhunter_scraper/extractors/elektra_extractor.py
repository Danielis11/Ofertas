from typing import List, Dict, Any
from .base_extractor import BaseExtractor
from ..normalizers.price_normalizer import PriceNormalizer
from ..normalizers.text_normalizer import TextNormalizer

class ElektraExtractor(BaseExtractor):
    STORE_SLUG = "elektra-mx"

    def extract_items(self, response) -> List[Dict[str, Any]]:
        items = []
        try:
            data = response.json()
        except:
            return items
        
        for product in data:
            try:
                title_raw = product.get('productName')
                if not title_raw:
                    continue
                title = TextNormalizer.clean_title(title_raw)

                url = product.get('link')
                external_id = product.get('productId')
                
                sku = product.get('items', [])[0]
                
                offer = sku.get('sellers', [])[0].get('commertialOffer', {})
                price_val = offer.get('Price')
                if not price_val or price_val <= 0:
                    continue
                    
                price, currency = PriceNormalizer.normalize(str(price_val), default_currency='MXN')
                
                images = sku.get('images', [])
                image_url = images[0].get('imageUrl') if images else None

                items.append({
                    'title': title,
                    'price': price,
                    'currency': currency or 'MXN',
                    'store_slug': self.STORE_SLUG,
                    'external_id': str(external_id),
                    'url': url,
                    'image_url': image_url,
                    'availability': offer.get('AvailableQuantity', 0) > 0,
                    'identifiers': {
                        'SKU': str(external_id),
                    }
                })
            except Exception as e:
                continue

        return items
