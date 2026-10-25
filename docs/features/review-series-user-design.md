# Design & Plan: Review-Serien für Nutzer (User-Created Series)

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER                       │
├─────────────────────────────────────────────────────────────────┤
│  Public Pages                          User Pages               │
│  ├── /serien (Server Comp)             ├── /serien/neu          │
│  ├── /serien/[slug] (Server Comp)      ├── /serien/[slug]/edit  │
│  └── /u/[username] (Tab: Serien)       │   (Client Comp, DnD)    │
├─────────────────────────────────────────────────────────────────┤
│  API Routes                                                         │
│  ├── GET  /api/serien                     (Public, cached)       │
│  ├── GET  /api/serien/[slug]              (Public, cached)       │
│  ├── GET  /api/user/serien                (Auth, User, cached)   │
│  ├── POST /api/user/serien                (Auth, User, Zod)      │
│  ├── GET  /api/user/serien/[slug]         (Auth, Owner/Collab)   │
│  ├── PATCH /api/user/serien/[slug]        (Auth, Owner/Collab)   │
│  ├── DELETE /api/user/serien/[slug]       (Auth, Owner)          │
│  ├── POST /api/user/serien/[slug]/reorder (Auth, Owner/Collab)   │
│  ├── POST /api/user/serien/[slug]/items   (Auth, Owner/Collab)   │
│  ├── DELETE /api/user/serien/[slug]/items/[reviewId] (Auth)      │
│  ├── GET/POST/DELETE /api/user/serien/[slug]/follow (Auth)       │
│  ├── GET/POST/PATCH/DELETE /api/user/serien/[slug]/collaborators │
├─────────────────────────────────────────────────────────────────┤
│  Shared Lib                                                         │
│  ├── lib/user-series.ts           (Core Logic, Server)           │
│  ├── lib/user-series-schema.ts    (Zod Schemas)                  │
│  ├── hooks/useUserSeries.ts       (Client Hooks: CRUD, Follow)   │
│  ├── hooks/useUserSeriesFollow.ts (Follow Hook)                  │
│  └── components/series/           (UI: UserSeriesForm, etc.)     │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer (Prisma)                                                │
│  ├── ReviewSeries (extended: ownerId, visibility, type)          │
│  ├── ReviewSeriesItem (unchanged)                                 │
│  ├── UserSeriesFollow (new)                                       │
│  ├── UserSeriesCollaborator (new)                                 │
│  └── Review.seriesId / seriesOrder (existing)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Datenfluss

### Public Read (Serie-Liste mit Filter)
```
GET /api/serien?type=USER&visibility=PUBLIC&cursor=xyz&limit=20
  → unstable_cache("series:list:{type}:{visibility}:{ownerId}", 60s)
  → Prisma: findMany(ReviewSeries, where: {deletedAt: null, type, visibility, ownerId?}, orderBy, cursor, take)
  → select: id, slug, title, description, coverImage, partCount, aggregateScore, createdAt, updatedAt, ownerId, type
  → Return { series[], nextCursor }
```

### Public Read (Serie-Detail mit Visibility-Check)
```
GET /api/serien/[slug]
  → unstable_cache("series:{slug}", 60s)
  → Prisma: findUnique(ReviewSeries, where: {slug, deletedAt: null}, include: items+review)
  → If series.visibility === PRIVATE:
       - Check auth: isOwnerOrCollaborator(userId, seriesId)
       - If not → return null (404)
  → Compute parts, Return { series, parts }
```

### User Write (Create Series)
```
POST /api/user/serien { title, description?, coverImage?, visibility?, reviewIds[] }
  → requireAuth → userId
  → Zod validate
  → slugify(title) + generateUniqueSlug
  → Transaction:
     - Create ReviewSeries { slug, title, description, coverImage, visibility, type: USER, ownerId: userId }
     - For each reviewId (ordered): Create ReviewSeriesItem, Update Review(seriesId, seriesOrder)
     - Update ReviewSeries partCount, aggregateScore, version++
  → revalidateTag("series:list"), revalidateTag("user-series:{userId}")
  → Return { series }
```

