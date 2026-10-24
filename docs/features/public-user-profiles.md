# Feature-Spezifikation: Öffentliche Nutzerprofile & Follow-System

## Problem und Nutzen

**Warum?** Die aktuelle Profilseite (`/profil`) ist nur für den eingeloggten Nutzer sichtbar. Es gibt keine Möglichkeit, andere Nutzer zu entdecken, ihre Reviews/Bewertungen zu sehen oder ihnen zu folgen. Eine Review-Plattform lebt von Community und sozialer Interaktion.

**Für wen?** Alle registrierten Nutzer (Entdecker, Review-Leser, Autoren).

**Nutzen:**
- Nutzer finden Gleichgesinnte über gemeinsame Interessen (Kategorien, Bewertungen)
- Autoren bauen Follower-Basis auf → mehr Sichtbarkeit für ihre Reviews
- Plattform-Effekt: Je mehr Profile verlinkt sind, desto höher die Verweildauer und SEO-Signale
- Basis für spätere Features: Benachrichtigungen, personalisierter Feed, Empfehlungen

## User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| US1 | Als Nutzer möchte ich öffentliche Profile unter `/u/[username]` sehen, um andere Nutzer zu entdecken. | - Öffentliche Profil-URL funktioniert<br>- Zeigt: Anzeigename, Avatar, Bio, Mitglied seit, Stats (Bewertungen, Bookmarks, Ø-Score)<br>- Listet öffentliche Bewertungen & Bookmarks (paginiert)<br>- 404 bei nicht existierendem Username |
| US2 | Als Nutzer möchte ich mein öffentliches Profil anpassen (Bio, Sichtbarkeit). | - Einstellungen-Seite (`/einstellungen/profil`) mit Bio-Textfeld (max 500 Zeichen)<br>- Toggle: "Profil öffentlich sichtbar" (Default: an)<br>- Toggle: "Bewertungen öffentlich zeigen"<br>- Toggle: "Bookmarks öffentlich zeigen"<br>- Änderungen sofort auf öffentlichem Profil sichtbar |
| US3 | Als Nutzer möchte ich andere Nutzer folgen, um ihre Aktivitäten zu sehen. | - "Folgen"-Button auf öffentlichem Profil (wenn nicht selbst)<br>- Follow-Count auf Profil (Follower / Folge ich)<br>- Follow-Liste (Modal oder separate Seite): Follower / Following<br>- Eigenes Profil: "Folge ich" statt "Folgen" Button |
| US4 | Als Nutzer möchte ich eine Aktivitäts-Feed sehen (eigene + gefolgte Nutzer). | - Neue Seite `/feed` (nur eingeloggt)<br>- Zeigt: neue Reviews von gefolgten Nutzern, neue Bewertungen, neue Kommentare<br>- Paginiert, chronologisch<br>- Leerzustand: "Folge Nutzern, um Aktivitäten zu sehen" |
| US5 | Als Nutzer möchte ich Benachrichtigungen erhalten, wenn mir jemand folgt. | - Notification-Create bei Follow (DB: `Notification` Typ `follow`)<br>- Anzeige in Header (Glocke) + Dropdown<br>- "Alle als gelesen" markieren<br>- Optional: E-Mail (später, nicht in Scope) |

## Scope & Nicht-Scope

**In Scope:**
- Öffentliche Profilseiten `/u/[username]`
- Profil-Einstellungen (Bio, Sichtbarkeits-Toggles)
- Follow/Unfollow API + UI
- Follower/Following Listen
- Aktivitäts-Feed `/feed` (Server Component, paginiert)
- Basis-Benachrichtigungen für Follows (In-App only)

**Nicht-Scope (später):**
- E-Mail/Push-Benachrichtigungen
- Blockieren/Muten von Nutzern
- Private Nachrichten
- Profil-Badges/Achievements
- Empfehlungs-Algorithmus
- Social Login Verknüpfung (Twitch schon da, aber Profil-Sync)

## Randfälle, Fehlerfälle, Berechtigungen

| Fall | Behandlung |
|------|------------|
| Nicht existierender Username | 404 Seite mit Link zur Suche |
| Eigenes Profil aufrufen | Redirect zu `/profil` (oder Tab "Öffentliche Ansicht") |
| Profil auf "privat" gesetzt | 404 für Fremde, Owner sieht Hinweis "Profil ist privat" |
| Follow sich selbst | Button deaktiviert/ausgeblendet |
| Doppelt folgen | Idempotent: zweiter Klick = Unfollow |
| Gelöschter Nutzer | Profil zeigt "Nutzer nicht mehr verfügbar", Follow-Beziehungen bereinigt (Cascade) |
| Leere Listen (keine Bewertungen/Bookmarks) | Freundliche Leerzustände mit CTA |
| Unautorisierter Zugriff auf `/feed` | Redirect zu `/login?redirect=/feed` |
| Race Condition Follow/Unfollow | Optimistic UI + Server-Validierung, Transaktion |

