# Feature-Design: Leseverlauf / Reading History

**Datum:** 2026-10-24  
**Status:** F3 – Design & Plan  
**Basiert auf:** `docs/features/reading-history.md` (Spec F2)

---

## 1. Architektonische Einordnung

### Bestehende Patterns wiederverwenden
| Pattern | Quelle | Wiederverwendung |
|---------|--------|------------------|
| Prisma Model + Relation | `ReviewReaction`, `Bookmark`, `Vote` | `ReadingHistory` folgt identischem Muster |
| API Routes (App Router) | `/api/reviews/[id]/reactions`, `/api/votes` | `GET/DELETE /api/reading-history*` analog |
| Server Logic (`lib/`) | `lib/review-reactions.ts`, `lib/votes.ts` | `lib/reading-history.ts` mit `getHistory`, `trackReading`, `deleteEntry`, `clearHistory` |
| Client Hook | `useReviewReactions` (optimistic UI) | `useReadingHistory` + `useReadingHistoryTracker` |
| UI Component | `ReviewReactions.tsx` | `ReadingHistoryBadge.tsx` (Review-Detail), `ReadingHistoryList.tsx` (`/verlauf`) |
| Cache Strategy | `unstable_cache` 60s + Tag-Invaliderung | `unstable_cache` 30s + Tag `reading-history:${userId}` |
| Feature-Flag | `FEATURE_REVIEW_REACTIONS` | `FEATURE_READING_HISTORY` (Default `false`) |
| Rate-Limit | `lib/rate-limit.ts` | Identisch, 6/min für Tracking, 30/min für Read/Delete |
| Auth Check | `getServerSession` → `TwitchUser.id` | Identisch |

### Neue Abhängigkeiten
- **Keine neuen npm-Packages** — alles mit Boardmitteln (IntersectionObserver, Visibility API, React Hooks)
- **Keine neuen DB-Indizes** außer den im Model definierten (`@@index([userId, lastReadAt])`, `@@index([reviewId])`)

---

## 2. Datenfluss

### Tracking-Flow (Client → API → DB)
```
Review-Detail (Client)
    │
    ├─ useReadingHistoryTracker mounts
    │   ├─ IntersectionObserver auf Article/Content-Container (≥50% viewport)
    │   ├─ Visibility API (document.visibilityState) für Dwell-Time
    │   ├─ State: scrollDepth, dwellTime, lastSentAt
    │   └─ Debounce 10s → POST /api/reading-history/track
    │
    ▼
API: POST /api/reading-history/track
    │
    ├─ Auth: getServerSession() → userId
    ├─ Validation: Zod (reviewId, progress, scrollDepth, dwellTime)
    ├─ Rate-Limit: 6/min per user
    ├─ Prisma: upsert ReadingHistory (unique userId+reviewId)
    │   ├─ progress = max(old, new)
    │   ├─ scrollDepth = max(old, new)
    │   ├─ dwellTime += new
    │   └─ lastReadAt = now()
    └─ Revalidate: cacheTag `reading-history:${userId}`
```

### Read-Flow (Server → Client)
```
/verlauf (Server Component)
    │
    ├─ getServerSession() → userId
    ├─ getReadingHistory(userId, cursor, limit) → unstable_cache 30s
    │   └─ Prisma: findMany + include Review (title, slug, category, images, score)
    └─ Props an Client Component ReadingHistoryList
```

---

## 3. Arbeitspakete (PKG-1 bis PKG-11)

