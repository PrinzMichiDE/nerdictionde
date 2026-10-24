# Feature Spec: Review Collections / Kuratierte Listen

## 1. Problem und Nutzen

**Problem:** Nutzer finden Reviews nur über Suche, Kategorien oder den Feed. Es gibt keine Möglichkeit, thematisch passende Reviews zu bündeln, zu teilen oder von anderen kuratieren zu lassen. Entdeckung neuer Inhalte ist auf algorithmische Empfehlungen oder manuelles Stöbern beschränkt.

**Nutzen:**
- **Entdeckung:** Nutzer finden thematisch passende Reviews gebündelt (z. B. "Beste Koop-Spiele 2024", "Versteckte Indie-Perlen", "PS5-Launch-Titel")
- **Kuratierung:** Erfahrene Nutzer/Redaktion teilen Expertise durch Listen
- **Community:** Listen können geteilt, gelikt und später gefolgt werden → Bindung
- **SEO:** Listen-Seiten sind lange-tail-Landingpages für Suchbegriffe ("beste rpg spiele 2024")
- **Retention:** Nutzer kehren zurück, um Listen zu aktualisieren oder neue zu entdecken

**Zielgruppe:** Endnutzer (Leser), die Reviews konsumieren. Später: Power-User/Redaktion als Kuratoren.

---

## 2. User Stories & Akzeptanzkriterien

### US1: Öffentliche Liste ansehen
**Als** Nutzer **will ich** eine öffentliche Liste mit Reviews sehen **damit** ich thematisch passende Inhalte gebündelt entdecke.

**Akzeptanzkriterien:**
- GET `/listen/[slug]` rendert Server-seitig (SEO)
- Zeigt: Titel, Beschreibung, Ersteller (Link zu Profil), Erstellungsdatum, Update-Datum, Anzahl Reviews
- Reviews als Karten (wie auf Review-Übersicht) mit Pagination (Cursor, 12 pro Seite)
- Leere Liste: Hinweis "Diese Liste ist noch leer"
- Nicht-existente Liste: 404
- Private Liste: 404 für Nicht-Ersteller, 403 für andere

### US2: Eigene Liste erstellen
**Als** angemeldeter Nutzer **will ich** eine neue Liste erstellen **damit** ich Reviews thematisch bündeln kann.

**Akzeptanzkriterien:**
- POST `/api/collections` (oder `/api/listen`) mit `{ title, description?, isPublic: true/false, reviewIds?: string[] }`
- Validierung: Titel 3-100 Zeichen, Beschreibung optional max 2000 Zeichen
- Slug wird auto-generiert (eindeutig, Kollision → Suffix `-2`, `-3`)
- Ersteller wird als Owner gesetzt
- Default: `isPublic = true`
- Response: 201 mit Listen-Objekt inkl. Slug
- Bei Validierungsfehler: 400 mit Feld-Fehlern

### US3: Liste bearbeiten (Metadaten)
**Als** Listen-Ersteller **will ich** Titel, Beschreibung, Sichtbarkeit ändern **damit** die Liste aktuell bleibt.

**Akzeptanzkriterien:**
- PATCH `/api/listen/[slug]` (nur Owner)
- Felder: `title?`, `description?`, `isPublic?`
- Slug ändert sich **nicht** bei Titeländerung (stabile URLs)
- 403 wenn nicht Owner, 404 wenn nicht existiert
- Response: 200 mit aktualisiertem Objekt

### US4: Reviews zur Liste hinzufügen/entfernen
**Als** Listen-Ersteller **will ich** Reviews zur Liste hinzufügen/entfernen **damit** ich den Inhalt kuratiere.

**Akzeptanzkriterien:**
- POST `/api/listen/[slug]/items` mit `{ reviewId, position? }` — fügt am Ende oder an Position ein
- DELETE `/api/listen/[slug]/items/[reviewId]` — entfernt Review
- Maximale Items pro Liste: 100 (Schutz vor Spam/Performance)
- Duplikate: 409 "Review bereits in Liste"
- Review muss `status = published` sein
- 403 wenn nicht Owner, 404 wenn Liste/Review nicht existiert
- Response: 200 mit aktualisierter Item-Liste (Positions-Array)

### US5: Listen-Reihenfolge per Drag-and-Drop ändern
**Als** Listen-Ersteller **will ich** die Reihenfolge per Drag-and-Drop ändern **damit** ich die Präsentation steuere.

