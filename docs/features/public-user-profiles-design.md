# Design & Plan: Öffentliche Nutzerprofile & Follow-System

## Übersicht

Dieses Dokument beschreibt die technische Lösung für das Feature "Öffentliche Nutzerprofile & Follow-System" basierend auf der Spezifikation in `docs/features/public-user-profiles.md`. Es baut auf der bestehenden Architektur auf: Next.js 16 App Router, Prisma + PostgreSQL, shadcn/ui, React 19, TypeScript.

## 1. Betroffene Module & Schnittstellen

### Datenmodell (Prisma)
**Neue Modelle:** `UserProfile`, `Follow`, `Notification` (siehe Spec)

**Änderungen an `TwitchUser`:**
- Neue Relationen: `userProfile`, `followers`, `following`, `notifications`
- Keine Breaking Changes an bestehenden Feldern

### API Routes (App Router)
```
src/app/api/
├── users/
│   ├── [username]/
│   │   └── route.ts              # GET öffentliches Profil
│   ├── me/
│   │   └── profile/
│   │       └── route.ts          # GET/PATCH eigene Einstellungen
│   ├── [username]/
│   │   ├── followers/
│   │   │   └── route.ts          # GET Follower-Liste
│   │   └── following/
│   │       └── route.ts          # GET Following-Liste
├── follow/
│   └── route.ts                  # POST Follow/Unfollow
├── feed/
│   └── route.ts                  # GET Aktivitäts-Feed
└── notifications/
    ├── route.ts                  # GET Liste, PATCH als gelesen
    └── read/
        └── route.ts              # PATCH alle als gelesen (optional, kann in route.ts)
```

### UI Components
```
src/components/
├── profiles/
│   ├── PublicProfile.tsx         # Server Component: /u/[username]
│   ├── ProfileHeader.tsx         # Avatar, Name, Bio, Stats, Follow-Button
│   ├── ProfileTabs.tsx           # Tabs: Bewertungen | Gespeichert
│   ├── ProfileRatingsList.tsx    # Paginierte Liste der Bewertungen
│   ├── ProfileBookmarksList.tsx  # Paginierte Liste der Bookmarks
│   ├── ProfileSettings.tsx       # Client: Bio, Sichtbarkeit
│   └── FollowButton.tsx          # Client: Optimistic Follow/Unfollow
├── feed/
│   ├── FeedPage.tsx              # Server: /feed
│   ├── FeedCard.tsx              # Einzelne Aktivität
│   └── FeedSkeleton.tsx          # Loading
├── notifications/
│   ├── NotificationBell.tsx      # Client: Header Glocke + Dropdown
│   ├── NotificationList.tsx      # Dropdown Items
│   └── NotificationsPage.tsx     # /benachrichtigungen (alle)
└── ui/ (bestehend)
    ├── button, avatar, badge, tabs, dialog, tooltip, ...
```

### Lib / Utilities
```
src/lib/
├── user-profiles.ts              # Profile CRUD, Follower-Counts
├── follow.ts                     # Follow/Unfollow Logic + Notifications
├── feed.ts                       # Feed Query + Caching
├── notifications.ts              # Notification CRUD
├── schemas/
│   └── profile-schema.ts         # Zod: bio, visibility toggles
└── session.ts                    # Bereits vorhanden: getServerSession
```

## 2. Datenfluss

### Öffentliches Profil (`/u/[username]`)
```
Request → Server Component (app/u/[username]/page.tsx)
  → getUserProfile(username) [lib/user-profiles.ts]
    → Prisma: TwitchUser + UserProfile + Ratings/Bookmarks (paginiert)
  → Render: ProfileHeader + ProfileTabs + Lists
  → Response: HTML (SSR, gecacht 60s via unstable_cache)
```

### Follow/Unfollow
```
Click FollowButton → POST /api/follow { followingId }
  → requireTwitchAuth → followUser(followerId, followingId) [lib/follow.ts]
    → Prisma Transaction:
      1. Follow upsert (unique constraint followerId+followingId)
      2. Notification.create (type: follow, data: { followedUserId, ... })
      3. UserProfile.update (followerCount++, followingCount++) [denormalisiert]
  → Response: { following: boolean, followerCount, followingCount }
  → FollowButton: Optimistic UI Update → Revalidate /u/[username]
```

### Feed (`/feed`)
```
Request → Server Component (app/feed/page.tsx)
  → getFeed(userId, cursor, limit) [lib/feed.ts]
    → Prisma: Follow.where(followerId=userId).followingId[] → IN query
    → Union: UserRating + Bookmark + Comment (author=followed) + Review (author=followed)
    → Sort by createdAt DESC, paginate (cursor-based)
    → unstable_cache 30s (key: userId + cursor)
  → Render: FeedCard[] + Pagination
```

