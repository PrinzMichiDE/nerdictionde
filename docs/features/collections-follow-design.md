# Design & Plan: Review Collections Follow

## 1. Architektur-Überblick

Das Feature nutzt **ausschließlich bestehende Infrastruktur**:
- **Follow-System**: Parallele Relation `CollectionFollow` (User ↔ Collection) analog zu `UserFollow` (User ↔ User)
- **Notifications**: Neuer `NotificationType.COLLECTION_ITEM_ADDED` in bestehendem Notification-System
- **Feed**: Erweiterung der bestehenden `/feed` Query um `CollectionFollow` Join
- **Collections**: Bestehende Models `ReviewCollection`, `CollectionItem` unverändert
- **Cache**: `unstable_cache` mit Tag-Invaliderung (Pattern wie bei Reactions, Collections, Reading History)

**Keine neuen Dependencies.** Alle Patterns existieren bereits im Codebase.

---

## 2. Datenfluss

### Follow/Unfollow (Mutation)
```
User Click → POST/DELETE /api/listen/[slug]/follow
  → verifySession()
  → checkFeatureFlag()
  → rateLimit()
  → findCollectionBySlug(slug)
  → authorization: !collection.deletedAt, collection.isPublic, userId !== collection.ownerId
  → Prisma: upsert/delete CollectionFollow (unique: userId+collectionId)
  → increment/decrement ReviewCollection.followerCount (atomic)
  → revalidateTag(`collection-follow:${slug}`)
  → revalidateTag(`user-followed-collections:${userId}`)
  → return { followed: boolean, followerCount: number }
```

### Feed mit Collections (Read)
```
GET /api/feed?includeCollections=true
  → verifySession()
  → findFollowedCollectionIds(userId) // cached 60s
  → findRecentCollectionItems(collectionIds, cursor, limit) // cached 30s
  → merge mit User-Feed Items (sort by createdAt desc)
  → return { items, nextCursor }
```

### Notifications (Trigger)
```
POST /api/listen/[slug]/items (Add Review to Collection)
  → nach erfolgreichem Insert:
  → findFollowerIds(collectionId) // cached 60s
  → für jeden Follower: createNotification({
      userId: followerId,
      type: 'COLLECTION_ITEM_ADDED',
      data: { collectionId, collectionSlug, collectionTitle, itemId, reviewId, reviewTitle },
      link: `/listen/${slug}?highlight=item-${itemId}`
    })
  → batch insert (effizient)
```

---

## 3. Betroffene Module & Dateien (Neu & Geändert)

### Neu
| Datei | Zweck |
|-------|-------|
| `prisma/migrations/..._collections_follow/migration.sql` | DB Migration (UP/DOWN) |
| `src/lib/collections-follow.ts` | Server Logic: toggleFollow, getFollowStatus, getFollowedCollections, getFollowers, getFollowerIds |
| `src/lib/collections-follow-schema.ts` | Zod Schemas (slug, followInput) |
| `src/app/api/listen/[slug]/follow/route.ts` | API POST/DELETE/GET Follow |
| `src/app/api/me/listen/followed/route.ts` | API GET gefolgte Listen |
| `src/app/api/feed/route.ts` | Erweiterung: includeCollections Parameter |
| `src/components/collections/CollectionFollowButton.tsx` | Follow Button Component (Client) |
| `src/components/collections/CollectionFollowerCount.tsx` | Follower Count Badge (Server/Client) |
| `src/components/collections/CollectionFollowerListModal.tsx` | Owner Modal: Follower Liste |
| `src/components/settings/FollowedCollectionsTab.tsx` | Tab "Gefolgte Listen" in Einstellungen |
| `src/components/feed/FeedCollectionItems.tsx` | Feed Section: Items aus gefolgten Listen |
| `src/lib/notifications.ts` | Erweiterung: createCollectionItemAddedNotification |

