# Feature Specification: Erweiterte Suchfilter (Advanced Search Filters)

**Datum:** 2026-10-24  
**Status:** In Planung (F1–F2)  
**Feature-Flag:** `FEATURE_ADVANCED_SEARCH_FILTERS` (Default: true)

---

## 1. Problem und Nutzen

### Problem
Die aktuelle Suche (`/suche`) bietet nur Basis-Filter:
- Kategorie (Games, Filme, Serien, Hardware)
- Score-Range (Min/Max 20–90)
- Tags (Mehrfachauswahl)
- Sortierung (Relevanz, Datum, Score)

Nutzer können **nicht** filtern nach:
- Veröffentlichungszeitraum (Release-Datum Range)
- Preisbereich (für Hardware/Spiele mit Preisverlauf)
- Plattform (PC, PS5, Xbox, Switch – aus IGDB/TMDB Metadaten)
- "Nur Reviews mit Video" (YouTube-Videos vorhanden)
- "Nur Reviews mit aktuellem Deal/Preis"
- Entwickler/Publisher (aus IGDB-Metadaten)
- Genre (aus Tags/Metadaten, aber nicht als eigener Filter)

### Nutzen für die Zielgruppe (Endnutzer)
- **Präzisere Kaufentscheidungen**: "Zeig mir PS5-Spiele unter 50€ mit Score > 80, erschienen 2023–2024"
- **Schnelleres Finden**: Weniger Scrollen, gezieltere Treffer
- **Vergleichbarkeit**: Filter kombinierbar für Side-by-Side-Entscheidungen
- **Retention**: Nutzer finden schneller, was sie suchen → längere Verweildauer, mehr Conversions (Affiliate/Deals)

### Warum jetzt?
- Search-Infrastruktur (API, Relevanz-Scoring, UI, Caching) ist **bereits stabil und getestet** (290 Tests grün)
- Keine Schema-Migration nötig – alle Filter nutzen bestehende Felder/Relationen
- Geringer Aufwand, hoher Impact (Core-Feature der Review-Plattform)
- Passt zur Priorität: **Stabilität > Features > Optik** – wir erweitern ein stabiles Feature

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien (messbar) |
|----|------------|------------------------------|
| **US1** | Als Nutzer möchte ich nach **Release-Datum-Range** filtern (von/bis), um z. B. nur Spiele aus 2024 zu sehen. | - Zwei Inputs: `releaseDateFrom` (YYYY-MM-DD), `releaseDateTo` (YYYY-MM-DD)<br>- API akzeptiert Parameter, filtert `Review.releaseDate`<br>- UI: Zwei Datum-Picker nebeneinander im Filter-Bereich<br>- Leere Werte = kein Filter |
| **US2** | Als Nutzer möchte ich nach **Preisbereich** filtern (Min/Max EUR), um Hardware/Spiele in meinem Budget zu finden. | - Zwei Inputs: `minPrice`, `maxPrice` (Float, EUR)<br>- Nutzt `Review.priceHistory` (neuester Eintrag) oder `Review.deals`<br>- API join't Preis-Daten, filtert serverseitig<br>- UI: Zwei Number-Inputs mit €-Label |
| **US3** | Als Nutzer möchte ich nach **Plattform** filtern (PC, PS5, Xbox Series, Switch), um nur für meine Konsole relevante Reviews zu sehen. | - Multi-Select: `platforms[]` (String-Array)<br>- Datenquelle: `Review.metadata.platforms` (IGDB) oder `Review.hardware.type`<br>- API filtert per JSON-Contains/Array-Overlap<br>- UI: Checkbox-Gruppe oder Multi-Select-Dropdown |
| **US4** | Als Nutzer möchte ich **nur Reviews mit Video** anzeigen, um Gameplay/Unboxing zu sehen. | - Boolean-Filter: `hasVideo=true/false`<br>- Prüft `Review.youtubeVideos.length > 0`<br>- UI: Checkbox "Mit Video" im Filter-Bereich |
| **US5** | Als Nutzer möchte ich **nur Reviews mit aktuellem Deal** sehen, um Schnäppchen zu finden. | - Boolean-Filter: `hasDeal=true/false`<br>- Prüft `Review.deals` (status="active", nicht abgelaufen)<br>- UI: Checkbox "Mit Deal" im Filter-Bereich |
| **US6** | Als Nutzer möchte ich nach **Entwickler/Publisher** filtern. | - Text-Input mit Autocomplete: `developer`, `publisher`<br>- Datenquelle: `Review.metadata.developer`, `Review.metadata.publisher` (IGDB)<br>- API: ILIKE-Suche auf JSON-Feldern |
| **US7** | Als Nutzer möchte ich **alle Filter kombinieren** und die URL teilen können. | - Alle Parameter in URL (`/suche?...`)<br>- `SearchFilters` Komponente verwaltet State → URL-Sync<br>- "Alle Filter zurücksetzen" setzt auch neue Filter zurück |
| **US8** | Als Nutzer möchte ich **leere Zustände** sinnvoll gefüllt sehen (z. B. "Keine PS5-Spiele unter 30€ gefunden"). | - Empty State zeigt aktive Filter an<br>- Vorschläge: "Filter lockern", "Preis erhöhen", "Plattform entfernen" |

