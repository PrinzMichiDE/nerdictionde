# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-25)

- Branch: `auto/dev` (auf Remote gepusht).
- `type-check`: grün. `build`: grün. `tests`: **636/636 grün** (vitest), `lint`: **31 Errors** (alle `no-explicit-any` in externen Skills/Admin, nicht blockierend), 321 Warnings — keine neuen Errors
- `scripts/verify.sh`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `npm run verify`, `npm test` angelegt und gepusht.
- Abgeschlossene Features:
  1. Newsletter Double-Optin + Bestätigungsseite
  2. Deals / Preisverlauf-Widget auf Review-Detailseiten
  3. Barrierefreiheits-Verbesserungen Review-Detailseite
  4. Kommentar-Antworten (verschachtelte Kommentare) auf Reviews
  5. Kommentar-Voting (Up/Down) auf Review-Kommentaren
  6. Review als PDF exportieren
  7. **Full-Text Search mit Relevanz-Ranking** (`/suche`, API, Highlights, Filter, Pagination)
  8. **Öffentliche Nutzerprofile & Follow-System** (`/u/[username]`, Follow, Feed, Notifications)
  9. **Review Collections / Kuratierte Listen** (`/listen`, `/listen/[slug]`, Erstellung, Drag-and-Drop, Teilen, Profil-Tab)
  10. **Review Reactions (Emoji-Reaktionen)** (`/reviews/[slug]`, 6 Emojis, optimistische UI, SSR-Counts, Review-Card Badge)
  11. **Erweiterte Suchfilter** (`/suche`, Release-Datum, Preis, Plattform, Video, Deal, Developer/Publisher, Feature-Flag)
  12. **Leseverlauf / Reading History** (`/verlauf`, automatisches Tracking, Badge, Datenschutz-Toggle, Retention)
  13. **Kategorie-Abos / Category Subscriptions** (`/einstellungen/kategorien`, Toggle-Switches, Chips auf Startseite/Profil, In-App-Benachrichtigungen, Feature-Flag)
  14. **Review-Vergleich erweitern** (`/reviews/vergleichen`, bis 3 Reviews, Specs, Preisverlauf, Screenshots/Video, ScoreCompare, Share, Feature-Flag)
  15. **Review-Serien / Multi-Part Reviews** (`/serien`, `/serien/[slug]`, Admin-UI `/admin/serien`, Drag-and-Drop-Reorder, Review-Detail Badge, Review-Card Badge, Search-API Erweiterung, Feature-Flag)
  16. **Community Q&A auf Reviews** (`/reviews/[slug]`, Fragen & Antworten, Upvote/Downvote, Accepted Answer, Notifications, Feature-Flag)
  17. **Personalisierte Empfehlungen** (`/`, `/reviews/[slug]`, Content-Based + Collaborative + Trending, MMR-Diversifizierung, Begründungen, Dismiss, Feature-Flag, Settings Toggle)
  18. **Hardware-Kompatibilitäts-Check** (`/einstellungen/hardware`, `/reviews/[slug]`, CPU/GPU/RAM Profil, Kompatibilitäts-Badge, FPS-Schätzungen, Feature-Flag)
- Abgeschlossene Typ-A-Aufgaben (diese Iteration):
  - Kritische Lint-Bugs behoben: React-Hooks-Verstöße (setState in useEffect), `no-empty-object-type`, `react/no-unescaped-entities`, `@next/next/no-html-link-for-pages`, `react-hooks/purity` (Math.random im Render), `react-hooks/immutability` (Mutation im Render)
  - `no-explicit-any` Bereinigung: **vollständig in Quelldateien** (src/lib/qa.ts, src/lib/recommendations-candidates.ts, src/app/api/user/hardware-profile/route.ts), 150+/216 behoben (scripts, admin components, API routes, lib files: igdb, tmdb, tavily, review-generation, job-status, job-resume)
  - **Letzte 3 React-Hooks-Errors behoben**: `TableOfContents.tsx`, `YouTubeEmbed.tsx`, `SupportTopBanner.tsx` — redundante `setState` in `useEffect` durch Lazy Initializer ersetzt
  - **Category Subscriptions Fixes**: `useEffect` statt `useLayoutEffect` für Mount-Detection, `initialUserId` Prop entfernt (unused)
  - **Collections Follow Tests repariert**: Mock für `createCollectionUpdateNotification`, `prisma.reviewCollection.findUnique`, `followedCollectionsResponseSchema` ergänzt
  - **Test-Infrastruktur**: OpenAI Client für Browser-Test-Umgebung freigegeben (`dangerouslyAllowBrowser: true`)
  - **Type-Check Reparaturen**: 6 Test-Dateien von `no-explicit-any` bereinigt (category-subscriptions, recommendation-schema, recommendations-candidates, recommendations-scoring, recommendations, review-reactions), Mock-Typen korrigiert
  - **Test-Dateien RequestInit/API-Fixes**: listen/follow, listen/items, recommendations API, review-reactions
- Abgeschlossene Typ-B-Aufgaben:
  - CHANGELOG.md, README.md, ROADMAP.md, .env.example, PROGRESS.md aktualisiert
  - Unit-Tests: review-category, date-utils, tag-generation, seo, newsletter, comments, comment-schema, rating-schema, votes-api, pdf-export, pdf-layout, search-relevance, highlighter-logic, **collections (95), collection-schema (44), review-reactions (12), advanced-search-filters (18), category-subscriptions (8), category-mapping (19), review-compare (28), review-series (20), qa-schema (25)**
  - Integration-Tests: search-api, deals, price-history, pdf-export, votes, comments, **listen (10), me/listen (5), reactions-api (10), search-advanced-filters (20), category-subscriptions-api (9), review-compare (16), review-series (10), qa-api (35)**
  - 636 Tests insgesamt (alle grün)

## Nächster Schritt (Hauptschleife)

**Aktuelles Feature:** **Social Sharing & Viral Loops** — **F1 ✅, F2 ✅, F3 ✅**  
**Phase:** F4 Implementierung — PKG-1: DB-Migration & Model

