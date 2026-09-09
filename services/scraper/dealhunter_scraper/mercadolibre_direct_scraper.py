"""
Mercado Libre Mexico Direct Proxy Scraper
Scrapes listado.mercadolibre.com.mx via rotating residential proxies (BrightData, SmartProxy, etc.)
Extracts MLM ID, title, price, images, and streams to RabbitMQ.
"""
import os
import re
import json
import uuid
import random
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path

import requests
import pika
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load env
root_path = Path(__file__).resolve().parents[3]
load_dotenv(root_path / ".env")
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MercadoLibreProxyScraper")

STORE_SLUG = "mercado-libre-mx"
BASE_URL = "https://listado.mercadolibre.com.mx"
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_DEFAULT_USER", "dealhunter_admin")
RABBITMQ_PASS = os.getenv("RABBITMQ_DEFAULT_PASS", "dealhunter_admin_pass")
EXCHANGE = "dealhunter.events"
ROUTING_KEY = "scraper.offer.found"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

DEFAULT_QUERIES = [
    "laptop", "celular", "playstation 5", "nintendo switch",
    "tenis", "jeans", "pantalla 4k", "refrigerador",
    "lavadora", "audifonos", "herramientas", "microondas",
]


def get_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
    }


def parse_ml_page(html: str):
    soup = BeautifulSoup(html, "html.parser")
    items = []

    # Check for bot challenge
    if "suspicious-traffic-frontend" in html or "account-verification" in html:
        logger.warning("[ML BOT DETECTED] Mercado Libre verification challenge encountered. Requires residential proxy rotation.")
        return items, True

    cards = soup.select(".promotions_wrapper-item, .promotion-item, .ui-search-layout__item, .poly-card, .ui-search-result__wrapper")
    for card in cards:
        try:
            link_el = card.select_one("a[href]")
            if not link_el or not link_el.has_attr("href"):
                continue
            url = link_el["href"].split("#")[0].split("?")[0]

            id_match = re.search(r"(MLM-?\d+)", url, re.IGNORECASE)
            external_id = id_match.group(1).replace("-", "").upper() if id_match else None
            if not external_id:
                continue

            title_el = card.select_one(".poly-component__title, .promotion-item__title, .ui-search-item__title, a.poly-component__title")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            if not title or len(title) < 4:
                continue

            fraction_el = card.select_one(".andes-money-amount__fraction")
            if not fraction_el:
                continue
            whole = fraction_el.get_text(strip=True).replace(",", "").replace(".", "")
            cents_el = card.select_one(".andes-money-amount__cents")
            cents = cents_el.get_text(strip=True) if cents_el else "00"
            price = float(f"{whole}.{cents}")
            if price <= 0:
                continue

            img_el = card.select_one("img.ui-search-result-image__element, img.poly-component__picture, img[src*='http2.mlstatic'], img")
            image_url = img_el.get("data-src") or img_el.get("src") if img_el else None

            items.append({
                "title": title,
                "price": price,
                "currency": "MXN",
                "storeSlug": STORE_SLUG,
                "store_slug": STORE_SLUG,
                "externalId": external_id,
                "external_id": external_id,
                "url": url,
                "imageUrl": image_url,
                "image_url": image_url,
                "availability": True,
                "identifiers": {"EXTERNAL_ID": external_id},
            })
        except Exception:
            continue

    return items, False


