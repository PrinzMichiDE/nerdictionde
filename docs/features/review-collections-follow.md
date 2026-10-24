# Feature-Spec: Review Collections Follow

**Datum:** 2026-10-24
**Status:** In Arbeit (F1–F2)
**Branch:** `auto/dev`
**Feature-Flag:** `FEATURE_COLLECTIONS_FOLLOW` (Default: `true`)

---

## 1. Problem und Nutzen

**Problem:** Nutzer können Review-Collections (kuratierte Listen) entdecken und lesen, aber nicht *folgen*. Wenn ein Kurator neue Reviews zur Liste hinzufügt oder die Reihenfolge ändert, erfahren Follower davon nichts. Es fehlt ein Mechanismus für passive Entdeckung und Benachrichtigung bei Updates von Listen, denen man vertraut.

**Nutzen:**
- **Entdeckung:** Nutzer finden neue Reviews über kuratierte Listen, denen sie folgen, statt nur über Suche/Kategorien.
- **Engagement:** Kuratoren erhalten Feedback (Follower-Zahl), Leser bleiben durch Benachrichtigungen am Ball.
- **Retention:** Regelmäßige Updates im Feed bringen Nutzer zurück auf die Plattform.
- **Community:** Stärkt die Beziehung zwischen Kuratoren und Lesern.

**Zielgruppe:** Endnutzer (Leser), die kuratierte Inhalte schätzen; Kuratoren, die Reichweite aufbauen wollen.

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| US1 | Als Nutzer möchte ich eine Collection folgen, um Updates im Feed zu sehen. | - Follow-Button auf `/listen/[slug]` (neben Share-Button)<br>- Optimistisches UI (sofortige Anzeige)<br>- Follow-Zähler wird inkrementiert<br>- Authentifizierung erforderlich (Twitch-Login) |
| US2 | Als Nutzer möchte ich eine Collection entfolgen. | - Follow-Button wechselt Zustand (Follow/Unfollow)<br>- Zähler dekrementiert<br>- Entfernt aus `/einstellungen/gefolgte-listen` |
| US3 | Als Nutzer sehe ich meine gefolgenen Collections in den Einstellungen. | - Tab "Gefolgte Listen" unter `/einstellungen/gefolgte-listen`<br>- Liste mit Cover, Titel, Kurator, Item-Count, letztes Update<br>- Pagination (Cursor-basiert)<br>- Unfollow direkt möglich |
| US4 | Als Nutzer erhalte ich Benachrichtigungen bei Updates gefolzter Collections. | - Notification bei: neues Item hinzugefügt, Item entfernt, Reorder, Titel/Beschreibung geändert<br>- Nutzung bestehender Notification-Infrastruktur (`NotificationType.COLLECTION_UPDATE`)<br>- Link führt zu `/listen/[slug]` |
| US5 | Als Kurator sehe ich die Follower-Zahl meiner Collection. | - Anzeige auf `/listen/[slug]` (öffentlich)<br>- In `/einstellungen/listen` bei eigenen Listen<br>- In Collection-Card auf `/listen` (Entdecken) |
| US6 | Als Nutzer entdecke ich beliebte Collections zum Folgen. | - Sortierung "Beliebt" (Follower-Count) auf `/listen`<br>- "Zum Folgen empfohlen" Sektion auf `/listen` (basierend auf eigenen Follows/Interessen) |

---

## 3. Scope & Nicht-Scope

**In Scope:**
- `CollectionFollow` Model (User ↔ Collection Many-to-Many)
- API: `POST/DELETE /api/listen/[slug]/follow`, `GET /api/me/followed-collections`
- UI: Follow-Button auf Collection-Detail, "Gefolgte Listen" in Einstellungen
- Notifications: Erweiterung `NotificationType` um `COLLECTION_UPDATE`
- Feed-Integration: Followed Collections erscheinen im bestehenden Feed (`/feed`)
- Sortierung "Beliebt" auf `/listen`

**Out of Scope (explizit):**
- E-Mail-Benachrichtigungen (nur In-App Notifications, Newsletter-Prefs bleiben unberührt)
- Follow von privaten Collections (nur öffentliche Collections können gefolgt werden)
- Collection-Follow-Import/Export
- Empfehlungs-Algorithmus (einfache Heuristik: "Collections von Kuratoren, denen du folgst" + "Beliebte Collections")
- Push-Notifications (Web Push API) — später separat

---

## 4. Randfälle, Fehlerfälle, Leere Zustände, Berechtigungen, Nebenläufigkeit

