# Feature: Full-Text Search mit Relevanz-Ranking

## Problem und Nutzen
**Warum?** Nutzer finden Reviews aktuell nur über Kategorien, Filter und eine client-seitige Titel-Suche. Ein echter Such-Index mit Relevanz-Ranking (Titel > Inhalt > Tags) ermöglicht schnelles Finden konkreter Inhalte ("Cyberpunk 2077 Patch 2.1", "RTX 4090 Test").

**Für wen?** Alle Endnutzer, die gezielt nach Produkten, Themen oder Schlagworten suchen.

**Nutzen:** Höhere Verweildauer, mehr Pageviews, bessere Conversion (Affiliate/Deals).

---

## User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterium |
|----|------------|-------------------|
| US1 | Als Nutzer möchte ich nach "Cyberpunk" suchen und alle relevanten Reviews finden | Suchergebnisse zeigen Reviews mit "Cyberpunk" im Titel/Inhalt/Tags, sortiert nach Relevanz |
| US2 | Als Nutzer möchte ich Suchergebnisse filtern (Kategorie, Score, Tags) | Filter funktionieren kombiniert mit Suche; URL-Parameter bleiben erhalten |
| US3 | Als Nutzer möchte ich eine dedizierte Suchseite (`/suche`) mit Autovervollständigung | `/suche?q=...` lädt Server-seitig, zeigt Highlights, Pagination, leere Zustände |
| US4 | Als Nutzer möchte ich auf mobilen Geräten schnell suchen | Such-Input im Header/Navigation, Enter/Click öffnet Ergebnisseite |
| US5 | Als Nutzer möchte ich "Keine Ergebnisse" sinnvoll behandelt sehen | Leere-Suche zeigt Vorschläge: "Ähnliche Kategorien", "Beliebte Tags", "Neueste Reviews" |

**Messbar:** Search-CTR (Klicks auf Ergebnisse / Suchen) > 30 %, mittlere Suchlatenz < 300 ms (p95).

---

## Scope & Nicht-Scope

**In Scope:**
- Dedizierte Suchseite `/suche` (Server Component, SSR)
- Server-seitige Suche via `/api/reviews/search` (bereits vorhanden) mit Relevanz-Scoring
- Highlighting von Suchbegriffen in Titel/Auszug
- Filter: Kategorie, Score-Range, Tags, Sortierung (Relevanz, Datum, Score)
- Pagination (12 pro Seite)
- URL-Shareable Suchparameter (`?q=...&category=game&minScore=80`)
- Accessibility: ARIA-Labels, Fokus-Management, Screen-Reader-freundliche Ergebnisse
- Mobile: Such-Input in Navigation/Header, Swipe-Gesten für Filter

**Out of Scope:**
- Fuzzy-Suche / Tippfehler-Toleranz (PostgreSQL `pg_trgm` später)
- Persönliche Suchhistorie (später mit User-Accounts)
- Synonyme / Stemming (später)
- Suche über News/Forum (separate Features)

---

## Randfälle, Fehlerfälle, Berechtigungen

| Fall | Verhalten |
|------|-----------|
| Leere Query (`q=` oder whitespace) | Redirect zu `/reviews` oder Zeige "Beliebte Suchen" |
| Query < 2 Zeichen | Client-seitig blockieren, Tooltip "Mind. 2 Zeichen" |
| Sehr lange Query (>100 Zeichen) | Truncaten auf 100, Warnung anzeigen |
| Keine Treffer | Empty State mit Vorschlägen (Kategorien, Tags, Neueste) |
| DB-Fehler / Timeout | Fehler-Banner, Retry-Button, Fallback auf `/reviews` |
| XSS in Query | Input sanitisieren (Prisma `mode: insensitive` ist sicher), Output escapen |
| Rate-Limit (später) | 30 req/min pro IP, 429 mit `Retry-After` |
| Concurrent Requests | `AbortController` bei neuer Eingabe (Client) |

**Berechtigungen:** Öffentlich (kein Login nötig). Admin-Flag `all=true` nur für Admins.

---

## Auswirkungen auf Bestehendes

| Bereich | Änderung |
|---------|----------|
| `/api/reviews/search` | Bereits vorhanden, wird genutzt; evtl. `relevance`-Sortierung ergänzen |
| `ReviewsList` (Client) | Client-seitige Suche entfernen, auf Server-Suche umstellen oder dedizierte Search-Page nutzen |
| Navigation/Header | Such-Icon/Input hinzufügen, auf `/suche` verlinken |
| `ReviewsFilter` | Kann bleiben für `/reviews`; Suchseite nutzt eigene Filter-Komponente |
| SEO | `<meta name="robots" content="noindex">` auf `/suche` (dynamisch), Canonical auf `/reviews` |
| Sitemap | Keine Suchergebnisseiten indexieren |

**Abwärtskompatibilität:** `/reviews?query=...` funktioniert weiterhin (Server-seitig via Haupt-API). Neue Suchseite ist additive.

---

## Datenmodell & Migrationen

**Keine Schema-Änderung nötig.** Bestehende Modelle (`Review`, `Tag`, `ReviewTag`) reichen aus.

