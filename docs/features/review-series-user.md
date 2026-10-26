# Feature Spec: Review-Serien für Nutzer (User-Created Series)

## 1. Problem und Nutzen

**Problem:** Nutzer möchten eigene kuratierte Listen von Reviews erstellen (z. B. "Meine Top 10 RPGs 2024", "Beste Co-op Spiele für Paare", "Hidden Gems der 2010er"). Das bestehende Review-Serien-System ist nur für Admins zugänglich. Es gibt keine Möglichkeit für Nutzer, eigene Serien zu erstellen, zu teilen und kollaborativ zu pflegen.

**Nutzen:**
- **Für Nutzer (Ersteller):** Eigene kuratierte Listen erstellen, öffentlich/privat teilen, als "Meine Liste" speichern, SEO-freundliche Seiten generieren
- **Für Nutzer (Leser):** Entdeckung kuratierter Listen von Gleichgesinnten, Follow-Funktion für Updates, Teilen in sozialen Medien
- **Für Plattform:** User Generated Content (UGC), höhere Verweildauer, Viralität durch Teilen, Community-Bildung, SEO durch Long-Tail-Serien-Seiten

**Zielgruppe:** Eingeloggte Nutzer (TwitchUser), alle Leser (öffentlich)

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| US1 | Als eingeloggter Nutzer erstelle ich eine eigene Serie (`/serien/neu`) mit Titel, Beschreibung, Cover (optional), Sichtbarkeit (öffentlich/privat), und füge Reviews per Suche/Select hinzu (Drag-and-Drop Reihenfolge). | - Form mit Validierung (Titel 1-200, Beschreibung max 5000, Cover URL optional)<br>- Review-Suche mit Autocomplete (bestehende Reviews)<br>- DnD für Reihenfolge, Max 50 Teile<br>- Slug Auto-Generierung mit Kollision-Handling (`-2`, `-3`)<br>- Feature-Flag `FEATURE_USER_SERIES` |
| US2 | Als Ersteller bearbeite ich meine Serie (`/serien/[slug]/bearbeiten`): Titel, Beschreibung, Cover, Sichtbarkeit, Reviews hinzufügen/entfernen, Reihenfolge ändern (DnD). | - Owner-Check (nur Ersteller + Admins)<br>- PATCH API mit Zod-Validierung<br>- Optimistische UI, Toast-Feedback<br>- Reorder validiert 1..N lückenlos<br>- Soft-Delete bei Entfernen (Relation lösen) |
| US3 | Als Ersteller lösche ich meine Serie (Soft-Delete via `deletedAt`). | - DELETE API, Owner-Check<br>- Bestätigungsdialog<br>- Serie wird ausgeblendet, Daten bleiben für History |
| US4 | Als Leser sehe ich öffentliche Nutzer-Serien auf `/serien` (gemischt mit Admin-Serien, gefilterbar nach "Erstellt von: Admin/Nutzer"). | - Server Component `/serien` zeigt beide Typen<br>- Filter-Chip "Typ: Admin / Nutzer"<br>- Badge auf Karte: "Von @username" |
| US5 | Als Leser sehe ich eine Nutzer-Serie auf `/serien/[slug]` mit Hero, Teilen-Liste, Scores, Share-Button, SEO/OG-Tags, Hinweis "Erstellt von @username". | - SSR wie Admin-Serie, aber Owner-Info<br>- Parts-Liste mit Review-Cards<br>- Share-Button (bestehende ShareButtons)<br>- `og:type=website`, `og:title`, `og:description`, `og:image` |
| US6 | Als Leser folge ich einer öffentlichen Nutzer-Serie (Follow-Button, optimistische UI, SSR-Count, Benachrichtigung bei neuen Items). | - Reuses `CollectionFollow` Pattern<br>- `UserSeriesFollow` Model (neu)<br>- Feed-Integration (`/feed?includeUserSeries=true`)<br>- Notification Type `user_series_update` |
| US7 | Als Leser sehe ich auf meinem Profil (`/u/[username]`) einen Tab "Serien" mit meinen erstellten (öffentlich/privat) und gefolgenen Serien. | - Tab "Serien" auf Profil<br>- Zwei Sections: "Erstellt" & "Gefolgt"<br>- Privat-Serien nur für Owner sichtbar |
| US8 | Als Ersteller lade ich andere Nutzer zur Kollaboration ein (Co-Owner / Editor), die Reviews hinzufügen/entfernen/reordern dürfen. | - `UserSeriesCollaborator` Model (neu)<br>- Rollen: `OWNER`, `EDITOR`<br>- Einladung per Username/Email, Accept-Flow<br>- Berechtigungs-Check in API |