**Akzeptanzkriterien:**
- PATCH `/api/listen/[slug]/reorder` mit `{ reviewIds: string[] }` (neue Reihenfolge)
- Validierung: Array enthält genau alle aktuellen Review-IDs der Liste (keine fehlenden, keine zusätzlichen)
- 403 wenn nicht Owner
- Response: 200 mit neuer Reihenfolge
- Client: `@dnd-kit` oder native HTML5 DnD, optimistische UI

### US6: Liste löschen
**Als** Listen-Ersteller **will ich** meine Liste löschen **damit** sie nicht mehr sichtbar ist.

**Akzeptanzkriterien:**
- DELETE `/api/listen/[slug]` (nur Owner)
- Soft-Delete: `deletedAt` gesetzt, Items bleiben (für Restore), Liste aus öffentlicher Anzeige entfernt
- 403 wenn nicht Owner
- Response: 204

### US7: Alle eigenen Listen verwalten
**Als** angemeldeter Nutzer **will ich** eine Übersicht aller meiner Listen sehen **damit** ich sie verwalten kann.

**Akzeptanzkriterien:**
- GET `/api/me/listen` (oder Seite `/einstellungen/listen`)
- Zeigt: alle Listen (public + private), Item-Count, Erstellungsdatum
- Actions: Bearbeiten, Löschen, Reviews verwalten
- Pagination (Cursor, 20 pro Seite)

### US8: Öffentliche Listen entdecken (Übersicht)
**Als** Nutzer **will ich** alle öffentlichen Listen durchstöbern **damit** ich interessante Kuratierungen finde.

**Akzeptanzkriterien:**
- GET `/listen` (Server Component, SSR)
- Filter: `?q=` (Titel/Beschreibung), `?sort=updated|created|itemCount|popularity`
- Pagination (Cursor, 20 pro Seite)
- Karten: Titel, Beschreibung (gekürzt), Ersteller-Avatar+Name, Item-Count, Updated-Ago
- Leerzustand: "Noch keine öffentlichen Listen"

### US9: Liste teilen (Social)
**Als** Nutzer **will ich** eine Liste teilen **damit** andere sie entdecken.

**Akzeptanzkriterien:**
- Share-Button auf Listen-Detailseite (Web Share API + Fallback: Clipboard + Toast)
- Open Graph Tags auf `/listen/[slug]` (Titel, Beschreibung, Ersteller, Item-Count, erstes Review-Bild)
- Twitter Card `summary_large_image`

### US10: Listen auf Profil anzeigen
**Als** Nutzer **will ich** auf einem öffentlichen Profil (`/u/[username]`) die öffentlichen Listen des Nutzers sehen **damit** ich dessen Kuratierungen entdecke.

**Akzeptanzkriterien:**
- Neuer Tab "Listen" auf `/u/[username]` (neben Bewertungen/Bookmarks)
- Zeigt öffentliche Listen als Karten (Titel, Item-Count, Updated-Ago)
- Link zu `/listen/[slug]`
- Leerzustand: "Noch keine öffentlichen Listen"

---

## 3. Scope & Nicht-Scope

### In Scope (MVP)
- CRUD für Listen (Titel, Beschreibung, Sichtbarkeit, Items, Reihenfolge)
- Öffentliche Listen-Seite (`/listen/[slug]`) + Übersicht (`/listen`)
- Eigene Listen-Verwaltung (`/einstellungen/listen` oder Tab in Profil-Einstellungen)
- Listen auf öffentlichem Profil (`/u/[username]/listen` Tab)
- Social Sharing (Web Share API, OG Tags)
- Serverseitiges Rendering für SEO
- Cursor-Pagination überall
- Optimistische UI bei Reorder/Add/Remove
- Maximale 100 Items/Liste

### Nicht-Scope (spätere Iterationen)
- **Listen folgen** (Follow/Unfollow Liste, Feed-Integration)
- **Listen liken/upvoten** (Social Proof)
- **Kollaborative Listen** (Mehrere Kuratoren)
- **Listen-Kategorien/Tags** (Taxonomie)
- **Auto-Listen** (z. B. "Meine 10 höchsten Bewertungen", "Neueste Reviews in Kategorie X")
- **Listen-Export** (PDF, JSON, CSV)
- **Listen-Kommentare** (Diskussion über die Kuratierung)
- **Empfehlungs-Algorithmus** basierend auf Listen
- **Redaktions-Listen** (offiziell, verified badge)

---