### User Write (Reorder - Optimistisches Locking)
```
POST /api/user/serien/[slug]/reorder { items: [{reviewId, seriesOrder}], version }
  → requireAuth → userId
  → Check permission: isOwnerOrEditor(userId, seriesId)
  → Find series, check version match → 409 Conflict if mismatch
  → Validate: orders 1..N lückenlos, all reviewIds belong to series
  → Transaction:
     - Update ReviewSeriesItem.seriesOrder per item
     - Update Review.seriesOrder denormalisiert
     - Increment ReviewSeries.version
  → revalidateTag("series:{slug}"), revalidateTag("series:list"), revalidateTag("review:{reviewId}"), revalidateTag("user-series:{userId}")
  → Return { version: newVersion }
```

### Follow Flow
```
POST /api/user/serien/[slug]/follow
  → requireAuth → userId
  → Check series.visibility === PUBLIC, series.type === USER
  → Upsert UserSeriesFollow (unique userId+seriesId)
  → Increment ReviewSeries.followersCount (denormalisiert)
  → revalidateTag("series:{slug}"), revalidateTag("user-series-follows:{userId}")
  → Create Notification (type: user_series_update) for followers? No, for NEW items only.
  → Return { followed: true, followersCount }
```

---

## 3. Bestehende Wiederverwendung (Analyse)

| Komponente | Wiederverwendung | Anpassung |
|------------|------------------|-----------|
| `ReviewSeries` / `ReviewSeriesItem` | **Basis Models** — werden um `ownerId`, `visibility`, `type` erweitert | Migration additive, Defaults für bestehende Admin-Serien |
| `lib/review-series.ts` | **Core Logic Patterns** — `getSeriesList`, `getSeriesBySlug`, `validateOrder`, `computeAggregateScore`, `slugify`, `generateUniqueSlug`, Cache-Tags, Reorder-Transaction | Erweitert um `type`, `visibility`, `ownerId` Filter, Permission-Checks |
| `lib/review-series-schema.ts` | **Zod Schemas** — `createSeriesSchema`, `updateSeriesSchema`, `reorderSeriesSchema`, `seriesListQuerySchema` | Neue Schemas für User-API (`createUserSeriesSchema` mit `visibility`, `reviewIds`), Collaborator-Schemas |
| `SeriesList`, `SeriesCard`, `SeriesDetail`, `SeriesBadge` | **UI Components** — funktionieren bereits für beide Typen via `series.type` / `series.owner` | `SeriesCard`: Badge "Von @username", `SeriesDetail`: Owner-Anzeige, Follow-Button, Visibility-Check |
| `useCollectionFollow` Hook | **Pattern für optimistische UI** (Follow, Add/Remove, Reorder) | `useUserSeriesFollow`, `useUserSeriesMutations` |
| `CollectionFollowerCount` / Modal | Nicht direkt — User-Serien haben Follower | Neu: `UserSeriesFollowerCount`, `UserSeriesFollowerModal` (kann Collection-Komponenten wiederverwenden) |
| Admin Collections UI (`/admin/listen`) | Layout, Tabelle, DnD-Pattern, Toast | User-Serien UI: `/serien/neu`, `/serien/[slug]/bearbeiten` (Client Comp) |
| `unstable_cache` Tags | `series:list`, `series:{slug}`, `review:{slug}` | Neue Tags: `series:list:{type}:{visibility}`, `user-series:{userId}`, `user-series-follows:{userId}` |
| Search API Erweiterung | `search-relevance.ts` → `series` Feld additiv | Filter `series.type`, `series.visibility`, `series.ownerId` |
| Feature-Flag Pattern | `FEATURE_REVIEW_SERIES`, `FEATURE_REVIEW_COLLECTIONS` | `FEATURE_USER_SERIES` (Default: `true`) |
| Notification System | `lib/notification.ts`, `NotificationType` Enum | Neuer Type `user_series_update`, `user_series_invite` |

---

## 4. Arbeitspakete (PKG-1 bis PKG-13)

