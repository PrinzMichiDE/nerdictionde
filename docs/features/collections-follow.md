# Feature Specification: Review Collections Follow

## 1. Problem und Nutzen

**Problem:** Nutzer können derzeit Reviews und Autoren folgen, aber nicht kuratierte Listen (Collections). Wenn ein Kurator eine Liste aktualisiert (neue Reviews hinzufügt, Reihenfolge ändert), erfahren Follower nichts davon. Entdeckung neuer Inhalte über vertrauenswürdige Kuratoren ist limitiert.

**Nutzen:**
- Nutzer folgen Listen ihrer Lieblingskuratoren → automatische Entdeckung neuer Reviews
- Kuratoren erhalten Feedback über Follower-Zahlen → Motivation für Qualitäts-Listen
- Erhöhte Retention durch personalisierten Feed (neue Items gefolzter Listen)
- Nahtlose Integration in bestehendes Follow/Notification-System

**Zielgruppe:** Eingeloggte Nutzer (TwitchUser), die Listen entdecken und kuratieren wollen.

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| US1 | Als Nutzer möchte ich einer öffentlichen Liste folgen, um über Updates informiert zu werden. | - Follow-Button auf `/listen/[slug]` für eingeloggte User sichtbar<br>- Klick toggelt Follow-Status (Follow/Unfollow)<br>- Optimistische UI, Toast-Bestätigung<br>- Follow-Count wird server-seitig aktualisiert (SSR) |
| US2 | Als Nutzer möchte ich meine gefolgten Listen verwalten. | - `/einstellungen/listen` zeigt Tab "Gefolgte Listen"<br>- Liste mit Cover, Titel, Kurator, Item-Count, Follow-Count<br>- Unfollow möglich<br>- Pagination (Cursor-based, 20 pro Seite) |
| US3 | Als Nutzer möchte ich in meinem Feed neue Items gefolzter Listen sehen. | - `/feed` (bestehend) zeigt neue CollectionItems gefolzter Listen<br>- Eintrag: Listen-Cover, Listen-Titel, Review-Titel, "Hinzugefügt vor X Stunden"<br>- Klick auf Review → Review-Detail, Klick auf Liste → Listen-Detail |
| US4 | Als Nutzer möchte ich Benachrichtigungen erhalten, wenn eine gefolgte Liste aktualisiert wird. | - In-App Notification (glocke) bei neuem Item in gefolgter Liste<br>- Optional: E-Mail Digest (wöchentliche Zusammenfassung, nutzt Newsletter-Prefs)<br>- Notification verlinkt zur Liste |
| US5 | Als Kurator möchte ich sehen, wer meinen Listen folgt. | - Auf `/listen/[slug]` (Owner-View): Follower-Count + Liste der Follower (Avatar, Name, Link zu Profil)<br>- Nur Owner sieht Follower-Liste (Datenschutz) |

---

## 3. Scope & Nicht-Scope

**In Scope:**
- `CollectionFollow` Model (User ↔ Collection Many-to-Many)
- Follow/Unfollow API (`POST/DELETE /api/listen/[slug]/follow`)
- Follow-Count auf Listen-Detail (SSR + Client-Update)
- Gefolgte Listen in Einstellungen (`/einstellungen/listen` → Tab "Gefolgt")
- Feed-Integration: neue Items gefolzter Listen in `/feed`
- Notifications: In-App bei neuen Items, E-Mail Digest (Optional, Feature-Flag)
- Owner-View: Follower-Liste auf eigener Liste
- Feature-Flag `FEATURE_COLLECTIONS_FOLLOW` (Default: `true`)

**Out of Scope:**
- Collections folgen ohne Login (Gäste)
- Private Listen folgen (nur öffentliche Listen)
- Push-Notifications (Web Push / Mobile Push) — nur In-App + E-Mail
- Follow-Import/Export
- Listen-Empfehlungen ("Ähnliche Listen") — separates Feature
- Collections Follow für Kommentare/Reviews — separates Feature

---

## 4. Randfälle, Fehlerfälle, Leere Zustände, Berechtigungen, Nebenläufigkeit