## 4. Randfälle, Fehlerfälle, Berechtigungen, Nebenläufigkeit

| Szenario | Verhalten |
|----------|-----------|
| Gleichzeitiges Reorder von zwei Tabs | Letzter Write gewinnt (optimistisches Locking via `version` Feld oder `updatedAt`-Check) |
| Review wird gelöscht/geunpublished | Item bleibt in Liste, wird aber nicht mehr gerendert (oder mit Badge "Nicht mehr verfügbar") |
| Nutzer ändert Username | Slug der Liste bleibt stabil (basiert auf Listen-Titel bei Erstellung), Profil-Link aktualisiert sich |
| Owner löscht Account | Listen werden anonymisiert (Owner = "Gelöschter Nutzer") oder soft-deleted |
| Sehr lange Beschreibung | Client-seitig Truncation + "Mehr anzeigen", Server validiert max 2000 Zeichen |
| Leere Liste teilen | Erlaubt, OG-Tags fallen auf Fallback zurück |
| Private Liste teilen | Share-Link funktioniert, aber Ziel zeigt 404 für Nicht-Owner |

**Berechtigungen:**
- Lesen öffentliche Liste: Jeder (auch nicht angemeldet)
- Lesen private Liste: Nur Owner
- Erstellen: Angemeldet (TwitchUser)
- Bearbeiten/Items/Reorder/Löschen: Nur Owner
- Admin: Kann alle Listen sehen/bearbeiten/löschen (für Moderation)

**Nebenläufigkeit:**
- Reorder: Client sendet vollständiges Array → Server validiert Vollständigkeit → Atomarer Update
- Add/Remove: Einzelne Operationen, Idempotenz via `reviewId` Unique-Constraint auf `CollectionItem`

---

## 5. Datenmodell & Migrationen

### Neue Prisma Models

```prisma
model ReviewCollection {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String   // 3-100 chars
  description String?  @db.Text // max 2000 chars
  isPublic    Boolean  @default(true)
  ownerId     String   @map("owner_id")
  owner       TwitchUser @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  itemCount   Int      @default(0) @map("item_count") // denormalisiert für schnelle Anzeige
  version     Int      @default(1) // optimistisches Locking für Reorder
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  items CollectionItem[]

  @@index([ownerId])
  @@index([isPublic, updatedAt])
  @@index([slug])
  @@map("review_collections")
}

model CollectionItem {
  id              String   @id @default(cuid())
  collectionId    String   @map("collection_id")
  collection      ReviewCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  reviewId        String   @map("review_id")
  review          Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  position        Int      // 0-basiert, sequentiell
  addedAt         DateTime @default(now()) @map("added_at")

  @@unique([collectionId, reviewId])
  @@unique([collectionId, position])
  @@index([collectionId, position])
  @@index([reviewId])
  @@map("collection_items")
}
```

### Migration (reversibel)
- `prisma migrate dev --name add-review-collections`
- Down-Migration: `DROP TABLE collection_items; DROP TABLE review_collections;`
- Keine Datenverluste bei bestehendem Schema

### Bestehende Models: Keine Änderungen nötig

---

## 6. API-Änderungen

| Endpoint | Methode | Auth | Beschreibung |
|----------|---------|------|--------------|
| `/api/listen` | GET | Nein | Öffentliche Listen (Pagination, Filter, Sort) |
| `/api/listen` | POST | Ja | Neue Liste erstellen |
| `/api/listen/[slug]` | GET | Nein (public) / Ja (private) | Listen-Detail |
| `/api/listen/[slug]` | PATCH | Owner | Metadaten aktualisieren |
| `/api/listen/[slug]` | DELETE | Owner | Liste löschen (Soft) |
| `/api/listen/[slug]/items` | POST | Owner | Review hinzufügen |
| `/api/listen/[slug]/items/[reviewId]` | DELETE | Owner | Review entfernen |
| `/api/listen/[slug]/reorder` | PATCH | Owner | Reihenfolge ändern |
| `/api/me/listen` | GET | Ja | Eigene Listen (Pagination) |

**Request/Response Schemas (Zod):**
- `CreateCollectionSchema`: `{ title: string (3-100), description?: string (max 2000), isPublic?: boolean, reviewIds?: string[] }`
- `UpdateCollectionSchema`: `{ title?: string (3-100), description?: string (max 2000), isPublic?: boolean }`
- `AddItemSchema`: `{ reviewId: string (cuid), position?: int (>=0) }`
- `ReorderSchema`: `{ reviewIds: string[] }` (muss alle aktuellen IDs enthalten)

