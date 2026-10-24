# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-24)

- Branch: `auto/dev` (auf Remote gepusht).
- `type-check`: grün. `build`: grün. `tests`: 121/121 grün (vitest, 17 Dateien). `lint`: 0 Errors, 138 Warnings — alle kritischen Lint-Errors (React Hooks setState in useEffect) behoben.
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
  - `no-explicit-any` Bereinigung gestartet: 150+/216 behoben (scripts, admin components, API routes, lib files: igdb, tmdb, tavily, review-generation, job-status, job-resume)
  - **Letzte 3 React-Hooks-Errors behoben**: `TableOfContents.tsx`, `YouTubeEmbed.tsx`, `SupportTopBanner.tsx` — redundante `setState` in `useEffect` durch Lazy Initializer ersetzt
- Abgeschlossene Typ-B-Aufgaben:
  - CHANGELOG.md, README.md erweitert
  - Unit-Tests: review-category, date-utils, tag-generation, seo, newsletter, comments, comment-schema, rating-schema, votes-api, pdf-export, pdf-layout, search-relevance, highlighter-logic
  - Integration-Tests: search-api, deals, price-history, pdf-export, votes, comments
  - 121 Tests insgesamt

## Nächster Schritt (Hauptschleife)

**Aktuelles Feature:** **Public User Profiles & Follow-System** (Spec: `docs/features/public-user-profiles.md`)
**Phase:** F4 Implementierung — PK8-PK13 erledigt → PK14: UI Öffentliche Profilseite `/u/[username]`

### Arbeitspakete (F4 Implementierung)
| PK | Beschreibung | Status |
|----|--------------|--------|
| PK1 | Datenmodell: Prisma Schema + Migration (`UserProfile`, `Follow`, `Notification`) | **erledigt** |
| PK2 | Seed-Script: `UserProfile` für alle existierenden `TwitchUser` anlegen | **erledigt** (keine exist. User) |
| PK3 | Lib: Profile Utilities (`src/lib/user-profiles.ts`) | **erledigt** |
| PK4 | Lib: Follow Logic (`src/lib/follow.ts`) | **erledigt** |
| PK5 | Lib: Feed Logic (`src/lib/feed.ts`) | **erledigt** |
| PK6 | Lib: Notifications (`src/lib/notifications.ts`) | **erledigt** |
| PK7 | Zod Schema: `src/lib/schemas/profile-schema.ts` | **erledigt** |
| PK8 | API: `/api/users/[username]` GET (öffentliches Profil) | **erledigt** |
| PK9 | API: `/api/users/me/profile` GET/PATCH (Einstellungen) | **erledigt** |
| PK10 | API: `/api/follow` POST (Follow/Unfollow) | **erledigt** |
| PK11 | API: `/api/users/[username]/followers` & `/following` GET (Listen) | **erledigt** |
| PK12 | API: `/api/feed` GET (Aktivitäts-Feed, paginiert, gecacht) | **erledigt** |
| PK13 | API: `/api/notifications` GET/PATCH (Liste, als gelesen markieren) | **erledigt** |
| PK14 | UI: Öffentliche Profilseite `/u/[username]` (Server Component, Tabs, Pagination) | **offen** |
| PK15 | UI: Profil-Einstellungen (`/einstellungen/profil` oder Tab) — Bio, Sichtbarkeit | **offen** |
| PK16 | UI: Follow-Button Component (optimistic, Loading, Tooltip) | **offen** |
| PK17 | UI: Feed-Seite `/feed` (Server Component, Infinite Scroll/Pagination) | **offen** |
| PK18 | UI: Header Notification-Glocke + Dropdown | **offen** |
| PK19 | UI: `/benachrichtigungen` Seite (alle Notifications, Filter ungelesen) | **offen** |
| PK20 | Tests: Unit (Follow, Feed, Notifications), Integration (APIs), E2E (Flows) | **offen** |
| PK21 | Self-Review & Verify — Build, Lint, Typecheck, Tests grün | **offen** |
| PK22 | Doku/Changelog — README, ROADMAP, DECISIONS, Feature-Spec Review-Sektion | **offen** |
