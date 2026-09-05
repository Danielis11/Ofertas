import pytest
from scrapy.http import HtmlResponse, Request
from dealhunter_scraper.extractors.mercadolibre_extractor import MercadoLibreExtractor
from dealhunter_scraper.extractors.amazon_extractor import AmazonExtractor

def test_mercadolibre_extractor_parsing():
    html_content = """
    <html>
        <body>
            <div class="ui-search-result__wrapper">
                <a class="ui-search-link" href="https://articulo.mercadolibre.com.mx/MLM-123456789-nintendo-switch-oled?search=1">
                    <h2 class="ui-search-item__title">Nintendo Switch OLED 64GB Blanca ¡Envío Gratis!</h2>
                </a>
                <div class="andes-money-amount">
                    <span class="andes-money-amount__fraction">6,899</span>
                    <span class="andes-money-amount__cents">50</span>
                </div>
                <img class="ui-search-result-image__element" data-src="https://http2.mlstatic.com/sample.jpg" />
            </div>
        </body>
    </html>
    """
    request = Request(url="https://listado.mercadolibre.com.mx/nintendo-switch")
    response = HtmlResponse(url=request.url, request=request, body=html_content.encode('utf-8'))

    extractor = MercadoLibreExtractor()
    items = extractor.extract_items(response)

    assert len(items) == 1
    item = items[0]
    assert item['title'] == "Nintendo Switch OLED 64GB Blanca"
    assert item['price'] == 6899.5
    assert item['currency'] == "MXN"
    assert item['store_slug'] == "mercado-libre-mx"
    assert item['external_id'] == "MLM123456789"
    assert item['url'] == "https://articulo.mercadolibre.com.mx/MLM-123456789-nintendo-switch-oled"
    assert item['availability'] is True

def test_amazon_extractor_parsing():
    html_content = """
    <html>
        <body>
            <div data-component-type="s-search-result" data-asin="B098RKWH1Q">
                <h2>
                    <a href="/dp/B098RKWH1Q/ref=sr_1_1">
                        <span>Nintendo Switch OLED Model with White Joy-Con</span>
                    </a>
                </h2>
                <div class="a-price">
                    <span class="a-price-whole">6,499.</span>
                    <span class="a-price-fraction">00</span>
                </div>
                <img class="s-image" src="https://m.media-amazon.com/images/sample.jpg" />
            </div>
        </body>
    </html>
    """
    request = Request(url="https://www.amazon.com.mx/s?k=nintendo-switch")
    response = HtmlResponse(url=request.url, request=request, body=html_content.encode('utf-8'))

    extractor = AmazonExtractor()
    items = extractor.extract_items(response)

    assert len(items) == 1
    item = items[0]
    assert item['title'] == "Nintendo Switch OLED Model with White Joy-Con"
    assert item['price'] == 6499.0
    assert item['currency'] == "MXN"
    assert item['store_slug'] == "amazon-mx"
    assert item['external_id'] == "B098RKWH1Q"
    assert item['url'] == "https://www.amazon.com.mx/dp/B098RKWH1Q"
    assert item['availability'] is True
