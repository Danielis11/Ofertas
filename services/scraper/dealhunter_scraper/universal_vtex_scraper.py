"""
Universal VTEX Scraper for Mexican Retailers & Fashion Brands
Connects to stores powered by VTEX (Marti, Levi's, Miniso, Guess, Tommy Hilfiger)
and streams scraped offers directly into RabbitMQ.
"""
import json
import uuid
import logging
import argparse
from datetime import datetime, timezone
from urllib.parse import quote

import requests
import pika

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("UniversalVTEX")

RABBITMQ_HOST = "localhost"
RABBITMQ_PORT = 5672
RABBITMQ_USER = "dealhunter_admin"
RABBITMQ_PASS = "dealhunter_admin_pass"
EXCHANGE = "dealhunter.events"
ROUTING_KEY = "scraper.offer.found"

STORES_CONFIG = {
    "marti-mx": {
        "name": "Marti Mexico",
        "domain": "https://www.marti.mx",
        "queries": ["tenis", "playera", "sudadera", "pants", "futbol", "running", "mochila", "gorra"],
    },
    "levis-mx": {
        "name": "Levi's Mexico Oficial",
        "domain": "https://www.levi.com.mx",
        "queries": ["jeans", "chamarra", "playera", "camisa", "pantalon", "shorts", "sudadera"],
    },
    "guess-mx": {
        "name": "Guess Mexico Oficial",
        "domain": "https://www.guess.mx",
        "queries": ["bolsa", "cartera", "vestido", "reloj", "tenis", "playera", "chamarra"],
    },
    "tommy-mx": {
        "name": "Tommy Hilfiger Mexico",
        "domain": "https://mx.tommy.com",
        "queries": ["playera", "polo", "sudadera", "jeans", "chamarra", "camisa", "tenis"],
    },
    "miniso-mx": {
        "name": "Miniso Mexico Oficial",
        "domain": "https://www.miniso.com.mx",
        "queries": ["audifonos", "peluche", "mochila", "organizador", "termo", "cable", "taza"],
    },
    "motorola-mx": {
        "name": "Motorola México",
        "domain": "https://www.motorola.com.mx",
        "queries": ["moto", "edge", "razr", "g", "audifonos", "reloj", "smartphone"],
    },
    "vans-mx": {
        "name": "Vans México Oficial",
        "domain": "https://www.vans.mx",
        "queries": ["tenis", "sk8", "old skool", "playera", "sudadera", "mochila", "gorra"],
    },
    "oster-mx": {
        "name": "Oster México Oficial",
        "domain": "https://www.oster.com.mx",
        "queries": ["licuadora", "cafetera", "freidora", "batidora", "plancha", "horno", "arrocera"],
    },
    "sony-mx": {
        "name": "Sony Store México Oficial",
        "domain": "https://store.sony.com.mx",
        "queries": ["audifonos", "bocina", "camara", "playstation", "televisor", "soundbar", "lente"],
    },
    "whirlpool-mx": {
        "name": "Whirlpool México Oficial",
        "domain": "https://www.whirlpool.mx",
        "queries": ["lavadora", "refrigerador", "microondas", "estufa", "campana", "secadora", "parrilla"],
    },
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json",
}


def fetch_vtex(domain: str, query: str, page: int = 0, page_size: int = 50):
    encoded = quote(query)
    from_idx = page * page_size
    to_idx = from_idx + page_size - 1
    url = f"{domain}/api/catalog_system/pub/products/search/{encoded}?_from={from_idx}&_to={to_idx}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        if r.status_code in (200, 206):
            return r.json()
    except Exception as e:
        logger.warning(f"Error fetching {url}: {e}")
    return []


def extract_products(raw_products, store_slug: str):
    items = []
    for product in raw_products:
        try:
            title = product.get("productName", "").strip()
            if not title:
                continue
            url = product.get("link", "")
            external_id = str(product.get("productId", "")).strip()
            if not external_id:
                continue

            sku_list = product.get("items", [])
            if not sku_list:
                continue
            sku = sku_list[0]

            sellers = sku.get("sellers", [])
            if not sellers:
                continue
            offer = sellers[0].get("commertialOffer", {})
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
                "storeSlug": store_slug,
                "store_slug": store_slug,
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


def scrape_store(store_slug: str, config: dict, pages_per_query: int = 2):
    store_name = config["name"]
    domain = config["domain"]
    queries = config["queries"]

    logger.info(f"========== Starting Scraper for {store_name} ({store_slug}) ==========")
    store_total = 0

    for query in queries:
        all_items = []
        for page in range(pages_per_query):
            raw = fetch_vtex(domain, query, page=page)
            if not raw:
                break
            items = extract_products(raw, store_slug)
            all_items.extend(items)
            logger.info(f"  [{store_slug}] '{query}' Page {page+1}: {len(items)} items")
            if len(raw) < 50:
                break

        count = publish_offers(all_items)
        store_total += count

    logger.info(f"Completed {store_name}: {store_total} offers published to RabbitMQ.")
    return store_total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--store", help="Specific store slug to scrape (e.g. levis-mx, marti-mx)")
    parser.add_argument("--pages", type=int, default=2, help="Pages per query (50 items/page)")
    args = parser.parse_args()

    if args.store:
        if args.store not in STORES_CONFIG:
            logger.error(f"Unknown store '{args.store}'. Available: {list(STORES_CONFIG.keys())}")
            return
        scrape_store(args.store, STORES_CONFIG[args.store], pages_per_query=args.pages)
    else:
        grand_total = 0
        for slug, config in STORES_CONFIG.items():
            total = scrape_store(slug, config, pages_per_query=args.pages)
            grand_total += total
        logger.info(f"ALL STORES FINISHED. Grand Total: {grand_total} offers published to RabbitMQ.")


if __name__ == "__main__":
    main()
