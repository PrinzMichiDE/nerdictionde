# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-23)

- Branch: `auto/dev` (auf Remote gepusht).
- `type-check`: grün. `build`: grün. `tests`: 48/48 grün (vitest, 10 Dateien). `lint`: 254 vorbestehende `no-explicit-any`-Errors (nicht blockierend), neue Dateien lint-sauber.
- `scripts/verify.sh`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `npm run verify`, `npm test` angelegt und gepusht.
- Abgeschlossene Features:
  1. Newsletter Double-Optin + Bestätigungsseite (F1-F9 erledigt)
  2. Deals / Preisverlauf-Widget auf Review-Detailseiten (F1-F9 erledigt)
  3. Barrierefreiheits-Verbesserungen Review-Detailseite (F1-F9 erledigt)
  4. Kommentar-Antworten (verschachtelte Kommentare) auf Reviews (F1-F9 erledigt)
- Abgeschlossene Typ-B-Aufgaben:
  - CHANGELOG.md angelegt
  - Unit-Tests: review-category, date-utils, tag-generation, seo (Schema-Generierung), newsletter (3 API-Routen), comments (7 API-Tests für parentId)
  - 48 Tests insgesamt

## Nächster Schritt (Hauptschleife)

Alle geplanten Roadmap-Features sind erledigt. Optionen:
- Typ B: README erweitern, weitere Unit-Tests (z. B. verbleibende Lib-Funktionen)
- Typ A: Lint-Fixes inkrementell (254 vorbestehende no-explicit-any-Errors)
- Typ D: Neue Roadmap-Features (Kommentar-Voting, PDF-Export, Benutzer-Profile)

## Konventionen (aus AGENTS.md)

- Ponytail full bei Code, Humanizer bei Prosa, Hallmark nur bei neuen eigenständigen Seiten.
- Commits: Conventional Commits, auf `auto/dev`, kein Force-Push, kein `--force`.
- Vor jedem Commit: Diff auf Secrets prüfen.
