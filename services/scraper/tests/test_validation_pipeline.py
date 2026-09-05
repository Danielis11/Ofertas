import pytest
from scrapy.exceptions import DropItem
from dealhunter_scraper.pipelines.validation_pipeline import ValidationPipeline

class DummySpider:
    name = "dummy"

def test_validation_pipeline_passes_valid_item():
    pipeline = ValidationPipeline()
    item = {
        'title': 'Nintendo Switch OLED',
        'price': 6499.0,
        'store_slug': 'amazon-mx',
        'external_id': 'B098RKWH1Q',
        'url': 'https://amazon.com.mx/dp/B098RKWH1Q',
    }
    result = pipeline.process_item(item, DummySpider())
    assert result == item

def test_validation_pipeline_drops_missing_field():
    pipeline = ValidationPipeline()
    item = {
        'title': 'Nintendo Switch OLED',
        'price': 6499.0,
        # missing store_slug, external_id, url
    }
    with pytest.raises(DropItem):
        pipeline.process_item(item, DummySpider())

def test_validation_pipeline_drops_invalid_price():
    pipeline = ValidationPipeline()
    item = {
        'title': 'Nintendo Switch OLED',
        'price': 0,
        'store_slug': 'amazon-mx',
        'external_id': 'B098RKWH1Q',
        'url': 'https://amazon.com.mx/dp/B098RKWH1Q',
    }
    with pytest.raises(DropItem):
        pipeline.process_item(item, DummySpider())
