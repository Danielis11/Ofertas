"""
Elektra Direct Scraper
Bypasses Scrapy entirely - uses requests + pika directly.
Run independently: python -m dealhunter_scraper.scrapers.elektra_direct --query xbox
"""
import json
import sys
import uuid
import logging
import argparse
from datetime import datetime, timezone
from urllib.parse import quote

import requests
import pika

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ElektraDirect")

STORE_SLUG = "elektra-mx"
RABBITMQ_HOST = "localhost"
RABBITMQ_PORT = 5672
RABBITMQ_USER = "dealhunter_admin"
RABBITMQ_PASS = "dealhunter_admin_pass"
EXCHANGE = "dealhunter.events"
ROUTING_KEY = "scraper.offer.found"

DEFAULT_QUERIES = [
    "xbox", "playstation", "nintendo",
    "samsung", "iphone", "xiaomi", "motorola",
    "laptop", "television", "pantalla", "monitor",
    "audifonos", "tablet", "consola",
    "refrigerador", "lavadora", "estufa", "licuadora",
    "colchon", "motocicleta", "tenis", "jeans",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json",
}


def fetch_elektra(query: str, page: int = 0, page_size: int = 50):
    encoded = quote(query)
    from_idx = page * page_size
    to_idx = from_idx + page_size - 1
    url = f"https://www.elektra.mx/api/catalog_system/pub/products/search/{encoded}?_from={from_idx}&_to={to_idx}"
    r = requests.get(url, headers=HEADERS, timeout=15)
    if r.status_code not in (200, 206):
        return []
    return r.json()


def extract_products(raw_products):
    items = []
    for product in raw_products:
        try:
            title = product.get("productName", "").strip()
            if not title:
                continue
            url = product.get("link", "")
            external_id = str(product.get("productId", ""))
            sku = product.get("items", [])[0]
            offer = sku.get("sellers", [])[0].get("commertialOffer", {})
            price = offer.get("Price")
            if not price or price <= 0:
                continue
            images = sku.get("images", [])
            image_url = images[0].get("imageUrl") if images else None
            available = offer.get("AvailableQuantity", 0) > 0
            brand = product.get("brand", "").strip() or None
            items.append({
                "title": title,
                "brand": brand,
                "price": float(price),
                "currency": "MXN",
                "storeSlug": STORE_SLUG,
                "store_slug": STORE_SLUG,
                "externalId": external_id,
                "external_id": external_id,
                "url": url,
                "imageUrl": image_url,
                "image_url": image_url,
                "availability": available,
                "identifiers": {"SKU": external_id},
            })
        except Exception:
            continue
    return items


def publish_offers(items):
    if not items:
        return 0
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    params = pika.ConnectionParameters(
        host=RABBITMQ_HOST, port=RABBITMQ_PORT,
        credentials=credentials, heartbeat=0,
    )
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)

    published = 0
    for item in items:
        event = {
            "eventId": str(uuid.uuid4()),
            "eventName": "OFFER_SCRAPED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "elektra-direct-scraper",
            "payload": item,
        }
        channel.basic_publish(
            exchange=EXCHANGE,
            routing_key=ROUTING_KEY,
            body=json.dumps(event),
            properties=pika.BasicProperties(delivery_mode=2),
        )
        published += 1

    connection.close()
    return published


def scrape_query(query: str, max_pages: int = 3):
    all_items = []
    for page in range(max_pages):
        raw = fetch_elektra(query, page=page)
        if not raw:
            break
        items = extract_products(raw)
        all_items.extend(items)
        logger.info(f"  [{query}] Page {page+1}: {len(items)} products")
        if len(raw) < 50:
            break
    return all_items


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", help="Single query to scrape")
    parser.add_argument("--pages", type=int, default=3)
    args = parser.parse_args()

    queries = [args.query] if args.query else DEFAULT_QUERIES

    total = 0
    for query in queries:
        logger.info(f"Scraping Elektra: '{query}'")
        items = scrape_query(query, max_pages=args.pages)
        count = publish_offers(items)
        logger.info(f"  Published {count} offers for '{query}'")
        total += count

    logger.info(f"DONE: Published {total} total offers to RabbitMQ")


if __name__ == "__main__":
    main()
