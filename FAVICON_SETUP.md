# Favicon Setup für Nerdiction

## Aktuelle Konfiguration

Das Favicon-System ist bereits konfiguriert in `src/app/layout.tsx` und erwartet folgende Dateien im `/public` Verzeichnis:

- `favicon.ico` - Standard Favicon (16x16, 32x32 Multi-Resolution)
- `icon-192.png` - 192x192 PNG für Android
- `icon-512.png` - 512x512 PNG für PWA
- `apple-icon.png` - 180x180 PNG für iOS

## Favicon generieren

### Option 1: Online-Tool (Empfohlen)

1. Gehe zu [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Lade die `public/icon.svg` Datei hoch
3. Konfiguriere die Optionen:
   - **iOS**: Apple Touch Icon aktivieren
   - **Android**: Chrome/Android Icons aktivieren
   - **Favicon für Desktop**: Windows, macOS, etc.
4. Lade das generierte Paket herunter
5. Kopiere alle Dateien ins `/public` Verzeichnis

### Option 2: Manuell mit Bildbearbeitung

1. Öffne `public/icon.svg` in einem Bildbearbeitungsprogramm (z.B. GIMP, Photoshop, Figma)
2. Exportiere als PNG in folgenden Größen:
   - 512x512 → `icon-512.png`
   - 192x192 → `icon-192.png`
   - 180x180 → `apple-icon.png`
3. Erstelle ein Multi-Resolution ICO:
   - Verwende ein Tool wie [ICO Convert](https://icoconvert.com/)
   - Lade `icon-512.png` hoch
   - Wähle Größen: 16x16, 32x32, 48x48
   - Speichere als `favicon.ico`

### Option 3: Mit Sharp (Node.js)

Falls du Node.js installiert hast, kannst du ein Script verwenden:

```bash
npm install sharp --save-dev
```

Dann ein Script erstellen, das die SVG in alle benötigten Formate konvertiert.

## Design-Hinweise

Das aktuelle Design basiert auf:
- **Farbe**: Blau (#3b82f6) - Primary Color der Website
- **Icon**: Gamepad-Symbol (passend zum Logo)
- **Stil**: Modern, minimalistisch, gut erkennbar

## Verifizierung

Nach dem Hochladen der Dateien:

1. Starte den Dev-Server: `npm run dev`
2. Öffne die Website im Browser
3. Prüfe den Tab: Das Favicon sollte sichtbar sein
4. Prüfe die Browser-Console auf 404-Fehler für fehlende Icons

## Manifest

Das `manifest.json` ist bereits konfiguriert und wird automatisch verwendet für PWA-Funktionalität.

## Troubleshooting

- **Favicon wird nicht angezeigt**: Browser-Cache leeren (Ctrl+Shift+R)
- **404-Fehler**: Prüfe, ob alle Dateien im `/public` Verzeichnis liegen
- **Falsche Größe**: Stelle sicher, dass die Dateien die korrekten Dimensionen haben

