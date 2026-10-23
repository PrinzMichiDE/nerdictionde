# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-23)

- Branch: `auto/dev` (auf Remote gepusht), uncommitete Änderungen aus vorheriger Session (Redesign-UI, News-Seite, Admin-Komponenten) bleiben unangetastet im Arbeitsbaum.
- `docs/` angelegt: PROGRESS.md, ROADMAP.md, DECISIONS.md.
- `type-check`: grün. `build`: grün. `tests`: 21/21 grün (vitest, 7 Dateien). `lint`: 254 vorbestehende `no-explicit-any`-Errors (nicht blockierend für Verify), alle neuen Dateien lint-sauber.
- `scripts/verify.sh`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `npm run verify` und `npm test` angelegt und gepusht.
- Abgeschlossene Features:
  1. Newsletter Double-Optin + Bestätigungsseite (F1-F9 durchlaufen)
  2. Deals / Preisverlauf-Widget auf Review-Detailseiten (F1-F9 durchlaufen)

## Aktuelle Work-Pakete

Keine (letztes Feature abgeschlossen).

## Nächster Schritt (Hauptschleife)

Typ A oder B wählen (Ratio: nach einem Feature folgt A/B/C):
- Lint-Fixes inkrementell (254 vorbestehende no-explicit-any-Errors)
- Weitere Unit-Tests für bestehende Logik
- Changelog (CHANGELOG.md) anlegen
- README erweitern

## Konventionen (aus AGENTS.md)

- Ponytail full bei Code, Humanizer bei Prosa, Hallmark nur bei neuen eigenständigen Seiten.
- Commits: Conventional Commits, auf `auto/dev`, kein Force-Push, kein `--force`.
- Vor jedem Commit: Diff auf Secrets prüfen.
