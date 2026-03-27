import requests
from django.conf import settings
from django.utils.dateparse import parse_datetime
from .models import ContentItem


def fetch_news(query='technology'):
    api_key = settings.NEWS_API_KEY
    url = 'https://newsapi.org/v2/everything'

    params = {
        'q': query,
        'language': 'en',
        'pageSize': 10,
        'apiKey': api_key
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        return [], f"API error: {response.status_code}"

    articles = response.json().get('articles', [])
    saved_items = []

    for article in articles:
        title = article.get('title', '')
        body = article.get('description') or article.get('content') or ''
        source = article.get('source', {}).get('name', 'newsapi')
        last_updated = parse_datetime(article.get('publishedAt', ''))

        if not title or not last_updated:
            continue

        item, created = ContentItem.objects.get_or_create(
            title=title,
            defaults={
                'body': body,
                'source': source,
                'last_updated': last_updated
            }
        )

        if created:
            saved_items.append(item)

    return saved_items, None