### Notifications
```
Header (Client) → GET /api/notifications?unreadOnly=true
  → requireTwitchAuth → getNotifications(userId) [lib/notifications.ts]
    → Prisma: Notification.where(userId, readAt=null).orderBy(createdAt DESC).take(10)
  → NotificationBell: Badge count + Dropdown list
Click "Alle anzeigen" → /benachrichtigungen (Server Component, paginiert)
```

## 3. Abhängigkeiten & Wiederverwendung

| Bestehend | Wiederverwendung |
|-----------|------------------|
| `TwitchUser` Model | Basis für Profile, Follow-Relationen |
| `getServerSession` / `requireTwitchAuth` | Auth in allen APIs |
| `prisma` Client | Alle DB-Zugriffe |
| shadcn/ui: `Button`, `Avatar`, `Tabs`, `Badge`, `Tooltip`, `Dialog`, `DropdownMenu`, `ScrollArea`, `Skeleton`, `Textarea`, `Switch`, `Input`, `Label`, `Card` | UI Building Blocks |
| `unstable_cache` (Next.js) | Feed & Profil Caching |
| Zod Schemas (`rating-schema.ts`) | Pattern für `profile-schema.ts` |
| API Test Pattern (`votes.test.ts`) | Pattern für neue API Tests |
| Unit Test Pattern (`search-relevance.test.ts`) | Pattern für neue Unit Tests |

## 4. Detaillierte Arbeitspakete (Verfeinert)

### PK1: Prisma Schema + Migration
- `prisma/schema.prisma`: 3 neue Models hinzufügen
- Relation zu `TwitchUser` hinzufügen (1:1 Profile, 1:N Follow/Notifications)
- Migration erstellen: `npx prisma migrate dev --name add-user-profiles-follows-notifications`
- Seed-Script: Für alle existierenden `TwitchUser` `UserProfile` mit Defaults anlegen

### PK2: Seed-Script
- `prisma/seed-user-profiles.ts`: Einmalig ausführen nach Migration
- `UserProfile.createMany` für User ohne Profile

### PK3: Lib - Profile Utilities
- `src/lib/user-profiles.ts`:
  - `getUserProfile(username)` → TwitchUser + UserProfile + Counts
  - `getUserProfileById(userId)` → für Settings
  - `updateUserProfile(userId, data)` → Bio, Visibility
  - `getProfileRatings(userId, cursor, limit)` → paginiert
  - `getProfileBookmarks(userId, cursor, limit)` → paginiert

### PK4: Lib - Follow Logic
- `src/lib/follow.ts`:
  - `followUser(followerId, followingId)` → Transaktion (Follow + Notification + Counts)
  - `unfollowUser(followerId, followingId)` → Transaktion (Delete + Counts)
  - `isFollowing(followerId, followingId)` → boolean
  - `getFollowerCount(userId)`, `getFollowingCount(userId)` → gecacht
  - `getFollowers(userId, cursor, limit)`, `getFollowing(userId, cursor, limit)`

### PK5: Lib - Feed Logic
- `src/lib/feed.ts`:
  - `getFeed(userId, cursor, limit)` → Union Query, cursor-based pagination
  - Types: `FeedItem = UserRating | Bookmark | Comment | Review` mit `type` discriminator
  - `unstable_cache` mit Key `feed:${userId}:${cursor}:${limit}`

### PK6: Lib - Notifications
- `src/lib/notifications.ts`:
  - `getNotifications(userId, { unreadOnly, cursor, limit })`
  - `markAsRead(userId, ids?)`, `markAllAsRead(userId)`
  - `createFollowNotification(followedUserId, followerId, followerUsername)`

### PK7: Zod Schema
- `src/lib/schemas/profile-schema.ts`:
  - `updateProfileSchema`: bio (max 500), isPublic, showRatings, showBookmarks (all optional)

### PK8: API Routes (8 Routes)
- Je Route: Auth Check → Validation → Service Call → Response
- Error Handling: 401, 403, 404, 400, 500
- Rate Limiting: Follow API (10 req/min per user via in-memory Map oder Upstash wenn vorhanden)

### PK9: UI Components (Profile)
- `PublicProfile` (Server): Layout, Metadata (Open Graph), Data Fetching
- `ProfileHeader` (Client): Avatar, Name, Bio, Stats, FollowButton
- `ProfileTabs` (Client): Tabs mit URL-Sync (`?tab=ratings&page=2`)
- `ProfileRatingsList` / `ProfileBookmarksList` (Client): Infinite Scroll oder Pagination
- `ProfileSettings` (Client): Form mit React Hook Form + Zod, Toast auf Erfolg

### PK10: UI Components (Follow)
- `FollowButton`: Props `followingId`, `initialFollowing`, `initialFollowerCount`
  - Optimistic Update: sofort UI ändern, API Call, auf Fehler zurückrollen
  - Loading State: Spinner, disabled
  - Tooltip: "Folge @username" / "Entfolge @username"