## Auswirkungen auf bestehende Features & Abwärtskompatibilität

- **Datenmodell:** Neue Tabellen `UserProfile`, `Follow`, `Notification` (siehe unten). Bestehende `TwitchUser` bleibt unverändert.
- **API:** Neue Routes unter `/api/users/[username]`, `/api/follow`, `/api/notifications`, `/api/feed`. Keine Breaking Changes an bestehenden APIs.
- **UI:** Header bekommt Notification-Glocke. `/profil` bekommt Link "Öffentliches Profil ansehen".
- **SEO:** Öffentliche Profile sind indexierbar (`robots.txt` allow `/u/*`), Meta-Tags (Open Graph, Twitter Card).
- **Performance:** Feed nutzt `unstable_cache` (30s), Follow-Counts gecacht.

## Datenmodell & Migrationen

### Neue Prisma-Modelle (in `prisma/schema.prisma`)

```prisma
model UserProfile {
  id            String   @id @default(cuid())
  userId        String   @unique @map("user_id")
  bio           String?  @db.Text
  isPublic      Boolean  @default(true) @map("is_public")
  showRatings   Boolean  @default(true) @map("show_ratings")
  showBookmarks Boolean  @default(true) @map("show_bookmarks")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user          TwitchUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")

  follower    TwitchUser @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following   TwitchUser @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followingId])
  @@map("follows")
}

model Notification {
  id        String           @id @default(cuid())
  userId    String           @map("user_id")
  type      NotificationType
  title     String
  message   String           @db.Text
  data      Json?            // { followedUserId, followedUsername, ... }
  readAt    DateTime?        @map("read_at")
  createdAt DateTime         @default(now()) @map("created_at")

  user      TwitchUser       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
  @@index([userId, createdAt])
  @@map("notifications")
}

enum NotificationType {
  follow
  // später: comment_reply, review_published, mention, etc.
}
```

### Migration (reversibel)

```sql
-- Up
CREATE TABLE "user_profiles" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "bio" TEXT,
  "is_public" BOOLEAN NOT NULL DEFAULT true,
  "show_ratings" BOOLEAN NOT NULL DEFAULT true,
  "show_bookmarks" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "TwitchUser"("id") ON DELETE CASCADE;

CREATE TABLE "follows" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "follower_id" TEXT NOT NULL,
  "following_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");
CREATE INDEX "follows_following_id_idx" ON "follows"("following_id");
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "TwitchUser"("id") ON DELETE CASCADE;
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "TwitchUser"("id") ON DELETE CASCADE;

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "TwitchUser"("id") ON DELETE CASCADE;

-- Down (reversibel)
DROP TABLE "notifications";
DROP TABLE "follows";
DROP TABLE "user_profiles";
```

### Bestehende Daten
- Für jeden existierenden `TwitchUser` wird ein `UserProfile` mit Defaults angelegt (Seed-Script in Migration).

## API-Änderungen

| Endpoint | Methode | Auth | Beschreibung |
|----------|---------|------|--------------|
| `/api/users/[username]` | GET | Optional | Öffentliches Profil laden |
| `/api/users/me/profile` | GET/PATCH | Required | Eigenes Profil-Einstellungen lesen/aktualisieren |
| `/api/follow` | POST | Required | Follow/Unfollow (Body: `{ followingId }`) |
| `/api/users/[username]/followers` | GET | Optional | Follower-Liste (paginiert) |
| `/api/users/[username]/following` | GET | Optional | Following-Liste (paginiert) |
| `/api/feed` | GET | Required | Aktivitäts-Feed (paginiert, `?cursor=&limit=`) |
| `/api/notifications` | GET | Required | Benachrichtigungen (paginiert, `?unreadOnly=`) |
| `/api/notifications/read` | PATCH | Required | Benachrichtigungen als gelesen markieren (Body: `{ ids?: string[], all?: boolean }`) |

## UI/UX-Ablauf

### Öffentliches Profil `/u/[username]`
- **Server Component** (SSR für SEO)
- Header: Avatar, Anzeigename, @username, Bio, "Mitglied seit", Stats (3 Karten: Bewertungen, Bookmarks, Ø-Score)
- Action: "Folgen" Button (rechts oben, wenn eingeloggt & nicht selbst)
- Tabs: "Bewertungen" | "Gespeichert" (nur wenn sichtbar per Einstellung)
- Paginierung: 12 Items pro Seite, URL-Sync (`?tab=ratings&page=2`)
- Leerzustände: "Noch keine öffentlichen Bewertungen" / "Dieser Nutzer hat noch nichts gespeichert"

### Profil-Einstellungen `/einstellungen/profil` (oder Tab in `/einstellungen`)
- Client Component (Formular)
- Bio: Textarea (max 500 Zeichen, Zeichenzähler)
- 3 Checkboxen: Profil öffentlich, Bewertungen zeigen, Bookmarks zeigen
- Speichern: Toast-Erfolg, sofortige Aktualisierung