**Nicht-Scope (explizit):**
- Automatische Serie-Erkennung via Titel-Pattern
- Serie-spezifische Kommentare/Foren (nutzt bestehende Review-Kommentare)
- Bewertung der Serie als Ganzes (nur aggregierter Score)
- Mehrsprachige Serientitel (ein Slug, ein Titel pro Locale später)
- Import/Export von Serien (JSON, CSV) — später
- Serie-Forking (Kopie erstellen) — später

---

## 3. Scope & Abgrenzung

**In Scope:**
- Erweiterung bestehender `ReviewSeries` Model: `ownerId`, `visibility` (PUBLIC/PRIVATE), `type` (ADMIN/USER), `collaborators` Relation
- Neue Models: `UserSeriesFollow`, `UserSeriesCollaborator`
- User-API: CRUD für eigene Serien, Follow/Unfollow, Collaborators verwalten
- Public API: Liste (mit Filter), Detail, Feed-Integration
- UI: Erstellung (`/serien/neu`), Bearbeitung (`/serien/[slug]/bearbeiten`), Profil-Tab, Follow-Button
- Search-API: `series` Feld existiert bereits, `ownerId`/`type`/`visibility` als Filter
- Feature-Flag `FEATURE_USER_SERIES` (Default: `true`)
- Tests: Unit, Integration, E2E

**Out of Scope:**
- Automatische Erkennung
- Serie-Kommentare/Foren
- Serie-Rating
- Mehrsprachigkeit
- Import/Export, Forking

---

## 4. Randfälle, Fehlerfälle, leere Zustände, Berechtigungen, Nebenläufigkeit

| Fall | Behandlung |
|------|------------|
| Serie mit 0 Teilen | Erlaubt (Draft), aber nicht öffentlich sichtbar bis ≥1 Teil |
| Serie mit 1 Teil | Wird als Serie gerendert (anders als Admin-Serien) |
| Review in 2 Serien (User + Admin) | Erlaubt: `ReviewSeriesItem.reviewId` unique pro Serie-Typ, aber Nutzer kann Review in eigener Serie UND in Admin-Serie haben → **Änderung:** `ReviewSeriesItem` unique auf `(seriesId, reviewId)` reicht, da `seriesId` unterschiedlich |
| Gleichzeitiges Edit durch Owner + Collaborator | Optimistisches Locking via `version` auf `ReviewSeries` (bereits vorhanden) |
| Gelöschtes Review in User-Serie | Soft-Delete: Review bleibt in Serie, Badge "Nicht verfügbar", nicht verlinkt |
| Owner löscht Account | Serie: `ownerId` auf `null` setzen, `deletedAt` setzen, Collaborator wird Owner (ältester) oder Serie wird Admin-übernommen |
| Unbefugter Zugriff Bearbeiten/Löschen | 403, Owner/Admin/Collaborator(EDITOR) only |
| Private Serie teilen | Link funktioniert nur für Owner/Collaborators, 404 für andere |
| Slug-Kollision | Auto-Suffix `-2`, `-3` wie bei Collections |
| Max 50 Teile erreicht | Validierung: 400 "Maximale Teileanzahl (50) erreicht" |
| Collaborator-Einladung an nicht-existierenden User | 404 "Nutzer nicht gefunden" |
| Selbst-Einladung | 400 "Du kannst dich nicht selbst einladen" |

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

