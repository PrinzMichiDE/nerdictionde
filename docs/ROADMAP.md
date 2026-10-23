# ROADMAP.md — Nerdiction.de

Status-Legend: `offen` | `in Arbeit` | `erledigt` | `blockiert`

## Priorisierung (aus AGENTS.md)

Stabilität > Features > Optik. Nach jeweils 2 erledigten Aufgaben vom Typ A/B/C folgt ein neues Feature (D), sofern die Roadmap Features enthält.

## Typ A — Kaputtes reparieren (Build, Tests, Bugs, Security, Regressionen)

- [x] `scripts/verify.sh` anlegen: Build + Type-Check + Lint + Tests (`npm run verify`)
- [x] CI-Workflow (`.github/workflows/ci.yml`) anlegen, der `verify` bei jedem Push läuft
- [x] Pre-Commit-Hook (`.husky/pre-commit`): Format + Lint + Secret-Scan
- [x] `type-check` auf `main` grün
- [x] `build` auf `main` grün
- [ ] Lint: 254 vorbestehende `no-explicit-any`-Errors inkrementell bereinigen (nicht blockierend für Verify)

## Typ B — Lücken schließen (Tests, Doku, Fehlerbehandlung)

- [x] `docs/PROGRESS.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md` angelegt
- [x] Unit-Tests für vorhandene Logik (review-category, date-utils, tag-generation, seo, newsletter-API)
- [x] README erweitern um Datenmodell, Environment-Variablen, Migrationshinweise
- [x] Changelog (`CHANGELOG.md`) anlegen und pflegen (SemVer)

## Typ C — Refactoring (wartbarkeitsverbessernd)

- (noch keine Kandidaten)

## Typ D — Neue Features (Review-Plattform für Endnutzer)

- [x] Related Reviews auf Review-Detailseiten (bereits vorhanden)
- [x] Benutzer-Bewertungen (bereits vorhanden)
- [x] Lesezeichen/Bookmarks (bereits vorhanden)
- [x] Newsletter Double-Optin + Bestätigungsseite (`/newsletter/confirm`) ← erledigt
- [x] Deals / Preisverlauf-Widget auf Review-Detailseiten ← erledigt
- [x] Barrierefreiheits-Verbesserungen Review-Detailseite (Fokus, ARIA) ← erledigt
- [x] **Kommentar-Antworten (verschachtelte Kommentare) auf Reviews** ← erledigt
- [x] **Kommentar-Voting (Up/Down auf Kommentare)** ← erledigt
- [ ] Review als PDF exportieren

## Typ E — Performance, UX, Developer Experience

- (noch keine Kandidaten)

## Aktuelles Feature

Keines.

## Nächster Schritt

`docs/features/comment-replies.md` Spec schreiben (Typ D).