| Fall | Behandlung |
|------|------------|
| Nicht eingeloggt | Follow-Button zeigt Login-Prompt (Modal/Redirect zu `/login?redirect=...`) |
| Eigene Liste folgen | Deaktiviert / versteckt (Owner kann eigener Liste nicht folgen) |
| Gelöschte Liste (Soft-Delete `deletedAt`) | Follow bleibt erhalten, Liste erscheint nicht mehr in Feed/Einstellungen, Unfollow möglich |
| Liste wird privat (`isPublic: false`) | Follow bleibt, neue Items erscheinen nicht mehr im Feed, Unfollow möglich |
| Doppeltes Follow (Race Condition) | DB Unique Constraint `(userId, collectionId)` → 409 Conflict, UI zeigt "Bereits gefolgt" |
| Gleichzeitiges Follow/Unfollow | Optimistic Locking via `version` auf Collection (wie bei Reorder) |
| Nutzer gelöscht | Cascade Delete Follows (Prisma `onDelete: Cascade`) |
| Liste gelöscht (Hard Delete) | Cascade Delete Follows |
| Feed: Keine gefolgten Listen / keine neuen Items | Empty State: "Noch keine gefolgten Listen. Entdecke Listen auf /listen" |
| Notification: Bereits gelesen | Idempotent via `notificationId` (User + Collection + Item + Typ) |

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

| Feature | Auswirkung |
|---------|------------|
| **Follow-System (User ↔ User)** | Keine — parallele Relation `CollectionFollow` |
| **Notifications** | Erweiterung: neuer Notification Type `COLLECTION_ITEM_ADDED` |
| **Feed (`/feed`)** | Erweiterung: Query um `CollectionFollow` joinen, neue Items filtern |
| **Review Collections** | Keine Breaking Changes — neue Relation nur additive |
| **Einstellungen (`/einstellungen/listen`)** | Neuer Tab "Gefolgt" neben "Eigene" |
| **API `/api/me/listen`** | Unverändert (eigene Listen); neue Route `/api/me/listen/followed` |

**Migration:** Reversibel (neue Tabelle `CollectionFollow`, neue Enum-Werte in `NotificationType`). Keine Datenverluste.

---

## 6. Datenmodell & Migrationen

### Prisma Schema Ergänzungen

```prisma
model CollectionFollow {
  userId        String        @db.VarChar(36)
  collectionId  String        @db.VarChar(36)
  createdAt     DateTime      @default(now())
  user          TwitchUser    @relation(fields: [userId], references: [id], onDelete: Cascade)
  collection    ReviewCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([userId, collectionId])
  @@index([userId])
  @@index([collectionId])
}

model ReviewCollection {
  // ... bestehende Felder ...
  followers     CollectionFollow[]
  followerCount Int           @default(0) // denormalisiert für SSR
  version       Int           @default(1) // optimistisches Locking (bereits vorhanden)
}

// NotificationType Enum Erweiterung
enum NotificationType {
  // ... bestehende ...
  COLLECTION_ITEM_ADDED
  COLLECTION_FOLLOWED       // Optional: wenn jemand eigener Liste folgt
}
```

### Migration (reversibel)

```sql
-- UP
CREATE TYPE "CollectionFollowNotificationType" AS ENUM ('COLLECTION_ITEM_ADDED', 'COLLECTION_FOLLOWED');

CREATE TABLE "CollectionFollow" (
  "userId"       VARCHAR(36) NOT NULL,
  "collectionId" VARCHAR(36) NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CollectionFollow_pkey" PRIMARY KEY ("userId", "collectionId"),
  CONSTRAINT "CollectionFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TwitchUser"("id") ON DELETE CASCADE,
  CONSTRAINT "CollectionFollow_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ReviewCollection"("id") ON DELETE CASCADE
);

CREATE INDEX "CollectionFollow_userId_idx" ON "CollectionFollow"("userId");
CREATE INDEX "CollectionFollow_collectionId_idx" ON "CollectionFollow"("collectionId");

ALTER TABLE "ReviewCollection" ADD COLUMN "followerCount" INTEGER NOT NULL DEFAULT 0;

-- NotificationType Enum erweitern (PostgreSQL: ALTER TYPE ... ADD VALUE)
ALTER TYPE "NotificationType" ADD VALUE 'COLLECTION_ITEM_ADDED';
ALTER TYPE "NotificationType" ADD VALUE 'COLLECTION_FOLLOWED';

-- DOWN (reversibel)
ALTER TYPE "NotificationType" DROP VALUE 'COLLECTION_ITEM_ADDED';
ALTER TYPE "NotificationType" DROP VALUE 'COLLECTION_FOLLOWED';
DROP TABLE "CollectionFollow";
ALTER TABLE "ReviewCollection" DROP COLUMN "followerCount";
```

