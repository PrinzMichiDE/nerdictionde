# Favicon Generation Guide

Um die Favicons zu generieren, benötigst du ein Tool wie:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)
- Oder ein Bildbearbeitungsprogramm

## Erforderliche Dateien

1. **favicon.ico** - 32x32, 16x16 (Multi-Resolution ICO)
2. **icon-192.png** - 192x192 PNG
3. **icon-512.png** - 512x512 PNG
4. **apple-icon.png** - 180x180 PNG (für iOS)

## Design-Vorschlag

Basierend auf dem Gamepad-Icon aus dem Header:
- **Hintergrund**: Blau (#3b82f6) - Primary Color
- **Icon**: Weißes Gamepad-Symbol
- **Stil**: Modern, minimalistisch, gut erkennbar auch in kleinen Größen

## Verwendung

1. Erstelle ein 512x512 PNG mit dem Gamepad-Icon
2. Verwende ein Tool wie RealFaviconGenerator um alle Größen zu generieren
3. Platziere die Dateien im `/public` Verzeichnis
4. Die Dateien werden automatisch von Next.js verwendet

## Alternative: SVG als Basis

Du kannst auch `public/icon.svg` als Basis verwenden und daraus die PNG-Versionen generieren.

