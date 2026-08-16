# Favicon Setup für Nerdiction

## Design

Das Logo ist ein **N-Monogramm** in einem abgerundeten Badge:

- **Quelle**: `public/icon.svg` (Badge) und `public/icon-maskable.svg` (Vollfläche für PWA maskable)
- **Wortlogo**: `public/logo.svg` (Badge + „Nerdiction"-Wordmark)
- **Farbe**: Blau (#3b82f6) mit Gradient (#60a5fa → #3b82f6 → #1d4ed8)
- **Stil**: Modern, minimalistisch, gut erkennbar bis 16x16 px
- Das N besitzt eine diagonale Unterbrechung (Circuit-/Gaming-Element)

## Dateien generieren

Alle Favicon-Dateien werden automatisch aus den SVGs erzeugt:

```bash
npm run generate:icons
```

Das Script (`scripts/generate-favicons.mjs`) erstellt in `/public`:

| Datei                   | Format      | Verwendung                 |
| ----------------------- | ----------- | -------------------------- |
| `favicon.ico`           | ICO (16/32/48/256) | Standard-Favicon     |
| `icon-192.png`          | 192x192 PNG | Android / Chrome           |
| `icon-512.png`          | 512x512 PNG | PWA                        |
| `icon-512-maskable.png` | 512x512 PNG | PWA maskable (Vollfläche)  |
| `apple-icon.png`        | 180x180 PNG | iOS Apple Touch Icon       |

## Integration

- `src/app/layout.tsx` referenziert die Icons in den `Metadata`.
- `public/manifest.json` enthält die PWA-Icons inkl. maskable Variante.
- Das Logo-Badge wird in Header und Footer angezeigt.

## Verifizierung

1. Starte den Dev-Server: `npm run dev`
2. Öffne die Website im Browser – der Tab zeigt das Favicon.
3. Prüfe die Browser-Console auf 404-Fehler für fehlende Icons.

## Troubleshooting

- **Favicon wird nicht angezeigt**: Browser-Cache leeren (Ctrl+Shift+R).
- **404-Fehler**: Prüfe, ob alle Dateien im `/public` Verzeichnis liegen.
- **Neues Design**: `public/icon.svg` anpassen und `npm run generate:icons` ausführen.
