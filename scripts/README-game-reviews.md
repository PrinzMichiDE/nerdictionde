# Massenerstellung von Game Reviews

Dieses Script ermöglicht die stabile Massenerstellung von 200 Game Reviews mit folgenden Features:

## Features

- ✅ **Robuste Fehlerbehandlung**: Retry-Logik mit exponentiellem Backoff
- ✅ **Rate Limiting**: Automatische Delays zwischen Requests
- ✅ **Progress Tracking**: Speichert Fortschritt und ermöglicht Resume bei Unterbrechung
- ✅ **IGDB Integration**: Nutzt IGDB API für Game-Daten
- ✅ **Batch Processing**: Verarbeitet Games in konfigurierbaren Batches

## Verwendung

### Einfache Ausführung

```bash
npm run create-game-reviews
```

### Manuelle Ausführung

```bash
tsx scripts/create-200-game-reviews.ts
```

## Konfiguration

Das Script kann durch Bearbeitung der Konstanten im Script angepasst werden:

- `TARGET_COUNT`: Anzahl der zu erstellenden Reviews (Standard: 200)
- `BATCH_SIZE`: Anzahl der Games pro Batch (Standard: 5)
- `DELAY_BETWEEN_BATCHES`: Delay zwischen Batches in ms (Standard: 3000)
- `DELAY_BETWEEN_GAMES`: Delay zwischen einzelnen Games in ms (Standard: 2000)
- `STATUS`: Status der erstellten Reviews ("draft" oder "published")
- `SKIP_EXISTING`: Überspringt bereits existierende Reviews (Standard: true)

## Progress Tracking

Das Script speichert den Fortschritt in `scripts/game-reviews-progress.json`. Falls das Script unterbrochen wird, kann es einfach erneut ausgeführt werden und setzt automatisch fort.

Die Progress-Datei wird automatisch gelöscht, wenn alle Reviews erfolgreich erstellt wurden.

## Fehlerbehandlung

- **Retry-Logik**: Jedes Game wird bis zu 3x wiederholt bei Fehlern
- **Rate Limiting**: Automatische Delays bei Rate-Limit-Fehlern
- **Error Logging**: Alle Fehler werden protokolliert und in der Progress-Datei gespeichert

## API-Endpunkt

Alternativ kann auch der API-Endpunkt `/api/reviews/bulk-create` verwendet werden:

```bash
POST /api/reviews/bulk-create
{
  "queryOptions": {
    "sortBy": "total_rating_count",
    "order": "desc",
    "minRating": 50
  },
  "totalLimit": 200,
  "batchSize": 5,
  "delayBetweenBatches": 3000,
  "delayBetweenGames": 2000,
  "status": "draft",
  "skipExisting": true,
  "maxRetries": 3
}
```

## Anforderungen

- Node.js mit TypeScript Support
- Konfigurierte Umgebungsvariablen:
  - `IGDB_CLIENT_ID`
  - `IGDB_CLIENT_SECRET`
  - `OPENAI_API_KEY`
  - `DATABASE_URL`
  - `BLOB_READ_WRITE_TOKEN` (für Bild-Uploads)

## Performance

- **Geschwindigkeit**: ~10-15 Minuten für 200 Reviews (abhängig von API-Limits)
- **Rate Limits**: Das Script respektiert automatisch IGDB und OpenAI Rate Limits
- **Stabilität**: Retry-Logik und Error Handling sorgen für hohe Erfolgsrate