| PKG | Beschreibung | Abhängigkeit | Geschätzt |
|-----|--------------|--------------|-----------|
| **PKG-1** | **DB-Migration & Prisma Models** — `ReviewSeries` erweitern (`ownerId`, `visibility`, `type`), `UserSeriesFollow`, `UserSeriesCollaborator`, Enums, Indizes, reversible Migration | — | 0.5h |
| **PKG-2** | **Types & Zod-Schemas** — `lib/user-series-schema.ts`: User Create/Update/Reorder/Item/Follow/Collaborator Schemas, Public List Query Extension, Response Types | PKG-1 | 0.5h |
| **PKG-3** | **Server Core Logic** — `lib/user-series.ts`: `createUserSeries()`, `getUserSeriesList()`, `getUserSeriesForEdit()`, `updateUserSeries()`, `deleteUserSeries()`, `reorderUserSeries()`, `addUserSeriesItem()`, `removeUserSeriesItem()`, `followUserSeries()`, `unfollowUserSeries()`, `getUserSeriesFollowStatus()`, `inviteCollaborator()`, `updateCollaboratorRole()`, `removeCollaborator()`, `checkPermission()`, `computeAggregateScore()` (reuse), `validateOrder()` (reuse), `slugify()` (reuse) | PKG-2 | 1.5h |
| **PKG-4** | **User API Routes** — CRUD + Reorder + Items + Follow + Collaborators, `requireAuth`, Permission-Checks, Zod-Validation, Optimistisches Locking, Tag-Invaliderung | PKG-3 | 1.5h |
| **PKG-5** | **Public API Erweiterung** — `GET /api/serien` (Filter `type`, `visibility`, `ownerId`), `GET /api/serien/[slug]` (Visibility-Check + Permission), Cache-Tags | PKG-3 | 0.5h |
| **PKG-6** | **Feed & Notification Integration** — `lib/feed.ts` Erweiterung `includeUserSeries`, Notification Types `user_series_update`, `user_series_invite`, Trigger bei Item-Add + Collaborator-Invite | PKG-3 | 0.5h |
| **PKG-7** | **Public Pages Erweiterung** — `/serien` (Filter-Chips Admin/User, Badge "Von @username"), `/serien/[slug]` (Visibility-Check, Owner-Anzeige, Follow-Button), Profil-Tab "Serien" (`/u/[username]`) | PKG-5 | 1h |
| **PKG-8** | **User Pages** — `/serien/neu` (Form + Review-Suche + DnD), `/serien/[slug]/bearbeiten` (Form + DnD + Collaborators Section), Client Components | PKG-4 | 1.5h |
| **PKG-9** | **Client Hooks** — `useUserSeriesMutations` (create, update, delete, reorder, addItem, removeItem), `useUserSeriesFollow`, `useUserSeriesCollaborators`, Optimistic UI, Rollback, Toast | PKG-4 | 0.5h |
| **PKG-10** | **UI Components** — `UserSeriesForm` (Shared Neu/Bearbeiten), `ReviewSearchAutocomplete` (für Review-Auswahl), `UserSeriesPartsDnD` (Native HTML5 DnD, tastaturbedienbar), `UserSeriesFollowButton`, `CollaboratorsManager`, `UserSeriesEmptyState` | PKG-8, PKG-9 | 1h |
| **PKG-11** | **Search API Filter** — `search-relevance.ts` / API: `series.type`, `series.visibility`, `series.ownerId` Filter in Response | PKG-1 | 0.3h |
| **PKG-12** | **Tests & Doku** — Unit (Logic, Schema, Hooks), Integration (User API, Public API, Feed), E2E (Create, Edit, Follow, Collaborate, Profil-Tab), CHANGELOG, README, .env.example, PROGRESS.md | PKG-1..11 | 1.5h |
| **PKG-13** | **Self-Review (F6) & Verify (F7)** — Code-Review, Build/Lint/Typecheck/Tests grün, Feature-Flag auf `true`, Doku final | PKG-12 | 0.5h |

**Gesamt geschätzt: ~11.3h**

---

## 5. Cache-Strategie

| Key | TTL | Invaliderung bei |
|-----|-----|------------------|
| `series:list:{type}:{visibility}:{ownerId?}` | 60s | Serie erstellen/löschen, Item hinzufügen/entfernen (partCount/Score), Visibility-Change, Type-Change |
| `series:{slug}` | 60s | Serie update, Reorder, Item add/remove, Review-Update (Score/Cover), Visibility-Change |
| `user-series:{userId}` | 60s | User-Serie erstellen/löschen/update, Item-Änderung, Collaborator-Änderung |
| `user-series-follows:{userId}` | 60s | Follow/Unfollow |
| `review:{slug}` | 30s | Review-Detail Serie-Badge (seriesId/seriesOrder) |
| `search:results:{hash}` | 60s | Unverändert (Series-Feld additiv) |

