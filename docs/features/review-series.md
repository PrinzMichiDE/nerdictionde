# Feature Spec: Review-Serien / Multi-Part Reviews

## 1. Problem und Nutzen

**Problem:** Reviews zu Spielen mit DLCs, Erweiterungen oder episodischen Inhalten (z. B. Base Game + DLCs, Staffel-Reviews) stehen aktuell isoliert. Nutzer sehen nicht auf einen Blick, was zusammengehört. Autoren müssen manuell verlinken. Keine gemeinsame Navigation, kein aggregierter Score.

**Nutzen:**
- **Für Leser:** Klare Struktur bei zusammengehörigen Inhalten (Base Game + DLCs, Staffeln), einfache Navigation zwischen Teilen, gemeinsamer Überblick (Gesamt-Score, Pros/Cons aggregiert).
- **Für Autoren:** Einfaches Gruppieren verwandter Reviews, automatische Verlinkung, weniger manuelle Arbeit.
- **Für Plattform:** Bessere Entdeckung (interne Verlinkung, SEO), höhere Verweildauer, Grundlage für "Complete Edition"-Views.

**Zielgruppe:** Endnutzer (Leser), Review-Autoren (Redaktion/Community).

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| US1 | Als Leser sehe ich auf einer Review-Detailseite, ob sie Teil einer Serie ist, und kann per Tab/Navigation zu den anderen Teilen springen. | - Badge/Chip "Teil X von Y: Serienname" oberhalb des Titles<br>- Klick öffnet Serie-Übersicht oder direkten Sprung zum Nachbar-Teil<br>- Funktioniert für 2–10 Teile |
| US2 | Als Leser sehe ich auf einer Serie-Übersichtsseite (`/serien/[slug]`) alle Teile mit Scores, Release-Daten, kurzer Inhaltsangabe und kann direkt zum Review springen. | - Server-rendered Seite mit SEO-Meta (Series Schema.org `ItemList`)<br>- Alle Teile als Karten: Cover, Titel, Score, Release, Kurztext<br>- "Gesamt-Score" (gewichtet nach Review-Länge/Relevanz) prominent<br>- Pagination falls > 10 Teile |
| US3 | Als Autor erstelle ich eine neue Serie im Admin/Redaktionsbereich und füge bestehende Reviews hinzu (Drag-and-Drop Reihenfolge). | - Admin-UI: Serie anlegen (Titel, Slug, Beschreibung, Cover optional)<br>- Reviews per Search/Select hinzufügen, Reihenfolge per DnD setzen<br>- Validierung: Review darf nur in einer Serie sein |
| US4 | Als Autor bearbeite ich eine Serie (Titel, Beschreibung, Cover, Reihenfolge, Teile entfernen/hinzufügen). | - PATCH `/api/admin/serien/[slug]`<br>- Reorder validiert Vollständigkeit (wie bei Collections)<br>- Entfernen löst Relation, löscht nicht das Review |
| US5 | Als Leser teile ich eine Serie (Web Share API + Clipboard Fallback), OG-Tags/Twitter Card auf Serie-Seite rendern korrekt. | - Share-Button auf `/serien/[slug]`<br>- OG: `og:type=website`, `og:title="Serienname"`, `og:description`, `og:image` (Serien-Cover oder erstes Review-Cover)<br>- Twitter Card `summary_large_image` |
| US6 | Als Leser sehe ich in Suchergebnissen und auf der Startseite/Category-Seiten einen Hinweis "Teil der Serie X" mit Link. | - `ReviewCard` erhält optionale `series` Prop<br>- Badge "Serie: Name" mit Link zu `/serien/[slug]`<br>- In Search-API: `series` Feld im Response |

**Nicht-Scope (explizit):**
- Automatische Erkennung von Serien (z. B. via Titel-Pattern) — manuell kuratiert.
- Serien-spezifische Kommentare/Foren — nutzt bestehende Review-Kommentare.
- Bewertung der Serie als Ganzes (nur aggregierter Score, kein eigenes Rating).
- Mehrsprachige Serientitel (ein Slug, ein Titel pro Locale später).

---

## 3. Scope & Abgrenzung

**In Scope:**
- Datenmodell: `ReviewSeries` + Relation `Review.seriesId` + `seriesOrder`
- Admin-API & UI für CRUD + Reorder
- Public API: `GET /api/serien`, `GET /api/serien/[slug]`
- Public Pages: `/serien` (Übersicht, Filter/Sort/Pagination), `/serien/[slug]` (Detail)
- Review-Detail Integration: Serie-Badge + Navigation
- Review-Card Enhancement: Serie-Badge
- Search-API Erweiterung: `series` im Response
- Feature-Flag `FEATURE_REVIEW_SERIES` (Default: `true`)
- Tests: Unit, Integration, E2E

