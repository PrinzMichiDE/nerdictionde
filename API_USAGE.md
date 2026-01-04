# API Usage - Category Reviews Generation

## Cron Job Endpoint

### Endpoint
```
GET /api/cron/generate-category-reviews
```

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

```json
{
  "message": "Category review generation completed. 2/2 categories successful (hardware, amazon).",
  "results": {
    "hardware": {
      "success": true,
      "reviewId": "clx1234567890",
      "error": null
    },
    "amazon": {
      "success": true,
      "reviewId": "clx0987654321",
      "error": null
    }
  },
  "timestamp": "2024-01-04T12:00:00.000Z"
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