---

## 6. Feature-Flag

- `FEATURE_USER_SERIES` (Env, Default: `true`)
- User API: `if (!flag) return 404`
- Public API: `if (!flag) return 404` für User-Serien (`type=USER`), Admin-Serien bleiben
- Public Pages: `/serien/neu`, `/serien/[slug]/bearbeiten` → `notFound()` bei `false`
- `/serien` Filter "Nutzer" nur bei `true`
- Profil-Tab "Serien" nur bei `true`
- Follow-Button nur bei `true`

---

## 7. Barrierefreiheit-Checkliste (PKG-7, PKG-8, PKG-10)

- [ ] Semantische HTML-Struktur (`<form>`, `<nav>`, `<ol>`, `<article>`)
- [ ] ARIA-Labels für Icon-Buttons (Follow, Share, DnD-Handle, Collaborator-Actions)
- [ ] `aria-current="step"` für aktiven Teil in Serie-Navigation
- [ ] Fokus-Reihenfolge logisch (Tab durch Form, DnD-Liste, Parts)
- [ ] DnD: Tastaturbedienbar (Space zum Greifen, Pfeile zum Bewegen, Enter zum Ablegen), `aria-grabbed`, `aria-dropeffect`, `role="list"` + `aria-roledescription="sortierbare Liste"`
- [ ] Reduced Motion: `@media (prefers-reduced-motion: reduce)` → DnD-Animationen aus
- [ ] Kontrast: Badges/Chips ≥ 4.5:1 (Tailwind `text-muted-foreground` auf `bg-muted` prüfen)
- [ ] Screen-Reader: Tooltip-Inhalt auch als `aria-describedby` oder separater Text
- [ ] Form: `aria-invalid`, `aria-describedby` für Fehlermeldungen, `required` Attribute
- [ ] Autocomplete: `aria-controls`, `aria-expanded`, `role="listbox"`/`option`

---

## 8. Migration-Details (PKG-1)

### Prisma Schema Ergänzungen

```prisma
// prisma/schema.prisma — ERWEITERUNGEN

enum SeriesVisibility {
  PUBLIC
  PRIVATE
}

enum SeriesType {
  ADMIN
  USER
}

enum CollaboratorRole {
  OWNER
  EDITOR
}

model ReviewSeries {
  id             String   @id @default(cuid())
  slug           String   @unique
  title          String
  description    String?  @db.Text
  coverImage     String?
  partCount      Int      @default(0)
  aggregateScore Float?
  shareCounts    Json?    @default("{}") @map("share_counts")
  followersCount Int      @default(0) @map("followers_count")  // NEU: denormalisiert
  version        Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  // NEU: User-Series Felder
  ownerId        String?  @map("owner_id")
  owner          TwitchUser? @relation("UserSeriesOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  visibility     SeriesVisibility @default(PUBLIC)
  type           SeriesType @default(ADMIN)

  items          ReviewSeriesItem[]
  reviews        Review[]
  followers      UserSeriesFollow[]           // NEU
  collaborators  UserSeriesCollaborator[]     // NEU

  @@index([deletedAt])
  @@index([ownerId])
  @@index([type, visibility])
  @@map("review_series")
}

model ReviewSeriesItem {
  id          String   @id @default(cuid())
  seriesId    String
  series      ReviewSeries @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  reviewId    String   @unique
  review      Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  seriesOrder Int
  createdAt   DateTime @default(now())

  @@unique([seriesId, seriesOrder])
  @@index([seriesId])
  @@map("review_series_items")
}

model UserSeriesFollow {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  user      TwitchUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  seriesId  String   @map("series_id")
  series    ReviewSeries @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([userId, seriesId])
  @@index([userId])
  @@index([seriesId])
  @@map("user_series_follows")
}

model UserSeriesCollaborator {
  id           String             @id @default(cuid())
  userId       String             @map("user_id")
  user         TwitchUser         @relation(fields: [userId], references: [id], onDelete: Cascade)
  seriesId     String             @map("series_id")
  series       ReviewSeries       @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  role         CollaboratorRole   @default(EDITOR)
  invitedAt    DateTime           @default(now()) @map("invited_at")
  acceptedAt   DateTime?          @map("accepted_at")

  @@unique([userId, seriesId])
  @@index([userId])
  @@index([seriesId])
  @@map("user_series_collaborators")
}
```

