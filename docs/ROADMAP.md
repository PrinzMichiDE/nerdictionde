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
- [ ] Lint: 246 vorbestehende `no-explicit-any`-Errors inkrementell bereinigen (nicht blockierend für Verify)

## Typ B — Lücken schließen (Tests, Doku, Fehlerbehandlung)

- [x] `docs/PROGRESS.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md` angelegt
- [ ] Unit-Tests für vorhandene Logik (z. B. `src/lib/review-category.ts`, `src/lib/date-utils.ts`, `src/lib/related-reviews.ts`)
- [ ] README erweitern um Datenmodell, Environment-Variablen, Migrationshinweise
- [ ] Changelog (`CHANGELOG.md`) anlegen und pflegen (SemVer)

## Typ C — Refactoring (wartbarkeitsverbessernd)

- (noch keine Kandidaten)

## Typ D — Neue Features (Review-Plattform für Endnutzer)

- [x] Related Reviews auf Review-Detailseiten (bereits vorhanden: `RelatedReviews.tsx` + `related-reviews.ts`)
- [x] Benutzer-Bewertungen (bereits vorhanden: `UserRatingSection`, `UserRating` Modell)
- [x] Lesezeichen/Bookmarks (bereits vorhanden: `ReviewActions`, `Bookmark` Modell)
- [x] **Newsletter Double-Optin + Bestätigungsseite (`/newsletter/confirm`)** ← erledigt
- [ ] Deals / Preisverlauf-Widget auf Review-Detailseiten (Modelle existieren, keine UI/Daten)
- [ ] Barrierefreiheits-Audit bestehender Seiten (Fokus, Kontrast, ARIA)

## Typ E — Performance, UX, Developer Experience

- (noch keine Kandidaten)

## Aktuelles Feature

Keines.

## Nächster Schritt

Unit-Tests für bestehende Logik (Typ B), z. B. `src/lib/review-category.ts`, `src/lib/date-utils.ts`, `src/lib/related-reviews.ts`.