### Geändert
| Datei | Änderung |
|-------|----------|
| `prisma/schema.prisma` | + Model `CollectionFollow`, + `followerCount` auf `ReviewCollection`, + Enum `NotificationType` |
| `src/app/listen/[slug]/page.tsx` | Integration: FollowButton, FollowerCount, Owner-Modal |
| `src/app/einstellungen/listen/page.tsx` | Neuer Tab "Gefolgte Listen" |
| `src/app/feed/page.tsx` | Integration: FeedCollectionItems |
| `src/components/ui/toast.tsx` | Nutzung für Follow/Unfollow Toasts |
| `.env.example` | + `FEATURE_COLLECTIONS_FOLLOW=true` |
| `src/lib/feature-flags.ts` | + `FEATURE_COLLECTIONS_FOLLOW` |

---

## 4. Arbeitspakete (PKG-1 bis PKG-11)

| PKG | Titel | Beschreibung | Abhängigkeit | Geschätzt |
|-----|-------|--------------|--------------|-----------|
| **PKG-1** | **DB Migration & Prisma Schema** | `CollectionFollow` Model, `followerCount` auf `ReviewCollection`, `NotificationType` Enum erweitern. Migration mit UP/DOWN. `prisma generate` & `prisma migrate dev`. | — | 0.5h |
| **PKG-2** | **Types & Zod Schemas** | `collections-follow-schema.ts`: `followParamsSchema` (slug), `followedCollectionsQuerySchema` (cursor, limit). Types für `FollowStatus`, `FollowedCollection`, `Follower`. | PKG-1 | 0.25h |
| **PKG-3** | **Server Logic (`lib/collections-follow.ts`)** | `toggleFollow(userId, collectionId)`, `getFollowStatus(userId, collectionId)`, `getFollowedCollections(userId, cursor, limit)`, `getFollowers(collectionId, cursor, limit)`, `getFollowerIds(collectionId)` (cached). Alle mit `unstable_cache` + Tags. | PKG-2 | 1h |
| **PKG-4** | **API: Follow/Unfollow/Status** | `/api/listen/[slug]/follow` POST/DELETE/GET. Feature-Flag Guard, Rate-Limit (30/min mutating, 60/min read), Auth, Validation, Owner-Check, Public-Check, Deleted-Check. Returns `{ followed, followerCount }`. | PKG-3 | 0.75h |
| **PKG-5** | **API: Gefolgte Listen** | `/api/me/listen/followed` GET. Cursor Pagination (limit 20, max 50). Cache 60s Tag `user-followed-collections:${userId}`. Returns `{ collections: FollowedCollection[], nextCursor }`. | PKG-3 | 0.5h |
| **PKG-6** | **API: Feed Erweiterung** | `/api/feed` GET: Parameter `includeCollections=true`. Join `CollectionFollow` → `CollectionItem` → `Review`. Cache 30s Tag `feed-collections:${userId}`. Merge mit User-Feed. | PKG-3 | 0.5h |
| **PKG-7** | **Client Hook & Types** | `useCollectionFollow(slug)`: `followed`, `followerCount`, `toggle()`, `loading`. Optimistic UI: sofort `followed` togglen, `followerCount` +/-1, Rollback bei Error. Toast auf Success/Error. | PKG-4 | 0.5h |
| **PKG-8** | **UI: Follow Button & Count** | `CollectionFollowButton.tsx` (Client): Button mit `aria-pressed`, Loading-State, Toast. `CollectionFollowerCount.tsx` (Server Component): SSR Count + Client-Hydration für Updates. | PKG-7 | 0.75h |
| **PKG-9** | **UI: Owner Follower Modal** | `CollectionFollowerListModal.tsx`: Dialog (shadcn/ui), Avatar, Name, `@username`, Profil-Link, Pagination. Nur für Owner sichtbar. | PKG-3, PKG-8 | 0.5h |
| **PKG-10** | **UI: Einstellungen Tab & Feed** | `FollowedCollectionsTab.tsx`: Grid/List, Unfollow-Button, Empty State. `/einstellungen/listen` Tab-Integration. `FeedCollectionItems.tsx`: Section mit Listen-Cover, Titel, Review-Links, "Alle anzeigen". | PKG-5, PKG-6 | 1h |
| **PKG-11** | **Notifications & Trigger** | `createCollectionItemAddedNotification(followerIds, collection, item)` in `lib/notifications.ts`. Aufruf in `POST /api/listen/[slug]/items` nach erfolgreichem Insert. Batch-Insert für Effizienz. Grouping-Logik (mehrere Items = eine Notification). | PKG-1, PKG-4 | 0.5h |
| **PKG-12** | **Tests** | Unit: `collections-follow.ts` (12), `notifications.ts` (6). Integration: Follow API (10), Followed Collections API (8), Feed Collections (8), Notification Trigger (6). E2E: Follow Flow, Owner Modal, Empty States. | PKG-1 bis PKG-11 | 1.5h |
| **PKG-13** | **Doku & Flag** | CHANGELOG.md, README.md, .env.example, ROADMAP.md, PROGRESS.md. Feature-Flag Default `true`. Spec Review (F6) in `collections-follow.md` eintragen. | PKG-12 | 0.5h |