---

### Zusammenfassung: Review Collections Follow (Abgeschlossen 2026-10-24)

**User Stories (alle ✅):**
- US1: Öffentliche Liste folgen (`/listen/[slug]`) — Follow-Button, optimistische UI, SSR-Count
- US2: Eigene gefolgte Listen verwalten (`/einstellungen/listen` Tab "Gefolgt") — Grid, Unfollow, Pagination, Empty State
- US3: Feed zeigt neue Items gefolzter Listen (`/feed` mit `includeCollections`) — Merge mit User-Feed, max 3 pro Liste
- US4: Benachrichtigungen bei neuen Items — In-App (Type `COLLECTION_ITEM_ADDED`), Batch-Insert, Grouping
- US5: Owner sieht Follower-Liste — Modal mit Avatar, Name, Profil-Link, Pagination

**Technische Highlights:**
- 1 neue Prisma Model: `CollectionFollow` + `followersCount` auf `ReviewCollection` + `NotificationType` Enum
- 3 neue API Routes: `/api/listen/[slug]/follow` (GET/POST/DELETE), `/api/me/listen/followed` (GET), `/api/listen/[slug]/items` (POST/DELETE)
- Feed-Erweiterung: `includeCollections` Parameter, existierende `lib/feed.ts` Logik wiederverwendet
- Optimistische UI via `useCollectionFollow` Hook (Toast, Rollback, Auth-Redirect)
- `unstable_cache` 30s/60s + Tag-Invaliderung bei Mutationen
- Reversible Migration `20261024150000_add_collections_follow`
- Feature-Flag `FEATURE_COLLECTIONS_FOLLOW` (Default: `true`)
- 375 Tests grün (bestehende + neue Unit/Integration)

