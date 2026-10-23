# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-23)

- Branch: `auto/dev` (auf Remote gepusht).
- `type-check`: grün. `build`: grün. `tests`: 29/29 grün (vitest, 8 Dateien). `lint`: 254 vorbestehende `no-explicit-any`-Errors (nicht blockierend), neue Dateien lint-sauber.
- `scripts/verify.sh`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `npm run verify`, `npm test` angelegt und gepusht.
- Abgeschlossene Features:
  1. Newsletter Double-Optin + Bestätigungsseite (F1-F9 erledigt)
  2. Deals / Preisverlauf-Widget auf Review-Detailseiten (F1-F9 erledigt)
  3. Barrierefreiheits-Verbesserungen Review-Detailseite (F1-F9 erledigt)

## Aktuelle Work-Pakete

Keine (alle geplanten Features abgeschlossen).

## Nächster Schritt (Hauptschleife)

Typ A/B/C wählen:
- Lint-Fixes inkrementell (254 vorbestehende no-explicit-any-Errors)
- Weitere Unit-Tests für bestehende Logik
- README erweitern

ODER Typ D: Neues Feature aus Roadmap (keine weiteren geplanten Features mehr,
neue Roadmap-Einträge ggf. erstellen).

## Konventionen (aus AGENTS.md)

- Ponytail full bei Code, Humanizer bei Prosa, Hallmark nur bei neuen eigenständigen Seiten.
- Commits: Conventional Commits, auf `auto/dev`, kein Force-Push, kein `--force`.
- Vor jedem Commit: Diff auf Secrets prüfen.
