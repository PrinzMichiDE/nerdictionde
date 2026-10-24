# Design & Plan: Review-Serien / Multi-Part Reviews

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER                       │
├─────────────────────────────────────────────────────────────────┤
│  Public Pages                          Admin Pages              │
│  ├── /serien (Server Comp)             ├── /admin/serien        │
│  ├── /serien/[slug] (Server Comp)      ├── /admin/serien/[slug] │
│  └── /reviews/[slug] (Client Comp)     │   /edit (Client Comp)   │
│       └── SeriesBadge (Client)         │       └── DnD List      │
├─────────────────────────────────────────────────────────────────┤
│  API Routes                                                         │
│  ├── GET  /api/serien                     (Public, cached)       │
│  ├── GET  /api/serien/[slug]              (Public, cached)       │
│  ├── POST /api/admin/serien               (Admin, Zod)           │
│  ├── GET  /api/admin/serien/[slug]        (Admin)                │
│  ├── PATCH /api/admin/serien/[slug]       (Admin, Zod, version)  │
│  ├── DELETE /api/admin/serien/[slug]      (Admin)                │
│  ├── POST /api/admin/serien/[slug]/reorder (Admin, Zod, version) │
│  ├── POST /api/admin/serien/[slug]/items   (Admin, Zod)          │
│  └── DELETE /api/admin/serien/[slug]/items/[reviewId] (Admin)    │
├─────────────────────────────────────────────────────────────────┤
│  Shared Lib                                                         │
│  ├── lib/review-series.ts          (Core Logic, Server)          │
│  ├── lib/review-series-schema.ts   (Zod Schemas)                 │
│  ├── hooks/useReviewSeries.ts      (Client Hook, Admin)          │
│  └── components/series/            (UI Components)               │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer (Prisma)                                                │
│  ├── ReviewSeries          (Model)                                 │
│  ├── ReviewSeriesItem      (Model, Join + Order)                   │
│  └── Review.seriesId / seriesOrder (FK + Denormalisierung)         │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Datenfluss

### Public Read (Serie-Liste)
```
GET /api/serien?cursor=xyz&limit=20
  → unstable_cache("series:list", 60s)
  → Prisma: findMany(ReviewSeries, where: {deletedAt: null}, orderBy, cursor, take)
  → select: id, slug, title, description, coverImage, partCount, aggregateScore, createdAt
  → Return { series[], nextCursor }
```

### Public Read (Serie-Detail)
```
GET /api/serien/[slug]
  → unstable_cache("series:{slug}", 60s)
  → Prisma: findUnique(ReviewSeries, include: { items: { include: { review: { select: ... }}, orderBy: { seriesOrder: asc }}})
  → Compute: partCount, aggregateScore (falls nicht denormalisiert)
  → Return { series, parts: Review[] }
```

### Admin Write (Reorder)
```
POST /api/admin/serien/[slug]/reorder { items: [{reviewId, seriesOrder}], version }
  → requireAdmin
  → Prisma: findUnique(ReviewSeries, select: {version: true})
  → If version mismatch → 409 Conflict
  → Transaction:
    - Validate: all reviewIds exist, belong to series, orders 1..N lückenlos
    - Update ReviewSeriesItem (seriesOrder) per item
    - Update Review (seriesOrder) denormalisiert
    - Increment ReviewSeries.version
  → revalidateTag("series:{slug}"), revalidateTag("series:list")
  → revalidateTag("review:{reviewId}") für betroffene Reviews
  → Return { version: newVersion }
```

## 3. Bestehende Wiederverwendung (Analyse)

| Komponente | Wiederverwendung | Anpassung |
|------------|------------------|-----------|
| `ReviewCollection` / `CollectionItem` | Pattern 1:1 für `ReviewSeries` / `ReviewSeriesItem` | Namen, Felder (kein `isPublic`, stattdessen `deletedAt`) |
| `useCollectionFollow` Hook | Pattern für optimistische UI (Reorder, Add/Remove) | `useReviewSeries` Admin-Hook |
| `CollectionFollowerCount` / Modal | Nicht direkt — Serie hat keine Follower | Neu: `SeriesBadge`, `SeriesPartsNav` |
| Admin Collections UI (`/admin/listen`) | Layout, Tabelle, DnD-Pattern | Neuer Tab "Serien" |
| `unstable_cache` Tags | `series:list`, `series:{slug}`, `review:{slug}` | Analog zu `collections:list` etc. |
| Search API Erweiterung | `search-relevance.ts` → `series` Feld additiv | Minimal |
| Feature-Flag Pattern | `FEATURE_REVIEW_COLLECTIONS`, `FEATURE_REVIEW_REACTIONS` | `FEATURE_REVIEW_SERIES` |

## 4. Arbeitspakete (PKG-1 bis PKG-11)

