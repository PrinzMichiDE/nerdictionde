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

Keine offenen Typ-D-Features in Roadmap. Nächste Iteration: Typ A (Lint-Bereinigung inkrementell, 260 Errors) oder Typ B (weitere Unit-Tests, Doku).
