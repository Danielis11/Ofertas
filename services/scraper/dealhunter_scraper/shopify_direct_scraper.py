"""
Universal Shopify Scraper for Mexican Retailers (New Era, Doto, etc.)
Extracts catalog directly via Shopify's standard /products.json endpoint
and publishes offers to RabbitMQ.
"""
import json
import uuid
import logging
import argparse
from datetime import datetime, timezone
import requests
import pika

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ShopifyScraper")

RABBITMQ_HOST = "localhost"
RABBITMQ_PORT = 5672
RABBITMQ_USER = "dealhunter_admin"
RABBITMQ_PASS = "dealhunter_admin_pass"
EXCHANGE = "dealhunter.events"
ROUTING_KEY = "scraper.offer.found"

STORES = {
    "newera-mx": {
        "name": "New Era México Oficial",
        "domain": "https://newera.mx",
        "max_pages": 4,
    },
    "doto-mx": {
        "name": "Doto México",
        "domain": "https://doto.com.mx",
        "max_pages": 4,
    },
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

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
            "source": f"scraper.{item['storeSlug']}",
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

def scrape_shopify_store(store_slug: str, config: dict):
    domain = config["domain"]
    name = config["name"]
    max_pages = config.get("max_pages", 4)
    logger.info(f"========== Starting Shopify Scraper for {name} ({store_slug}) ==========")
    
    total_published = 0
    for page in range(1, max_pages + 1):
        url = f"{domain}/products.json?limit=250&page={page}"
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                logger.warning(f"Failed to fetch {url}: Status {r.status_code}")
                break
            data = r.json()
            products = data.get("products", [])
            if not products:
                break
            
            items = []
            for p in products:
                title = p.get("title", "").strip()
                if not title:
                    continue
                handle = p.get("handle", "")
                product_url = f"{domain}/products/{handle}" if handle else domain
                brand = p.get("vendor", "").strip() or None
                images = p.get("images", [])
                image_url = images[0].get("src") if images else None
                
                variants = p.get("variants", [])
                if not variants:
                    continue
                
                var = variants[0]
                try:
                    price = float(var.get("price", 0))
                except (ValueError, TypeError):
                    continue
                
                if price <= 0:
                    continue
                
                external_id = str(var.get("id") or p.get("id"))
                available = var.get("available", True)
                
                items.append({
                    "title": title,
                    "brand": brand,
                    "price": price,
                    "currency": "MXN",
                    "storeSlug": store_slug,
                    "store_slug": store_slug,
                    "externalId": external_id,
                    "external_id": external_id,
                    "url": product_url,
                    "imageUrl": image_url,
                    "image_url": image_url,
                    "availability": available,
                    "identifiers": {"SKU": external_id},
                })
            
            count = publish_offers(items)
            total_published += count
            logger.info(f"  [{store_slug}] Page {page}: {len(items)} extracted, {count} published")
            
            if len(products) < 250:
                break
        except Exception as e:
            logger.error(f"Error on page {page} of {domain}: {e}")
            break
            
    logger.info(f"Finished {name}: {total_published} total offers published.")
    return total_published

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--store", help="Store slug (e.g. newera-mx, doto-mx)")
    args = parser.parse_args()
    
    if args.store:
        if args.store in STORES:
            scrape_shopify_store(args.store, STORES[args.store])
        else:
            print(f"Unknown store {args.store}")
    else:
        for slug, cfg in STORES.items():
            scrape_shopify_store(slug, cfg)