---

## 3. Scope & Nicht-Scope

### In Scope (MVP)
- API-Erweiterung: 7 neue Query-Parameter (`releaseDateFrom`, `releaseDateTo`, `minPrice`, `maxPrice`, `platforms`, `hasVideo`, `hasDeal`, `developer`, `publisher`)
- UI-Erweiterung: `SearchFilters` Komponente um neue Filter-Bereiche erweitern
- Bestehende Filter (Kategorie, Score, Tags, Sort) bleiben unverändert
- URL-State-Management für alle neuen Filter
- Feature-Flag `FEATURE_ADVANCED_SEARCH_FILTERS` (Default true)
- Unit-Tests für Filter-Logik, Integration-Tests für API

### Nicht-Scope (explizit)
- **Keine** neuen Datenbank-Modelle oder Migrationen
- **Kein** separater "Advanced Search" Modal/Page – Filter inline in bestehender Bar
- **Keine** gespeicherten Filter-Presets (User-saved searches) – später evtl.
- **Keine** Faceted Search Counts ("PC (42), PS5 (18)") – zu aufwendig für MVP
- **Keine** Genre-Filter als eigene Taxonomie – Tags decken das ab
- **Keine** Hardware-Specs-Filter (GPU/CPU/RAM) – zu nischig, später evtl.

---

## 4. Randfälle, Fehlerfälle, Leere Zustände

| Situation | Verhalten |
|-----------|-----------|
| `releaseDateFrom` > `releaseDateTo` | API ignoriert beide, Client zeigt Inline-Warnung (Toast) |
| `minPrice` > `maxPrice` | API ignoriert beide, Client zeigt Inline-Warnung |
| Ungültiges Datum (z. B. "2024-13-45") | API gibt 400, Client validiert vor Submit (HTML5 date input) |
| Plattform-Wert nicht in DB | API filtert einfach – Ergebnis 0 Treffer, kein Fehler |
| `hasVideo=true` + `hasDeal=true` | UND-Verknüpfung (beide müssen zutreffen) |
| Keine Treffer bei kombinierten Filtern | Empty State mit aktiven Filtern + "Filter lockern"-CTAs |
| API Timeout / DB-Fehler | Bestehende Error-Boundary + Toast, keine Regression |
| Sehr viele Filter aktiv | UI: "X Filter aktiv" Badge, Collapse-Option für Filter-Bar |

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

| Feature | Auswirkung | Migration nötig? |
|---------|------------|------------------|
| `/suche` Page | Erweitert, nicht gebrochen | Nein |
| `SearchFilters` Component | Neue Props, erweiterter State | Nein (Defaults) |
| `/api/reviews/search` | Neue optionale Parameter | Nein (optional) |
| `SearchResults` Component | Unverändert (bekommt nur gefilterte Daten) | Nein |
| SEO / Sitemap | Unverändert | Nein |
| Caching (`unstable_cache` tags) | Cache-Key erweitert um neue Parameter | Nein (automatisch via `searchParams`) |
| Bestehende Links/Bookmarks | Funktionieren weiter (neue Parameter optional) | Nein |

**Abwärtskompatibilität:** 100% – alle neuen Parameter sind optional, Default-Verhalten identisch.

---

## 6. Datenmodell & API-Änderungen

### Review-Modell (bestehend, relevante Felder)
```prisma
model Review {
  // ... bestehende Felder
  releaseDate     DateTime?    // Neu: für Release-Range-Filter
  priceHistory    PriceHistory[] // Neu: für Preis-Filter (neuester Eintrag)
  deals           Deal[]       // Neu: für "hasDeal"-Filter
  youtubeVideos   String[]     // Bestehend: für "hasVideo"-Filter
  metadata        Json?        // Bestehend: developer, publisher, platforms (IGDB)
  hardware        Hardware?    // Bestehend: für Hardware-Plattform
  // ...
}
```

### API: GET `/api/reviews/search` – Neue Parameter