### Follow-Button
- Variante: `outline` wenn nicht folgt, `default` wenn folgt
- Loading-State während Request
- Tooltip: "Folge @username" / "Entfolge @username"
- Count: "123 Follower · 45 Folge ich" auf Profil

### Feed `/feed`
- Server Component (SSR, gecacht 30s)
- Karte pro Aktivität: Typ-Icon, Akteur (Link zu Profil), Aktion, Ziel (Link zu Review/Kommentar), Zeitstempel
- Infinite Scroll oder Paginierung (Next.js `useSearchParams` + `Link` prefetch)
- Leerzustand: Illustration + "Folge Nutzern, um ihre Aktivitäten hier zu sehen"

### Benachrichtigungen (Header-Glocke)
- Icon mit Badge (Anzahl ungelesen)
- Dropdown: Liste (neueste 10), "Alle anzeigen" → `/benachrichtigungen`
- Item: Icon, Titel, Nachricht, Zeit, Markieren als gelesen (Click)
- "Alle als gelesen markieren" Button

## Barrierefreiheit

- Alle interaktiven Elemente: `button`/`a` mit `aria-label` wo nötig
- Focus-Visible Styles (Tailwind `focus-visible:ring-2`)
- Feed: `aria-live="polite"` für neue Items (später bei WebSocket)
- Profile: Semantisches HTML (`<header>`, `<section>`, `<nav>` für Tabs)
- Color Contrast: Mindestens 4.5:1 (Tailwind Defaults prüfen)

## Sicherheit

- **Autorisierung:** 
  - Profil-Einstellungen: Nur Owner (`session.userId === profile.userId`)
  - Follow: Nur eingeloggt, nicht selbst, Rate-Limit (10/min)
  - Feed/Notifications: Nur eingeloggt
- **Eingabevalidierung:** 
  - Bio: `z.string().max(500).optional()`
  - Username: Prüfen gegen `TwitchUser.username` (bereits unique)
- **Datenschutz:** 
  - Private Profile: 404 für Fremde, keine Daten in API-Response
  - Follow-Beziehungen: Nur öffentliche Profile in Listen zeigen
  - DSGVO: Profil-Daten in Export enthalten, Löschung cascade

## Performance-Erwartung

- Öffentliches Profil: < 200ms TTFB (SSR + DB-Indizes)
- Feed: < 300ms (Cache-Hit), < 500ms (Cache-Miss)
- Follow-API: < 100ms (Single INSERT/DELETE + Notification INSERT)
- Follow-Counts: Denormalisiert in `UserProfile` (`followerCount`, `followingCount`) für schnelle Anzeige

## Teststrategie

| Typ | Was | Wo |
|-----|-----|----|
| Unit | `createFollow`, `unfollow`, `getFeed`, `markNotificationsRead` | `tests/lib/user-profiles.test.ts`, `tests/lib/follow.test.ts`, `tests/lib/feed.test.ts`, `tests/lib/notifications.test.ts` |
| Integration | API Routes: Profil GET/PATCH, Follow POST, Feed GET, Notifications GET/PATCH | `tests/api/users.test.ts`, `tests/api/follow.test.ts`, `tests/api/feed.test.ts`, `tests/api/notifications.test.ts` |
| E2E | Öffentliches Profil ansehen, Folgen/Entfolgen, Feed sehen, Benachrichtigung erhalten | `tests/e2e/public-profiles.spec.ts`, `tests/e2e/follow.spec.ts`, `tests/e2e/feed.spec.ts` |
| Visual | Profil-Layout (Desktop/Mobile), Feed-Karten, Notification-Dropdown | Storybook/Chromatic (falls eingerichtet) |

## Rollout-Plan

1. **Feature Flag:** `PUBLIC_PROFILES_ENABLED` (Default: `true` nach Merge)
2. **Migration:** Prisma Migration + Seed für existierende User
3. **Deploy:** `auto/dev` → CI grün → Merge zu `main` → Vercel Preview → Production
4. **Monitoring:** Error-Rate API, Follow-Conversion, Feed-Engagement
5. **Rollback:** Feature Flag auf `false`, Migration `down` möglich

---

## Review (F6) — wird nach Implementierung ausgefüllt

| Check | Status | Bemerkung |
|-------|--------|-----------|
| Alle Akzeptanzkriterien erfüllt & getestet | | |
| Randfälle & Fehlerpfade behandelt | | |
| Eingaben validiert, Autorisierung geprüft | | |
| Keine Performance-Fallen (N+1, Indizes) | | |
| Migrationen reversibel, Daten intakt | | |
| Abwärtskompatibilität gewahrt | | |
| Code-Stil & Architektur konsistent | | |
| UI: Alle Zustände, Barrierefreiheit | | |