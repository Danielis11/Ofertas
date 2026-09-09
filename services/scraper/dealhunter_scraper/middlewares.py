import os
import re
import random
import logging
from urllib.parse import urlparse
from scrapy import signals
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.utils.response import response_status_message

logger = logging.getLogger('ResidentialProxyMiddleware')

# Realistic Mexican Desktop User-Agents (Chrome 122/123/124 on Windows & Mac)
DESKTOP_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
]

SEC_CH_UA_LIST = [
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    '"Microsoft Edge";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
]


class ResidentialProxyMiddleware:
    """
    Downloader middleware that routes Amazon and Mercado Libre requests through
    rotating residential proxies (BrightData, SmartProxy, Oxylabs, Webshare, etc.).
    Supports both standard Scrapy HTTP requests and Playwright browser contexts.
    """

    def __init__(self, proxy_url=None, proxy_server=None, proxy_user=None, proxy_pass=None, enabled=True):
        self.proxy_url = proxy_url
        self.proxy_server = proxy_server
        self.proxy_user = proxy_user
        self.proxy_pass = proxy_pass
        self.enabled = enabled

        # Resolve components if full URL was provided
        if self.proxy_url and not self.proxy_server:
            parsed = urlparse(self.proxy_url)
            self.proxy_server = f"{parsed.scheme}://{parsed.hostname}:{parsed.port}"
            self.proxy_user = parsed.username
            self.proxy_pass = parsed.password

        if self.enabled and (self.proxy_url or self.proxy_server):
            logger.info(f"Residential Proxy configured: {self.proxy_server} (user: {self.proxy_user or 'none'})")
        else:
            logger.info("Residential Proxy middleware loaded in PASS-THROUGH mode (no proxy credentials configured yet).")

    @classmethod
    def from_crawler(cls, crawler):
        proxy_url = crawler.settings.get('RESIDENTIAL_PROXY_URL') or os.getenv('RESIDENTIAL_PROXY_URL')
        proxy_server = crawler.settings.get('PROXY_SERVER') or os.getenv('PROXY_SERVER')
        proxy_user = crawler.settings.get('PROXY_USERNAME') or os.getenv('PROXY_USERNAME')
        proxy_pass = crawler.settings.get('PROXY_PASSWORD') or os.getenv('PROXY_PASSWORD')
        enabled = crawler.settings.getbool('RESIDENTIAL_PROXY_ENABLED', True)

        return cls(
            proxy_url=proxy_url,
            proxy_server=proxy_server,
            proxy_user=proxy_user,
            proxy_pass=proxy_pass,
            enabled=enabled,
        )

    def process_request(self, request, spider):
        # 1. Always inject a realistic Mexican shopper User-Agent and stealth headers
        ua = random.choice(DESKTOP_USER_AGENTS)
        sec_ch_ua = random.choice(SEC_CH_UA_LIST)
        request.headers['User-Agent'] = ua
        request.headers['Accept-Language'] = 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7'
        request.headers['Sec-Ch-Ua'] = sec_ch_ua
        request.headers['Sec-Ch-Ua-Mobile'] = '?0'
        request.headers['Sec-Ch-Ua-Platform'] = '"Windows"' if 'Windows' in ua else '"macOS"'
        request.headers['Sec-Fetch-Dest'] = 'document'
        request.headers['Sec-Fetch-Mode'] = 'navigate'
        request.headers['Sec-Fetch-Site'] = 'none'
        request.headers['Sec-Fetch-User'] = '?1'
        request.headers['Upgrade-Insecure-Requests'] = '1'

        # 2. Attach Residential Proxy if enabled and configured
        if not self.enabled or not (self.proxy_url or self.proxy_server):
            return None

        # Apply to Amazon and Mercado Libre (or any spider that doesn't explicitly disable proxy)
        target_domains = ['amazon.com.mx', 'mercadolibre.com.mx', 'listado.mercadolibre.com.mx']
        is_target = any(domain in request.url for domain in target_domains)

        if is_target or spider.name in ('amazon', 'mercadolibre'):
            # For standard Scrapy HTTP requests
            if self.proxy_url:
                request.meta['proxy'] = self.proxy_url
            elif self.proxy_server:
                if self.proxy_user and self.proxy_pass:
                    scheme, hostport = self.proxy_server.split('://', 1)
                    request.meta['proxy'] = f"{scheme}://{self.proxy_user}:{self.proxy_pass}@{hostport}"
                else:
                    request.meta['proxy'] = self.proxy_server

            # For Playwright requests
            if request.meta.get('playwright'):
                context_kwargs = request.meta.get('playwright_context_kwargs', {})
                pw_proxy = {'server': self.proxy_server}
                if self.proxy_user:
                    pw_proxy['username'] = self.proxy_user
                if self.proxy_pass:
                    pw_proxy['password'] = self.proxy_pass
                context_kwargs['proxy'] = pw_proxy
                request.meta['playwright_context_kwargs'] = context_kwargs

            logger.debug(f"Routed request through residential proxy: {request.url[:60]}...")

        return None

    def process_response(self, request, response, spider):
        # Detect Amazon Bot Detection (503 or CAPTCHA page)
        if 'amazon.com.mx' in response.url:
            if response.status == 503 or 'api-services-support@amazon.com' in response.text or 'Type the characters you see in this image' in response.text:
                logger.warning(f"[BOT-DETECTED] Amazon CAPTCHA encountered on {request.url}. Triggering retry with new proxy session.")
                # Retry if retry middleware is enabled
                retries = request.meta.get('retry_times', 0) + 1
                if retries <= 3:
                    retryreq = request.copy()
                    retryreq.meta['retry_times'] = retries
                    retryreq.dont_filter = True
                    return retryreq
                logger.error(f"[BOT-EXHAUSTED] Max retries exceeded for Amazon: {request.url}")

        # Detect Mercado Libre Account Verification / Suspicious Traffic Redirect
        if 'mercadolibre.com.mx' in response.url:
            if 'suspicious-traffic-frontend' in response.text or 'account-verification' in response.text or response.status == 403:
                logger.warning(f"[BOT-DETECTED] Mercado Libre verification challenge encountered on {request.url}.")
                retries = request.meta.get('retry_times', 0) + 1
                if retries <= 3:
                    retryreq = request.copy()
                    retryreq.meta['retry_times'] = retries
                    retryreq.dont_filter = True
                    return retryreq
                logger.error(f"[BOT-EXHAUSTED] Max retries exceeded for Mercado Libre: {request.url}")

        return response