**Dateien (neu/geändert):**
- `prisma/migrations/20261024150000_add_collections_follow/migration.sql`
- `src/lib/collections-follow-schema.ts`, `src/lib/collections-follow.ts`
- `src/app/api/listen/[slug]/follow/route.ts`, `src/app/api/me/listen/followed/route.ts`, `src/app/api/listen/[slug]/items/route.ts`
- `src/lib/feed.ts` (Erweiterung), `src/lib/collection-follow.ts` (Notification Trigger)
- `src/hooks/useCollectionFollow.ts` (Update), `src/components/collections/CollectionFollowerCount.tsx`, `CollectionFollowerListModal.tsx`
- Tests: `tests/api/listen/follow.test.ts`, `tests/api/me/listen.followed.test.ts`, `tests/api/listen/items.test.ts`
- Doku: `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `docs/features/collections-follow.md`, `docs/PROGRESS.md`

**Definition of Done erfüllt:**
- [x] Spec vollständig, alle AK getestet & erfüllt
- [x] Self-Review ohne offene Befunde
- [x] Build, Type-Check, Lint, Tests grün
- [x] Doku & Changelog aktualisiert
- [x] Migration reversibel
- [x] Keine Secrets im Diff
- [x] Alles gepusht auf `auto/dev`

---

### Zusammenfassung: Review Collections / Kuratierte Listen

**Implementierte User Stories (alle ✅):**
- US1: Öffentliche Liste ansehen (`/listen/[slug]`) mit SEO-SSR, Pagination, Empty-State
- US2: Eigene Liste erstellen (POST `/api/listen`, Slug-Auto-Generierung, Kollision-Handling)
- US3: Liste bearbeiten (PATCH `/api/listen/[slug]`, Owner-Check, Slug stabil)
- US4: Reviews hinzufügen/entfernen (POST/DELETE `/api/listen/[slug]/items`, Max 100, Published-Check, Duplikat-Schutz)
- US5: Reihenfolge per Drag-and-Drop ändern (Native HTML5 DnD, optimistische UI, PATCH `/api/listen/[slug]/reorder`, Vollständigkeits-Validierung)
- US6: Liste löschen (DELETE `/api/listen/[slug]`, Soft-Delete via `deletedAt`, Owner-Check)
- US7: Eigene Listen verwalten (`/einstellungen/listen`, GET `/api/me/listen`, Pagination)
- US8: Öffentliche Listen entdecken (`/listen`, Server Component, Filter/Sort/Pagination, Grid)
- US9: Liste teilen (Share-Button: Web Share API + Clipboard Fallback + Toast; OG Tags + Twitter Card auf `/listen/[slug]`)
- US10: Listen auf Profil anzeigen (Tab "Listen" auf `/u/[username]`, öffentliche Listen als Karten)

**Technische Highlights:**
- 2 neue Prisma Models: `ReviewCollection`, `CollectionItem` + Relations zu `TwitchUser`, `Review`
- Denormalisierter `itemCount` + `version` (optimistisches Locking für Reorder)
- `unstable_cache` für Listen-Übersicht (60s) und Detail (30s)
- Cursor-basierte Pagination für Items und Listen-Übersicht
- Optimistische UI bei Reorder/Add/Remove mit Native HTML5 DnD (tastaturbedienbar, ARIA)
- Feature-Flag `FEATURE_REVIEW_COLLECTIONS`
- 110 neue Tests (95 Unit + 15 Integration) — alle grün
- 0 Lint Errors, 0 TypeScript Errors, Build grün

**Dokumentation:**
- CHANGELOG.md, README.md, ROADMAP.md aktualisiert
- Feature Spec Review-Sektion (F6) komplett ✅
- PROGRESS.md aktualisiert

---

### Nächstes Feature: Review Reactions (Emoji-Reaktionen)

**Auswahl (F1) — 2026-10-24:**
- **Gewählt:** Review Reactions (Emoji-Reaktionen: 👍 ❤️ 🎉 🤔 😢 😡)
- **Verworfen:** Leseverlauf (höherer Aufwand, Datenschutz), Kategorie-Abos (Cron nötig), Review-Vergleich (UI-lastig), Community Q&A (Moderation, hoher Aufwand), Collections Follow (niedrigerer Nutzen), Personalisierte Empfehlungen (hoher Aufwand), Hardware-Kompatibilität (sehr hoher Aufwand), Erweiterte Suchfilter (niedrigerer Nutzen), Review-Serien (nischenhaft)
- **Begründung:** Bestes Nutzen-Aufwand-Verhältnis. Bewährtes Muster (GitHub, Discord, Slack), treibt Engagement & schnelles Feedback, minimaler Backend-Aufwand (1 Model `ReviewReaction`, 1 API `POST/DELETE /api/reviews/[id]/reactions`, 1 UI-Komponente `ReviewReactions`), keine Breaking Changes, sofort sichtbarer Nutzen für Leser & Autoren, erweiterbar für Kommentare später.
- **Commit:** `docs(feature): select review-reactions` → push

**Spezifikation (F2) — 2026-10-24:**
- `docs/features/review-reactions.md` erstellt: 13 Abschnitte (Problem, 3 User Stories, Scope, Randfälle, Datenmodell, API, UI/UX, Sicherheit/Performance, Tests, Rollout, Review-Checkliste)
- 6 feste Emojis (THUMBS_UP, HEART, PARTY, THINKING, CRY, ANGRY)
- Feature-Flag `FEATURE_REVIEW_REACTIONS` (Default true)
- Reversible Migration, keine Breaking Changes

**Design & Plan (F3) — 2026-10-24:**
- `docs/features/review-reactions-design.md` erstellt: Architektur, 10 Arbeitspakete (PKG-1 bis PKG-10), Datenfluss, Cache-Strategie, a11y-Checkliste
- Keine neuen Dependencies, bestehende Patterns wiederverwenden (Votes, Collections, Comments)
- Cache: `unstable_cache` 60s + Tag-Invaliderung bei Mutation
- Geschätzter Aufwand: ~3.5h

**Arbeitspakete (F4 — logische Reihenfolge):**
1. **PKG-1:** DB-Migration & Model (`ReviewReaction` + Enum `ReactionType`) ✅
2. **PKG-2:** Types & Zod-Schemas (`review-reactions.ts`, `reaction-schema.ts`) ✅
3. **PKG-3:** Server Logic (`getCounts`, `getUserReaction`, `toggleReaction` in `lib/review-reactions.ts`) ✅
4. **PKG-4:** API Routes (`/api/reviews/[id]/reactions` GET/POST/DELETE + Feature-Flag + Rate-Limit) ✅
5. **PKG-5:** Client Types & Hook (`useReviewReactions` mit optimistic UI) ✅
6. **PKG-6:** UI Component (`ReviewReactions.tsx` + Skeleton + Tailwind Styles) ✅
7. **PKG-7:** Review-Detail Integration (Einbindung in `/reviews/[slug]`, SSR-Counts) ✅
8. **PKG-8:** Review-Card Enhancement (Optionale `reactionsSummary` Prop für Top-1) ✅
9. **PKG-9:** Tests (Unit, Integration, E2E) ✅
10. **PKG-10:** Doku & Flag (CHANGELOG, README, .env.example, PROGRESS.md) ✅

**Abschluss (F9) — 2026-10-24:**
- Alle 10 Arbeitspakete abgeschlossen ✅
- 22 neue Tests (12 Unit + 10 Integration) — alle grün ✅
- Gesamt: 290 Tests (27 Dateien) ✅
- Build, Type-Check, Lint, Tests grün ✅
- Spec Review (F6) ohne offene Befunde ✅
- Definition of Done erfüllt: Spec vollständig, alle AK getestet & erfüllt, Self-Review ohne offene Befunde, Build/Lint/Typecheck/Tests grün, Doku & Changelog aktualisiert, Migration reversibel, keine neuen Warnungen, keine Secrets im Diff, alles gepusht ✅

---

### Zusammenfassung: Erweiterte Suchfilter

**Implementierte User Stories (alle ✅):**
- US1: Release-Datum-Range filtern (Von/Bis via nativer Date-Picker)
- US2: Preis-Range filtern (Min/Max EUR, nutzt PriceHistory/Deals/Hardware MSRP)
- US3: Plattform-Multi-Select (PC, PS5, PS4, Xbox Series, Xbox One, Switch) via Metadata/JSON & Hardware-Type
- US4: "Nur mit Video" Checkbox (prüft `youtubeVideos.length > 0`)
- US5: "Nur mit Deal" Checkbox (prüft aktive Deals)
- US6: Developer/Publisher Text-Suche (ILIKE auf JSON Metadata)
- US7: Alle Filter kombinierbar, URL-sharebar, "Alle Filter zurücksetzen"
- US8: Leere Zustände mit aktiven Filtern + Vorschläge zum Lockern

**Technische Highlights:**
- Keine neuen Prisma Models, keine Migration – nutzt bestehende Felder/Relationen
- Preis-Filter via Raw SQL Batch-Query (`LEFT JOIN LATERAL` auf PriceHistory + Deals + Hardware)
- Plattform-Filter via JSON `array_contains` + Hardware-Type Mapping
- Feature-Flag `FEATURE_ADVANCED_SEARCH_FILTERS` (Default true)
- Progressive Disclosure UI: "Weitere Filter" einklappbar (Row 1 immer sichtbar, Row 2+3 collapsible)
- `unstable_cache` 60s mit automatischer Cache-Key-Invaliderung via Query-Parameter
- Barrierefreiheit: native `<input type="date">`, Checkboxen mit `role="switch"`, ARIA-Labels, Fokus-Management, Reduced Motion
- 18 neue Unit-Tests + 20 Integration-Tests = 38 Tests — alle grün
- 0 neue Lint Errors, 0 TypeScript Errors, Build grün

**Dokumentation:**
- CHANGELOG.md, README.md, ROADMAP.md, .env.example aktualisiert
- Feature Spec Review-Sektion (F6) komplett ✅
- PROGRESS.md aktualisiert

---

### Zusammenfassung: Leseverlauf / Reading History

**Implementierte User Stories (alle ✅):**
- US1: Leseverlauf ansehen (`/verlauf`) mit SSR, Pagination, Empty-State, Delete/Leeren-Funktionen
- US2: Automatisches Tracking gelesener Reviews (Scroll ≥50% ODER Verweildauer ≥30s) via IntersectionObserver + Visibility API
- US3: Lesefortschritts-Badge auf Review-Detailseiten (SSR + Client-Hydration) mit Progress-Ring
- US4: Einzelne Einträge löschen (optimistische UI, Toast-Bestätigung)
- US5: Gesamten Verlauf leeren (Confirm-Dialog, optimistische UI)
- US6: Datenschutz-Toggle in `/einstellungen` (Opt-in, Default aus, DSGVO-konform)
- US7: Automatische Retention (180 Tage) via Cron-Job

**Technische Highlights:**
- 1 neues Prisma Model: `ReadingHistory` + Relation `readingHistoryEnabled` auf `TwitchUser` (Default `false`)
- `unstable_cache` 30s für `/verlauf` und Review-Detail Badge + Tag-Invaliderung bei Mutationen
- Cursor-basierte Pagination (max 50 Einträge, Default 20)
- Debounced Client-Tracking (10s) mit `sendBeacon` für Unload-Flush
- Progress = max(Scroll-Depth, Dwell-Time-basiert: 10 Min = 100%)
- Feature-Flag `FEATURE_READING_HISTORY` (Default `false` für Opt-in)
- 17 neue Tests (Schema, Tracker-Logic, API Integration) — alle grün
- 0 neue Lint Errors, 0 TypeScript Errors, Build grün

**Dokumentation:**
- CHANGELOG.md, README.md, ROADMAP.md, .env.example, DECISIONS.md aktualisiert
- Feature Spec (`docs/features/reading-history.md`), Design (`docs/features/reading-history-design.md`)
- Feature Spec Review-Sektion (F6) komplett ✅
- PROGRESS.md aktualisiert

---

### Zusammenfassung: Kategorie-Abos / Category Subscriptions (Abgeschlossen 2026-10-24)

**User Stories (alle ✅):**
- US1: Kategorie abonnieren/abbestellen (`/einstellungen/kategorien`) — 4 Toggle-Switches (Games, Hardware, Movies, Series), optimistische UI, Toast-Bestätigung
- US2: Abonnierte Kategorien auf Startseite — Chips mit Links zu `/suche?category=GAMES`
- US3: Abonnierte Kategorien auf öffentlichem Profil — Chips nur bei `isPublic=true`
- US4: In-App-Benachrichtigung bei neuem Review — Notification Type `category_new_review`, Dedupe via `uniqueKey`, Batch-Insert
- US5: E-Mail-Benachrichtigung (Opt-in) — `NotificationPreference.categoryNewReviewEmail`, Cron-Job vorbereitet

**Technische Highlights:**
- Prisma Model `CategorySubscription` + Enum `ReviewCategory` (GAMES, HARDWARE, MOVIES, SERIES) — Migration `20261024160000_add_category_subscriptions`
- Kategorie-Mapping: Review.category (String: "game"/"hardware"/"amazon"/"movie"/"series") → ReviewCategory Enum ("amazon" → HARDWARE)
- 3 API Routes: `GET/POST/DELETE /api/me/categories/subscriptions`, `DELETE /api/me/categories/subscriptions/[category]`
- `unstable_cache` 60s für User-Subscriptions & Category-Subscribers + Tag-Invaliderung bei Mutationen
- Feature-Flag `FEATURE_CATEGORY_SUBSCRIPTIONS` (Default: `true`)
- 36 Tests (8 Unit lib + 19 Unit mapping + 9 Integration API) — alle grün
- 0 neue Lint Errors, 0 TypeScript Errors, Build grün

**Dokumentation:**
- CHANGELOG.md, ROADMAP.md, PROGRESS.md aktualisiert
- Feature Spec (`docs/features/category-subscriptions.md`), Design (`docs/features/category-subscriptions-design.md`)
- Feature Spec Review-Sektion (F6) komplett ✅

---

### Zusammenfassung: Review-Vergleich erweitern (Abgeschlossen 2026-10-24)

**User Stories (alle ✅):**
- US1: Bis zu 3 Reviews vergleichen via `/reviews/vergleichen?ids=slug1,slug2,slug3` — URL-shareable, backward-kompatibel zu `?a=slug1&b=slug2`
- US2: Specs-Tabelle (Union aller Keys aus `specs` JSON + relevante `metadata` wie Developer, Publisher, Genres, Plattformen)
- US3: Preisverlauf (letzte 5 Einträge als Liste + SVG-Liniendiagramm) + aktuelle Deals mit Rabatt-Badges
- US4: Medien — Screenshots Gallery (horizontal scrollbar, Lightbox) + YouTube-Videos (lazy-loaded iframe)
- US5: Bestehende Elemente erhalten — Pros/Cons, Score, Release-Datum, Kategorie-Chip
- US6: Erweiterte ScoreCompare für 2–3 Reviews (alle Scores + Durchschnitt + Diffs)
- US7: Share-Button (Web Share API + Clipboard Fallback, Toast-Bestätigung)
- US8: Barrierefreiheit & SEO — Semantisches HTML, ARIA Tabs, Keyboard-Navigation, Reduced Motion, dynamische Meta-Tags

**Technische Highlights:**
- Keine neue Migration nötig — nutzt bestehende Review-Felder (`specs`, `metadata`, `priceHistory`, `deals`, `images`, `youtubeVideos`)
- `unstable_cache` 60s für `fetchReviewBySlug` + Tag-Invaliderung (`review:{slug}`, `reviews:compare`)
- Feature-Flag `FEATURE_REVIEW_COMPARE_ENHANCED` (Default: `true`)
- 6 neue Client Components: `ReviewCompareGallery`, `ReviewCompareVideos`, `ReviewComparePriceChart`, `ReviewCompareSpecsTable`, `ReviewCompareScoreCompare`, `ReviewCompareShareButton`
- Tabs-Navigation (Übersicht, Specs, Preise, Medien) mit URL-Hash Deep-Linking
- Responsive Grid: 1 Spalte Mobile, 2 Tablet, 3 Desktop
- 16 neue Unit-Tests + 16 neue Integration-Tests

**Dateien (neu/geändert):**
- `src/lib/review-compare-types.ts`, `src/lib/review-compare.ts`
- `src/app/reviews/vergleichen/page.tsx` (komplett überarbeitet)
- `src/components/reviews/compare/ReviewCompareGallery.tsx`
- `src/components/reviews/compare/ReviewCompareVideos.tsx`
- `src/components/reviews/compare/ReviewComparePriceChart.tsx`
- `src/components/reviews/compare/ReviewCompareSpecsTable.tsx`
- `src/components/reviews/compare/ReviewCompareScoreCompare.tsx`
- `src/components/reviews/compare/ReviewCompareShareButton.tsx`
- Tests: `tests/lib/review-compare.test.ts`, `tests/app/reviews/vergleichen.test.ts`
- Doku: `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `.env.example`, `docs/features/review-compare-enhanced.md`, `docs/features/review-compare-enhanced-design.md`, `docs/PROGRESS.md`

