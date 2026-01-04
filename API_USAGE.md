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
