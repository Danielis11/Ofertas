import re
import html
from typing import Optional

class TextNormalizer:
    """Normalizes titles, descriptions and brand names, stripping promotional clutter."""

    PROMO_PATTERNS = [
        r'[¡!]?\s*env[ií]o gratis\s*[¡!]?',
        r'[¡!]?\s*meses sin intereses\s*[¡!]?',
        r'[¡!]?\s*super oferta\s*[¡!]?',
        r'[¡!]?\s*descuento imperdible\s*[¡!]?',
        r'[¡!]?\s*oferta del d[ií]a\s*[¡!]?',
        r'\bcon regalo\b',
        r'\bpromoci[oó]n\b',
    ]

    @classmethod
    def clean_title(cls, raw_title: Optional[str]) -> str:
        if not raw_title:
            return ""

        # Unescape HTML entities
        text = html.unescape(str(raw_title))

        # Remove promotional text
        for pattern in cls.PROMO_PATTERNS:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)

        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        # Remove trailing and dangling punctuation left by stripped promo badges
        text = re.sub(r'[\s\-|,\.!\?¡¿]+$', '', text).strip()

        return text