def publish_offers(items):
    if not items:
        return 0
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    params = pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT, credentials=credentials, heartbeat=0)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)

    published = 0
    for item in items:
        event = {
            "eventId": str(uuid.uuid4()),
            "eventName": "OFFER_SCRAPED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": f"scraper.{STORE_SLUG}",
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


def scrape_query(query: str, proxy: str = None, pages: int = 2):
    slug = query.strip().replace(" ", "-")
    proxies = {"http": proxy, "https": proxy} if proxy else None
    all_items = []

    for page in range(pages):
        from_offset = page * 50 + 1
        url = f"{BASE_URL}/{slug}_Desde_{from_offset}" if page > 0 else f"{BASE_URL}/{slug}"
        logger.info(f"Fetching Mercado Libre: '{query}' (page {page+1}) via proxy: {bool(proxy)}")
        try:
            r = requests.get(url, headers=get_headers(), proxies=proxies, timeout=15)
            items, captcha = parse_ml_page(r.text)
            if captcha:
                logger.warning(f"Proxy IP flagged on page {page+1}. Rotate proxy or use residential IP.")
                break
            all_items.extend(items)
            logger.info(f"  Extracted {len(items)} products from page {page+1}")
            if not items:
                break
        except Exception as e:
            logger.error(f"Request error on page {page+1}: {e}")
            break

    count = publish_offers(all_items)
    logger.info(f"Published {count} Mercado Libre offers for '{query}' to RabbitMQ")
    return count


OFERTAS_CATEGORIES = [
    ("Todas", ""),
    ("Celulares y Telefonía", "MLM1051"),
    ("Computación", "MLM1648"),
    ("Ropa, Bolsas y Calzado", "MLM1430"),
    ("Consolas y Videojuegos", "MLM1144"),
    ("Electrónica, Audio y Video", "MLM1000"),
    ("Hogar, Muebles y Jardín", "MLM1574"),
    ("Deportes y Fitness", "MLM1276"),
    ("Herramientas", "MLM26353"),
    ("Belleza y Cuidado Personal", "MLM1246"),
    ("Electrodomésticos", "MLM5726"),
    ("Accesorios para Vehículos", "MLM1747"),
    ("Juegos y Juguetes", "MLM1132"),
    ("Bebés", "MLM1384"),
    ("Relojes y Joyas", "MLM3937"),
    ("Cámaras y Fotografía", "MLM1039"),
    ("Salud y Equipamiento Médico", "MLM180800"),
    ("Alimentos y Bebidas", "MLM1403"),
]


def scrape_ofertas(categories=None, pages=3, proxy=None):
    proxies = {"http": proxy, "https": proxy} if proxy else None
    total_published = 0
    cats = categories or OFERTAS_CATEGORIES

    for cat_name, cat_id in cats:
        for page in range(1, pages + 1):
            url = f"https://www.mercadolibre.com.mx/ofertas?page={page}"
            if cat_id:
                url += f"&category={cat_id}"
            logger.info(f"Fetching ML Ofertas [{cat_name}] page {page}")
            try:
                r = requests.get(url, headers=get_headers(), proxies=proxies, timeout=12)
                items, blocked = parse_ml_page(r.text)
                if blocked:
                    logger.warning(f"Challenge on ML Ofertas [{cat_name}] page {page}")
                    break
                cnt = publish_offers(items)
                total_published += cnt
                logger.info(f"  Published {cnt} deals to RabbitMQ ({cat_name} p.{page})")
            except Exception as e:
                logger.error(f"Error fetching ML ofertas {url}: {e}")
                break

    logger.info(f"Published total {total_published} hot deals from Mercado Libre to RabbitMQ")
    return total_published


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", help="Search term (e.g. laptop, tenis)")
    parser.add_argument("--ofertas", action="store_true", help="Scrape hot deals feed")
    parser.add_argument("--pages", type=int, default=3)
    parser.add_argument("--proxy", help="Residential proxy URL (e.g. http://user:pass@host:port)")
    args = parser.parse_args()

    proxy = args.proxy or os.getenv("RESIDENTIAL_PROXY_URL")

    total = 0
    if args.ofertas or not args.query:
        total += scrape_ofertas(pages=args.pages, proxy=proxy)

    if args.query:
        cnt = scrape_query(args.query, proxy=proxy, pages=args.pages)
        total += cnt
        if cnt == 0 and not args.ofertas:
            logger.info("Search blocked by bot challenge without proxy, falling back to hot deals feed...")
            total += scrape_ofertas(pages=args.pages, proxy=proxy)

    logger.info(f"Mercado Libre scraping finished. Total published: {total}")


if __name__ == "__main__":
    main()