- **ReviewSeries Model:** Neue Felder `ownerId`, `visibility`, `type`, `collaborators` — additive, keine Breaking Changes
- **Bestehende Admin-Serien:** `type=ADMIN`, `ownerId=null`, `visibility=PUBLIC` — unverändert
- **Public API `/api/serien`:** Neue Query-Parameter `type=ADMIN|USER`, `visibility=PUBLIC|PRIVATE`, `ownerId` — additive
- **Public API `/api/serien/[slug]`:** Prüft `visibility` + Berechtigung — additive
- **Review-Detail Serie-Badge:** Zeigt beide Typen an, Link zu `/serien/[slug]` — unverändert
- **Search API:** `series` Feld existiert, neue Filter `series.type`, `series.visibility` — additive
- **Migration:** Reversibel (Spalten droppbar, Tabellen droppbar)
- **Feature-Flag:** `FEATURE_USER_SERIES` — kann per Env abgeschaltet werden (UI/API 404)

---

## 6. Datenmodell & Migrationen

### Prisma Schema Ergänzungen

```prisma
// Bestehendes ReviewSeries erweitern
model ReviewSeries {
  id             String   @id @default(cuid())
  slug           String   @unique
  title          String
  description    String?  @db.Text
  coverImage     String?
  partCount      Int      @default(0)
  aggregateScore Float?
  shareCounts    Json?    @default("{}") @map("share_counts")
  version        Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  // NEU: User-Series Felder
  ownerId        String?  @map("owner_id")           // Null für Admin-Serien
  owner          TwitchUser? @relation("UserSeriesOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  visibility     SeriesVisibility @default(PUBLIC)  // PUBLIC, PRIVATE
  type           SeriesType @default(ADMIN)         // ADMIN, USER

  items          ReviewSeriesItem[]
  reviews        Review[] // Inverse relation for Review.series
  followers      UserSeriesFollow[]                 // NEU
  collaborators  UserSeriesCollaborator[]           // NEU

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

// NEU: Follow für User-Serien (analog CollectionFollow)
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

// NEU: Kollaboratoren für User-Serien
enum CollaboratorRole {
  OWNER
  EDITOR
}

model UserSeriesCollaborator {
  id        String            @id @default(cuid())
  userId    String            @map("user_id")
  user      TwitchUser        @relation(fields: [userId], references: [id], onDelete: Cascade)
  seriesId  String            @map("series_id")
  series    ReviewSeries      @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  role      CollaboratorRole  @default(EDITOR)
  invitedAt DateTime          @default(now()) @map("invited_at")
  acceptedAt DateTime?        @map("accepted_at")

  @@unique([userId, seriesId])
  @@index([userId])
  @@index([seriesId])
  @@map("user_series_collaborators")
}

enum SeriesVisibility {
  PUBLIC
  PRIVATE
}

enum SeriesType {
  ADMIN
  USER
}
```

### Migration (reversibel)

```sql
-- UP
-- Enums
CREATE TYPE "SeriesVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "SeriesType" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "CollaboratorRole" AS ENUM ('OWNER', 'EDITOR');

-- ReviewSeries: neue Spalten
ALTER TABLE "review_series" ADD COLUMN "owner_id" TEXT;
ALTER TABLE "review_series" ADD COLUMN "visibility" "SeriesVisibility" NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "review_series" ADD COLUMN "type" "SeriesType" NOT NULL DEFAULT 'ADMIN';

-- Bestehende Admin-Serien: owner_id=NULL, visibility=PUBLIC, type=ADMIN (Default)
-- Indizes
CREATE INDEX "review_series_owner_id_idx" ON "review_series"("owner_id");
CREATE INDEX "review_series_type_visibility_idx" ON "review_series"("type", "visibility");

-- FK für ownerId
ALTER TABLE "review_series" ADD CONSTRAINT "review_series_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "twitch_users"("id") ON DELETE SET NULL;

-- UserSeriesFollow
CREATE TABLE "user_series_follows" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "series_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_series_follows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_series_follows_user_id_series_id_key" ON "user_series_follows"("user_id", "series_id");
CREATE INDEX "user_series_follows_user_id_idx" ON "user_series_follows"("user_id");
CREATE INDEX "user_series_follows_series_id_idx" ON "user_series_follows"("series_id");
ALTER TABLE "user_series_follows" ADD CONSTRAINT "user_series_follows_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "twitch_users"("id") ON DELETE CASCADE;
ALTER TABLE "user_series_follows" ADD CONSTRAINT "user_series_follows_series_id_fkey"
  FOREIGN KEY ("series_id") REFERENCES "review_series"("id") ON DELETE CASCADE;

-- UserSeriesCollaborator
CREATE TABLE "user_series_collaborators" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "series_id" TEXT NOT NULL,
  "role" "CollaboratorRole" NOT NULL DEFAULT 'EDITOR',
  "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accepted_at" TIMESTAMP(3),
  CONSTRAINT "user_series_collaborators_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_series_collaborators_user_id_series_id_key" ON "user_series_collaborators"("user_id", "series_id");
CREATE INDEX "user_series_collaborators_user_id_idx" ON "user_series_collaborators"("user_id");
CREATE INDEX "user_series_collaborators_series_id_idx" ON "user_series_collaborators"("series_id");
ALTER TABLE "user_series_collaborators" ADD CONSTRAINT "user_series_collaborators_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "twitch_users"("id") ON DELETE CASCADE;
ALTER TABLE "user_series_collaborators" ADD CONSTRAINT "user_series_collaborators_series_id_fkey"
  FOREIGN KEY ("series_id") REFERENCES "review_series"("id") ON DELETE CASCADE;

-- DOWN (reversibel)
ALTER TABLE "review_series" DROP CONSTRAINT "review_series_owner_id_fkey";
DROP INDEX "review_series_type_visibility_idx";
DROP INDEX "review_series_owner_id_idx";
ALTER TABLE "review_series" DROP COLUMN "type";
ALTER TABLE "review_series" DROP COLUMN "visibility";
ALTER TABLE "review_series" DROP COLUMN "owner_id";

DROP TABLE "user_series_collaborators";
DROP TABLE "user_series_follows";

DROP TYPE "CollaboratorRole";
DROP TYPE "SeriesType";
DROP TYPE "SeriesVisibility";
```

