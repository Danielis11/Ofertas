import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from project root .env and local
root_path = Path(__file__).resolve().parents[3]
load_dotenv(root_path / ".env")
load_dotenv()

BOT_NAME = "dealhunter_scraper"

SPIDER_MODULES = ["dealhunter_scraper.spiders"]
NEWSPIDER_MODULE = "dealhunter_scraper.spiders"

ROBOTSTXT_OBEY = False

CONCURRENT_REQUESTS = 8
DOWNLOAD_DELAY = 1.0

COOKIES_ENABLED = False

DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

ITEM_PIPELINES = {
    "dealhunter_scraper.pipelines.ValidationPipeline": 300,
    "dealhunter_scraper.pipelines.RabbitMQPipeline": 700,
    "dealhunter_scraper.pipelines.ApiPublisherPipeline": 800,
}

# ==========================================
# RESIDENTIAL PROXY CONFIGURATION (BrightData / SmartProxy / Webshare)
# ==========================================
RESIDENTIAL_PROXY_ENABLED = os.getenv("RESIDENTIAL_PROXY_ENABLED", "true").lower() == "true"
RESIDENTIAL_PROXY_URL = os.getenv("RESIDENTIAL_PROXY_URL")
PROXY_SERVER = os.getenv("PROXY_SERVER")
PROXY_USERNAME = os.getenv("PROXY_USERNAME")
PROXY_PASSWORD = os.getenv("PROXY_PASSWORD")

DOWNLOADER_MIDDLEWARES = {
    "dealhunter_scraper.middlewares.ResidentialProxyMiddleware": 610,
    "scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware": 750,
}

AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 0.5
AUTOTHROTTLE_MAX_DELAY = 5.0
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0

REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"

DOWNLOAD_HANDLERS = {
    "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}
PLAYWRIGHT_BROWSER_TYPE = "chromium"
PLAYWRIGHT_LAUNCH_OPTIONS = {
    "headless": True,
    "args": [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
    ]
}
PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT = 30000