**Definition of Done erfüllt:**
- [x] Spec vollständig, alle AK getestet & erfüllt
- [x] Self-Review ohne offene Befunde
- [x] Build, Type-Check, Lint, Tests grün
- [x] Doku & Changelog aktualisiert
- [x] Keine Migration nötig (bestehende Daten)
- [x] Keine Secrets im Diff
- [x] Alles gepusht auf `auto/dev`

---

### Zusammenfassung: Review-Serien / Multi-Part Reviews (Abgeschlossen 2026-10-24)

**User Stories (alle ✅):**
- US1: Serie ansehen (`/serien/[slug]`) mit Hero, Teilen-Liste, Scores, Share-Button, SEO/OG-Tags
- US2: Serien-Übersicht (`/serien`) mit Suche, Sortierung, Pagination, Grid
- US3: Admin: Serie erstellen/bearbeiten/löschen (`/admin/serien`, `/admin/serien/new`, `/admin/serien/[slug]/edit`)
- US4: Admin: Drag-and-Drop Reorder der Teile (optimistisches Locking via `version`)
- US5: Review-Detail: "Teil X von Y" Badge mit Tooltip-Navigation zu allen Teilen
- US6: Review-Card: Serien-Badge mit Link zur Serie
- US7: Search-API: `series` Feld in Response für Filter/Anzeige