---

## 7. API-Änderungen

### User API (erfordert Auth, Owner/Collaborator-Check)

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/user/serien` | GET | Meine Serien (Owner + Collaborator), Filter: `visibility`, `cursor`, `limit` |
| `/api/user/serien` | POST | Serie erstellen `{ title, description?, coverImage?, visibility?, reviewIds[] }` |
| `/api/user/serien/[slug]` | GET | Serie zum Bearbeiten laden (Owner/Collaborator only) |
| `/api/user/serien/[slug]` | PATCH | Serie updaten `{ title?, description?, coverImage?, visibility?, items?: {reviewId, seriesOrder}[] }` |
| `/api/user/serien/[slug]` | DELETE | Serie löschen (Soft-Delete, Owner only) |
| `/api/user/serien/[slug]/reorder` | POST | Reorder `{ items: {reviewId, seriesOrder}[], version }` |
| `/api/user/serien/[slug]/items` | POST | Item hinzufügen `{ reviewId }` |
| `/api/user/serien/[slug]/items/[reviewId]` | DELETE | Item entfernen |
| `/api/user/serien/[slug]/follow` | GET/POST/DELETE | Follow-Status, Folgen, Entfolgen |
| `/api/user/serien/[slug]/collaborators` | GET | Collaborators liste |
| `/api/user/serien/[slug]/collaborators` | POST | Collaborator einladen `{ userId, role }` |
| `/api/user/serien/[slug]/collaborators/[userId]` | PATCH | Rolle ändern `{ role }` |
| `/api/user/serien/[slug]/collaborators/[userId]` | DELETE | Collaborator entfernen |

### Public API (erweitert)

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/serien` | GET | Liste: neue Query `type=ADMIN|USER`, `visibility=PUBLIC|PRIVATE`, `ownerId` |
| `/api/serien/[slug]` | GET | Detail: prüft `visibility` + Berechtigung (Owner/Collaborator sehen PRIVATE) |

### Feed API Erweiterung

- `GET /api/feed?includeUserSeries=true` → merged Feed mit User-Serien-Updates

### Notification Type (neu)

- `user_series_update` — bei neuem Item in gefolgter User-Serie

### Search API Erweiterung (bestehend)

- Response Items: `series: { id, slug, title, order, totalParts, type, ownerId } | null`

---

## 8. UI/UX-Ablauf

