# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-23)

- Branch: `auto/dev` (auf Remote gepusht).
- `type-check`: grün. `build`: grün. `tests`: 74/74 grün (vitest, 13 Dateien). `lint`: 254 vorbestehende `no-explicit-any`-Errors (nicht blockierend), neue Dateien lint-sauber.
- `scripts/verify.sh`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `npm run verify`, `npm test` angelegt und gepusht.
- Abgeschlossene Features:
  1. Newsletter Double-Optin + Bestätigungsseite
  2. Deals / Preisverlauf-Widget auf Review-Detailseiten
  3. Barrierefreiheits-Verbesserungen Review-Detailseite
  4. Kommentar-Antworten (verschachtelte Kommentare) auf Reviews
  5. Kommentar-Voting (Up/Down) auf Review-Kommentaren
- Abgeschlossene Typ-B-Aufgaben:
  - CHANGELOG.md, README.md erweitert
  - Unit-Tests: review-category, date-utils, tag-generation, seo, newsletter, comments, comment-schema, rating-schema, votes-api
  - 74 Tests insgesamt

## Nächster Schritt (Hauptschleife)

Typ D: Neues Feature aus Roadmap — "Review als PDF exportieren" ist der einzige verbleibende Kandidat.
ODER Typ A/B: Lint-Fixes inkrementell (254 vorbestehende Errors), weitere Unit-Tests.

## Konventionen (aus AGENTS.md)

- Ponytail full bei Code, Humanizer bei Prosa, Hallmark nur bei neuen eigenständigen Seiten.
- Commits: Conventional Commits, auf `auto/dev`, kein Force-Push, kein `--force`.
- Vor jedem Commit: Diff auf Secrets prüfen.
