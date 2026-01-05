# API Usage - Category Reviews Generation

## Cron Job Endpoint

### Endpoint
```
GET /api/cron/generate-category-reviews
```

### Categories
Die API generiert Reviews für alle folgenden Kategorien:
- **Game** (Spiele) - via IGDB API
- **Hardware** - via Tavily Search
- **Product** - via Multi-Source Strategy (PA API, Tavily, Scraping)
- **Amazon** (Legacy Produkte) - via Multi-Source Strategy
- **Movie** (Filme) - via TMDB API
- **Series** (Serien) - via TMDB API

### Authorization

**Vercel Cron Secret erforderlich** - Die API benötigt einen gültigen `Authorization` Header in der Produktion.
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

### Multi-Source Product Data
Für die Kategorie **Product** und **Amazon** wird eine Fallback-Kette verwendet:
1. **Amazon PA API 5.0**: Offizielle Datenquelle für Bilder, Preise und Specs (erfordert Credentials).
2. **Tavily Search**: Semantische Suche nach Produktdaten und Reviews.
3. **Smart Scraping**: Verbessertes Scraping mit Retry-Logik und CAPTCHA-Erkennung.

### Manueller Aufruf

#### Mit cURL:
```bash
curl -X GET https://your-domain.vercel.app/api/cron/generate-category-reviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Response Format

#### Erfolgreiche Antwort (Status 200):

```json
{
  "success": true,
  "status": 200,
  "message": "Cron completed. 6/6 categories successful.",
  "duration": "45.2s",
  "results": {
    "game": { "success": true, "reviewId": "...", "error": null },
    "hardware": { "success": true, "reviewId": "...", "error": null },
    "product": { "success": true, "reviewId": "...", "error": null },
    "amazon": { "success": true, "reviewId": "...", "error": null },
    "movie": { "success": true, "reviewId": "...", "error": null },
    "series": { "success": true, "reviewId": "...", "error": null }
  },
  "timestamp": "2024-01-05T12:00:00.000Z"
}
```

---

## Auto-Generate Review Endpoint

### Endpoint
```
POST /api/reviews/auto-generate
```

### Beschreibung
Generiert eine Review basierend auf einem Input (Name, URL, ID).

### Validation
Für Produkte wird der Input validiert:
- Mindestens 3 Zeichen.
- Maximal 200 Zeichen.
- ASIN Format (falls erkannt) muss 10 alphanumerische Zeichen sein.

---

## Mass Create Reviews Endpoint

### Endpoint
```
POST /api/reviews/bulk-create-mass
```

### Beschreibung
Startet einen Hintergrund-Job zur Massenerstellung von Reviews für eine gewählte Kategorie. Unterstützt Fortschrittsanzeige und Resume-Funktion.

### Parameter
- `category`: "game", "movie", "series", "hardware", "product"
- `count`: Anzahl der zu erstellenden Reviews
- `productNames`: (Nur für "product") Array von Produktnamen oder ASINs
- `hardwareNames`: (Nur für "hardware") Array von Hardware-Namen
- `status`: "draft" oder "published"
- `batchSize`: Anzahl der gleichzeitigen Anfragen (Standard: 5)

---