**Index-Optimierung (optional, später):**
```sql
-- Für Relevanz-Ranking: GIN-Index auf tsvector
CREATE INDEX IF NOT EXISTS review_search_idx ON "Review" USING GIN (
  to_tsvector('german', coalesce(title, '') || ' ' || coalesce(content, ''))
);
```
→ Reversibel mit `DROP INDEX`. Nicht blockierend für Feature-Release.

---

## API-Änderungen

**Bestehend:** `GET /api/reviews/search?query=...&category=...&minScore=...&maxScore=...&tags=...&sort=relevance|date-desc|score-desc&limit=12`

**Ergänzung:** `sort=relevance` implementieren (PostgreSQL `ts_rank_cd` oder Applikation-seitig: Titel-Treffer > Tag-Treffer > Inhalts-Treffer).

**Response:** Unverändert (`{ reviews: [...] }`), evtl. `total` für Pagination hinzufügen.

---

## UI/UX-Ablauf

### Suchseite `/suche`
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Navigation | [🔍 Such-Input mit Enter]       │
├─────────────────────────────────────────────────────────────┤
│ Hero: "Suche nach Tests, Produkten, Themen…"                │
│     [Input: q=...] [Kategorie ▼] [Score ▼] [Tags ▼] [Sort ▼]│
├─────────────────────────────────────────────────────────────┤
│ Ergebnisse (Grid/List Toggle):                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ [Bild]      │  │ [Bild]      │  │ [Bild]      │          │
│  │ Titel       │  │ Titel       │  │ Titel       │          │
│  │ 🏷️ Game    │  │ 🏷️ Hardware│  │ 🏷️ Movie   │          │
│  │ ⭐ 92/100   │  │ ⭐ 88/100   │  │ ⭐ 85/100   │          │
│  │ "…Cyberpunk…"│  │ "…RTX 4090…"│  │ "…Dune…"    │  ← Highlight
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│ Pagination: [←] 1 2 3 … 12 [→]                              │
├─────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└─────────────────────────────────────────────────────────────┘
```

**Zustände:**
- **Loading:** Skeleton-Grid (6 Karten)
- **Error:** Banner "Suche fehlgeschlagen. Erneut versuchen?" + Link zu `/reviews`
- **Empty:** "Keine Treffer für „{q}". Versuche: Andere Kategorie, breiterer Begriff, beliebte Tags: [Tag1] [Tag2] [Tag3]. Neueste Reviews: [Link1] [Link2]"

**Barrierefreiheit:**
- `role="search"` auf Form, `aria-label="Site-Suche"`
- Ergebnisse: `role="list"`, `aria-label="Suchergebnisse"`
- Highlights: `<mark>` mit `aria-hidden="true"` + Screen-Reader-Text "Suchbegriff: Cyberpunk"
- Fokus nach Submit auf erstes Ergebnis (`tabIndex={-1}` + `focus()`)
- Tastatur: Tab durch Filter, Enter auf Sortierung, Escape schließt Dropdowns

---

## Sicherheit

- **Input-Validierung:** `query` max 100 Zeichen, alphanumerisch + Basis-Sonderzeichen, trimmen
- **SQL-Injection:** Prisma Parameterized Queries (bereits sicher)
- **XSS:** Output in React (auto-escaped), Highlights via `<mark>` nur für Text-Nodes
- **DoS:** `limit` max 50, `timeout` 5s auf DB-Query
- **Keine Secrets** in Code/Logs/Response

---

## Performance-Erwartung

| Metrik | Ziel |
|--------|------|
| Time to First Byte (TTFB) | < 200 ms (cached), < 500 ms (uncached) |
| DB-Query (p95) | < 150 ms |
| Bundle-Größe (Search-Page) | < 50 kB gzipped (Client-Code minimal) |
| Lighthouse Performance | ≥ 90 |

**Optimierung:** `unstable_cache` auf Suche (60s), `revalidateTag` bei neuen Reviews.

---

## Teststrategie

| Typ | Was |
|-----|-----|
| Unit | `buildSearchWhere()` (libs), Relevanz-Scoring-Funktion |
| Integration | `GET /api/reviews/search` mit diversen Parametern, Pagination, leere Results |
| E2E | `/suche?q=cyberpunk` → Ergebnisse visible, Highlights, Filter, Pagination, Empty State |
| Accessibility | axe-core auf Suchseite, Tastatur-Navigation, Screen-Reader-Test |

**Rollout:** Feature-Flag `SEARCH_ENABLED` (default `true`). Bei Problemen: Flag auf `false`, `/suche` gibt 404.

---

## Nächste Schritte (Arbeitspakete)

1. **PK1 – API: Relevanz-Sortierung** (`/api/reviews/search` erweitern)
2. **PK2 – Suchseite `/suche` (Server Component)** – Grundgerüst, Query-Handling, Metadata
3. **PK3 – SearchResults Component (Client)** – Grid, Highlights, Pagination, Empty/Error States
4. **PK4 – SearchFilters Component** – Kategorie, Score, Tags, Sortierung, URL-Sync
5. **PK5 – Navigation/Header Integration** – Such-Input, Shortcut `/`, Mobile
6. **PK6 – Tests** – Unit (Scoring), Integration (API), E2E (Flow)
7. **PK7 – Self-Review & Verify** – Build, Lint, Typecheck, Tests grün
8. **PK8 – Doku/Changelog** – README, ROADMAP, DECISIONS