---

## 7. UI/UX-Ablauf

### Seiten & Komponenten

1. **`/listen`** (Server Component)
   - Hero: "Entdecke kuratierte Listen"
   - Filter-Leiste: Suche (Debounce 300ms), Sort-Select
   - Grid: `CollectionCard` (Titel, Beschreibung, Owner-Avatar, Item-Count, Updated)
   - Infinite Scroll / "Mehr laden" Button

2. **`/listen/[slug]`** (Server Component + Client Islands)
   - Header: Titel, Beschreibung, Owner (Link zu `/u/[username]`), Meta (Item-Count, Erstellt, Aktualisiert), Visibility Badge, Share-Button, Bearbeiten-Button (nur Owner)
   - Client Component: `CollectionItems` (Review-Karten Grid, Pagination)
   - Owner-Mode: Inline "Review hinzufügen" Modal (Search + Multi-Select), Drag-and-Drop Handles, Remove-Buttons

3. **`/einstellungen/listen`** (Client Component, geschützt)
   - Liste aller eigenen Listen (Table/Card)
   - Actions: Neu, Bearbeiten, Löschen, Items verwalten (Link zu `/listen/[slug]`)

4. **`/u/[username]`** → Neuer Tab "Listen"
   - Grid von `CollectionCard` (nur öffentliche)

### Zustände
- **Loading:** Skeleton für Karten/Grid
- **Error:** Toast + Inline-Meldung "Liste nicht gefunden" / "Fehler beim Laden"
- **Empty:** Illustration + "Noch keine Listen" / "Diese Liste ist leer" + CTA "Liste erstellen" / "Review hinzufügen"
- **Success:** Toast "Liste erstellt" / "Reihenfolge gespeichert" / "Review hinzugefügt"

### Barrierefreiheit
- Drag-and-Drop: Tastaturbedienbar (Pfeiltasten + Space/Enter), `aria-roledescription`, `aria-grabbed`, Live-Region für Ansagen
- Fokus-Management bei Modal öffnen/schließen
- Semantische HTML (`<section>`, `<article>`, `<nav>`)
- Farbkontrast ≥ 4.5:1
- Reduced Motion: Animationen deaktiviert

---

## 8. Sicherheit & Performance

### Sicherheit
- **Auth:** Alle Mutations-Endpoints prüfen Session (`getServerSession`)
- **Autorisierung:** Owner-Check via `collection.ownerId === session.user.id`
- **Validierung:** Zod auf allen Inputs (Body, Params, Query)
- **Rate-Limit:** 30 req/min für Mutations, 120 req/min für Reads (via Middleware/Upstash)
- **XSS:** Beschreibung/Title escaped (React auto-escapes, aber `dangerouslySetInnerHTML` vermeiden)
- **DoS-Schutz:** Max 100 Items/Liste, Max 50 Listen/Nutzer (soft limit, Admin kann erhöhen)

### Performance
- **Caching:** `unstable_cache` für `/api/listen` (60s), `/api/listen/[slug]` (30s), `/api/me/listen` (kein Cache, user-spezifisch)
- **DB-Indizes:** `(ownerId)`, `(isPublic, updatedAt)`, `(collectionId, position)`, `(collectionId, reviewId)` unique
- **N+1-Vermeidung:** `include: { items: { include: { review: { select: {...} } } } }` mit `take` für Pagination
- **Cursor-Pagination:** `where: { position: { gt: cursor } }` auf `CollectionItem`
- **Denormalisierung:** `itemCount` auf `ReviewCollection` für schnelle Counts ohne Join

---

## 9. Teststrategie

### Unit-Tests (vitest)
- `src/lib/collections.ts` Utilities: `generateSlug`, `validateReorder`, `calculateItemCount`
- `src/lib/schemas/collection-schema.ts` Zod-Schemas (Validierung, Edge Cases)
- `src/components/collections/CollectionCard.test.tsx` (Rendering, Props)

### Integration-Tests (vitest + Test-DB)
- `POST /api/listen` — Erstellung, Validierung, Slug-Kollision, Auth
- `GET /api/listen/[slug]` — Public/Private, 404, Items-Pagination
- `PATCH /api/listen/[slug]` — Owner-Check, Felder, Slug-Stabilität
- `POST/DELETE /api/listen/[slug]/items` — Add/Remove, Duplikate, Max-Items, Review-Status
- `PATCH /api/listen/[slug]/reorder` — Validierung (Vollständigkeit, Duplikate), Owner-Check
- `DELETE /api/listen/[slug]` — Soft-Delete, Owner-Check
- `GET /api/me/listen` — Pagination, nur eigene
- `GET /api/listen` — Filter, Sort, Pagination, Public-only

