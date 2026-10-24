# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-24)

- Branch: `auto/dev` (auf Remote gepusht).
- `type-check`: grün. `build`: grün. `tests`: 121/121 grün (vitest, 17 Dateien). `lint`: 153 Errors (davon 153 `no-explicit-any`, inkrementelle Bereinigung), 137 Warnings — kritische Bugs (React Hooks, unescaped entities, html links, empty object types) behoben, TypeScript-Errors behoben.
- `scripts/verify.sh`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `npm run verify`, `npm test` angelegt und gepusht.
- Abgeschlossene Features:
  1. Newsletter Double-Optin + Bestätigungsseite
  2. Deals / Preisverlauf-Widget auf Review-Detailseiten
  3. Barrierefreiheits-Verbesserungen Review-Detailseite
  4. Kommentar-Antworten (verschachtelte Kommentare) auf Reviews
  5. Kommentar-Voting (Up/Down) auf Review-Kommentaren
  6. Review als PDF exportieren
  7. **Full-Text Search mit Relevanz-Ranking** (`/suche`, API, Highlights, Filter, Pagination)
- Abgeschlossene Typ-A-Aufgaben (diese Iteration):
  - Kritische Lint-Bugs behoben: React-Hooks-Verstöße (setState in useEffect), `no-empty-object-type`, `react/no-unescaped-entities`, `@next/next/no-html-link-for-pages`, `react-hooks/purity` (Math.random im Render), `react-hooks/immutability` (Mutation im Render)
  - `no-explicit-any` Bereinigung gestartet: 66/216 behoben (hardware-catalog, types/review, markdown-to-pdf, streaming, job-status, bulk-create routes, auto-generate, releases, review-detail, IGDBGame types)
- Abgeschlossene Typ-B-Aufgaben:
  - CHANGELOG.md, README.md erweitert
  - Unit-Tests: review-category, date-utils, tag-generation, seo, newsletter, comments, comment-schema, rating-schema, votes-api, pdf-export, pdf-layout, search-relevance, highlighter-logic
  - Integration-Tests: search-api, deals, price-history, pdf-export, votes, comments
  - 121 Tests insgesamt

## Nächster Schritt (Hauptschleife)

**Aktuelles Feature:** Keines — Full-Text Search abgeschlossen.
**Phase:** Feature fertig. Nächster Zyklus: Hauptschleife → Typ A (weitere Lint-Bereinigung: `no-explicit-any`) oder Typ B (weitere Tests/Doku).

### Arbeitspakete (F4 Implementierung)
| PK | Beschreibung | Status |
|----|--------------|--------|
| PK1 | API: Relevanz-Sortierung in `/api/reviews/search` (ts_rank / Applikation-Scoring) | **erledigt** |
| PK2 | Suchseite `/suche` (Server Component) — Grundgerüst, Query-Handling, Metadata | **erledigt** |
| PK3 | `SearchResults` Component (Client) — Grid, Highlights, Pagination, Empty/Error States | **erledigt** |
| PK4 | `SearchFilters` Component — Kategorie, Score, Tags, Sortierung, URL-Sync | **erledigt** |
| PK5 | Navigation/Header Integration — Such-Input, Shortcut `/`, Mobile | **erledigt** |
| PK6 | Tests — Unit (Scoring), Integration (API), E2E (Flow) | **erledigt** |
| PK7 | Self-Review & Verify — Build, Lint, Typecheck, Tests grün | **erledigt** |
| PK8 | Doku/Changelog — README, ROADMAP, DECISIONS | **erledigt** |