### Migration Commands

```bash
# Migration erstellen (create-only für manuelle Prüfung)
npx prisma migrate dev --name add_user_series --create-only

# Dann SQL manuell prüfen/anpassen (siehe Spec Migration SQL), dann apply
npx prisma migrate dev
```

---

## 9. Bestehende Dateien, die angepasst werden

| Datei | Änderung |
|-------|----------|
| `prisma/schema.prisma` | Enums + Model-Erweiterungen + 2 neue Models |
| `src/lib/feature-flags.ts` | `FEATURE_USER_SERIES` hinzufügen |
| `src/lib/review-series.ts` | `getSeriesList`/`getSeriesBySlug` um `type`/`visibility`/`ownerId` Filter erweitern, `getSeriesBySlug` Visibility-Check |
| `src/lib/review-series-schema.ts` | `seriesListQuerySchema` um `type`, `visibility`, `ownerId` erweitern |
| `src/app/serien/page.tsx` | Filter-Chips "Admin/Nutzer", Badge "Von @username" in SeriesCard |
| `src/app/serien/[slug]/page.tsx` | Visibility-Check, Owner-Anzeige, Follow-Button |
| `src/app/u/[username]/page.tsx` | Tab "Serien" hinzufügen (Erstellt/Gefolgt) |
| `src/components/series/SeriesCard.tsx` | `owner` Prop → Badge "Von @username" |
| `src/components/series/SeriesDetail.tsx` | Owner-Anzeige, Follow-Button, Visibility-Handling |
| `.env.example` | `FEATURE_USER_SERIES=true` |

---

## 10. Neue Dateien

```
src/lib/user-series-schema.ts          # Zod Schemas für User-Series API
src/lib/user-series.ts                 # Core Logic (Server)
src/app/api/user/serien/route.ts       # GET (Liste), POST (Create)
src/app/api/user/serien/[slug]/route.ts # GET (Edit), PATCH, DELETE
src/app/api/user/serien/[slug]/reorder/route.ts
src/app/api/user/serien/[slug]/items/route.ts
src/app/api/user/serien/[slug]/items/[reviewId]/route.ts
src/app/api/user/serien/[slug]/follow/route.ts
src/app/api/user/serien/[slug]/collaborators/route.ts
src/app/api/user/serien/[slug]/collaborators/[userId]/route.ts
src/hooks/useUserSeries.ts             # Mutations Hook
src/hooks/useUserSeriesFollow.ts       # Follow Hook
src/hooks/useUserSeriesCollaborators.ts # Collaborators Hook
src/components/series/UserSeriesForm.tsx
src/components/series/ReviewSearchAutocomplete.tsx
src/components/series/UserSeriesPartsDnD.tsx
src/components/series/UserSeriesFollowButton.tsx
src/components/series/CollaboratorsManager.tsx
src/app/serien/neu/page.tsx
src/app/serien/[slug]/bearbeiten/page.tsx
tests/lib/user-series.test.ts
tests/lib/user-series-schema.test.ts
tests/hooks/useUserSeries.test.ts
tests/api/user/serien.test.ts
tests/api/user/serien/follow.test.ts
tests/api/user/serien/collaborators.test.ts
tests/e2e/user-series.test.ts
```

---

## 11. Nächste Schritte

1. **PKG-1 ausführen:** Migration erstellen & anwenden (`npx prisma migrate dev --name add_user_series --create-only` → SQL prüfen → apply)
2. **PKG-2:** Types & Schemas schreiben (`src/lib/user-series-schema.ts`)
3. **PKG-3:** Core Logic implementieren (`src/lib/user-series.ts`)
4. **PKG-4:** User API Routes schreiben
5. **PKG-5:** Public API erweitern
6. **PKG-6:** Feed & Notification Integration
7. **PKG-7:** Public Pages erweitern
8. **PKG-8/9/10:** User Pages + Hooks + UI Components
9. **PKG-11:** Search API Filter
10. **PKG-12:** Tests & Doku
11. **PKG-13:** Self-Review & Verify

Jedes Paket: Code → lokal testen (`npm run type-check`, `npm run build`, relevante Tests) → Commit → Push.