### E2E-Tests (e2e/Playwright)
- Flow: Anmelden → Liste erstellen → Reviews hinzufügen → Reorder → Öffentlich ansehen → Teilen
- Flow: Nicht-Owner versucht zu bearbeiten → 403
- Flow: Private Liste über direkten Link → 404 für Nicht-Owner
- Flow: Drag-and-Drop Reorder (Tastatur + Maus)
- Flow: Liste auf Profil-Tab sichtbar

**Ziel:** 100% API-Coverage, kritische UI-Flows E2E.

---

## 10. Rollout-Plan & Feature-Flag

- Feature-Flag: `FEATURE_REVIEW_COLLECTIONS` (Default: `true` nach Merge)
- Bei Flag `false`: API gibt 404, UI-Links ausgeblendet, Build nicht gebrochen
- Migration wird bei Deploy ausgeführt (Prisma Migrate Deploy)
- Kein Breaking Change für bestehende Features

---

## 11. Review (F6) — Platzhalter

*Wird nach Implementierung ausgefüllt.*

---

## 12. Implementation TODO Checklist (F3 Design & Plan)

| Paket | Beschreibung | Status |
|-------|--------------|--------|
| PK1 | Prisma Schema: `ReviewCollection`, `CollectionItem` + Migration | ☐ |
| PK2 | Zod Schemas: `collection-schema.ts` (Create, Update, AddItem, Reorder) | ☐ |
| PK3 | Lib: `src/lib/collections.ts` (Utilities: Slug-Generierung, Reorder-Validierung, Count-Sync) | ☐ |
| PK4 | API: `GET /api/listen` (Public Lists mit Filter/Sort/Pagination) | ☐ |
| PK5 | API: `POST /api/listen` (Create) | ☐ |
| PK6 | API: `GET /api/listen/[slug]` (Detail, Public/Private, Items Pagination) | ☐ |
| PK7 | API: `PATCH /api/listen/[slug]` (Update Metadaten, Owner-Check) | ☐ |
| PK8 | API: `DELETE /api/listen/[slug]` (Soft Delete, Owner-Check) | ☐ |
| PK9 | API: `POST /api/listen/[slug]/items` (Add Review, Max 100, Published-Check) | ☐ |
| PK10 | API: `DELETE /api/listen/[slug]/items/[reviewId]` (Remove Review) | ☐ |
| PK11 | API: `PATCH /api/listen/[slug]/reorder` (Reorder, Validierung, Owner-Check) | ☐ |
| PK12 | API: `GET /api/me/listen` (Eigene Listen, Pagination) | ☐ |
| PK13 | UI: `/listen` Seite (Server Component, Filter, Sort, Grid, Infinite Scroll) | ☐ |
| PK14 | UI: `/listen/[slug]` Seite (Server Component + Client Islands: Header, Items, Owner-Mode) | ☐ |
| PK15 | UI: `CollectionCard` Component (Wiederverwendbar für Grid) | ☐ |
| PK16 | UI: `CollectionItems` Client Component (Grid, Pagination, Owner-Mode: Add/Remove/DnD) | ☐ |
| PK17 | UI: `/einstellungen/listen` Seite (Eigene Listen verwalten) | ☐ |
| PK18 | UI: Profil-Tab "Listen" auf `/u/[username]` | ☐ |
| PK19 | UI: Share-Button (Web Share API + Clipboard Fallback + Toast) | ☐ |
| PK20 | UI: OG Tags auf `/listen/[slug]` (Metadata Export) | ☐ |
| PK21 | Drag-and-Drop: `@dnd-kit/core` + `@dnd-kit/sortable` Integration | ☐ |
| PK22 | Unit Tests (Utils, Schemas, Components) | ☐ |
| PK23 | Integration Tests (Alle API Endpoints) | ☐ |
| PK24 | E2E Tests (Kritische Flows) | ☐ |
| PK25 | Self-Review (F6) + Verify (F7: Build, Lint, Typecheck, Tests) | ☐ |
| PK26 | Doku: CHANGELOG, README, ROADMAP, Feature-Spec Review-Sektion | ☐ |