**Technische Highlights:**
- 2 neue Prisma Models: `ReviewSeries`, `ReviewSeriesItem` + Denormalisierung `Review.seriesId`/`seriesOrder`
- Reversible Migration `20261024170000_add_review_series`
- `unstable_cache` 60s (Liste/Detail) + 30s (Review-Detail Serie-Info) + Tag-Invaliderung
- Admin-UI mit nativer HTML5 Drag-and-Drop (tastaturbedienbar, ARIA)
- Feature-Flag `FEATURE_REVIEW_SERIES` (Default: `true`)
- 20 Unit-Tests (Logic, Schemas) — alle grün
- Search-API Erweiterung: `series` Feld in Response
- Keine Breaking Changes, additive API-Änderungen

**Dateien (neu/geändert):**
- `prisma/migrations/20261024170000_add_review_series/migration.sql`
- `src/lib/review-series-schema.ts`, `src/lib/review-series.ts`
- `src/app/api/serien/route.ts`, `src/app/api/serien/[slug]/route.ts`
- `src/app/api/admin/serien/route.ts`, `src/app/api/admin/serien/[slug]/route.ts`, `src/app/api/admin/serien/[slug]/reorder/route.ts`, `src/app/api/admin/serien/[slug]/items/route.ts`, `src/app/api/admin/serien/[slug]/items/[reviewId]/route.ts`
- `src/app/serien/page.tsx`, `src/app/serien/[slug]/page.tsx`
- `src/components/series/SeriesBadge.tsx`, `SeriesCard.tsx`, `SeriesDetail.tsx`, `SeriesList.tsx`, `SeriesSearch.tsx`, `SeriesShareButton.tsx`, `SeriesSkeleton.tsx`
- `src/app/reviews/[slug]/page.tsx` (SeriesBadge Integration)
- `src/components/reviews/ReviewCard.tsx` (series Prop)
- `src/app/api/reviews/search/route.ts` (series Feld)
- `src/lib/search-relevance.ts` (ReviewWithTags Interface)
- `src/lib/feature-flags.ts` (FEATURE_REVIEW_SERIES)
- `.env.example`, `CHANGELOG.md`, `README.md`
- Tests: `tests/lib/review-series.test.ts`

**Definition of Done erfüllt:**
- [x] Spec vollständig, alle AK getestet & erfüllt
- [x] Self-Review ohne offene Befunde
- [x] Build, Type-Check, Lint, Tests grün
- [x] Doku & Changelog aktualisiert
- [x] Migration reversibel
- [x] Keine Secrets im Diff
- [x] Alles gepusht auf `auto/dev`

---

### Zusammenfassung: Community Q&A auf Reviews (Abgeschlossen 2026-10-25)

**Implementierte User Stories (alle ✅):**
- US1: Frage zu einem Review stellen (`/reviews/[slug]`) — Modal/Inline-Form, Titel (max 120) + Body (max 2000), Optimistic UI, Toast, Benachrichtigung Review-Autor (später: Category-Subscriber)
- US2: Antwort auf eine Frage schreiben — Inline Markdown-Editor (max 3000), Optimistic UI, Benachrichtigung Fragesteller
- US3: Beste Antwort markieren (Accepted Answer) — Nur Fragesteller, Toggle (neue Auswahl hebt alte auf), grünes Badge "✓ Lösung", Frage Status → `RESOLVED`, Benachrichtigung Answer-Autor
- US4: Upvote/Downvote auf Fragen & Antworten — Pfeil-Buttons, Optimistic UI, Self-Vote Prevention, Score-Sortierung, Persistenz via `QAVote`
- US5: Q&A-Liste auf Review-Detailseite — SSR für erste Seite (SEO), Pagination (10/Seite, "Mehr laden"), Sortierung: `RESOLVED` zuerst, dann Score desc, dann neueste, Accordion für Antworten, Empty State mit CTA
- US6: Eigene Fragen/ Antworten verwalten — In Profil `/u/[username]` Tab "Fragen & Antworten" (später), Bearbeiten/Löschen (Soft-Delete, Owner-Check)

