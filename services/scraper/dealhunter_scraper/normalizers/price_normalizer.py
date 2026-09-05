import re
from typing import Tuple, Optional

class PriceNormalizer:
    """Normalizes raw price text from various ecommerce stores into structured float + currency."""

    CURRENCY_SYMBOLS = {
        '$': 'MXN',
        'USD': 'USD',
        'US$': 'USD',
        'EUR': 'EUR',
        '€': 'EUR',
        'MXN': 'MXN',
        'MX$': 'MXN',
    }

    @classmethod
    def normalize(cls, raw_price: Optional[str], default_currency: str = 'MXN') -> Tuple[Optional[float], Optional[str]]:
        if not raw_price:
            return None, None

        cleaned = str(raw_price).strip()
        currency = default_currency

        # Detect currency
        for symbol, curr_code in cls.CURRENCY_SYMBOLS.items():
            if symbol in cleaned.upper():
                currency = curr_code
                break

        # Remove currency symbols and extraneous text
        num_str = re.sub(r'[^\d.,]', '', cleaned)
        if not num_str:
            return None, None

        # Format detection: European (1.234,56) vs US/Latin (1,234.56)
        if ',' in num_str and '.' in num_str:
            if num_str.rfind(',') > num_str.rfind('.'):
                # European format: replace '.' with nothing and ',' with '.'
                num_str = num_str.replace('.', '').replace(',', '.')
            else:
                # Standard format: remove ','
                num_str = num_str.replace(',', '')
        elif ',' in num_str:
            # Could be decimal comma (e.g. 1234,50) or thousands separator (e.g. 6,499)
            parts = num_str.split(',')
            if len(parts) == 2 and len(parts[1]) == 2:
                num_str = num_str.replace(',', '.')
            else:
                num_str = num_str.replace(',', '')

        try:
            val = float(num_str)
            if val <= 0:
                return None, None
            return round(val, 2), currency
        except (ValueError, TypeError):
            return None, None
