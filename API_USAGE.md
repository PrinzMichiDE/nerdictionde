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
- **Amazon** (Produkte) - via Tavily Search
- **Movie** (Filme) - via TMDB API
- **Series** (Serien) - via TMDB API

### Authorization

**Keine Authorization erforderlich** - Die API kann öffentlich aufgerufen werden.

### Manueller Aufruf

#### Mit cURL:
```bash
curl -X GET https://your-domain.vercel.app/api/cron/generate-category-reviews
```

#### Mit JavaScript/Fetch:
```javascript
fetch('https://your-domain.vercel.app/api/cron/generate-category-reviews', {
  method: 'GET'
})
.then(response => response.json())
.then(data => {
  console.log('Results:', data);
  console.log('Hardware reviews:', data.results.hardware);
  console.log('Amazon reviews:', data.results.amazon);
});
```

#### Mit Postman/Insomnia:
- Method: `GET`
- URL: `https://your-domain.vercel.app/api/cron/generate-category-reviews`
- Keine Headers erforderlich

### Response Format

#### Erfolgreiche Antwort (Status 200):

```json
{
  "success": true,
  "status": 200,
  "message": "Category review generation completed. 5/5 categories successful (game, hardware, amazon, movie, series).",
  "results": {
    "game": {
      "success": true,
      "reviewId": "clx1111111111",
      "error": null
    },
    "hardware": {
      "success": true,
      "reviewId": "clx1234567890",
      "error": null
    },
    "amazon": {
      "success": true,
      "reviewId": "clx0987654321",
      "error": null
    },
    "movie": {
      "success": true,
      "reviewId": "clx2222222222",
      "error": null
    },
    "series": {
      "success": true,
      "reviewId": "clx3333333333",
      "error": null
    }
  },
  "summary": {
    "totalSuccessful": 5,
    "totalFailed": 0,
    "game": "Success",
    "hardware": "Success",
    "amazon": "Success",
    "movie": "Success",
    "series": "Success"
  },
  "timestamp": "2024-01-04T12:00:00.000Z"
}
```

#### Fehlerantwort (Status 500):

```json
{
  "success": false,
  "status": 500,
  "error": "Error message",
  "message": "An error occurred while generating category reviews"
}
```

### Sicherheitshinweis

Die API ist öffentlich aufrufbar. Für Produktionsumgebungen sollten Sie Rate Limiting oder andere Sicherheitsmaßnahmen in Betracht ziehen.

### Automatischer Schedule

Der Cron-Job läuft automatisch:
- **Schedule**: Täglich um Mitternacht (0:00 UTC)
- **Vercel Cron**: Konfiguriert in `vercel.json`

### Manuelle Ausführung

Sie können die API jederzeit manuell aufrufen, um Reviews zu generieren, ohne auf den automatischen Schedule zu warten.

---

## Bulk Create 200 Game Reviews Endpoint

### Endpoint
```
POST /api/reviews/bulk-create-200
```

### Beschreibung
Dedizierter API-Endpunkt für die stabile Massenerstellung von 200 Game Reviews. Optimiert für Zuverlässigkeit mit Retry-Logik, Rate Limiting und robuster Fehlerbehandlung.

### Authorization

**Admin-Authentifizierung erforderlich** - Die API benötigt einen gültigen Admin-Token.

### Request Body

```json
{
  "queryOptions": {
    "sortBy": "total_rating_count",
    "order": "desc",
    "minRating": 50,
    "genreId": 12,
    "platformId": 6
  },
  "status": "draft",
  "skipExisting": true,
  "batchSize": 5,
  "delayBetweenBatches": 3000,
  "delayBetweenGames": 2000,
  "maxRetries": 3
}
```

#### Parameter

- `queryOptions` (optional): IGDB Query-Optionen für die Spieleauswahl
  - `sortBy`: "popularity" | "rating" | "release_date" | "name" | "total_rating_count" (Standard: "total_rating_count")
  - `order`: "asc" | "desc" (Standard: "desc")
  - `minRating`: Mindestbewertung (0-100, Standard: 50)
  - `genreId`: Optional - Filter nach Genre-ID
  - `platformId`: Optional - Filter nach Plattform-ID
  - `releaseYear`: Optional - Filter nach Release-Jahr
- `status` (optional): "draft" | "published" (Standard: "draft")
- `skipExisting` (optional): Überspringt bereits existierende Reviews (Standard: true)
- `batchSize` (optional): Anzahl der Games pro Batch (Standard: 5)
- `delayBetweenBatches` (optional): Delay zwischen Batches in ms (Standard: 3000)
- `delayBetweenGames` (optional): Delay zwischen einzelnen Games in ms (Standard: 2000)
- `maxRetries` (optional): Maximale Anzahl von Retries pro Game (Standard: 3)

### Beispiel-Aufruf

#### Mit cURL:
```bash
curl -X POST https://your-domain.vercel.app/api/reviews/bulk-create-200 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "queryOptions": {
      "sortBy": "total_rating_count",
      "order": "desc",
      "minRating": 50
    },
    "status": "draft",
    "skipExisting": true
  }'
```

#### Mit JavaScript/Fetch:
```javascript
fetch('https://your-domain.vercel.app/api/reviews/bulk-create-200', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: JSON.stringify({
    queryOptions: {
      sortBy: 'total_rating_count',
      order: 'desc',
      minRating: 50
    },
    status: 'draft',
    skipExisting: true
  })
})
.then(response => response.json())
.then(data => {
  console.log('Results:', data.results);
  console.log('Successful:', data.results.successful);
  console.log('Failed:', data.results.failed);
});
```

### Response Format

#### Erfolgreiche Antwort (Status 200):

```json
{
  "message": "Bulk creation completed: 195 successful, 3 failed, 2 skipped",
  "results": {
    "total": 200,
    "successful": 195,
    "failed": 3,
    "skipped": 2,
    "reviews": [
      {
        "id": "clx1111111111",
        "title": "The Witcher 3: Wild Hunt",
        "slug": "the-witcher-3-wild-hunt",
        "igdbId": 1942
      },
      ...
    ],
    "errors": [
      {
        "game": "Some Game",
        "igdbId": 1234,
        "error": "Error message"
      }
    ],
    "totalTime": "12m 34s",
    "totalTimeMs": 754000
  }
}
```

#### Fehlerantwort (Status 400/500):

```json
{
  "error": "Failed to fetch games from IGDB: Rate limit exceeded"
}
```

### Features

- ✅ **Retry-Logik**: Exponentielles Backoff bei Fehlern (bis zu 3 Versuche)
- ✅ **Rate Limiting**: Automatische Delays zwischen Requests
- ✅ **Batch Processing**: Verarbeitet Games in konfigurierbaren Batches
- ✅ **Error Handling**: Robuste Fehlerbehandlung mit detailliertem Logging
- ✅ **Progress Tracking**: ETA-Berechnung während der Verarbeitung

### Performance

- **Geschwindigkeit**: ~10-15 Minuten für 200 Reviews (abhängig von API-Limits)
- **Rate Limits**: Respektiert automatisch IGDB und OpenAI Rate Limits
- **Stabilität**: Hohe Erfolgsrate durch Retry-Logik und Error Handling

### Anforderungen

- Konfigurierte Umgebungsvariablen:
  - `IGDB_CLIENT_ID`
  - `IGDB_CLIENT_SECRET`
  - `OPENAI_API_KEY`
  - `DATABASE_URL`
  - `BLOB_READ_WRITE_TOKEN` (für Bild-Uploads)