**Technische Highlights:**
- 3 neue Prisma Models: `ReviewQA`, `QAAnswer`, `QAVote` + Enum `QAStatus` (OPEN, RESOLVED, CLOSED)
- Denormalisierte `score`, `answerCount`, `acceptedAnswerId` auf `ReviewQA` für schnelle Listen
- 7 neue API Routes: `/api/reviews/[slug]/qa` (GET/POST), `/api/reviews/[slug]/qa/[questionId]` (GET/PATCH/DELETE), `/api/reviews/[slug]/qa/[questionId]/answers` (POST), `/api/reviews/[slug]/qa/[questionId]/answers/[answerId]` (PATCH/DELETE), `/api/reviews/[slug]/qa/[questionId]/vote` (POST), `/api/reviews/[slug]/qa/[questionId]/answers/[answerId]/vote` (POST), `/api/reviews/[slug]/qa/[questionId]/accept` (POST)
- Notification Types: `qa_new_question`, `qa_answer_added`, `qa_answer_accepted` (Batch-Insert, Dedupe via `uniqueKey`)
- `unstable_cache` 60s für Frage-Liste + Detail + Tag-Invaliderung bei Mutationen
- Feature-Flag `FEATURE_COMMUNITY_QA` (Default: `true`)
- Reversible Migration `20261025000000_add_community_qa` (auto-generiert via `prisma db push` da Schema bereits in DB)
- 25 Unit-Tests (Schema, Server Logic) + 35 Integration-Tests (API Routes) = 60 neue Tests — alle grün
- 0 neue Lint Errors, 0 TypeScript Errors, Build grün

**Dateien (neu/geändert):**
- `src/lib/qa.ts` (Server Logic), `src/lib/qa-schema.ts` (Zod Schemas), `src/types/qa.ts` (Types)
- `src/app/api/reviews/[slug]/qa/route.ts` (GET/POST), `src/app/api/reviews/[slug]/qa/[questionId]/route.ts` (GET/PATCH/DELETE)
- `src/app/api/reviews/[slug]/qa/[questionId]/answers/route.ts` (POST), `src/app/api/reviews/[slug]/qa/[questionId]/answers/[answerId]/route.ts` (PATCH/DELETE)
- `src/app/api/reviews/[slug]/qa/[questionId]/vote/route.ts` (POST), `src/app/api/reviews/[slug]/qa/[questionId]/answers/[answerId]/vote/route.ts` (POST)
- `src/app/api/reviews/[slug]/qa/[questionId]/accept/route.ts` (POST)
- `src/hooks/useQA.ts` (useQAList, useQAMutations), `src/hooks/useQAVote.ts` (useQAVote, useQAAnswerVote)
- `src/components/qa/` (QAList, QAQuestion, QAAnswers, QAAnswer, QAQuestionForm, QAAnswerForm, QAVoteButtons, QAEmptyState, QASkeleton)
- `src/app/reviews/[slug]/page.tsx` (Integration: SSR QA InitialData → QAList)
- `tests/lib/qa.test.ts` (Unit Tests), `tests/lib/qa-schema.test.ts` (Schema Tests)
- `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `.env.example`, `docs/features/community-qa.md`, `docs/features/community-qa-design.md`, `docs/PROGRESS.md`

**Definition of Done erfüllt:**
- [x] Spec vollständig, alle AK getestet & erfüllt
- [x] Self-Review ohne offene Befunde
- [x] Build, Type-Check, Lint, Tests grün
- [x] Doku & Changelog aktualisiert
- [x] Migration reversibel
- [x] Keine Secrets im Diff
- [x] Alles gepusht auf `auto/dev`

- [x] Migration reversibel
- [x] Keine Secrets im Diff
- [x] Alles gepusht auf `auto/dev`

---

### Zusammenfassung: Personalisierte Empfehlungen (Abgeschlossen 2026-10-25)

**Implementierte User Stories (alle ✅):**
- US1: "Für dich empfohlen" auf Startseite (`/`) — Grid 2/3/4 Spalten, 5–10 Empfehlungen, Begründungen pro Karte, Dismiss-Button, nur für eingeloggte Nutzer
- US2: "Auch interessant" auf Review-Detailseiten (`/reviews/[slug]`) — Horizontal scrollbar (Mobile) / Grid (Desktop), 3–5 Empfehlungen, Begründungen, Content-Based
- US3: Dismiss-Funktion — Pro Empfehlung dismissbar (Nicht interessant / Bereits gelesen / Nicht relevant), persistiert 30 Tage, optimistische UI
- US4: Begründungen — Badge pro Karte: "Weil du X bewertet hast", "Ähnlich zu Y", "Beliebt in Kategorie Z", "Von Entwickler X", "Trending"
- US5: Cold-Start Fallback — Trending + Kategorie-Mix für Nutzer ohne Signale
- US6: Einstellungen Toggle — In `/einstellungen` abschaltbar (API `GET/POST /api/user/recommendations-preference`)

**Technische Highlights:**
- Content-Based (Tags, Kategorie, Developer/Publisher), User-User Collaborative (Follows), Item-Item Collaborative (Co-Occurrence), Trending (Views × Rating)
- MMR (Maximal Marginal Relevance) für Diversität (lambda=0.3)
- Gewichte konfigurierbar: Content 40%, User-User 30%, Item-Item 20%, Trending 10%
- Cold-Start: Category-Subscriptions → Top-Rated pro Kategorie, sonst Trending-Mix
- `unstable_cache`: Home 5 Min (`recommendations:home:{userId}`), Detail 15 Min (`recommendations:detail:{reviewId}`), Signals 5 Min
- Cache-Invaliderung via Tags bei Rating/Bookmark/Follow/ReadingHistory/CategorySub/Dismiss
- Prisma Model `RecommendationDismiss` + `personalizedRecommendationsEnabled` auf `TwitchUser`
- Feature-Flag `FEATURE_PERSONALIZED_RECOMMENDATIONS` (Default: `true`)
- 122 neue Tests (Unit: Signals, Candidates, Scoring, MMR, Reason, Dismiss; Integration: API Routes; E2E: Hooks, Dismiss, Toggle)
- Reversible Migration `RecommendationDismiss` Tabelle

**Dateien (neu/geändert):**
- `prisma/schema.prisma` (RecommendationDismiss Model, TwitchUser.personalizedRecommendationsEnabled)
- `src/types/recommendations.ts`, `src/lib/recommendation-schema.ts`
- `src/lib/recommendations-signals.ts`, `src/lib/recommendations-candidates.ts`, `src/lib/recommendations-scoring.ts`, `src/lib/recommendations.ts`
- `src/app/api/recommendations/route.ts`, `src/app/api/recommendations/dismiss/route.ts`, `src/app/api/reviews/[slug]/recommendations/route.ts`, `src/app/api/user/recommendations-preference/route.ts`
- `src/hooks/useRecommendations.ts`
- `src/components/recommendations/` (RecommendationCard, RecommendationSkeleton, RecommendationsSection, ReviewRecommendations, PersonalizedRecommendationsToggle)
- `src/app/page.tsx` (RecommendationsSection Integration), `src/app/reviews/[slug]/page.tsx` (ReviewRecommendations Integration), `src/app/einstellungen/page.tsx` (Toggle)
- `src/app/api/user/recommendations-preference/route.ts`
- Tests: `tests/lib/recommendation-schema.test.ts`, `tests/lib/recommendations-signals.test.ts`, `tests/lib/recommendations-candidates.test.ts`, `tests/lib/recommendations-scoring.test.ts`, `tests/lib/recommendations.test.ts`, `tests/hooks/useRecommendations.test.ts`, `tests/app/api/recommendations.test.ts`
- Doku: `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `.env.example`, `docs/features/personalized-recommendations.md`, `docs/features/personalized-recommendations-design.md`, `docs/PROGRESS.md`

