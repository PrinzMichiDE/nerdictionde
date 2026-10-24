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
- [x] Kritische Lint-Bugs behoben: React-Hooks-Verstöße (setState in useEffect), `no-empty-object-type`, `react/no-unescaped-entities`, `@next/next/no-html-link-for-pages`, `react-hooks/purity` (Math.random im Render), `react-hooks/immutability` (Mutation im Render)
- [x] `no-explicit-any` Bereinigung: ~150/216 behoben (scripts, admin components, API routes, lib files: igdb, tmdb, tavily, review-generation, job-status, job-resume)
- [x] **Letzte 3 React-Hooks-Errors behoben** (`TableOfContents.tsx`, `YouTubeEmbed.tsx`, `SupportTopBanner.tsx`) — redundante `setState` in `useEffect` durch Lazy Initializer ersetzt
- [ ] Lint: verbleibende `no-explicit-any` Warnings inkrementell bereinigen (nicht blockierend für Verify)

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
- [x] Review als PDF exportieren (`/api/reviews/[slug]/pdf`, `ReviewPdfDownload`, `ReviewPdfLayout`, `markdown-to-pdf`) ← erledigt
- [x] **Full-Text Search mit Relevanz-Ranking** (`/suche`, Highlights, Filter, Pagination) — Spec: `docs/features/search-relevance.md` ← erledigt
- [ ] **Öffentliche Nutzerprofile & Follow-System** (`/u/[username]`, Follow, Feed, Notifications) — Spec: `docs/features/public-user-profiles.md` ← **in Arbeit**

## Typ E — Performance, UX, Developer Experience

- (noch keine Kandidaten)

## Aktuelles Feature

**Öffentliche Nutzerprofile & Follow-System** (Spec: `docs/features/public-user-profiles.md`)
Phase: F2 Spec erledigt → F3 Design & Plan

## Nächster Schritt

F3 Design & Plan: Technische Lösung entwerfen, Arbeitspakete in PROGRESS.md verfeinern, bestehende Wiederverwendbarkeit prüfen (Session, Prisma, UI-Komponenten). Dann F4 Implementierung starten mit PK1 (Datenmodell + Migration).
