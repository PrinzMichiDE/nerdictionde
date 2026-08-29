# Amazon Product API Research - amazon-buddy

## Übersicht

Das Repository [drawrowfly/amazon-product-api](https://github.com/drawrowfly/amazon-product-api) bietet eine umfassende Lösung für das Scraping von Amazon-Produkten über das NPM-Paket `amazon-buddy`.

## Aktuelle Implementierung vs. amazon-buddy

### Aktuelle Implementierung (`/src/lib/amazon.ts`)

**Funktionalität:**
- ✅ ASIN aus URL parsen
- ✅ Basis-Produktdaten scrapen (Titel, Preis, Beschreibung, Bild, Specs)
- ⚠️ Einfaches Scraping mit cheerio
- ⚠️ Begrenzte Fehlerbehandlung
- ❌ Keine Produktsuche
- ❌ Keine Review-Integration
- ❌ Keine Multi-Marketplace-Unterstützung

**Technologie:**
- `axios` für HTTP-Requests
- `cheerio` für HTML-Parsing
- Manuelle Selektor-Logik

### amazon-buddy Library

**Funktionalität:**
- ✅ Produktsuche nach Keyword (bis zu 500 Produkte)
- ✅ Produktdetails per ASIN
- ✅ Review-Scraping (bis zu 1000 Reviews)
- ✅ Kategorien-Liste
- ✅ Multi-Marketplace-Unterstützung (alle Amazon-Märkte)
- ✅ Filterung nach Rating, Discount, Sponsored
- ✅ Sortierung nach Score/Relevanz
- ✅ CSV/JSON Export
- ✅ Random User-Agent Support (Anti-Bot-Schutz)

**Technologie:**
- `cheerio` für HTML-Parsing
- `request` / `request-promise` (veraltet)
- `async` für parallele Requests
- `tough-cookie` für Cookie-Management
- `socks-proxy-agent` für Proxy-Support

## API-Methoden

### 1. `.products(options)` - Produktsuche

```javascript
const products = await amazonScraper.products({ 
  keyword: 'Xbox One', 
  number: 50,
  country: 'DE',
  category: 'aps',
  rating: [3, 5],
  discount: false,
  sponsored: false
});
```

**Output:**
```javascript
[{
  position: { page: 1, position: 1, global_position: 1 },
  asin: 'B07CSLG8ST',
  price: {
    discounted: false,
    current_price: 574,
    currency: 'USD',
    before_price: 0,
    savings_amount: 0,
    savings_percent: 0
  },
  reviews: { total_reviews: 317, rating: 4.6 },
  url: 'https://www.amazon.com/dp/B07CSLG8ST',
  score: '1458.20',
  sponsored: false,
  amazonChoice: false,
  bestSeller: false,
  amazonPrime: false,
  title: 'Product Title',
  thumbnail: 'https://...'
}]
```

### 2. `.asin(options)` - Einzelprodukt-Details

```javascript
const product = await amazonScraper.asin({ 
  asin: 'B01GW3H3U8',
  country: 'DE'
});
```

**Output:**
- Vollständige Produktdetails
- Feature Bullets
- Varianten mit Bildern
- Detaillierte Preisinformationen

### 3. `.reviews(options)` - Produkt-Reviews

```javascript
const reviews = await amazonScraper.reviews({ 
  asin: 'B01GW3H3U8', 
  number: 50,
  rating: [1, 2] // Optional: Filter nach Rating
});
```

**Output:**
```javascript
[{
  id: 'R3OZ9T0YATJ5UM',
  review_data: 'Reviewed in the United States on May 31, 2018',
  name: 'Danyelle Arbour',
  rating: 5,
  title: 'Review Title',
  review: 'Review text...'
}]
```

### 4. `.categories(options)` - Verfügbare Kategorien

```javascript
const categories = await amazonScraper.categories({ country: 'DE' });
```

### 5. `.countries()` - Verfügbare Länder/Märkte

```javascript
const countries = await amazonScraper.countries();
```

## Vorteile der Integration

1. **Erweiterte Funktionalität**
   - Produktsuche ermöglicht Discovery-Features
   - Review-Integration für bessere Produktbewertungen
   - Multi-Marketplace für internationale Produkte

2. **Robustere Implementierung**
   - Bewährte Library mit 734+ Stars
   - Bessere Fehlerbehandlung
   - Anti-Bot-Schutz-Mechanismen

3. **Mehr Datenpunkte**
   - Detaillierte Preisinformationen (Discount, Savings)
   - Review-Metriken (Rating, Anzahl)
   - Produktvarianten
   - Amazon Choice / Best Seller Flags

## Nachteile / Risiken

1. **Veraltete Dependencies**
   - `request` ist deprecated (seit 2020)
   - Sollte auf `axios` oder `node-fetch` migriert werden

2. **Legal & Compliance**
   - Amazon's Terms of Service verbieten Scraping
   - Risiko von IP-Blocking
   - Rechtliche Unsicherheit

3. **Wartbarkeit**
   - Externe Dependency kann brechen (Amazon ändert HTML-Struktur)
   - Keine Garantie für Updates

4. **Performance**
   - Parallele Requests können Rate-Limiting auslösen
   - Langsamere Response-Zeiten bei vielen Produkten

## Empfehlung

### Option 1: Integration von amazon-buddy (Empfohlen für erweiterte Features)

**Vorteile:**
- Schnelle Implementierung erweiterter Features
- Bewährte Library
- Weniger Wartungsaufwand für Scraping-Logik

**Nachteile:**
- Externe Dependency
- Veraltete Dependencies (könnte Probleme verursachen)

**Implementierung:**
```typescript
// Neue Funktionen in /src/lib/amazon.ts
import amazonBuddy from 'amazon-buddy';

export async function searchAmazonProducts(keyword: string, options?: {
  country?: string;
  number?: number;
  category?: string;
}) {
  return await amazonBuddy.products({
    keyword,
    country: options?.country || 'DE',
    number: options?.number || 20,
    category: options?.category || 'aps'
  });
}

export async function getAmazonProductByAsin(asin: string, country: string = 'DE') {
  return await amazonBuddy.asin({ asin, country });
}

export async function getAmazonReviews(asin: string, options?: {
  number?: number;
  rating?: [number, number];
}) {
  return await amazonBuddy.reviews({
    asin,
    number: options?.number || 50,
    rating: options?.rating
  });
}
```

### Option 2: Verbesserung der aktuellen Implementierung

**Vorteile:**
- Volle Kontrolle über den Code
- Keine externen Dependencies
- Bessere Anpassbarkeit

**Nachteile:**
- Mehr Entwicklungszeit
- Wartungsaufwand für Scraping-Logik
- Fehleranfälliger

### Option 3: Hybrid-Ansatz (Empfohlen)

- Behalte aktuelle Implementierung für einfache ASIN-Lookups
- Integriere amazon-buddy für erweiterte Features (Suche, Reviews)
- Implementiere Fallback-Mechanismus

## Nächste Schritte

1. **Evaluation:**
   - Teste amazon-buddy in Entwicklungsumgebung
   - Prüfe Kompatibilität mit Next.js Server Components
   - Teste Rate-Limiting und Fehlerbehandlung

2. **Integration:**
   - Installiere `amazon-buddy` Package
   - Erweitere `/src/lib/amazon.ts` mit neuen Funktionen
   - Erstelle API-Routes für Suche und Reviews
   - Implementiere Caching-Strategie

3. **API-Endpoints:**
   - `GET /api/amazon/search?keyword=...&country=DE`
   - `GET /api/amazon/product/:asin`
   - `GET /api/amazon/reviews/:asin`

4. **UI-Integration:**
   - Produktsuche im Admin-Panel
   - Review-Anzeige in Produktdetails
   - Multi-Marketplace-Auswahl

## Technische Details

**Package-Installation:**
```bash
npm install amazon-buddy
```

**TypeScript-Typen:**
- Library ist in JavaScript geschrieben
- Type-Definitionen müssen manuell erstellt werden
- Oder `@types/amazon-buddy` prüfen (falls vorhanden)

**Next.js Integration:**
- Funktioniert in Server Components / API Routes
- Nicht für Client Components geeignet (Server-only)
- Rate-Limiting sollte implementiert werden

## Sicherheitsüberlegungen

1. **Rate Limiting:**
   - Implementiere Request-Limits pro User/IP
   - Nutze Caching für wiederholte Anfragen
   - Queue-System für Bulk-Requests

2. **Error Handling:**
   - Graceful Degradation bei Fehlern
   - Fallback auf manuelle Eingabe
   - Logging für Monitoring

3. **Legal Compliance:**
   - Nutzer über Scraping informieren
   - Terms of Service beachten
   - Alternative: Amazon Product Advertising API (offiziell, aber kostenpflichtig)

## Fazit

Die `amazon-buddy` Library bietet erhebliche Vorteile gegenüber der aktuellen Basis-Implementierung, insbesondere für:
- Produktsuche
- Review-Integration
- Multi-Marketplace-Support

Eine Integration ist sinnvoll, sollte aber mit Vorsicht erfolgen:
- Testen in Entwicklungsumgebung
- Rate-Limiting implementieren
- Fallback-Mechanismen einbauen
- Rechtliche Aspekte beachten

Die aktuelle Implementierung kann als Fallback beibehalten werden.
