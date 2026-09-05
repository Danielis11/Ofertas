BOT_NAME = "dealhunter_scraper"

SPIDER_MODULES = ["dealhunter_scraper.spiders"]
NEWSPIDER_MODULE = "dealhunter_scraper.spiders"

ROBOTSTXT_OBEY = False

CONCURRENT_REQUESTS = 4
DOWNLOAD_DELAY = 1.5

COOKIES_ENABLED = False

DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
}

ITEM_PIPELINES = {
    "dealhunter_scraper.pipelines.ValidationPipeline": 300,
    "dealhunter_scraper.pipelines.RabbitMQPipeline": 700,
    "dealhunter_scraper.pipelines.ApiPublisherPipeline": 800,
}

AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1.0
AUTOTHROTTLE_MAX_DELAY = 10.0
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0

REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
