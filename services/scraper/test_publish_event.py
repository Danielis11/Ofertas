import json
import uuid
from datetime import datetime, timezone
import pika

credentials = pika.PlainCredentials('dealhunter_admin', 'dealhunter_admin_pass')
parameters = pika.ConnectionParameters(host='localhost', port=5672, credentials=credentials)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()

# Event payload: Amazon price drop from 6499 to 5999!
event = {
    "eventId": str(uuid.uuid4()),
    "eventName": "OFFER_SCRAPED",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "source": "scraper.amazon-mx",
    "payload": {
        "title": "Nintendo Switch OLED 64GB Blanco",
        "brand": "Nintendo",
        "model": "OLED White",
        "price": 5999.00,
        "currency": "MXN",
        "storeSlug": "amazon-mx",
        "externalId": "B098RKWH1Q",
        "url": "https://www.amazon.com.mx/dp/B098RKWH1Q",
        "availability": True,
        "identifiers": {
            "ASIN": "B098RKWH1Q",
            "EAN": "0045496883386"
        }
    }
}

channel.basic_publish(
    exchange='dealhunter.events',
    routing_key='scraper.offer.detected',
    body=json.dumps(event),
    properties=pika.BasicProperties(delivery_mode=2)
)

print("EVENT_PUBLISHED_SUCCESS")
connection.close()