| PKG | Beschreibung | Abhängigkeit | Geschätzt |
|-----|--------------|--------------|-----------|
| **PKG-1** | **DB-Migration & Prisma Models** — `ReviewSeries`, `ReviewSeriesItem`, `Review.seriesId`, `Review.seriesOrder`, Indizes, reversible Migration | — | 0.5h |
| **PKG-2** | **Types & Zod-Schemas** — `lib/review-series-schema.ts` (Admin Create/Update/Reorder/Item), `lib/review-series.ts` Types (Public Series, SeriesPart) | PKG-1 | 0.5h |
| **PKG-3** | **Server Core Logic** — `lib/review-series.ts`: `getSeriesList()`, `getSeriesBySlug()`, `createSeries()`, `updateSeries()`, `deleteSeries()`, `reorderSeries()`, `addSeriesItem()`, `removeSeriesItem()`, `computeAggregateScore()`, `validateOrder()`, `slugify()` | PKG-2 | 1h |
| **PKG-4** | **Public API Routes** — `GET /api/serien`, `GET /api/serien/[slug]` mit Feature-Flag, Cache-Tags, Error-Handling | PKG-3 | 0.5h |
| **PKG-5** | **Admin API Routes** — CRUD + Reorder + Items, `requireAdmin`, Zod-Validation, Optimistisches Locking, Tag-Invaliderung | PKG-3 | 1h |
| **PKG-6** | **Search API Erweiterung** — `search-relevance.ts` / API: `series` Feld in Response Items (optional, nullable) | PKG-1 | 0.3h |
| **PKG-7** | **Public Pages** — `/serien` (Server Comp, Grid, Pagination, Search, Sort), `/serien/[slug]` (Server Comp, Hero, Parts-List, Share, SEO, OG/Twitter) | PKG-4 | 1h |
| **PKG-8** | **Review-Detail Integration** — `SeriesBadge` Client Component (Chip "Teil X von Y", Link, Tooltip mit Teilen), Einbindung in `/reviews/[slug]` | PKG-4 | 0.5h |
| **PKG-9** | **Review-Card Enhancement** — Optionale `series` Prop → Badge "Serie: Name" mit Link | PKG-1 | 0.3h |
| **PKG-10** | **Admin UI** — `/admin/serien` Liste (Tabelle), `/admin/serien/[slug]/edit` (Form + Native HTML5 DnD Liste, tastaturbedienbar, ARIA), Toast-Feedback | PKG-5 | 1.5h |
| **PKG-11** | **Tests & Doku** — Unit (Logic, Schema), Integration (Admin API, Public API, Search), E2E (Navigation, Admin Flow), CHANGELOG, README, .env.example, PROGRESS.md | PKG-1..10 | 1.5h |

**Gesamt geschätzt: ~8.6h**

## 5. Cache-Strategie

| Key | TTL | Invaliderung bei |
|-----|-----|------------------|
| `series:list` | 60s | Serie erstellen/löschen, Item hinzufügen/entfernen (partCount/Score ändert sich) |
| `series:{slug}` | 60s | Serie update, Reorder, Item add/remove, Review-Update (Score/Cover) |
| `review:{slug}` | 30s | Review-Detail Serie-Badge (seriesId/seriesOrder) |
| `search:results:{hash}` | 60s | Unverändert (Series-Feld additiv) |

## 6. Feature-Flag

- `FEATURE_REVIEW_SERIES` (Env, Default: `true`)
- Public API: `if (!flag) return 404`
- Public Pages: `if (!flag) return notFound()`
- Admin API: `if (!flag) return 404` (oder immer erlaubt für Admins?)
- Admin UI: Nur anzeigen wenn Flag `true`
- Review-Detail/Review-Card: Nur rendern wenn Flag `true`

## 7. Barrierefreiheit-Checkliste (PKG-7, PKG-8, PKG-10)

- [ ] Semantische HTML-Struktur (`<nav>`, `<ol>`, `<article>`)
- [ ] ARIA-Labels für Icon-Buttons (Share, Reorder-Handle)
- [ ] `aria-current="step"` für aktiven Teil in Serie-Navigation
- [ ] Fokus-Reihenfolge logisch (Tab durch Teile-Liste)
- [ ] DnD: Tastaturbedienbar (Space zum Greifen, Pfeile zum Bewegen, Enter zum Ablegen), `aria-grabbed`, `aria-dropeffect`
- [ ] Reduced Motion: `@media (prefers-reduced-motion: reduce)` → DnD-Animationen aus
- [ ] Kontrast: Badges/Chips ≥ 4.5:1 (Tailwind `text-muted-foreground` auf `bg-muted` prüfen)
- [ ] Screen-Reader: Tooltip-Inhalt auch als `aria-describedby` oder separater Text

## 8. Migration-Details (PKG-1)

```prisma
// prisma/schema.prisma Ergänzungen

model ReviewSeries {
  id            String   @id @default(cuid())
  slug          String   @unique
  title         String
  description   String?  @db.Text
  coverImage    String?
  partCount     Int      @default(0)      // Denormalisiert
  aggregateScore Float?  // Denormalisiert: Durchschnitt aller Teile
  version       Int      @default(1)      // Optimistisches Locking
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  items         ReviewSeriesItem[]
  @@index([deletedAt])
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
}

model Review {
  // ... existing
  seriesId     String?
  seriesOrder  Int?
  series       ReviewSeries? @relation(fields: [seriesId], references: [id], onDelete: SetNull)
  seriesItems  ReviewSeriesItem[]
}
```

**Migration-Command:**
```bash
npx prisma migrate dev --name add_review_series --create-only
# Dann SQL manuell prüfen/anpassen, dann apply
```

## 9. Nächste Schritte

1. **PKG-1 ausführen:** Migration erstellen & anwenden
2. **PKG-2:** Types & Schemas schreiben
3. **PKG-3:** Core Logic implementieren
4. ... sequentiell weiter

Jedes Paket: Code → lokal testen (`npm run type-check`, `npm run build`, relevante Tests) → Commit → Push.