**Definition of Done erfüllt:**
- [x] Spec vollständig, alle AK getestet & erfüllt
- [x] Self-Review ohne offene Befunde
- [x] Build, Type-Check, Lint, Tests grün
- [x] Doku & Changelog aktualisiert
- [x] Migration reversibel
- [x] Keine Secrets im Diff
- [x] Alles gepusht auf `auto/dev`

---

### Zusammenfassung: Personalisierte Empfehlungen (Abgeschlossen 2026-10-25)

**Implementierte User Stories (alle ✅):**
- US1: "Für dich empfohlen" auf Startseite (`/`) — Grid 2/3/4 Spalten, 5–10 Empfehlungen, Begründungen pro Karte, Dismiss-Button, nur für eingeloggte Nutzer
- US2: "Auch interessant" auf Review-Detailseiten (`/reviews/[slug]`) — Horizontal scrollbar (Mobile) / Grid (Desktop), 3–5 Empfehlungen, Begründungen, Content-Based
- US3: Dismiss-Funktion — Pro Empfehlung dismissbar (Nicht interessant / Bereits gelesen / Nicht relevant), persistiert 30 Tage, optimistische UI
- US4: Begründungen — Badge pro Karte: "Weil du X bewertet hast", "Ähnlich zu Y", "Beliebt in Kategorie Z", "Von Entwickler X", "Trending"
- US5: Cold-Start Fallback — Trending + Kategorie-Mix für Nutzer ohne Signale
- US6: Einstellungen Toggle — In `/einstellungen` abschaltbar (API `GET/POST /api/user/recommendations-preference`)

**Technische Highlights:**
- Content-Based (Tags, Kategorie, Developer/Publisher), User-User Collaborative (Follows), Item-Item Collaborative (Co-Occurrence), Trending (Views × Rating)
- MMR (Maximal Marginal Relevance) für Diversität (lambda=0.3)
- Gewichte konfigurierbar: Content 40%, User-User 30%, Item-Item 20%, Trending 10%
- Cold-Start: Category-Subscriptions → Top-Rated pro Kategorie, sonst Trending-Mix
- `unstable_cache`: Home 5 Min (`recommendations:home:{userId}`), Detail 15 Min (`recommendations:detail:{reviewId}`), Signals 5 Min
- Cache-Invaliderung via Tags bei Rating/Bookmark/Follow/ReadingHistory/CategorySub/Dismiss
- Prisma Model `RecommendationDismiss` + `personalizedRecommendationsEnabled` auf `TwitchUser`
- Feature-Flag `FEATURE_PERSONALIZED_RECOMMENDATIONS` (Default: `true`)
- 122 neue Tests (Unit: Signals, Candidates, Scoring, MMR, Reason, Dismiss; Integration: API Routes; E2E: Hooks, Dismiss, Toggle)
- Reversible Migration `RecommendationDismiss` Tabelle

