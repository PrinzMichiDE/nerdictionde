# Design & Plan: Review Collections Follow

**Datum:** 2026-10-24
**Feature:** Review Collections Follow
**Spec:** `docs/features/review-collections-follow.md`
**Branch:** `auto/dev`

---

## 1. Architektur-Übersicht

Das Feature fügt ein **Follow-System für Collections** hinzu, analog zum bestehenden User-Follow-System (`Follow` Model, `follow.ts`, Notifications, Feed). Es nutzt bestehende Infrastruktur wo möglich:

- **Neues Model:** `CollectionFollow` (User ↔ ReviewCollection Many-to-Many)
- **Denormalisierter Counter:** `followersCount` auf `ReviewCollection`
- **Notifications:** Neuer `NotificationType.COLLECTION_UPDATE` (wie `follow`)
- **Feed:** Erweiterung von `getFeed()` um Collection-Items
- **APIs:** REST-Endpoints unter `/api/listen/[slug]/follow` + `/api/me/followed-collections`
- **UI:** Follow-Button auf Collection-Detail, "Gefolgte Listen" in Einstellungen, Sort "Beliebt" auf `/listen`

---

## 2. Datenfluss

```
┌─────────────┐     POST /api/listen/[slug]/follow      ┌──────────────────┐
│   Client    │ ──────────────────────────────────────▶ │   API Route      │
└─────────────┘                                         │ (auth, validate) │
                                                        └────────┬─────────┘
                                                                 │
                      ┌──────────────────────────────────────────┘
                      ▼
            ┌─────────────────┐     Transaction      ┌──────────────────┐
            │  lib/           │ ───────────────────▶ │  Prisma          │
            │  collection-    │  1. Upsert           │  CollectionFollow│
            │  follow.ts      │  2. Increment        │  ReviewCollection│
            │                 │     followersCount   │  (followersCount)│
            └─────────────────┘  3. Create           └────────┬─────────┘
                                  Notification                │
                                                              ▼
                                              ┌────────────────────────┐
                                              │  Cache Invalidation  │
                                              │  revalidateTag       │
                                              │  user:X:followed-    │
                                              │  collections         │
                                              │  collection:Y:       │
                                              │  followers           │
                                              └────────────────────────┘
```

---

## 3. Betroffene Module & Dateien

### Neu zu erstellen:
| Datei | Zweck |
|-------|-------|
| `prisma/schema.prisma` | + `CollectionFollow` Model, `followersCount` auf `ReviewCollection`, `COLLECTION_UPDATE` in `NotificationType` |
| `src/lib/collection-follow.ts` | Server Logic: `followCollection`, `unfollowCollection`, `isFollowingCollection`, `getFollowedCollections`, `getFollowStatus` |
| `src/lib/schemas/collection-follow-schema.ts` | Zod-Schemas für API-Validierung |
| `src/app/api/listen/[slug]/follow/route.ts` | POST/DELETE Follow, GET Follow-Status |
| `src/app/api/me/followed-collections/route.ts` | GET paginierte gefolgte Collections |
| `src/hooks/useCollectionFollow.ts` | Client Hook mit Optimistic UI |
| `src/components/collections/CollectionFollowButton.tsx` | Follow-Button Component (a11y, States) |
| `src/app/einstellungen/gefolgte-listen/page.tsx` | Seite "Gefolgte Listen" |
| `tests/lib/collection-follow.test.ts` | Unit-Tests für Server-Logic |
| `tests/api/listen/follow.test.ts` | Integration-Tests für API |
| `tests/api/me/followed-collections.test.ts` | Integration-Tests für API |

### Zu modifizieren:
| Datei | Änderung |
|-------|----------|
| `src/lib/feed.ts` | Feed um Collection-Items erweitern (neuer `FeedItem` Type `collection_item`) |
| `src/lib/collections.ts` | `getPublicCollections`: Sort `popular` (by `followersCount`) hinzufügen |
| `src/app/api/listen/route.ts` | Query-Schema: `sort=popular` erlauben |
| `src/components/collections/CollectionCard.tsx` | Follower-Count anzeigen (optional) |
| `src/app/listen/[slug]/page.tsx` | Follow-Button in Header einbauen (SSR: `getFollowStatus`) |
| `src/app/listen/page.tsx` | Sort-Option "Beliebt" hinzufügen |
| `src/lib/notifications.ts` | `createCollectionUpdateNotification` Helper |
| `.env.example` | `FEATURE_COLLECTIONS_FOLLOW=true` hinzufügen |
| `CHANGELOG.md`, `README.md`, `ROADMAP.md` | Dokumentation aktualisieren |

