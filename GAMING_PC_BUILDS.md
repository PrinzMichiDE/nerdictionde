# Automatische Gaming PC Build Generierung

## Übersicht

Dieses System generiert automatisch jeden Monat neue Gaming PC Setups für verschiedene Preiskategorien. Es nutzt Tavily für die Recherche aktueller Hardware-Preise und Komponenten-Empfehlungen.

## Preiskategorien

Das System generiert Setups für folgende Preiskategorien:
- 300€, 400€, 500€, 600€, 700€, 800€, 900€
- 1.000€, 1.200€, 1.500€, 1.700€, 2.000€
- 2.500€, 3.000€, 3.500€, 4.500€

## Funktionsweise

### 1. Budget-Allokation

Für jede Preiskategorie wird das Budget automatisch auf die verschiedenen Komponenten verteilt:
- **GPU**: 35-52% (je nach Budget)
- **CPU**: 12-20%
- **Motherboard**: 12%
- **RAM**: 10%
- **SSD**: 8%
- **PSU**: 3-8%
- **Case**: 2-5%
- **Cooler**: 1-2%

### 2. Komponenten-Recherche

Für jede Komponente wird ein Multi-Source-Ansatz verwendet:

**Tavily Recherche:**
- Allgemeine Hardware-Informationen
- Produktspezifikationen
- Bewertungen und Empfehlungen

**Amazon API Integration:**
- **Amazon PA API**: Wenn ASIN gefunden wird, werden aktuelle Preise und Produktdaten direkt von Amazon geholt
- **Tavily Amazon Search**: Sucht nach Amazon-Produkten und extrahiert ASINs
- **Affiliate Links**: Automatische Generierung von Amazon Affiliate Links für alle Komponenten
- **Preisvergleich**: Amazon-Preise werden bevorzugt, wenn sie innerhalb des Budgets liegen

**Fallback-Kette:**
1. Tavily Hardware-Suche → Produktname extrahieren
2. Tavily Amazon-Suche → ASIN finden
3. Amazon PA API → Produktdaten und Preise holen (wenn ASIN vorhanden)
4. Affiliate Link generieren (ASIN-basiert oder Suchlink)

### 3. Build-Generierung

Mit OpenAI werden:
- SEO-freundliche Titel generiert
- Beschreibungen erstellt
- Komponenten-Empfehlungen strukturiert

### 4. Automatische Aktualisierung

Der Cron Job läuft **jeden Monat am 1. um 2:00 Uhr UTC** und:
- Aktualisiert bestehende Builds mit neuen Komponenten
- Erstellt neue Builds für fehlende Preiskategorien
- Setzt den Status auf "published"

## Cron Job Konfiguration

```json
{
  "path": "/api/cron/generate-gaming-pc-builds",
  "schedule": "0 2 1 * *"
}
```

## Manuelle Ausführung

Der Cron Job kann manuell getriggert werden über:
```
GET /api/cron/generate-gaming-pc-builds
Authorization: Bearer {CRON_SECRET}
```

## API Endpoints

### Generierung
- `GET /api/cron/generate-gaming-pc-builds` - Generiert/aktualisiert alle Builds

### Build Management
- `GET /api/gaming-pcs` - Liste aller Builds
- `GET /api/gaming-pcs/[price]` - Einzelner Build
- `POST /api/gaming-pcs` - Neuen Build erstellen (Admin)
- `PATCH /api/gaming-pcs/[price]` - Build aktualisieren (Admin)
- `DELETE /api/gaming-pcs/[price]` - Build löschen (Admin)

## Umgebungsvariablen

Benötigte Umgebungsvariablen:
- `TAVILY_API_KEY` - API Key für Tavily Recherche
- `OPENAI_API_KEY` - API Key für OpenAI (Titel/Beschreibung Generierung)
- `CRON_SECRET` - Secret für Cron Job Authentifizierung
- `AMAZON_PAAPI_ACCESS_KEY` - (Optional) Amazon PA API Access Key für direkte Produktdaten
- `AMAZON_PAAPI_SECRET_KEY` - (Optional) Amazon PA API Secret Key
- `AMAZON_PAAPI_PARTNER_TAG` - (Optional) Amazon Partner Tag für Affiliate Links
- `AMAZON_PAAPI_MARKETPLACE` - (Optional) Marketplace (Standard: "de")

## Komponenten-Typen

Das System unterstützt folgende Komponenten-Typen:
- CPU
- GPU
- Motherboard
- RAM
- SSD
- PSU
- Case
- Cooler

## Fehlerbehandlung

- Wenn eine Komponente nicht gefunden wird, wird ein Platzhalter erstellt
- Bei Preisabweichungen wird das Budget angepasst
- Bei Slug-Konflikten wird ein Timestamp angehängt
- Fehler werden geloggt, aber der Prozess läuft weiter

## Performance

- Jeder Build benötigt ca. 15-25 Sekunden (wegen API-Calls)
- Gesamtlaufzeit für alle 16 Preiskategorien: ca. 5-8 Minuten
- Rate Limiting: 
  - 1 Sekunde Delay zwischen Komponenten (ohne Amazon API)
  - 2 Sekunden Delay wenn Amazon PA API verwendet wird (1 req/sec Limit)
  - 2 Sekunden Delay zwischen Builds

## Amazon API Integration

Das System nutzt automatisch die Amazon API, wenn verfügbar:

1. **ASIN-Extraktion**: Tavily durchsucht Amazon-Suchergebnisse nach ASINs
2. **Produktdaten**: Wenn ASIN gefunden, wird Amazon PA API verwendet für:
   - Aktuelle Preise
   - Produktspezifikationen
   - Verfügbarkeit
   - Bewertungen
3. **Affiliate Links**: Automatische Generierung von Affiliate Links:
   - Direkter Produktlink (wenn ASIN vorhanden)
   - Suchlink (Fallback)
4. **Preisvergleich**: Amazon-Preise werden bevorzugt, wenn sie realistisch sind

**Vorteile:**
- Aktuelle, genaue Preise direkt von Amazon
- Automatische Affiliate-Link-Generierung
- Bessere Produktdaten und Spezifikationen
- Höhere Conversion-Rate durch direkte Links