| Parameter | Typ | Beschreibung | Beispiel |
|-----------|-----|--------------|----------|
| `releaseDateFrom` | `string` (ISO Date) | Release-Datum ab (inklusiv) | `2024-01-01` |
| `releaseDateTo` | `string` (ISO Date) | Release-Datum bis (inklusiv) | `2024-12-31` |
| `minPrice` | `number` (Float) | Minimaler Preis (EUR) | `29.99` |
| `maxPrice` | `number` (Float) | Maximaler Preis (EUR) | `59.99` |
| `platforms` | `string[]` (comma-separated) | Plattform-Filter | `PC,PS5` |
| `hasVideo` | `boolean` | Nur Reviews mit YouTube-Video | `true` |
| `hasDeal` | `boolean` | Nur Reviews mit aktuellem Deal | `true` |
| `developer` | `string` | Entwickler (ILIKE auf metadata) | `CD Projekt` |
| `publisher` | `string` | Publisher (ILIKE auf metadata) | `Bethesda` |

### API-Response: Unverändert
Gibt weiterhin `{ reviews: [...], pagination: {...} }` zurück.

### Preis-Logik (Server-seitig)
- **Games/Software**: Neuester `PriceHistory`-Eintrag pro Review (aktueller Preis)
- **Hardware**: `Hardware.msrp` oder neuester `PriceHistory`
- **Deals**: `Deal.price` (wenn `status="active"` und `expiresAt > now`)
- Fallback: Wenn kein Preis verfügbar → Review wird bei Preis-Filter **ausgeschlossen** (nicht 0€)

### Plattform-Logik
- **Games**: `Review.metadata.platforms` (Array of Strings aus IGDB: `["PC", "PlayStation 5", "Xbox Series X"]`)
- **Hardware**: `Review.hardware.type` → Mapping auf Plattform-Kategorie
- **Movies/Series**: Keine Plattform (Filter ignoriert für diese Kategorien)

---

## 7. UI/UX-Ablauf

### Filter-Bar Struktur (erweitert)
```
Row 1: [Kategorie ▼] [Sortierung ▼] [Score ▼] [Release-Datum ▼] [Preis ▼]
Row 2: [Plattform ▼] [☑ Mit Video] [☑ Mit Deal] [Entwickler 🔍] [Publisher 🔍]
Row 3: [Tags: #action #rpg #coop ×]                    [Alle Filter zurücksetzen]
```

### Zustände
| Zustand | Darstellung |
|---------|-------------|
| **Idle** | Filter-Bar sichtbar, alle Dropdowns geschlossen |
| **Loading** | `SearchSkeleton` für Results, Filter interaktiv |
| **Results** | Gefilterte Liste, Pagination, "X Filter aktiv" Badge |
| **Empty** | "Keine Treffer für [Filter-Kombination]" + Vorschläge |
| **Error** | Bestehende Error-Box + "Erneut versuchen" |

### Barrierefreiheit (a11y)
- Alle neuen Inputs: `label`, `aria-label`, `aria-describedby` für Hilfetexte
- Datum-Picker: Native `<input type="date">` (browser-native, barrierefrei)
- Checkboxen: `<input type="checkbox">` mit `role="switch"` für Toggle-Look
- Multi-Select: `role="listbox"` + `aria-multiselectable="true"` + Tastaturnavigation
- Fokus-Management: `focus-visible` Styles, Tab-Reihenfolge logisch
- Screen-Reader: Live-Region für "X Filter aktiv, Y Treffer"
- Reduced Motion: Dropdown-Animationen respektieren `prefers-reduced-motion`

### Mobile / Responsive
- Filter-Bar: Horizontal scrollbar auf Mobile (`overflow-x-auto`, `flex-nowrap` für Row 1)
- Dropdowns: Full-Width auf Mobile, `bottom-sheet`-artig (bereits Pattern in `SearchFilters`)
- Touch-Targets: Mind. 44×44px (bereits via `py-2 px-3` gegeben)

---

## 8. Sicherheit & Performance

### Eingabevalidierung (API)
- `releaseDateFrom/To`: Regex `^\d{4}-\d{2}-\d{2}$`, parsbar als `Date`, nicht in Zukunft > 1 Jahr
- `minPrice/maxPrice`: `>= 0`, `<= 100000`, `minPrice <= maxPrice`
- `platforms`: Whitelist bekannter Werte (`PC`, `PS5`, `Xbox Series`, `Switch`, `PS4`, `Xbox One`), unbekannte ignorieren
- `hasVideo/hasDeal`: Boolean (`true`/`false`/`1`/`0`)
- `developer/publisher`: Max 100 Zeichen, alphanumerisch + Leerzeichen/Strich/Bindestrich, SQL-Injection-Schutz via Prisma