---

## 4. Arbeitspakete (PKG-1 bis PKG-11)

### PKG-1: DB-Migration & Prisma Model
- **Ziel:** `CollectionFollow` Model + `followersCount` auf `ReviewCollection` + `COLLECTION_UPDATE` Enum
- **Dateien:** `prisma/schema.prisma`
- **Migration:** `npx prisma migrate dev --name add_collection_follow`
- **Verifikation:** `npx prisma db pull`, `npx prisma generate`, Type-Check grün

### PKG-2: Types & Zod-Schemas
- **Ziel:** TypeScript Types + Zod Validierung für API
- **Dateien:** `src/lib/schemas/collection-follow-schema.ts`
- **Inhalt:** `followCollectionParamsSchema`, `followedCollectionsQuerySchema`, Response-Types

### PKG-3: Server Logic (`lib/collection-follow.ts`)
- **Ziel:** Kernfunktionen analog `follow.ts`
- **Funktionen:**
  - `followCollection(userId, collectionId)` → Transaction: upsert Follow, increment `followersCount`, create Notification (für Owner)
  - `unfollowCollection(userId, collectionId)` → Transaction: delete Follow, decrement `followersCount`
  - `isFollowingCollection(userId, collectionId)` → boolean
  - `getFollowStatus(userId, collectionId)` → `{ isFollowing: boolean, followersCount: number }`
  - `getFollowedCollections(userId, cursor?, limit?)` → paginierte Collections mit Owner-Info
- **Cache:** `unstable_cache` 60s für `getFollowedCollections`, Tags: `user:${userId}:followed-collections`, `collection:${collectionId}:followers`

### PKG-4: API Routes - Follow/Unfollow/Status
- **Ziel:** `POST/DELETE /api/listen/[slug]/follow`, `GET /api/listen/[slug]/follow-status`
- **Datei:** `src/app/api/listen/[slug]/follow/route.ts`
- **Auth:** `requireTwitchAuth` für POST/DELETE, optional für GET (SSR)
- **Validierung:** Collection existiert, ist öffentlich (`isPublic=true`, `deletedAt=null`)
- **Rate-Limit:** 30/min (bestehende Middleware)
- **Response:** `{ followed: boolean, followersCount: number }`

### PKG-5: API Route - Gefolgte Collections
- **Ziel:** `GET /api/me/followed-collections?cursor=&limit=20`
- **Datei:** `src/app/api/me/followed-collections/route.ts`
- **Auth:** `requireTwitchAuth` (nur eigene)
- **Response:** `{ collections: CollectionWithFollowInfo[], nextCursor: string | null }`

### PKG-6: Client Hook (`useCollectionFollow`)
- **Ziel:** Optimistische UI, State-Management
- **Datei:** `src/hooks/useCollectionFollow.ts`
- **API:** `follow()`, `unfollow()`, `toggle()`, `isFollowing`, `followersCount`, `isLoading`, `error`
- **Optimistic:** Sofortiges UI-Update, Rollback bei Fehler + Toast

### PKG-7: UI Component - Follow Button
- **Ziel:** `CollectionFollowButton` mit allen States
- **Datei:** `src/components/collections/CollectionFollowButton.tsx`
- **States:** Nicht eingeloggt (Login-Link), Nicht gefolgt (Outline), Gefolgt (Filled), Lädt (Spinner), Fehler (Toast)
- **A11y:** `aria-pressed`, `aria-label`, `aria-live` für Count, `focus-visible`
- **Props:** `collectionId`, `slug`, `initialFollowing`, `initialCount`, `onChange?`

### PKG-8: Collection-Detail Integration
- **Ziel:** Follow-Button in `/listen/[slug]` Header einbauen
- **Dateien:** `src/app/listen/[slug]/page.tsx`, `src/components/collections/CollectionHeader.tsx` (falls existent)
- **SSR:** `getFollowStatus` für Initial-Render (Count + User-Status)
- **Feature-Flag:** `FEATURE_COLLECTIONS_FOLLOW` guard

### PKG-9: Einstellungen - Gefolgte Listen
- **Ziel:** `/einstellungen/gefolgte-listen` Seite
- **Datei:** `src/app/einstellungen/gefolgte-listen/page.tsx`
- **Server Component** für Initial-Load (SSR), Client Component für Interaktion (Unfollow, Pagination)
- **Grid** wie `/listen` mit Unfollow-Button pro Karte
- **Leerer Zustand:** CTA zu `/listen`

