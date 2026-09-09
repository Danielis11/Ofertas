"""
Amazon Mexico Direct Proxy Scraper
Scrapes Amazon.com.mx via rotating residential proxies (BrightData, SmartProxy, etc.)
Extracts ASIN, title, price, images, and streams to RabbitMQ.
"""
import os
import json
import uuid
import random
import logging
import argparse
from datetime import datetime, timezone
from urllib.parse import quote_plus, urljoin
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
logger = logging.getLogger("AmazonProxyScraper")

STORE_SLUG = "amazon-mx"
BASE_URL = "https://www.amazon.com.mx"
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
    "laptop", "nintendo switch", "playstation 5", "xbox series x",
    "audifonos bluetooth", "monitor gamer", "samsung galaxy", "iphone 15",
    "smart tv 4k", "teclado mecanico", "reloj inteligente", "tablet",
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


def parse_amazon_page(html: str):
    soup = BeautifulSoup(html, "html.parser")
    items = []

    # Check for CAPTCHA
    if "api-services-support@amazon.com" in html or "Type the characters you see in this image" in html:
        logger.warning("[AMAZON BOT DETECTED] Amazon CAPTCHA challenge returned. Requires residential proxy rotation.")
        return items, True

    raw_cards = soup.find_all(attrs={"data-asin": True})
    for card in raw_cards:
        try:
            asin = card.get("data-asin", "").strip()
            if not asin or len(asin) < 5:
                continue

            # 1. Price extraction
            price = None
            offscreen = card.select_one(".a-price .a-offscreen")
            if offscreen:
                p_text = offscreen.get_text(strip=True).replace("$", "").replace(",", "")
                try:
                    price = float(p_text)
                except ValueError:
                    pass

            if not price:
                whole_el = card.select_one(".a-price-whole")
                if whole_el:
                    whole = whole_el.get_text(strip=True).replace(",", "").replace(".", "")
                    fraction_el = card.select_one(".a-price-fraction")
                    fraction = fraction_el.get_text(strip=True) if fraction_el else "00"
                    try:
                        price = float(f"{whole}.{fraction}")
                    except ValueError:
                        pass

            if not price or price <= 0:
                continue

            # 2. Image and Title extraction
            img_el = card.select_one("img.s-image, img[data-image-latency], img")
            image_url = img_el["src"] if img_el and img_el.has_attr("src") else None

            title = ""
            if img_el and img_el.get("alt"):
                title = img_el.get("alt").strip()

            if not title or len(title) < 5:
                title_el = card.select_one("h2 a span, h2 span, h2, a span.a-text-normal, span.a-text-normal")
                if title_el:
                    title = title_el.get_text(strip=True)

            if not title or len(title) < 5:
                continue

            # 3. Clean permanent canonical URL
            url = f"https://www.amazon.com.mx/dp/{asin}"

            items.append({
                "title": title,
                "price": price,
                "currency": "MXN",
                "storeSlug": STORE_SLUG,
                "store_slug": STORE_SLUG,
                "externalId": asin,
                "external_id": asin,
                "url": url,
                "imageUrl": image_url,
                "image_url": image_url,
                "availability": True,
                "identifiers": {"ASIN": asin},
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
try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


def scrape_query_playwright(query: str, pages: int = 1):
    if not PLAYWRIGHT_AVAILABLE:
        return []
    items_found = []
    encoded = quote_plus(query)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
                locale="es-MX",
                viewport={"width": 1280, "height": 800},
            )
            page = context.new_page()
            for page_num in range(1, pages + 1):
                url = f"{BASE_URL}/s?k={encoded}&page={page_num}"
                page.goto(url, timeout=35000, wait_until="domcontentloaded")
                page.wait_for_timeout(1500)
                html = page.content()
                page_items, cap = parse_amazon_page(html)
                if not cap and page_items:
                    items_found.extend(page_items)
            browser.close()
    except Exception as e:
        logger.error(f"Playwright fallback error for '{query}': {e}")
    return items_found


def scrape_query(query: str, proxy: str = None, pages: int = 2):
    encoded = quote_plus(query)
    proxies = {"http": proxy, "https": proxy} if proxy else None
    all_items = []

    for page in range(1, pages + 1):
        url = f"{BASE_URL}/s?k={encoded}&page={page}"
        logger.info(f"Fetching Amazon: '{query}' (page {page}) via proxy: {bool(proxy)}")
        try:
            r = requests.get(url, headers=get_headers(), proxies=proxies, timeout=15)
            items, captcha = parse_amazon_page(r.text)
            if captcha or not items:
                logger.info(f"Requests blocked/empty for page {page}. Switching to Playwright headless browser...")
                pw_items = scrape_query_playwright(query, pages=1)
                all_items.extend(pw_items)
                break
            all_items.extend(items)
            logger.info(f"  Extracted {len(items)} products from page {page}")
            if not items:
                break
        except Exception as e:
            logger.error(f"Request error on page {page}: {e}. Trying Playwright...")
            pw_items = scrape_query_playwright(query, pages=1)
            all_items.extend(pw_items)
            break

    count = publish_offers(all_items)
    logger.info(f"Published {count} Amazon offers for '{query}' to RabbitMQ")
    return count


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", help="Search term (e.g. laptop, nintendo)")
    parser.add_argument("--pages", type=int, default=2)
    parser.add_argument("--proxy", help="Residential proxy URL (e.g. http://user:pass@host:port)")
    args = parser.parse_args()

    proxy = args.proxy or os.getenv("RESIDENTIAL_PROXY_URL")

    queries = [args.query] if args.query else DEFAULT_QUERIES
    total = 0
    for q in queries:
        total += scrape_query(q, proxy=proxy, pages=args.pages)

    logger.info(f"Amazon scraping finished. Total published: {total}")


if __name__ == "__main__":
    main()
