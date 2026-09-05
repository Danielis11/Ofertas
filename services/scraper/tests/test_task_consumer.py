import pytest
from dealhunter_scraper.task_consumer import TaskConsumer, SPIDER_MAPPING

def test_spider_mapping_stores():
    assert SPIDER_MAPPING["amazon-mx"] == "amazon"
    assert SPIDER_MAPPING["mercado-libre-mx"] == "mercadolibre"
    assert SPIDER_MAPPING["walmart-mx"] == "walmart"

def test_process_task_amazon():
    consumer = TaskConsumer()
    payload = {
        "storeSlug": "amazon-mx",
        "searchQuery": "playstation 5",
        "category": "videojuegos",
        "priority": "HIGH",
        "maxItems": 40,
        "triggeredBy": "MANUAL",
    }
    result = consumer.process_task(payload)
    assert result["spider"] == "amazon"
    assert result["store_slug"] == "amazon-mx"
    assert result["search_query"] == "playstation 5"
    assert result["priority"] == "HIGH"
    assert result["max_items"] == 40
    assert result["status"] == "QUEUED_FOR_EXECUTION"

def test_process_task_mercadolibre():
    consumer = TaskConsumer()
    payload = {
        "storeSlug": "mercado-libre-mx",
        "searchQuery": "iphone 15 pro",
        "priority": "NORMAL",
        "triggeredBy": "CRON",
    }
    result = consumer.process_task(payload)
    assert result["spider"] == "mercadolibre"
    assert result["store_slug"] == "mercado-libre-mx"
    assert result["search_query"] == "iphone 15 pro"
    assert result["triggered_by"] == "CRON"

def test_process_task_unknown_store():
    consumer = TaskConsumer()
    payload = {
        "storeSlug": "unknown-store-xyz",
    }
    with pytest.raises(ValueError, match="Unknown store slug"):
        consumer.process_task(payload)