### `/serien/neu` (Client Component, Auth Required)
- Form: Titel (Pflicht), Beschreibung (optional, Markdown), Cover-URL (optional), Sichtbarkeit (Radio: Öffentlich/Privat)
- Review-Suche: Autocomplete via `/api/reviews/search?q=` (bestehend), Max 50 Auswahlen
- Drag-and-Drop Liste der gewählten Reviews (Native HTML5 DnD, tastaturbedienbar, ARIA)
- "Serie erstellen" → POST `/api/user/serien` → Redirect zu `/serien/[slug]`
- Validierung: Client + Server (Zod)

### `/serien/[slug]/bearbeiten` (Client Component, Owner/Collaborator)
- Gleiches Form wie Neu, aber Pre-filled
- DnD Liste der aktuellen Teile
- "Review hinzufügen" → Modal mit Suche
- "Entfernen" pro Item (Icon-Button)
- Speichern → PATCH `/api/user/serien/[slug]`
- Löschen → DELETE mit Confirm-Dialog

### `/serien` (Server Component, SSR) — Erweiterung
- Bestehende Grid-Liste
- Neue Filter-Chips: "Alle", "Admin", "Nutzer" (Query `type`)
- Serie-Card: Badge "Von @username" bei User-Serien
- Empty State angepasst

### `/serien/[slug]` (Server Component, SSR) — Erweiterung
- Prüft `visibility`: PRIVATE → 404 für Nicht-Owner/Collaborator
- Hero: Cover, Titel, Beschreibung, Meta (Teile, Erstellt, Gesamt-Score, **Ersteller: @username**)
- Follow-Button (falls eingeloggt, nicht Owner, PUBLIC)
- Parts-Liste wie Admin-Serie
- Share-Button (bestehend)
- SEO: `ItemList` Schema.org, OG/Twitter Tags

### Profil `/u/[username]` — Neuer Tab "Serien"
- Zwei Sections: "Erstellt" (Grid, zeigt PRIVATE nur für Owner), "Gefolgt" (Grid)
- Pagination (Cursor)
- Empty States mit CTAs

### Review-Detail (`/reviews/[slug]`) — Unverändert
- Serie-Badge zeigt beide Typen, Link zu `/serien/[slug]`

### Barrierefreiheit
- Semantisches HTML: `<form>`, `<nav aria-label="Serien-Navigation">`, `<ol>` für Teile
- ARIA: `aria-current="step"` für aktiven Teil, `aria-label` für Icon-Buttons
- DnD: Tastaturbedienbar (Space greifen, Pfeile bewegen, Enter ablegen), `aria-grabbed`, `aria-dropeffect`
- Reduced Motion: `@media (prefers-reduced-motion: reduce)` → DnD-Animationen aus
- Kontrast: Badges/Chips ≥ 4.5:1
- Screen-Reader: Tooltip-Inhalt auch als `aria-describedby`

### Lade-/Fehler-/Erfolgszustände
- Skeleton für Serie-Cards, Teile-Listen, Form-Felder
- Toast bei Aktionen (Erstellt, Aktualisiert, Gelöscht, Reordered, Gefolgt, Eingeladen)
- 404-Seite für nicht existierende/gelöschte/private Serien
- Optimistische UI bei Follow, Reorder, Add/Remove (Rollback bei Fehler)
- Inline-Validierungsfehler im Form (Zod)

---

## 9. Sicherheit & Performance

**Sicherheit:**
- User-API: `requireAuth` Middleware, Owner/Collaborator-Check via `series.ownerId` + `UserSeriesCollaborator`
- Input-Validierung: Zod-Schemas für alle User-Endpoints
- Keine User-Input in SQL (Prisma ORM)
- Rate-Limit auf User-API (30 req/min per User), Public API (60 req/min per IP)
- Private Serien: 404 für Unbefugte (kein 403, verhindert Enum-Attacke)
- Collaborator-Einladung: Nur Owner darf einladen, Max 10 Collaborators pro Serie

**Performance:**
- `unstable_cache` 60s für `/api/serien` (mit `type`, `visibility`, `ownerId` im Cache-Key) + Tag-Invaliderung (`series:list`, `series:user:{ownerId}`)
- `unstable_cache` 60s für `/api/serien/[slug]` + Tag `series:{slug}`
- `unstable_cache` 30s für User-Serien-Liste (`/api/user/serien`) + Tag `user-series:{userId}`
- Cursor-Pagination (kein Offset)
- `select` auf Reviews in Serie-Detail (nur Felder für Card)
- Denormalisierter `partCount` + `aggregateScore` auf `ReviewSeries` (bei Item-Änderung aktualisiert)
- Follow-Count denormalisiert auf `ReviewSeries.followersCount` (neue Spalte, bei Follow/Unfollow inkrementieren)