| Fall | Behandlung |
|------|------------|
| Nicht eingeloggt | Follow-Button zeigt Login-Prompt (Link zu `/auth/login?redirect=...`) |
| Collection gelöscht (`deletedAt` gesetzt) | Follow bleibt in DB (Soft-Delete), aber Collection nicht mehr in Feed/Einstellungen sichtbar; Unfollow möglich |
| Collection privat gemacht | Follow bleibt bestehen, aber Collection verschwindet aus Feed/Einstellungen bis wieder öffentlich |
| Doppeltes Follow | Idempotent: `POST` auf bestehenden Follow → 200 OK, kein zweiter Eintrag (Unique Constraint) |
| Race Condition Follow/Unfollow | Optimistisches Locking via `version` auf `ReviewCollection` (wie bei Reorder); Retry bei Konflikt |
| Selbst-Follow (Owner folgt eigener Liste) | Erlaubt (Kurator will Updates sehen), aber UI unterscheidet nicht |
| Nutzer gelöscht | Cascade Delete auf `CollectionFollow` (Prisma `onDelete: Cascade`) |
| Collection gelöscht (hard) | Nicht vorgesehen (nur Soft-Delete via `deletedAt`) |
| Leere Zustände | `/einstellungen/gefolgte-listen`: "Du folgst noch keinen Listen. Entdecke Listen auf /listen"<br>`/listen` Sort "Beliebt": Fallback auf "Neueste" wenn keine Follows |

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

| Feature | Auswirkung |
|---------|------------|
| **Review Collections** | Neues Feld `followersCount` (denormalisiert) auf `ReviewCollection`; Migration fügt Spalte hinzu, Default 0 |
| **Public User Profiles / Follow-System** | Wiederverwendung: `Notification`-Model, `Feed`-Logik, `Follow`-Pattern (User↔User) → analog User↔Collection |
| **Notifications** | Neuer `NotificationType.COLLECTION_UPDATE`; bestehende Preferences (`notificationPreferences`) steuern Anzeige |
| **Feed (`/feed`)** | Query um `CollectionFollow` erweitert; Items aus gefolzten Collections gemischt mit User-Follows |
| **API `/api/me/listen`** | Unverändert (eigene Listen); neuer Endpoint `/api/me/followed-collections` |
| **Database** | 1 neue Migration (reversibel): `CollectionFollow` Model + `followersCount` auf `ReviewCollection` + Index |
| **Feature-Flag** | `FEATURE_COLLECTIONS_FOLLOW` schaltet API + UI komplett ab (Fallback: Feature unsichtbar) |

**Abwärtskompatibilität:** Keine Breaking Changes. Bestehende Collections, Follows (User↔User), Notifications, Feed funktionieren unverändert.

---

## 6. Datenmodell & Migrationen

### Prisma Schema Erweiterungen

```prisma
model ReviewCollection {
  // ... bestehende Felder ...
  followersCount Int       @default(0)
  followers      CollectionFollow[]
  // version bleibt für optimistisches Locking (Reorder)
}

model CollectionFollow {
  id             String    @id @default(cuid())
  userId         String
  user           TwitchUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  collectionId   String
  collection     ReviewCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  createdAt      DateTime  @default(now())

  @@unique([userId, collectionId])
  @@index([userId])
  @@index([collectionId])
  @@map("collection_follows")
}

enum NotificationType {
  // ... bestehende ...
  COLLECTION_UPDATE
}
```

### Migration (reversibel)

```sql
-- UP
CREATE TABLE "collection_follows" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "collection_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collection_follows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collection_follows_user_id_collection_id_key" ON "collection_follows"("user_id", "collection_id");
CREATE INDEX "collection_follows_user_id_idx" ON "collection_follows"("user_id");
CREATE INDEX "collection_follows_collection_id_idx" ON "collection_follows"("collection_id");

ALTER TABLE "review_collections" ADD COLUMN "followers_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "collection_follows" ADD CONSTRAINT "collection_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "twitch_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_follows" ADD CONSTRAINT "collection_follows_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "review_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enum-Erweiterung für NotificationType (PostgreSQL)
ALTER TYPE "NotificationType" ADD VALUE 'COLLECTION_UPDATE';

-- DOWN
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM ('FOLLOW', 'REVIEW_COMMENT', 'COMMENT_REPLY', 'COMMENT_VOTE', 'REVIEW_REACTION', 'COLLECTION_ITEM_ADDED'); -- ohne COLLECTION_UPDATE
-- Data migration falls Notifications existieren...
DROP TYPE "NotificationType_old";

ALTER TABLE "review_collections" DROP COLUMN "followers_count";
DROP TABLE "collection_follows";
```