**Out of Scope:**
- Automatische Serie-Erkennung
- Serie-Rating/-Kommentare
- Serie-Export (PDF etc.)
- Mehrsprachigkeit (i18n) — später

---

## 4. Randfälle, Fehlerfälle, leere Zustände, Berechtigungen, Nebenläufigkeit

| Fall | Behandlung |
|------|------------|
| Serie mit 0 Teilen | Nicht öffentlich sichtbar (Admin nur), 404 auf Public Page |
| Serie mit 1 Teil | Wird nicht als Serie gerendert (Badge nur ab 2 Teilen) |
| Review in 2 Serien | Datenbank-Constraint `UNIQUE (reviewId)` auf `ReviewSeriesItem` verhindert |
| Reorder: Lücken in `seriesOrder` | Validierung: 1..N lückenlos, sonst 400 |
| Gleichzeitiges Reorder durch 2 Admins | Optimistisches Locking via `version` auf `ReviewSeries` (wie Collections) |
| Gelöschtes Review in Serie | Soft-Delete: Review bleibt in Serie, wird aber nicht öffentlich verlinkt (Badge "Nicht verfügbar") |
| Serie löschen | Soft-Delete via `deletedAt`, Relations bleiben (für History), Public 404 |
| Unbefugter Zugriff Admin-API | `requireAdmin` Middleware, 403 |
| Leere Serie-Übersicht (`/serien`) | Empty State: "Noch keine Serien", CTA zum Admin (für Admins) |
| Slug-Kollision | Auto-Suffix `-2`, `-3` wie bei Collections |

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

- **Review Model:** Neues optionales Feld `seriesId` (FK) + `seriesOrder` (Int). Kein Breaking Change.
- **ReviewCard / Review-Detail:** Optionale Props/Context — keine Breaking Changes.
- **Search API:** Neues Feld `series` im Response — additive, Clients ignorieren unbekannte Felder.
- **Admin UI:** Neuer Tab "Serien" — additive.
- **Migration:** Reversibel (Spalte droppbar, Tabelle droppbar).
- **Feature-Flag:** Kann per Env abgeschaltet werden (`FEATURE_REVIEW_SERIES=false`) — dann keine UI, API 404.

---

## 6. Datenmodell & Migrationen

### Prisma Schema Ergänzungen

```prisma
model ReviewSeries {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String?  @db.Text
  coverImage  String?  // URL zu Cover-Bild
  version     Int      @default(1) // Optimistisches Locking
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  items       ReviewSeriesItem[]
  @@index([deletedAt])
}

model ReviewSeriesItem {
  id           String   @id @default(cuid())
  seriesId     String
  series       ReviewSeries @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  reviewId     String   @unique // Ein Review max in einer Serie
  review       Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  seriesOrder  Int      // 1-basiert, lückenlos
  createdAt    DateTime @default(now())

  @@unique([seriesId, seriesOrder])
  @@index([reviewId])
}

model Review {
  // ... existing fields
  seriesId     String?
  seriesOrder  Int?
  series       ReviewSeries? @relation(fields: [seriesId], references: [id], onDelete: SetNull)
  seriesItems  ReviewSeriesItem[]
}
```

### Migration (reversibel)

