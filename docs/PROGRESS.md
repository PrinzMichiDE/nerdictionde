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

**Aktuelles Feature:** **Review Collections / Kuratierte Listen** — **F1 Auswahl ✅, F2 Spec ✅, F3 Design & Plan ✅, F4 API Implementierung (PK4-PK12) ✅**
**Phase:** F4 UI Implementierung (PK13-PK21)

---

### Zusammenfassung: Public User Profiles & Follow-System

**Implementierte User Stories (alle ✅):**
- US1: Öffentliche Profile `/u/[username]` mit Bio, Avatar, Stats, Tabs (Bewertungen/Bookmarks), Pagination
- US2: Profil-Einstellungen `/einstellungen/profil` (Bio 500 Zeichen, 3 Sichtbarkeits-Toggles)
- US3: Follow/Unfollow mit optimistischer UI, Follower/Following-Listen, Counts
- US4: Aktivitäts-Feed `/feed` (Bewertungen + Bookmarks gefolgter Nutzer, Infinite Scroll, Cache 30s)
- US5: Benachrichtigungs-System (Header-Glocke mit Badge, Dropdown, `/benachrichtigungen` Seite, Filter, Als-gelesen)

**Technische Highlights:**
- 3 neue Prisma Models: `UserProfile`, `Follow`, `Notification` + Relations zu `TwitchUser`
- Denormalisierte Counts (`followerCount`, `followingCount`) für schnelle Anzeige
- `unstable_cache` für Profil (60s) und Feed (30s)
- Cursor-basierte Pagination für alle Listen
- Optimistische UI bei Follow/Unfollow mit sofortigem Rollback auf Fehler
- 158 Tests (Unit + Integration) alle grün
- 0 Lint Errors, 0 TypeScript Errors, Build grün

**Dokumentation:**
- CHANGELOG.md, README.md aktualisiert
- Feature Spec Review-Sektion (F6) komplett ✅
- ROADMAP.md: Feature als erledigt markiert

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
| PK14 | UI: Öffentliche Profilseite `/u/[username]` (Server Component, Tabs, Pagination) | **erledigt** |
| PK15 | UI: Follow-Button Component (optimistic, Loading, Tooltip) | **erledigt** |
| PK16 | UI: Profil-Einstellungen (`/einstellungen/profil` oder Tab) — Bio, Sichtbarkeit | **erledigt** |
| PK17 | UI: Feed-Seite `/feed` (Server Component, Infinite Scroll/Pagination) | **erledigt** |
| PK18 | UI: Header Notification-Glocke + Dropdown | **erledigt** |
| PK19 | UI: `/benachrichtigungen` Seite (alle Notifications, Filter ungelesen) | **erledigt** |
| PK20 | Tests: Unit (Follow, Feed, Notifications), Integration (APIs), E2E (Flows) | **erledigt** |
| PK21 | Self-Review & Verify — Build, Lint, Typecheck, Tests grün | **erledigt** |
| PK22 | Doku/Changelog — README, ROADMAP, DECISIONS, Feature-Spec Review-Sektion | **erledigt** |

---

### Neues Feature: Review Collections / Kuratierte Listen

**Ziel:** Nutzer erstellen, teilen und entdecken kuratierte Listen von Reviews ("Beste RPGs 2024", "Hidden Gems", "Koop-Spiele").

**User Stories (MVP):**
- US1: Öffentliche Liste ansehen (`/listen/[slug]`)
- US2: Eigene Liste erstellen
- US3: Liste bearbeiten (Metadaten)
- US4: Reviews zur Liste hinzufügen/entfernen (Max 100)
- US5: Reihenfolge per Drag-and-Drop ändern
- US6: Liste löschen (Soft-Delete)
- US7: Eigene Listen verwalten (`/einstellungen/listen`)
- US8: Öffentliche Listen entdecken (`/listen` mit Filter/Sort)
- US9: Liste teilen (Web Share API, OG Tags)
- US10: Listen auf Profil anzeigen (`/u/[username]` Tab "Listen")

**Technische Highlights (geplant):**
- 2 neue Prisma Models: `ReviewCollection`, `CollectionItem` + Relations zu `TwitchUser`, `Review`
- Denormalisierter `itemCount` + `version` für optimistisches Locking
- `unstable_cache` für Listen-Übersicht (60s) und Detail (30s)
- Cursor-Pagination für Items und Listen-Übersicht
- Optimistische UI bei Reorder/Add/Remove mit `@dnd-kit`
- Feature-Flag `FEATURE_REVIEW_COLLECTIONS`

### Arbeitspakete (F4 Implementierung)
| PK | Beschreibung | Status |
|----|--------------|--------|
| PK1 | Prisma Schema: `ReviewCollection`, `CollectionItem` + Migration | **erledigt** |
| PK2 | Zod Schemas: `collection-schema.ts` (Create, Update, AddItem, Reorder) | **erledigt** |
| PK3 | Lib: `src/lib/collections.ts` (Utilities: Slug-Generierung, Reorder-Validierung, Count-Sync) | **erledigt** |
| PK4 | API: `GET /api/listen` (Public Lists mit Filter/Sort/Pagination) | **erledigt** |
| PK5 | API: `POST /api/listen` (Create) | **erledigt** |
| PK6 | API: `GET /api/listen/[slug]` (Detail, Public/Private, Items Pagination) | **erledigt** |
| PK7 | API: `PATCH /api/listen/[slug]` (Update Metadaten, Owner-Check) | **erledigt** |
| PK8 | API: `DELETE /api/listen/[slug]` (Soft Delete, Owner-Check) | **erledigt** |
| PK9 | API: `POST /api/listen/[slug]/items` (Add Review, Max 100, Published-Check) | **erledigt** |
| PK10 | API: `DELETE /api/listen/[slug]/items/[reviewId]` (Remove Review) | **erledigt** |
| PK11 | API: `PATCH /api/listen/[slug]/reorder` (Reorder, Validierung, Owner-Check) | **erledigt** |
| PK12 | API: `GET /api/me/listen` (Eigene Listen, Pagination) | **erledigt** |
| PK13 | UI: `/listen` Seite (Server Component, Filter, Sort, Grid, Infinite Scroll) | ☐ |
| PK14 | UI: `/listen/[slug]` Seite (Server Component + Client Islands: Header, Items, Owner-Mode) | ☐ |
| PK15 | UI: `CollectionCard` Component (Wiederverwendbar für Grid) | ☐ |
| PK16 | UI: `CollectionItems` Client Component (Grid, Pagination, Owner-Mode: Add/Remove/DnD) | ☐ |
| PK17 | UI: `/einstellungen/listen` Seite (Eigene Listen verwalten) | ☐ |
| PK18 | UI: Profil-Tab "Listen" auf `/u/[username]` | ☐ |
| PK19 | UI: Share-Button (Web Share API + Clipboard Fallback + Toast) | ☐ |
| PK20 | UI: OG Tags auf `/listen/[slug]` (Metadata Export) | ☐ |
| PK21 | Drag-and-Drop: `@dnd-kit/core` + `@dnd-kit/sortable` Integration | ☐ |
| PK22 | Unit Tests (Utils, Schemas, Components) | ☐ |
| PK23 | Integration Tests (Alle API Endpoints) | ☐ |
| PK24 | E2E Tests (Kritische Flows) | ☐ |
| PK25 | Self-Review (F6) + Verify (F7: Build, Lint, Typecheck, Tests) | ☐ |
| PK26 | Doku: CHANGELOG, README, ROADMAP, Feature-Spec Review-Sektion | ☐ |
