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
pip install django djangorestframework

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

Uses a mock dataset entered via the Django admin panel. Source field 
is set to `mock` as per the alternative option in the assignment.

## Assumptions & Trade-offs

- SQLite used for simplicity as recommended
- Mock data used instead of a live API integration
- Scan is API-triggered rather than scheduled
- Deduplication handled via `unique_together` on (keyword, content_item)