---

## 10. Teststrategie

| Ebene | Was | Ziel |
|-------|-----|------|
| Unit | `lib/user-series.ts` (Logik: create, update, reorder, add/remove item, follow, collaborator, validateOrder, slugify) | 100% Branches |
| Unit | `lib/user-series-schema.ts` (Zod-Schemas) | Valid/Invalid Cases |
| Unit | `hooks/useUserSeries.ts` (Optimistic UI, Rollback) | Mocked API |
| Integration | User API (CRUD, Reorder, Items, Follow, Collaborators) | 200/400/403/404 Cases, Berechtigungen |
| Integration | Public API (List mit Filter, Detail mit Visibility-Check) | Response-Shape, Cache-Tags |
| Integration | Feed API (`includeUserSeries`) | Merge-Logik, Dedupe |
| E2E | `/serien/neu` → Erstellen → `/serien/[slug]` → Bearbeiten → Follow → Profil-Tab | Happy Path + Empty States + Berechtigungen |
| E2E | Admin-Serien vs User-Serien Koexistenz auf `/serien` | Filter, Badges |

**Testdaten:** Seed-Script für 3 User-Serien (2–5 Teile) mit gemischten Reviews, 2 Collaborators, 5 Followers.

---

## 11. Rollout-Plan

1. Migration + Models (Feature-Flag `false`)
2. User API + Core Logic (Feature-Flag `false`)
3. Public API Erweiterung + Feed/Notification (Feature-Flag `false`)
4. UI: `/serien/neu`, `/serien/[slug]/bearbeiten`, Follow-Button (Feature-Flag `false`)
5. UI: `/serien` Filter-Erweiterung, `/serien/[slug]` Visibility-Check, Profil-Tab "Serien"
6. Review-Detail Badge (unverändert, funktioniert schon)
7. Search API Filter (additiv)
8. Tests schreiben & grün
9. Self-Review (F6)
10. Feature-Flag auf `true` setzen (`.env.example`, Vercel Env)
11. Doku & Changelog
12. Verify (F7) → Done (F9)

---

## 12. Review-Checkliste (F6)

- [ ] Alle 8 User Stories implementiert & getestet
- [ ] Randfälle: 0/1 Teil, Reorder-Konflikte, gelöschte Reviews, Slug-Kollision, Private-Serie-Zugriff, Collaborator-Berechtigungen, Owner-Löschung
- [ ] Eingaben validiert (Zod), Autorisierung (Owner/Admin/Collaborator), keine Secrets
- [ ] Performance: N+1 vermieden (select/include), Cache-Tags, Indizes, Denormalisierung (partCount, aggregateScore, followersCount)
- [ ] Migration reversibel, bestehende Admin-Serien unbeeinflusst
- [ ] Abwärtskompatibilität: Public API additiv, Search API additiv, Review-Card unverändert
- [ ] Code-Stil: Konsistent mit Collections/Reactions/Compare/Admin-Series
- [ ] UI: Alle Zustände (Loading, Error, Empty, Success), a11y geprüft
- [ ] Feature-Flag funktional (UI/API ausgeblendet bei `false`)

---

## 13. Offene Fragen / Annahmen

- **Annahme:** `requireAuth` Middleware existiert und liefert `userId` (TwitchUser.id)
- **Annahme:** `requireAdmin` Middleware existiert für Admin-Checks
- **Frage:** Soll `followersCount` auf `ReviewSeries` denormalisiert werden? → Ja, für schnelle Anzeige ohne Count-Query
- **Frage:** Max Collaborators pro Serie? → 10 (konfigurierbar via Const)
- **Frage:** Einladung per Username oder Email? → Username (TwitchUser.username), Fallback Email via Lookup
- **Frage:** Benachrichtigung bei Collaborator-Einladung? → Ja, In-App Notification Type `user_series_invite`
- **Annahme:** Feed-Logik in `lib/feed.ts` existiert und ist erweiterbar (wie bei Collections Follow)