### PK11: UI Components (Feed)
- `FeedPage` (Server): Data Fetching, Metadata
- `FeedCard` (Client): Typ-spezifische Darstellung (Rating: Stern + Review-Link, Bookmark: Bookmark-Icon, Comment: Sprechblase + Text-Ausschnitt)
- `FeedSkeleton`: Loading Placeholder

### PK12: UI Components (Notifications)
- `NotificationBell` (Client): Glocke mit Badge, DropdownMenu mit Liste
- `NotificationList`: Items mit Icon, Titel, Nachricht, Zeit, Click → Mark as Read + Navigate
- `NotificationsPage` (Server): Vollständige Liste, Filter (alle/ungelesen), Pagination

### PK13: Pages
- `app/u/[username]/page.tsx` → PublicProfile
- `app/u/[username]/followers/page.tsx` → Followers List
- `app/u/[username]/following/page.tsx` → Following List
- `app/einstellungen/profil/page.tsx` (oder Tab in `/einstellungen`) → ProfileSettings
- `app/feed/page.tsx` → FeedPage
- `app/benachrichtigungen/page.tsx` → NotificationsPage
- Header Integration: `NotificationBell` in `src/components/layout/Header.tsx` (oder wo Header ist)

### PK14: Tests
- Unit: `follow.test.ts`, `feed.test.ts`, `notifications.test.ts`, `user-profiles.test.ts`
- Integration: `users.test.ts`, `follow.test.ts`, `feed.test.ts`, `notifications.test.ts`
- E2E: `public-profiles.spec.ts`, `follow.spec.ts`, `feed.spec.ts`

### PK15: Self-Review & Verify
- `npm run verify` (type-check, build, lint, tests)
- Lint Errors beheben, Tests grün

### PK16: Doku & Changelog
- README: neue Seiten, Environment (keine neuen), Migration Hinweis
- CHANGELOG.md: Version bump, Feature Eintrag
- ROADMAP.md: Feature als erledigt markieren
- Feature Spec: Review-Sektion ausfüllen

## 5. Migration Strategy

### Up Migration (automatisch via Prisma)
```sql
-- UserProfile, Follow, Notification Tabellen
-- Indizes, Foreign Keys, Unique Constraints
-- Default: isPublic=true, showRatings=true, showBookmarks=true
```

### Seed (nach Migration)
```typescript
// prisma/seed-user-profiles.ts
const users = await prisma.twitchUser.findMany({
  where: { userProfile: null },
  select: { id: true }
});
await prisma.userProfile.createMany({
  data: users.map(u => ({ userId: u.id })),
  skipDuplicates: true
});
```

### Down Migration (reversibel)
```sql
DROP TABLE "notifications";
DROP TABLE "follows";
DROP TABLE "user_profiles";
```

## 6. Performance-Optimierungen

1. **Denormalisierte Counts:** `UserProfile.followerCount`, `followingCount` für schnelle Anzeige ohne Count-Queries
2. **Caching:** 
   - Profil: `unstable_cache` 60s (Key: `profile:${username}`)
   - Feed: `unstable_cache` 30s (Key: `feed:${userId}:${cursor}:${limit}`)
   - Follow-Counts: In-Memory Cache (TTL 60s) oder Redis falls verfügbar
3. **Indizes:** 
   - `Follow.followingId` für Follower-Liste
   - `Follow.followerId` für Following-Liste
   - `Notification.userId + readAt + createdAt` für Listen
4. **Cursor Pagination:** Statt Offset für Feed/Listen (bessere Performance bei großen Datensätzen)

## 7. Sicherheits-Checkliste

- [ ] Alle API Routes: `requireTwitchAuth` für schreibende/private Endpoints
- [ ] Profil-Settings: Ownership Check (`session.userId === profile.userId`)
- [ ] Follow: Selbst-Follow verhindern, Rate Limit (10/min)
- [ ] Private Profile: 404 für Fremde, keine Daten in API
- [ ] Input Validation: Zod auf allen POST/PATCH
- [ ] XSS: Bio escapet rendern (React macht das automatisch via Text-Content)
- [ ] CSRF: SameSite Cookie + JWT in Cookie (bereits vorhanden)

## 8. Rollout & Feature Flag

- Feature Flag: `PUBLIC_PROFILES_ENABLED` (env var, default `true`)
- In Code: `if (!process.env.PUBLIC_PROFILES_ENABLED) return notFound()` in Profil-Pages
- Migration: Deploy → Migration läuft → Seed läuft → Feature Flag on
- Rollback: Flag off → Migration down (falls nötig)

---

## Nächster Schritt

Beginn mit **PK1**: Prisma Schema erweitern + Migration erstellen.