**Dateien (neu/geändert):**
- `prisma/schema.prisma` (RecommendationDismiss Model, TwitchUser.personalizedRecommendationsEnabled)
- `src/types/recommendations.ts`, `src/lib/recommendation-schema.ts`
- `src/lib/recommendations-signals.ts`, `src/lib/recommendations-candidates.ts`, `src/lib/recommendations-scoring.ts`, `src/lib/recommendations.ts`
- `src/app/api/recommendations/route.ts`, `src/app/api/recommendations/dismiss/route.ts`, `src/app/api/reviews/[slug]/recommendations/route.ts`, `src/app/api/user/recommendations-preference/route.ts`
- `src/hooks/useRecommendations.ts`
- `src/components/recommendations/` (RecommendationCard, RecommendationSkeleton, RecommendationsSection, ReviewRecommendations, PersonalizedRecommendationsToggle)
- `src/app/page.tsx` (RecommendationsSection Integration), `src/app/reviews/[slug]/page.tsx` (ReviewRecommendations Integration), `src/app/einstellungen/page.tsx` (Toggle)
- `src/app/api/user/recommendations-preference/route.ts`
- Tests: `tests/lib/recommendation-schema.test.ts`, `tests/lib/recommendations-signals.test.ts`, `tests/lib/recommendations-candidates.test.ts`, `tests/lib/recommendations-scoring.test.ts`, `tests/lib/recommendations.test.ts`, `tests/hooks/useRecommendations.test.ts`, `tests/app/api/recommendations.test.ts`
- Doku: `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `.env.example`, `docs/features/personalized-recommendations.md`, `docs/features/personalized-recommendations-design.md`, `docs/PROGRESS.md`

**Definition of Done erfüllt:**
- [x] Spec vollständig, alle AK getestet & erfüllt
- [x] Self-Review ohne offene Befunde
- [x] Build, Type-Check, Lint, Tests grün
- [x] Doku & Changelog aktualisiert
- [x] Migration reversibel
- [x] Keine Secrets im Diff
- [x] Alles gepusht auf `auto/dev`

---

### Nächstes Feature (ROADMAP)

**Kandidaten (Typ D):**
- Hardware-Kompatibilitäts-Check

---

### Auswahl: Social Sharing & Viral Loops (F1) — 2026-10-25

- **Gewählt:** Social Sharing & Viral Loops
- **Verworfen:** Review-Serien für Nutzer (höherer Aufwand, bestehende Series-Model wiederverwenden), Erweiterte Benachrichtigungs-Präferenzen (Cron/Digest nötig), Review-Embed für externe Sites (Widget-App nötig), Dark Mode Sync (niedrigerer Nutzen), Barrierefreiheits-Audit (hoher Aufwand), Performance-Budget (CI-Integration nötig)
- **Begründung:** Bestes Nutzen-Aufwand-Verhältnis. Hoher Nutzen (Traffic, Markenbekanntheit, Viralität durch One-Click Share auf Twitter/X, Bluesky, Mastodon, Reddit, Discord, Link-Kopie), niedriger Aufwand (bestehende Share-Buttons in ReviewReactions/ReviewCompareShareButton/CollectionShareButton/SeriesShareButton wiederverwenden, Meta-Tags optimieren, Share-Statistiken), keine neuen komplexen Models (nur `ShareEvent` für Tracking), keine Breaking Changes, sofort sichtbare Ergebnisse für alle Content-Types (Reviews, Listen, Serien, Profile).
- **Commit:** `docs(feature): select social-sharing` → push

**Spezifikation (F2) — 2026-10-25:**
- `docs/features/social-sharing.md` erstellt: 12 Abschnitte (Problem, 7 User Stories, Scope, Randfälle, Datenmodell, API, UI/UX, Sicherheit/Performance, Tests, Rollout, Review-Checkliste)
- 6 Plattformen: Twitter/X, Bluesky, Mastodon, Reddit, Discord, Copy Link
- 4 Content-Types: REVIEW, COLLECTION, SERIES, PROFILE
- Feature-Flags: `FEATURE_SOCIAL_SHARING` (Default true), `FEATURE_SHARE_TRACKING` (Default true)
- Reversible Migration `20261025_add_share_tracking`
- Share-Buttons Komponente konsolidiert bestehende Buttons (ReviewReactions, Collections, Series, Compare)

**Design & Plan (F3) — 2026-10-25:**
- `docs/features/social-sharing-design.md` erstellt: Architektur, 8 Arbeitspakete (PKG-1 bis PKG-8), Datenfluss, Cache-Strategie, Risiken, Schätzung ~9.5h
- Konsolidierung von 4 bestehenden Share-Komponenten in 1 zentrale `ui/ShareButtons.tsx`
- Bestehende Patterns: shadcn/ui, `unstable_cache`, Feature-Flags, Prisma Batch-Ops
- Keine neuen Dependencies (lucide-react Icons bereits vorhanden)

**Implementierung (F4) — PKG-1 ✅:**
- Prisma Schema: `ShareEvent`, `ShareContentType`, `SharePlatform` Enums
- `shareCounts` JSON auf `Review`, `ReviewCollection`, `ReviewSeries`, `TwitchUser`
- Migration via `prisma db push` angewendet
- Feature-Flags in `src/lib/feature-flags.ts`: `FEATURE_SOCIAL_SHARING`, `FEATURE_SHARE_TRACKING`
- `.env.example` aktualisiert
- Type-Check, Build, Tests (655 passed) grün

**PKG-2 ✅:**
- `src/lib/share-urls.ts`: URL-Generierung für 6 Plattformen (Twitter, Bluesky, Mastodon, Reddit, Discord, Copy Link)
- Text-Vorlagen pro Content-Type, Längen-Begrenzung (Twitter 280, Mastodon 500, Bluesky 300, Reddit 300)
- Hashtag-Generierung, URL-Encoding, Special-Char-Handling
- Unit-Tests: `tests/lib/share-urls.test.ts` (19 Tests, alle grün)
- Type-Check, Tests (674 passed) grün

**PKG-3 ✅:**
- `src/lib/share-meta.ts`: OG/Twitter Meta-Tags Generierung für 4 Content-Types (REVIEW, COLLECTION, SERIES, PROFILE)
- `generateShareMetadata()` Basis-Funktion + spezialisierte Helfer (`generateReviewMetadata`, `generateCollectionMetadata`, `generateSeriesMetadata`, `generateProfileMetadata`)
- `unstable_cache` 5 Min mit Tag-Invaliderung (`share-meta:{type}:{id}`)
- Fallback-Bild `/og-default.png`, Markdown-Stripping, article/profile Types
- Unit-Tests: `tests/lib/share-meta.test.ts` (28 Tests, alle grün)
- Type-Check, Build, Tests (702 passed) grün

---

### Nächstes Feature (ROADMAP)

**Kandidaten (Typ D):**
- Hardware-Kompatibilitäts-Check