| Paket | Beschreibung | Abhängigkeit | Geschätzter Aufwand |
|-------|--------------|--------------|---------------------|
| **PKG-1** | **DB-Migration & Model** — `ReadingHistory` Model + Relation in `TwitchUser`, `prisma migrate dev` | — | 15 min |
| **PKG-2** | **Types & Zod-Schemas** — `src/lib/reading-history.ts` (Types), `src/lib/reading-history-schema.ts` (Zod) | PKG-1 | 15 min |
| **PKG-3** | **Server Logic** — `getHistory`, `trackReading`, `deleteEntry`, `clearHistory` in `src/lib/reading-history.ts` | PKG-2 | 30 min |
| **PKG-4** | **API Routes** — `GET /api/reading-history`, `DELETE /api/reading-history/[reviewId]`, `DELETE /api/reading-history`, `POST /api/reading-history/track` + Feature-Flag + Rate-Limit | PKG-3 | 30 min |
| **PKG-5** | **Client Types & Hooks** — `useReadingHistory` (SWR/React Query für Liste), `useReadingHistoryTracker` (Tracking-Logik) | PKG-4 | 30 min |
| **PKG-6** | **UI: ReadingHistoryBadge** — Komponente für Review-Detail (SSR + Client Hydration), zeigt Progress | PKG-3 | 20 min |
| **PKG-7** | **UI: ReadingHistoryList** — `/verlauf` Client Component: Liste, Skeleton, Empty, Pagination, Delete, Clear All | PKG-5 | 45 min |
| **PKG-8** | **Page: /verlauf** — Server Component + Client Wrapper, SEO, Meta, Auth-Check | PKG-7 | 20 min |
| **PKG-9** | **Review-Detail Integration** — Badge in `/reviews/[slug]` einbinden, SSR-Daten laden | PKG-6 | 15 min |
| **PKG-10** | **Einstellungen: Datenschutz-Toggle** — `/einstellungen/datenschutz` Sektion, Opt-in/out, Persistenz in UserProfile oder Cookie | PKG-3 | 25 min |
| **PKG-11** | **Tests & Doku** — Unit (Tracker-Logik, Schema), Integration (APIs), E2E (Flow), CHANGELOG, README, .env.example, PROGRESS.md | PKG-1–10 | 60 min |

**Gesamt:** ~4.5h

---

## 4. Cache-Strategie

| Operation | Cache | TTL | Invaliderung |
|-----------|-------|-----|--------------|
| `GET /api/reading-history` | `unstable_cache` | 30s | Tag `reading-history:${userId}` bei Track/Delete/Clear |
| `GET /api/reviews/[slug]` (inkl. History) | `unstable_cache` | 30s | Tag `reading-history:${userId}` + `review:${slug}` |
| Tracking (POST) | **Kein Cache** | — | Schreibt DB, invalidiert Read-Cache via Tag |

---

## 5. Client-Tracking Details (`useReadingHistoryTracker`)

```typescript
// Hook-Interface
interface UseReadingHistoryTrackerOptions {
  reviewId: string;
  enabled: boolean; // aus Feature-Flag + User-Setting
}

interface ReadingProgress {
  progress: number;      // 0-100
  scrollDepth: number;   // 0-100
  dwellTime: number;     // Sekunden
}

// Logik:
1. Mount → startTime = now(), visible = true
2. IntersectionObserver auf main Content-Container (rootMargin: "0px 0px -50% 0px")
   → bei entry.isIntersecting: scrollDepth = 100 (bzw. berechnet)
   → progress = max(scrollDepth, dwellTimeBasiert)
3. VisibilityChange Event:
   - hidden → dwellTime += now() - lastVisibleStart, visible = false
   - visible → lastVisibleStart = now()
4. BeforeUnload → flush aktuelle dwellTime
5. Debounce: nur wenn (now() - lastSentAt) > 10_000ms → POST /track
6. Cleanup: Observer disconnect, Event-Listener remove
```

**Progress-Berechnung:**
- `scrollDepth`: Prozent des Artikels, der im Viewport war (IntersectionObserver `intersectionRatio` * 100)
- `dwellTimeBasiert`: `Math.min(dwellTime / 60 * 10, 100)` → 10 Min = 100%
- `progress = Math.max(scrollDepth, dwellTimeBasiert)` — nimmt das "bessere" Signal

---

## 6. API-Details

