# API Usage - Category Reviews Generation

## Cron Job Endpoint

### Endpoint
```
GET /api/cron/generate-category-reviews
```

### Authorization

Wenn `CRON_SECRET` in den Environment Variables gesetzt ist, muss der Request einen Authorization Header enthalten:

```bash
Authorization: Bearer YOUR_CRON_SECRET
```

### Manueller Aufruf

#### Mit cURL:
```bash
curl -X GET https://your-domain.vercel.app/api/cron/generate-category-reviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### Mit JavaScript/Fetch:
```javascript
fetch('https://your-domain.vercel.app/api/cron/generate-category-reviews', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

#### Mit Postman/Insomnia:
- Method: `GET`
- URL: `https://your-domain.vercel.app/api/cron/generate-category-reviews`
- Headers:
  - `Authorization: Bearer YOUR_CRON_SECRET`

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

### Ohne Authorization (für lokale Entwicklung)

Wenn `CRON_SECRET` nicht gesetzt ist, kann die API ohne Authorization aufgerufen werden (nur für lokale Entwicklung empfohlen).

### Automatischer Schedule

Der Cron-Job läuft automatisch:
- **Schedule**: Täglich um Mitternacht (0:00 UTC)
- **Vercel Cron**: Konfiguriert in `vercel.json`

### Manuelle Ausführung

Sie können die API jederzeit manuell aufrufen, um Reviews zu generieren, ohne auf den automatischen Schedule zu warten.