### Autorisierung
- **Öffentliche API** – keine Auth nötig (wie bisher)
- Rate-Limit: Bestehendes Middleware (100 req/min/IP) reicht

### Performance
- **Indices vorhanden**: `Review.releaseDate` (Index Zeile 62), `Review.category + releaseDate` (Zeile 63)
- **Preis-Filter**: Erfordert Join auf `PriceHistory`/`Deal` – Index auf `PriceHistory.reviewId + recordedAt` (Zeile 251), `Deal.reviewId + status` (Zeile 274)
- **Metadata-Filter**: JSON-Contains auf `metadata` – PostgreSQL GIN-Index auf `metadata` wäre ideal, aber für MVP: sequentieller Scan auf vorgefilteter Menge (nach Kategorie/Score/Tags) – akzeptabel bei < 5k Reviews
- **Caching**: `unstable_cache` mit Tag `["search"]` + Query-Parameter im Key → automatische Invaliderung
- **N+1-Vermeidung**: Alle Filter in **einem** Query via `where`-Klausel, keine nachgelagerten Queries

### Erwartete Performance
- P95 < 300ms bei 10k Reviews, 5 Filter kombiniert
- Cold Start (Cache Miss): < 800ms
- Bundle-Size Impact: ~2-3 KB gzipped (neue Filter-UI-Komponenten)

---

## 9. Teststrategie

### Unit-Tests (`tests/lib/advanced-search-filters.test.ts`)
- `buildSearchWhereClause()` – alle Filter-Kombinationen
- Preis-Logik: `getCurrentPrice(review)` – PriceHistory, Deal, Hardware MSRP, Fallback
- Plattform-Matching: `matchesPlatforms(review, platforms[])`
- Datum-Parsing & Validierung
- URL-Parameter-Serialisierung/Deserialisierung

### Integration-Tests (`tests/api/search-advanced-filters.test.ts`)
- GET `/api/reviews/search?releaseDateFrom=2024-01-01` → nur 2024+
- GET `...?minPrice=10&maxPrice=50` → Preis-Range korrekt
- GET `...?platforms=PC,PS5` → nur diese Plattformen
- GET `...?hasVideo=true` → nur Reviews mit youtubeVideos
- GET `...?hasDeal=true` → nur Reviews mit aktivem Deal
- GET `...?developer=CD%20Projekt` → ILIKE-Match
- Kombinierte Filter: Alle gleichzeitig → UND-Verknüpfung
- Pagination & Sortierung mit Filtern
- Feature-Flag `FEATURE_ADVANCED_SEARCH_FILTERS=false` → 404 oder Filter ignoriert

### E2E-Tests (Playwright via `e2e` Skill, falls verfügbar)
- Suche öffnen → Release-Datum setzen → Ergebnisse prüfen
- Preis-Range setzen → nur Reviews im Bereich
- Plattform Multi-Select → nur PS5-Spiele
- "Mit Video" + "Mit Deal" kombinieren
- URL teilen → neuer Tab → gleiche Filter aktiv
- "Alle Filter zurücksetzen" → URL clean, alle Treffer

### Testdaten (Seed)
- Mind. 20 Reviews mit variierten: releaseDate (2020–2025), Preise (0–500), Plattformen, youtubeVideos, deals, metadata.developer/publisher
- Seed-Script erweitern (`prisma/seed.ts`)

---

## 10. Rollout-Plan

1. **Feature-Flag** `FEATURE_ADVANCED_SEARCH_FILTERS=true` in `.env.example` + `.env.local`
2. **API** deployen (neue Parameter optional, Default-Verhalten unverändert)
3. **UI** deployen (neue Filter in `SearchFilters`, hinter Flag versteckt)
4. **Flag auf true** setzen → Live für alle
5. **Monitoring**: Logs prüfen (`/api/reviews/search` Query-Params), Error-Rate, P95-Latency
6. **Rollback**: Flag auf `false` → UI blendet Filter aus, API ignoriert Parameter

---

## 11. Review-Checkliste (F6 – Self-Review)

*Wird nach Implementierung ausgefüllt.*