### PKG-10: Feed-Integration & Entdecken-Sortierung
- **Ziel:** Feed zeigt Collection-Updates, `/listen` Sort "Beliebt"
- **Dateien:**
  - `src/lib/feed.ts`: `FeedItem` Type um `collection_item` erweitern, Query um `CollectionFollow` Join erweitern
  - `src/lib/collections.ts`: `getPublicCollections` Sort `popular` (by `followersCount` DESC)
  - `src/app/api/listen/route.ts`: `sort=popular` in Schema erlauben
  - `src/app/listen/page.tsx`: UI für Sort "Beliebt"

### PKG-11: Tests, Doku, Flag, Cleanup
- **Unit-Tests:** `tests/lib/collection-follow.test.ts` (alle Funktionen, Edge-Cases)
- **Integration-Tests:** `tests/api/listen/follow.test.ts`, `tests/api/me/followed-collections.test.ts`
- **E2E-Test:** Follow-Flow (Login → Collection → Folgen → Feed → Einstellungen → Entfolgen)
- **Doku:** CHANGELOG.md, README.md, ROADMAP.md, `.env.example`
- **Feature-Flag:** `FEATURE_COLLECTIONS_FOLLOW` in Code prüfen (API + UI)
- **Lint/Typecheck/Build/Tests** grün

---

## 5. Cache-Strategie

| Query | Cache | TTL | Tags | Invalidation |
|-------|-------|-----|------|--------------|
| `getFollowedCollections` | `unstable_cache` | 60s | `user:${userId}:followed-collections` | Follow/Unfollow |
| `getFollowStatus` | `unstable_cache` | 60s | `collection:${collectionId}:followers` | Follow/Unfollow |
| `getPublicCollections(sort=popular)` | `unstable_cache` | 60s | `collections:public` | Follow/Unfollow (Counter-Änderung) |
| `getFeed` | `unstable_cache` | 30s | `feed:${userId}` | Neue Activity (Rating, Bookmark, Collection-Item) |

---

## 6. Abhängigkeiten & Wiederverwendung

| Bestehend | Wiederverwendung |
|-----------|------------------|
| `Follow` Model / `follow.ts` | Pattern 1:1 für `CollectionFollow` / `collection-follow.ts` |
| `Notification` / `notifications.ts` | `createFollowNotification` → `createCollectionUpdateNotification` |
| `getFeed` / `feed.ts` | Extension um `collection_item` Type |
| `getPublicCollections` / `collections.ts` | Sort `popular` hinzufügen |
| `CollectionCard` Component | Follower-Count Badge |
| `useFollow` Hook (falls existent) | Pattern für `useCollectionFollow` |
| Auth Middleware (`requireTwitchAuth`) | Unverändert nutzen |
| Rate-Limiter | Unverändert nutzen |

---

## 7. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| N+1 bei Feed (Collection-Items → Reviews) | Mittel | Hoch | `include` mit `take` limit, Batch-Loading |
| Race Condition Follow/Unfollow | Niedrig | Mittel | Transaktion + Unique Constraint (`userId`, `collectionId`) |
| Cache-Stale (Counter nicht aktualisiert) | Mittel | Niedrig | Tag-basierte Invalidation bei Mutation, kurzer TTL (60s) |
| Notification-Spam bei häufigen Updates | Niedrig | Mittel | Debounce: max 1 Notification pro Collection pro Stunde pro Follower (später) |
| Feed-Duplikate (User-Follow + Collection-Follow) | Mittel | Niedrig | Deduplizierung in `getFeed` (Review-ID Set) |

---

## 8. Geschätzter Aufwand

| Paket | Stunden |
|-------|---------|
| PKG-1: DB & Model | 0.5 |
| PKG-2: Types/Schemas | 0.25 |
| PKG-3: Server Logic | 1.0 |
| PKG-4: API Follow/Status | 0.75 |
| PKG-5: API Followed Collections | 0.5 |
| PKG-6: Client Hook | 0.5 |
| PKG-7: UI Button | 0.75 |
| PKG-8: Detail Integration | 0.5 |
| PKG-9: Einstellungen Seite | 0.75 |
| PKG-10: Feed + Sort | 0.75 |
| PKG-11: Tests/Doku | 1.5 |
| **Total** | **~8.5h** |

---

## 9. Nächster Schritt

**F4 Implementierung** — Start mit PKG-1 (DB-Migration & Model).

*Design erstellt im Rahmen der autonomen Entwicklung (F3).*