**Gesamt: ~9h** (verteilt auf mehrere Iterationen)

---

## 5. Cache-Strategie

| Cache Key | TTL | Invaliderung bei | Zweck |
|-----------|-----|------------------|-------|
| `collection-follow:${slug}` | 30s | Follow/Unfollow auf dieser Collection | Follow-Status & Count auf Listen-Detail |
| `user-followed-collections:${userId}` | 60s | Follow/Unfollow durch User | Einstellungen Tab "Gefolgt" |
| `collection-followers:${collectionId}` | 60s | Follow/Unfollow auf dieser Collection | Owner Follower-Modal |
| `feed-collections:${userId}` | 30s | Neues Item in gefolgter Collection, Follow/Unfollow | Feed Section |
| `collection-follower-ids:${collectionId}` | 60s | Follow/Unfollow | Notification Trigger (Batch) |

**Tag-Pattern:** `revalidateTag('collection-follow:${slug}')` etc. in Mutation-APIs.

---

## 6. Barrierefreiheits-Checkliste (WCAG 2.1 AA)

- [ ] Follow-Button: `aria-pressed="true/false"`, `aria-label` dynamisch
- [ ] Focus-Visible: Outline auf Button, Modal, Links
- [ ] Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Focus-Trap, ESC schließt
- [ ] Toast: `aria-live="polite"`, `role="status"`, nicht blockierend
- [ ] Reduced Motion: `prefers-reduced-motion` respektiert (Toast-Animation, Modal-Transition)
- [ ] Color Contrast: Follow-Button States (Outline/Filled) ≥ 4.5:1
- [ ] Keyboard: Tab-Navigation, Enter/Space auf Button, ESC auf Modal
- [ ] Screen Reader: Follower-Count als Text (`{count} Follower`), nicht nur Icon

---

## 7. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Race Condition Follow/Unfollow | Mittel | Dateninkonsistenz | DB Unique Constraint + Optimistic Locking (`version` auf Collection) |
| Notification-Spam bei Bulk-Add | Niedrig | Nutzer frustriert | Grouping: mehrere Items binnen 5min → 1 Notification "X neue Einträge" |
| Feed Performance bei vielen Follows | Mittel | Langsame Feed-Load | Cursor Pagination, Limit 3 Items pro Liste im Feed, Cache 30s |
| Cache-Staleness | Niedrig | Falsche Counts | Kurze TTL (30-60s), Tag-Invaliderung bei Mutationen, Version-Check |

---

## 8. Rollout-Checkliste

- [ ] Migration auf Staging angewendet & getestet (UP + DOWN)
- [ ] Feature-Flag `FEATURE_COLLECTIONS_FOLLOW=true` in Staging
- [ ] Alle Unit/Integration/E2E Tests grün
- [ ] Build, Type-Check, Lint, `npm run verify` grün
- [ ] Self-Review (F6) ohne offene Befunde
- [ ] Production Deploy mit Flag `true`
- [ ] Monitoring: Follow-Rate, Error-Rate, Feed-Latency prüfen

---

## 9. Nächste Schritte

1. **PKG-1**: Prisma Schema & Migration anlegen
2. **PKG-2**: Types & Zod Schemas
3. **PKG-3**: Server Logic mit Cache
4. ... sequenziell nach Tabelle oben

Jedes Paket: Commit + Push nach Verifizierung (`npm run type-check` + relevante Tests).