# Content Monitoring & Flagging System

A Django REST API backend that ingests external content, identifies 
keyword-based matches, and supports a human review workflow with 
suppression rules.

## Setup Instructions
```bash
# Clone the repo
git clone https://github.com/EnzoGreed/content-monitor.git
cd content-monitor

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate.bat  # Windows
source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install django djangorestframework requests

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
```
## Quick Start (after setup)

**Step 1 — Add a keyword:**
```bash
curl -X POST http://127.0.0.1:8000/api/keywords/ -H "Content-Type: application/json" -d '{"name": "python"}'
```

**Step 2 — Fetch real articles from NewsAPI:**
```bash
curl -X POST http://127.0.0.1:8000/api/fetch/ -H "Content-Type: application/json" -d '{"query": "python"}'
```

**Step 3 — Scan for matches:**
```bash
curl -X POST http://127.0.0.1:8000/api/scan/ -H "Content-Type: application/json" -d '{"content_id": 1}'
```

**Step 4 — Review a flag:**
```bash
curl -X PATCH http://127.0.0.1:8000/api/flags/1/ -H "Content-Type: application/json" -d '{"status": "relevant"}'
```

## API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/keywords/ | Create a keyword |
| POST | /api/fetch/ | Fetch real articles from NewsAPI |
| POST | /api/scan/ | Trigger a scan on a content item |
| GET | /api/flags/ | List all flags |
| PATCH | /api/flags/{id}/ | Update review status |

## Sample curl Commands

**Create a keyword:**
```bash
curl -X POST http://127.0.0.1:8000/api/keywords/ \
  -H "Content-Type: application/json" \
  -d '{"name": "django"}'
```

**Trigger a scan:**
```bash
curl -X POST http://127.0.0.1:8000/api/scan/ \
  -H "Content-Type: application/json" \
  -d '{"content_id": 1}'
```

**List all flags:**
```bash
curl http://127.0.0.1:8000/api/flags/
```

**Update a flag status:**
```bash
curl -X PATCH http://127.0.0.1:8000/api/flags/1/ \
  -H "Content-Type: application/json" \
  -d '{"status": "relevant"}'
```

## Scoring Logic

| Match type | Score |
|---|---|
| Exact keyword match in title | 100 |
| Partial keyword match in title | 70 |
| Keyword appears only in body | 40 |

## Suppression Logic

If a flag is marked `irrelevant`, it will not reappear on future scans 
unless `ContentItem.last_updated` changes after the review timestamp. 
This is checked by comparing `content_item.last_updated` against 
`flag.reviewed_at`.

## Data Source
Uses **NewsAPI** (https://newsapi.org) to fetch real articles via 
the `POST /api/fetch/` endpoint.

To run locally, create a `local_settings.py` file in the root folder:
```python
NEWS_API_KEY = '907e948f62fd493fb810ba3d771994ef'
```
Get a free API key at https://newsapi.org.

## Assumptions & Trade-offs

- SQLite used for simplicity as recommended
- NewsAPI used for live article fetching via POST /api/fetch/
- Scan is API-triggered rather than scheduled
- Deduplication handled via `unique_together` on (keyword, content_item)