| Check | Status | Notiz |
|-------|--------|-------|
| Alle 8 User Stories implementiert & getestet | ☐ | |
| Randfälle (ungültige Daten, leere Ergebnisse) behandelt | ☐ | |
| Eingaben validiert (API + Client) | ☐ | |
| Keine Secrets im Code | ☐ | |
| Keine N+1-Queries, Indizes genutzt | ☐ | |
| Migrationen reversibel (keine nötig) | ☐ | N/A |
| Abwärtskompatibilität: Bestehende Links/API-Calls funktionieren | ☐ | |
| Code-Stil: Konsistent mit `SearchFilters`, `route.ts`, Prisma-Patterns | ☐ | |
| UI: Alle Zustände (Loading, Empty, Error) vorhanden | ☐ | |
| Barrierefreiheit: Labels, ARIA, Fokus, Reduced Motion | ☐ | |
| Feature-Flag sauber implementiert (Default true) | ☐ | |
| Unit-Tests > 90% Coverage für neue Logik | ☐ | |
| Integration-Tests für alle 7 neuen Parameter | ☐ | |
| Build / Lint / Typecheck / Tests grün | ☐ | |
| Doku: CHANGELOG, README, .env.example aktualisiert | ☐ | |
| ROADMAP.md: Feature als erledigt markiert | ☐ | |

---

## 12. Offene Fragen / Risiken

| Frage | Entscheidung / Status |
|-------|------------------------|
| Plattform-Werte: Exakte Strings aus IGDB nutzen oder normalisieren? | **Normalisieren** in `lib/platform-utils.ts`: Map IGDB-IDs → kanonische Namen (`PC`, `PS5`, `Xbox Series`, `Switch`, `PS4`, `Xbox One`). |
| Preis für Games ohne PriceHistory/Deal? | **Ausschließen** bei Preis-Filter (nicht 0€ annehmen). Dokumentieren in Empty State. |
| `metadata.platforms` ist JSON-Array – wie filtern? | Prisma: `metadata.path('platforms').array_contains(['PS5'])` (PostgreSQL JSONB). |
| `developer`/`publisher` in `metadata` – Struktur? | IGDB: `metadata.developer` (String), `metadata.publisher` (String). Prisma: `metadata.path('developer').string_contains('CD Projekt')`. |
| Client-seitige Validierung vs Server-seitige? | **Beides**: Client (UX, sofortiges Feedback) + Server (Sicherheit, API-Verträge). |
| Wie viele Filter gleichzeitig in UI anzeigen? | **Progressive Disclosure**: Row 1 immer sichtbar, Row 2+3 einklappbar ("Weitere Filter ▼"). |

---

## 13. Arbeitspakete (F3 – Design & Plan)

| Paket | Beschreibung | Abhängigkeit | Geschätzter Aufwand |
|-------|--------------|--------------|---------------------|
| **PKG-1** | Types & Zod-Schemas (`src/lib/search-filters.ts`, `src/lib/search-filter-schema.ts`) | – | 0.5h |
| **PKG-2** | Plattform-Utils (`src/lib/platform-utils.ts`): Normalisierung, Whitelist, Matching | PKG-1 | 0.5h |
| **PKG-3** | Preis-Utils (`src/lib/price-utils.ts`): `getCurrentPrice`, `hasActiveDeal` | PKG-1 | 0.5h |
| **PKG-4** | API Route erweitern (`/api/reviews/search/route.ts`): Neue Parameter, Where-Clause, Joins | PKG-1,2,3 | 1.5h |
| **PKG-5** | Client Types & Hook: `useAdvancedSearchFilters` (extends `useSearchParams`) | PKG-1 | 0.5h |
| **PKG-6** | UI: `SearchFilters` erweitern – Release-Datum, Preis, Plattform, Video, Deal, Developer/Publisher | PKG-5 | 1.5h |
| **PKG-7** | Feature-Flag Integration & Progressive Disclosure (Collapse "Weitere Filter") | PKG-6 | 0.5h |
| **PKG-8** | Unit-Tests (Logik, Utils, Schema) | PKG-1–3 | 1h |
| **PKG-9** | Integration-Tests (API, alle Filter-Kombis) | PKG-4 | 1h |
| **PKG-10** | E2E-Tests (Critical Paths), Seed-Daten erweitern | PKG-8,9 | 1h |
| **PKG-11** | Doku & Flag: CHANGELOG, README, .env.example, ROADMAP, PROGRESS.md | PKG-10 | 0.5h |

**Gesamt:** ~9h (verteilt auf mehrere Iterationen)

---

## 14. Definition of Done (Feature)

- [ ] Spec vollständig (dieses Dokument)
- [ ] Alle 8 User Stories implementiert & durch Tests abgedeckt
- [ ] Self-Review (F6) ohne offene Befunde
- [ ] `npm run verify` grün (Build, Lint, Typecheck, 290+ Tests)
- [ ] Doku & Changelog aktualisiert
- [ ] Migrationen reversibel (keine nötig)
- [ ] Keine neuen Warnungen, keine Secrets im Diff
- [ ] Alles auf `auto/dev` gepusht