---

## 7. API-Änderungen

### Endpoints

| Method | Path | Beschreibung | Auth | Rate-Limit |
|--------|------|--------------|------|------------|
| POST | `/api/listen/[slug]/follow` | Collection folgen | Ja (Session) | 30/min |
| DELETE | `/api/listen/[slug]/follow` | Collection entfolgen | Ja (Session) | 30/min |
| GET | `/api/me/followed-collections` | Gefolgte Collections (paginiert) | Ja (Session) | 60/min |
| GET | `/api/listen/[slug]/follow-status` | Follow-Status + Count (für SSR) | Optional | 120/min |

### Request/Response Schemas (Zod)

```typescript
// POST /api/listen/[slug]/follow
// Request: leer (Body optional, für Future-Proofing)
// Response 200: { followed: true, followersCount: number }
// Response 401: { error: "Nicht authentifiziert" }
// Response 404: { error: "Collection nicht gefunden" }
// Response 403: { error: "Collection nicht öffentlich" }

// DELETE /api/listen/[slug]/follow
// Response 200: { followed: false, followersCount: number }

// GET /api/me/followed-collections?cursor=&limit=20
// Response 200: {
//   collections: CollectionWithFollowInfo[],
//   nextCursor: string | null
// }
// CollectionWithFollowInfo: { id, slug, title, description, coverImage, owner: { id, username, displayName, image }, itemCount, followersCount, updatedAt, isFollowing: true }

// GET /api/listen/[slug]/follow-status
// Response 200: { isFollowing: boolean, followersCount: number }
```

---

## 8. UI/UX-Ablauf

### Collection-Detail (`/listen/[slug]`) — Follow-Button

**Zustände:**
- **Nicht eingeloggt:** Button "Folgen" → Klick → Redirect `/auth/login?redirect=/listen/[slug]`
- **Nicht gefolgt:** Button "Folgen" (Outline) + Zähler → Klick → Optimistisch "Gefolgt" (Filled) + Count+1
- **Gefolgt:** Button "Gefolgt" (Filled, Herz/Bookmark-Icon) + Zähler → Klick → Optimistisch "Folgen" (Outline) + Count-1
- **Lädt:** Spinner im Button, disabled
- **Fehler:** Toast "Fehler beim Folgen", Rollback UI

**Barrierefreiheit:**
- `aria-pressed` auf Button (true/false)
- `aria-label`: "Collection folgen" / "Collection entfolgen"
- Fokus-Style sichtbar (`focus-visible:ring-2`)
- Screen-Reader: Live-Region für Count-Änderung (`aria-live="polite"`)

### Einstellungen: Gefolgte Listen (`/einstellungen/gefolgte-listen`)

- Server Component (SSR) für SEO/Initial-Load
- Client Component für Interaktion (Unfollow, Pagination)
- Grid wie `/listen` aber mit "Gefolgt"-Badge und Unfollow-Button pro Karte
- Leerer Zustand: CTA "Listen entdecken" → Link zu `/listen`

### Entdecken (`/listen`) — Sortierung "Beliebt"

- Neuer Sort-Parameter `sort=popular` (nach `followersCount` DESC, dann `updatedAt` DESC)
- Default bleibt `sort=latest`
- URL-sharebar (`?sort=popular&page=2`)

### Feed (`/feed`) — Integration

- Bestehende Feed-Query um Items aus gefolzten Collections erweitern
- Collection-Items bekommen Label "Aus gefolzter Liste: [Titel]" + Link zur Collection
- Deduplizierung: Wenn Review bereits via User-Follow im Feed → nur einmal anzeigen (höhere Priorität: User-Follow)

---

## 9. Sicherheit, Validierung, Performance

**Sicherheit:**
- Alle mutierenden Endpoints: CSRF-Schutz (Next.js Default), Session-Validierung (`getServerSession`)
- Authorization: Nur öffentliche Collections (`deletedAt` null, `isPublic` true) können gefolgt werden
- Rate-Limiting: 30 req/min pro User für Follow/Unfollow (verhindert Spam)
- Input-Validierung: `slug` via Zod (bereits in Route-Params), keine User-Input im Body nötig

