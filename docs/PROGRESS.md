# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-23)

- Branch: `auto/dev` (auf Remote gepusht).
- `type-check`: grün. `build`: grün. `tests`: 80/80 grün (vitest, 14 Dateien). `lint`: 260 vorbestehende `no-explicit-any`-Errors (nicht blockierend), neue Dateien lint-sauber.
- `scripts/verify.sh`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `npm run verify`, `npm test` angelegt und gepusht.
- Abgeschlossene Features:
  1. Newsletter Double-Optin + Bestätigungsseite
  2. Deals / Preisverlauf-Widget auf Review-Detailseiten
  3. Barrierefreiheits-Verbesserungen Review-Detailseite
  4. Kommentar-Antworten (verschachtelte Kommentare) auf Reviews
  5. Kommentar-Voting (Up/Down) auf Review-Kommentaren
  6. Review als PDF exportieren
- Abgeschlossene Typ-B-Aufgaben:
  - CHANGELOG.md, README.md erweitert
  - Unit-Tests: review-category, date-utils, tag-generation, seo, newsletter, comments, comment-schema, rating-schema, votes-api, pdf-export, pdf-layout
  - 80 Tests insgesamt

## Nächster Schritt (Hauptschleife)

**Aktuelles Feature:** Full-Text Search mit Relevanz-Ranking (Typ D)
**Phase:** F3 Design & Plan — Arbeitspakete definiert. Nächster Schritt: F4 PK1 (API Relevanz-Sortierung).

### Arbeitspakete (F4 Implementierung)
| PK | Beschreibung | Status |
|----|--------------|--------|
| PK1 | API: Relevanz-Sortierung in `/api/reviews/search` (ts_rank / Applikation-Scoring) | **erledigt** |
| PK2 | Suchseite `/suche` (Server Component) — Grundgerüst, Query-Handling, Metadata | **in Arbeit** |
| PK3 | `SearchResults` Component (Client) — Grid, Highlights, Pagination, Empty/Error States | offen |
| PK4 | `SearchFilters` Component — Kategorie, Score, Tags, Sortierung, URL-Sync | offen |
| PK5 | Navigation/Header Integration — Such-Input, Shortcut `/`, Mobile | offen |
| PK6 | Tests — Unit (Scoring), Integration (API), E2E (Flow) | offen |
| PK7 | Self-Review & Verify — Build, Lint, Typecheck, Tests grün | offen |
| PK8 | Doku/Changelog — README, ROADMAP, DECISIONS | offen |
