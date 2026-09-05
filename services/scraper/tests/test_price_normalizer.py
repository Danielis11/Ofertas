import pytest
from dealhunter_scraper.normalizers.price_normalizer import PriceNormalizer

def test_normalize_standard_mxn():
    price, currency = PriceNormalizer.normalize("$6,499.00")
    assert price == 6499.0
    assert currency == "MXN"

def test_normalize_with_spaces():
    price, currency = PriceNormalizer.normalize("$ 7,199 MXN")
    assert price == 7199.0
    assert currency == "MXN"

def test_normalize_usd():
    price, currency = PriceNormalizer.normalize("USD 299.99")
    assert price == 299.99
    assert currency == "USD"

def test_normalize_euro():
    price, currency = PriceNormalizer.normalize("349,99 €")
    assert price == 349.99
    assert currency == "EUR"

def test_normalize_invalid_or_zero():
    assert PriceNormalizer.normalize("Gratis") == (None, None)
    assert PriceNormalizer.normalize("$0.00") == (None, None)
    assert PriceNormalizer.normalize(None) == (None, None)
    assert PriceNormalizer.normalize("") == (None, None)