---

## 7. API-Änderungen

| Endpoint | Methode | Auth | Beschreibung |
|----------|---------|------|--------------|
| `/api/listen/[slug]/follow` | POST | Required | Liste folgen (Body: leer) |
| `/api/listen/[slug]/follow` | DELETE | Required | Liste entfolgen |
| `/api/listen/[slug]/follow` | GET | Optional | Follow-Status + Count abrufen (für SSR) |
| `/api/me/listen/followed` | GET | Required | Eigene gefolgte Listen (Cursor Pagination) |
| `/api/feed` | GET | Required | Erweiterung: `?includeCollections=true` (Default true wenn Flag an) |

**Rate-Limit:** 30 req/min pro User (Follow/Unfollow), 60 req/min (Read).

---

## 8. UI/UX-Ablauf

### 8.1 Listen-Detail (`/listen/[slug]`)
- **Follow-Button** (rechts oben, neben Share/Edit):
  - Nicht eingeloggt: `Button` → `onClick` → `redirectToLogin(slug)`
  - Eingeloggt, nicht gefolgt: `Button` "Folgen" (Outline, + Icon)
  - Eingeloggt, gefolgt: `Button` "Gefolgt" (Filled, Check Icon) + Count Badge
  - Owner: Button versteckt, stattdessen Follower-Count + Link zu Follower-Liste (Modal)
- **Follower-Count** immer sichtbar (SSR via `followerCount`)
- **Owner-Modal "Follower"** (Klick auf Count): Liste der Follower (Avatar, Name, `@username`, Profil-Link), Pagination

### 8.2 Einstellungen → Listen (`/einstellungen/listen`)
- Tabs: ["Eigene Listen", "Gefolgte Listen"]
- **Tab "Gefolgte Listen"**: Grid/List von Karten (Cover, Titel, Kurator, Item-Count, Follow-Count, Unfollow-Button)
- Empty State: "Du folgst noch keiner Liste. Entdecke Listen auf /listen"

### 8.3 Feed (`/feed`)
- Neue Section "Aus deinen gefolgten Listen" (über/nach User-Feed)
- Items: Listen-Cover (klein), Listen-Titel (Link), Review-Titel (Link), "Hinzugefügt vor Xh"
- Gruppe pro Liste (max 3 neueste Items pro Liste, "Alle X anzeigen" → Listen-Detail)

### 8.4 Notifications (Glocke)
- Typ `COLLECTION_ITEM_ADDED`: "Neu in **{Listen-Titel}**: {Review-Titel}"
- Aktion: Klick → Listen-Detail (`/listen/[slug]?highlight=item-{id}`)
- Grouping: Mehrere Items derselben Liste → "3 neue Einträge in {Listen-Titel}"

### 8.5 Barrierefreiheit
- Follow-Button: `aria-pressed` (true/false), `aria-label` ("Liste folgen", "Liste nicht mehr folgen")
- Fokus-Management nach Toggle (Button behält Fokus)
- Reduced Motion: Toast-Animation respektiert `prefers-reduced-motion`
- Screen-Reader: Live-Region für Toast-Bestätigung (`aria-live="polite"`)

---

## 9. Sicherheit & Performance

**Sicherheit:**
- Input-Validierung: `slug` via Zod (bereits in `listen/[slug]` vorhanden)
- Authorization: `userId` aus Session, Owner-Check für Follower-Liste
- Rate-Limiting: Follow/Unfollow 30/min, Read 60/min
- Keine Secrets im Code, keine PII in Logs