### `GET /api/reading-history`
```typescript
// Query
cursor?: string; // ISO timestamp des letzten lastReadAt
limit?: number;  // default 20, max 50

// Response
{
  items: Array<{
    review: {
      id: string;
      slug: string;
      title: string;
      category: string;
      images: string[];
      score: number;
    };
    progress: number;
    scrollDepth: number;
    dwellTime: number;
    lastReadAt: string; // ISO
  }>;
  nextCursor: string | null;
}
```

### `POST /api/reading-history/track`
```typescript
// Body (Zod)
{
  reviewId: string;      // CUID
  progress: number;      // 0-100
  scrollDepth: number;   // 0-100
  dwellTime: number;     // >=0 Sekunden (Delta seit letztem Send)
}

// Response
{ success: true, entry: ReadingHistoryEntry }

// Errors
400: Invalid body
401: Not authenticated
429: Rate limit exceeded
500: Server error
```

### `DELETE /api/reading-history/[reviewId]`
```typescript
// Response
{ success: true }

// Errors
401: Not authenticated
404: Not found
```

### `DELETE /api/reading-history`
```typescript
// Response
{ success: true, deletedCount: number }
```

---

## 7. UI-Komponenten-Struktur

```
src/
├── components/
│   ├── reading-history/
│   │   ├── ReadingHistoryBadge.tsx      // Review-Detail Indikator
│   │   ├── ReadingHistoryList.tsx       // /verlauf Liste (Client)
│   │   ├── ReadingHistoryCard.tsx       // Einzelne Karte in Liste
│   │   ├── ReadingHistorySkeleton.tsx   // Loading State
│   │   └── ClearHistoryDialog.tsx       // Confirm Dialog
│   └── settings/
│       └── PrivacySettings.tsx          // Toggle für Tracking
├── app/
│   ├── verlauf/
│   │   ├── page.tsx                     // Server Component
│   │   └── ReadingHistoryClient.tsx     // Client Wrapper
│   ├── api/reading-history/
│   │   ├── route.ts                     // GET, DELETE (all)
│   │   ├── [reviewId]/route.ts          // DELETE single
│   │   └── track/route.ts               // POST track
│   └── einstellungen/datenschutz/
│       └── page.tsx                     // Erweitert um Tracking-Toggle
├── lib/
│   ├── reading-history.ts               // Server Logic + Types
│   └── reading-history-schema.ts        // Zod Schemas
└── hooks/
    └── useReadingHistoryTracker.ts      // Client Tracking Hook
```

---

## 8. Barrierefreiheit Checkliste (alle Komponenten)

- [ ] Semantisches HTML (`<nav>`, `<section>`, `<article>`, `<button>`)
- [ ] `aria-label` für Icon-Buttons (Delete, Clear)
- [ ] Focus-Visible Styles (Tailwind `focus-visible:ring`)
- [ ] `prefers-reduced-motion`: keine Animationen
- [ ] Color Contrast ≥ 4.5:1 (Badge, Progress-Bar)
- [ ] Screen Reader: Fortschritt als Text (`aria-label="Gelesen am 15.10.2026, 73 Prozent"`)
- [ ] Keyboard: Tab-Reihenfolge, Escape schließt Dialog, Enter/Space aktiviert Buttons
- [ ] Live Region für Toasts (bereits via `sonner` vorhanden)

---

## 9. Migration & Rollback

```bash
# Anwenden
npx prisma migrate dev --name add_reading_history

# Rollback (falls nötig)
npx prisma migrate reset  # oder db push ohne Model
```

**Rollback-Plan:** Model `ReadingHistory` aus Schema entfernen → `prisma db push` → API-Routen/UI hinter Feature-Flag bleiben inaktiv → kein Datenverlust bei anderen Models.

---

## 10. Umgebungsvariablen

```env
# .env.example
FEATURE_READING_HISTORY=false  # Default: Opt-in
READING_HISTORY_RETENTION_DAYS=180
READING_HISTORY_MAX_ENTRIES=200
```