**Performance:**
- `followersCount` denormalisiert auf `ReviewCollection` → kein `COUNT(*)` bei jedem Request
- `unstable_cache` für `/api/me/followed-collections` (60s, Tags: `user:${userId}:followed-collections`)
- Cache-Invaliderung bei Follow/Unfollow: `revalidateTag(user:${userId}:followed-collections)` + `revalidateTag(collection:${collectionId}:followers)`
- Feed-Query: `CollectionFollow` Join mit `ReviewCollection` → `CollectionItem` → `Review`; Indizes auf `userId`, `collectionId` vorhanden
- N+1 vermeiden: `include: { collection: { include: { items: { include: { review: true } } } }` mit `take` Limit

**Skalierbarkeit:**
- `CollectionFollow` Tabelle wächst linear mit Follows; bei 100k Usern × 50 Follows = 5M Rows → Index reicht
- Denormalisierter Counter vermeidet teure Aggregationen
- Batch-Invalidierung bei Collection-Update: ein `revalidateTag` pro Collection

---

## 10. Teststrategie

### Unit-Tests (`vitest`)
- `lib/collection-follow.ts`: `toggleFollow`, `getFollowStatus`, `getFollowedCollections` — Logik, Edge-Cases (Duplicate, Deleted Collection, Private Collection)
- `lib/collection-follow-schema.ts`: Zod-Schemas (Validierung, Fehlermeldungen)
- `components/collections/CollectionFollowButton.tsx`: Rendering aller Zustände, a11y-Attribute, Optimistic UI

### Integration-Tests (`vitest` + Test-DB)
- `POST /api/listen/[slug]/follow`: Auth, Idempotenz, Counter-Inkrement, Notification-Erstellung
- `DELETE /api/listen/[slug]/follow`: Auth, Counter-Dekrement, Cleanup
- `GET /api/me/followed-collections`: Pagination, Cursor, Filter (nur öffentliche), Sortierung
- `GET /api/listen/[slug]/follow-status`: SSR-Counts, Public Access
- Feed-Integration: Items aus gefolzten Collections erscheinen im Feed, Deduplizierung

### E2E-Tests (`e2e` / Playwright)
- Flow: Login → Collection öffnen → Folgen → Feed prüfen → Einstellungen "Gefolgte Listen" → Entfolgen
- Nicht eingeloggt: Follow-Button → Login-Redirect → zurück → gefolgt
- Barrierefreiheit: Tastaturnavigation, Screen-Reader-Labels

**Testdaten:** Seed-Script für 3 User, 5 Collections (verschiedene Owner), Items, Follows.

---

## 11. Rollout-Plan & Feature-Flag

**Feature-Flag:** `FEATURE_COLLECTIONS_FOLLOW` (Environment Variable, Default `true`)

**Rollout:**
1. Flag auf `true` in `.env.example` und Vercel Preview
2. Deployment auf Preview → Manuelle Tests (E2E-Checkliste)
3. Flag auf `true` in Production (Vercel Env)
4. Monitoring: Follow-Rate, Feed-Engagement, Error-Rate (Sentry)

**Rollback:** Flag auf `false` → API liefert 404, UI-Komponenten rendern nicht (Feature unsichtbar), DB unverändert.

---

## 12. Review-Checkliste (F6 — Self-Review)

*Wird nach Implementierung ausgefüllt.*

- [ ] Jedes Akzeptanzkriterium der Spec ist erfüllt und getestet
- [ ] Randfälle und Fehlerpfade behandelt, keine unbehandelten Exceptions
- [ ] Eingaben validiert, Autorisierung geprüft, keine Secrets im Code
- [ ] Keine Performance-Fallen (N+1-Abfragen, unnötige Re-Renders, fehlende Indizes)
- [ ] Migrationen reversibel, bestehende Daten bleiben intakt
- [ ] Abwärtskompatibilität gewahrt, bestehende Tests grün
- [ ] Konsistenz mit Code-Stil und Architektur, keine toten Codeteile
- [ ] UI: alle Zustände vorhanden, Barrierefreiheit beachtet

---

## 13. Offene Fragen / Spätere Erweiterungen

- **E-Mail-Digest:** Wöchentliche Zusammenfassung "Neues aus deinen gefolzten Listen" (später, Newsletter-Integration)
- **Collection-Follow-Empfehlungen:** ML-basiert (später, Personalisierte Empfehlungen)
- **Private Collections folgen:** Erlauben, wenn Owner explizit teilt (Invite-Link)
- **Collection-Follow-Analytics:** Für Kuratoren (Wer folgt? Wann? Welche Items performen?)

---

*Spec erstellt im Rahmen der autonomen Entwicklung (F1–F2). Nächster Schritt: F3 Design & Plan.*