```sql
-- UP
CREATE TYPE "ReviewSeriesItem" AS ENUM (...); -- nicht nötig, separate Tabelle

CREATE TABLE "ReviewSeries" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "coverImage" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ReviewSeries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewSeries_slug_key" ON "ReviewSeries"("slug");
CREATE INDEX "ReviewSeries_deletedAt_idx" ON "ReviewSeries"("deletedAt");

CREATE TABLE "ReviewSeriesItem" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "seriesId" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "seriesOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewSeriesItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewSeriesItem_reviewId_key" ON "ReviewSeriesItem"("reviewId");
CREATE UNIQUE INDEX "ReviewSeriesItem_seriesId_seriesOrder_key" ON "ReviewSeriesItem"("seriesId", "seriesOrder");
CREATE INDEX "ReviewSeriesItem_seriesId_idx" ON "ReviewSeriesItem"("seriesId");

ALTER TABLE "ReviewSeriesItem" ADD CONSTRAINT "ReviewSeriesItem_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "ReviewSeries"("id") ON DELETE CASCADE;
ALTER TABLE "ReviewSeriesItem" ADD CONSTRAINT "ReviewSeriesItem_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE;

ALTER TABLE "Review" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "Review" ADD COLUMN "seriesOrder" INTEGER;
CREATE INDEX "Review_seriesId_idx" ON "Review"("seriesId");
ALTER TABLE "Review" ADD CONSTRAINT "Review_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "ReviewSeries"("id") ON DELETE SET NULL;

-- DOWN (reversibel)
ALTER TABLE "Review" DROP CONSTRAINT "Review_seriesId_fkey";
DROP INDEX "Review_seriesId_idx";
ALTER TABLE "Review" DROP COLUMN "seriesOrder";
ALTER TABLE "Review" DROP COLUMN "seriesId";

ALTER TABLE "ReviewSeriesItem" DROP CONSTRAINT "ReviewSeriesItem_reviewId_fkey";
ALTER TABLE "ReviewSeriesItem" DROP CONSTRAINT "ReviewSeriesItem_seriesId_fkey";
DROP INDEX "ReviewSeriesItem_seriesId_idx";
DROP INDEX "ReviewSeriesItem_seriesId_seriesOrder_key";
DROP INDEX "ReviewSeriesItem_reviewId_key";
DROP TABLE "ReviewSeriesItem";

DROP INDEX "ReviewSeries_deletedAt_idx";
DROP INDEX "ReviewSeries_slug_key";
DROP TABLE "ReviewSeries";
```

---

## 7. API-Änderungen

### Public API

| Route | Methode | Beschreibung | Response |
|-------|---------|--------------|----------|
| `/api/serien` | GET | Liste aller Serien (Filter: `q`, `sort=title|created|parts`, `cursor`, `limit`) | `{ series: Series[], nextCursor }` |
| `/api/serien/[slug]` | GET | Serie-Detail mit allen Teilen (Reviews mit `select` für Cards) | `{ series, parts: Review[] }` |