**Performance:**
- `followerCount` denormalisiert auf `ReviewCollection` → SSR ohne Extra-Query
- `unstable_cache` für:
  - `/api/listen/[slug]/follow` GET (30s, Tag: `collection-follow:{slug}`)
  - `/api/me/listen/followed` (60s, Tag: `user-followed-collections:{userId}`)
  - Feed-Collection-Items (30s, Tag: `feed-collections:{userId}`)
- Cache-Invaliderung bei Follow/Unfollow/Item-Add via `revalidateTag`
- Cursor-Pagination (max 20) für Followed-Listen & Feed
- DB-Indizes auf `CollectionFollow(userId)`, `CollectionFollow(collectionId)`

---

## 10. Teststrategie

| Test-Art | Abdeckung |
|----------|-----------|
| **Unit** | `lib/collections-follow.ts`: `toggleFollow`, `getFollowStatus`, `getFollowedCollections`, `getFollowers` (Edge Cases: Duplicate, Not Found, Owner, Deleted Collection) |
| **Unit** | `lib/notifications.ts`: `createCollectionItemAddedNotification` (Grouping, Idempotenz) |
| **Integration** | API `/api/listen/[slug]/follow` POST/DELETE/GET (Auth, Rate-Limit, Validation, Count-Sync) |
| **Integration** | API `/api/me/listen/followed` (Pagination, Filter, Auth) |
| **Integration** | Feed `/api/feed` mit `includeCollections=true` (Joins, Filter, Pagination) |
| **Integration** | Notification Trigger bei `POST /api/listen/[slug]/items` (CollectionFollow → Notification) |
| **E2E** | Follow-Flow: Login → Listen-Detail → Follow → Feed zeigt Item → Unfollow → Feed entfernt |
| **E2E** | Owner sieht Follower-Liste, Nicht-Owner nicht |
| **E2E** | Empty States (keine gefolgten Listen, keine Follower) |

**Test-Daten:** Fixtures für `TwitchUser`, `ReviewCollection`, `CollectionItem`, `CollectionFollow`.

---

## 11. Rollout-Plan & Feature-Flag

- **Feature-Flag:** `FEATURE_COLLECTIONS_FOLLOW` (Env: `FEATURE_COLLECTIONS_FOLLOW=true`, Default: `true`)
- **Rollout:** Flag an → alle Nutzer sofort (kein Gradual Rollout nötig, niedriges Risiko)
- **Fallback:** Flag aus → API gibt 404, UI-Komponenten rendern nicht (Feature-Flag-Guard in Components)
- **Migration:** `prisma migrate deploy` vor Deploy (reversibel)

---

## 12. Review-Checkliste (F6 - Self-Review)

- [ ] Alle 5 User Stories implementiert & getestet
- [ ] Randfälle: Nicht eingeloggt, Owner, Gelöschte/Private Listen, Race Conditions behandelt
- [ ] Eingaben validiert (Zod), Autorisierung geprüft (Session, Owner-Check)
- [ ] Keine N+1-Queries (denormalisierter `followerCount`, Joins in Feed optimiert)
- [ ] Migration reversibel (DOWN-Skript vorhanden)
- [ ] Bestehende Tests grün, keine Breaking Changes
- [ ] UI: Alle Zustände (Loading, Error, Empty, Success), a11y (ARIA, Fokus, Reduced Motion)
- [ ] Feature-Flag schaltet Feature vollständig ab
- [ ] Dokumentation (CHANGELOG, README, .env.example) aktualisiert

---

## 13. offene Fragen / Entscheidungen

| Frage | Status | Entscheidung |
|-------|--------|--------------|
| E-Mail Digest für Collections Follow? | Offen | Initial **nicht** (zusätzlicher Aufwand: Cron, Template, Prefs). In-App Notification reicht für MVP. Später per Flag zuschaltbar. |
| Follower-Liste öffentlich oder nur Owner? | Entschieden | **Nur Owner** (Datenschutz, entspricht User-Follows) |
| Benachrichtigung bei Reorder (Reihenfolge geändert)? | Entschieden | **Nein** — nur bei neuen Items (`COLLECTION_ITEM_ADDED`). Reorder ist kuratorisch, kein "neuer Inhalt". |
| Hard Delete vs Soft Delete bei Collection? | Entschieden | **Soft Delete** (`deletedAt`) bleibt — Follows bleiben erhalten, Unfollow möglich. |