### Admin API (erfordert `requireAdmin`)

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/admin/serien` | POST | Serie anlegen `{ title, description?, coverImage? }` → `{ series }` |
| `/api/admin/serien/[slug]` | GET | Serie mit Items (für Edit-View) |
| `/api/admin/serien/[slug]` | PATCH | Update `{ title?, description?, coverImage?, items?: { reviewId, seriesOrder }[] }` |
| `/api/admin/serien/[slug]` | DELETE | Soft-Delete (`deletedAt = now()`) |
| `/api/admin/serien/[slug]/reorder` | POST | Reorder `{ items: { reviewId, seriesOrder }[], version }` → `{ version }` |
| `/api/admin/serien/[slug]/items` | POST | Item hinzufügen `{ reviewId }` (Auto-Order ans Ende) |
| `/api/admin/serien/[slug]/items/[reviewId]` | DELETE | Item entfernen |

### Search API Erweiterung

- `GET /api/search?q=...` → Response Items erhalten zusätzlich `series: { id, slug, title, order, totalParts } | null`

---

## 8. UI/UX-Ablauf

### `/serien` (Server Component, SSR)
- Header: "Review-Serien", Suche, Sort (Titel, Erstellt, Teile), Pagination (Cursor, 20/Seite)
- Grid: Serie-Cards (Cover, Titel, Teile-Anzahl, Gesamt-Score, Beschreibung gekürzt)
- Empty State: "Keine Serien gefunden" / "Noch keine Serien"

### `/serien/[slug]` (Server Component, SSR)
- Hero: Cover (full-width), Titel, Beschreibung, Meta (Teile, Erstellt, Gesamt-Score)
- Tabs: "Alle Teile" (Standard), "Nur Reviews" (ohne DLCs etc. — später)
- Teile-Liste: Karten wie Review-Card aber kompakt (Cover, Titel, Score, Release, Kurztext, "Lesen"-Button)
- Sticky "Zurück zur Übersicht" Link
- Share-Button (Web Share + Clipboard)
- SEO: `ItemList` Schema.org, OG/Twitter Tags

### Review-Detail (`/reviews/[slug]`)
- Oberhalb Title: Chip "Teil X von Y: Serienname" → Link zu `/serien/[seriesSlug]`
- Bei Mausover: Tooltip mit allen Teilen (klein, horizontal scrollbar)
- Mobile: Einfacher Link

### Review-Card (überall)
- Optional `series` Prop → Badge "Serie: Name" mit Link

### Admin: `/admin/serien` + `/admin/serien/[slug]/edit`
- Liste: Tabelle (Titel, Slug, Teile, Status, Aktionen)
- Edit: Form + Drag-and-Drop Liste der Teile (Native HTML5 DnD, tastaturbedienbar)
- Validierung: Order 1..N lückenlos, Review einzigartig

### Barrierefreiheit
- Semantisches HTML: `<nav aria-label="Serien-Navigation">`, `<ol>` für Teile-Reihenfolge
- ARIA: `aria-current="step"` für aktiven Teil, `aria-label` für Share-Button
- Focus-Management: Tab-Order logisch, Skip-Links
- Reduced Motion: DnD-Animationen deaktiviert
- Kontrast: Badges/Chips mind. 4.5:1

### Lade-/Fehler-/Erfolgszustände
- Skeleton für Serie-Cards und Teile-Listen
- Toast bei Admin-Aktionen (Erstellt, Aktualisiert, Gelöscht, Reordered)
- 404-Seite für nicht existierende/gelöschte Serien
- Optimistische UI bei Reorder (Rollback bei Fehler)

---

## 9. Sicherheit & Performance

**Sicherheit:**
- Admin-API: `requireAdmin` Middleware, CSRF via Same-Site Cookies
- Input-Validierung: Zod-Schemas für alle Admin-Endpoints (Slug-Format, Title-Länge, Cover-URL)
- Keine User-Input in SQL (Prisma ORM)
- Rate-Limit auf Public API (60 req/min per IP)

**Performance:**
- `unstable_cache` 60s für `/api/serien` und `/api/serien/[slug]` + Tag-Invaliderung (`series:list`, `series:{slug}`)
- `unstable_cache` 30s für Review-Detail Serie-Info + Tag `review:{slug}`
- Cursor-Pagination (kein Offset)
- `select` auf Reviews in Serie-Detail (nur Felder für Card: id, slug, title, score, coverImage, releaseDate, excerpt, seriesOrder)
- Denormalisierter `partCount` + `aggregateScore` auf `ReviewSeries` (bei Item-Änderung aktualisiert)

---

## 10. Teststrategie

| Ebene | Was | Ziel |
|-------|-----|------|
| Unit | `lib/review-series.ts` (Logik: aggregateScore, validateOrder, slugify) | 100% Branches |
| Unit | `lib/review-series-schema.ts` (Zod-Schemas) | Valid/Invalid Cases |
| Integration | Admin API (CRUD, Reorder, Items) | 200/400/403/404 Cases |
| Integration | Public API (List, Detail, Search-Erweiterung) | Response-Shape, Cache-Tags |
| E2E | `/serien` → `/serien/[slug]` → Review-Detail Navigation | Happy Path + Empty States |
| E2E | Admin: Serie anlegen, Reviews hinzufügen, Reorder, Löschen | Full Flow |

**Testdaten:** Seed-Script für 3 Serien (2–5 Teile) mit gemischten Reviews.

---

## 11. Rollout-Plan

1. Migration + Models (Feature-Flag `false`)
2. Admin API + UI (Feature-Flag `false`)
3. Public API + Pages (Feature-Flag `false`)
4. Review-Detail + Review-Card Integration (Feature-Flag `false`)
4. Search API Erweiterung
5. Tests schreiben & grün
6. Self-Review (F6)
7. Feature-Flag auf `true` setzen (`.env.example`, Vercel Env)
8. Doku & Changelog
9. Verify (F7) → Done (F9)

---

## 12. Review-Checkliste (F6)

- [ ] Alle 6 User Stories implementiert & getestet
- [ ] Randfälle: 0/1 Teil, Reorder-Konflikte, gelöschte Reviews, Slug-Kollision
- [ ] Eingaben validiert (Zod), Autorisierung (Admin), keine Secrets
- [ ] Performance: N+1 vermieden (select/include), Cache-Tags, Indizes
- [ ] Migration reversibel, bestehende Reviews unbeeinflusst
- [ ] Abwärtskompatibilität: Search API additiv, Review-Card optional
- [ ] Code-Stil: Konsistent mit Collections/Reactions/Compare
- [ ] UI: Alle Zustände (Loading, Error, Empty, Success), a11y geprüft
- [ ] Feature-Flag funktional (UI/API ausgeblendet bei `false`)

---

## 13. Offene Fragen / Annahmen

- **Annahme:** Admin-UI existiert bereits unter `/admin` (basierend auf bestehenden Admin-Routes für Collections etc.)
- **Frage:** Soll `aggregateScore` gewichtet sein (z. B. Base Game höher)? → Initial: einfacher Durchschnitt aller Teile, später konfigurierbar.
- **Frage:** Serie-Cover Pflicht oder optional? → Optional, Fallback: erstes Review-Cover.