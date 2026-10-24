# Feature-Design: Review Reactions (Emoji-Reaktionen)

**Status:** F3 Design — In Arbeit  
**Datum:** 2026-10-24  
**Branch:** `auto/dev`  
**Spec:** `docs/features/review-reactions.md`

---

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ ReviewDetail│    │ ReviewCard  │    │ ReviewReactions UI  │  │
│  │   (RSC)     │    │   (RSC)     │    │   (Client Comp)     │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
│         │                  │                       │             │
│         ▼                  ▼                       ▼             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js Router                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Server (Next.js API)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  GET /api/reviews/[id]/reactions                             ││
│  │  POST /api/reviews/[id]/reactions                            ││
│  │  DELETE /api/reviews/[id]/reactions                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Prisma Client (PostgreSQL)                      ││
│  │  Model: ReviewReaction (userId, reviewId, type, createdAt)  ││
│  │  Index: (reviewId), (userId), Unique(userId, reviewId)      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Betroffene Module & Dateien

### Neu anzulegende Dateien

| Pfad | Zweck |
|------|-------|
| `prisma/migrations/20261024xxxxxx_add_review_reactions/migration.sql` | DB-Migration für `ReviewReaction` Model + Enum |
| `src/lib/schemas/reaction-schema.ts` | Zod-Schemas für API-Validierung |
| `src/lib/review-reactions.ts` | Server-seitige Logik (Counts, User-Reaction, Toggle) |
| `src/app/api/reviews/[id]/reactions/route.ts` | API-Routes (GET, POST, DELETE) |
| `src/components/reviews/ReviewReactions.tsx` | Client Component für Reaction-UI |
| `src/components/reviews/ReviewReactionsSkeleton.tsx` | Skeleton für SSR-Loading |
| `src/hooks/useReviewReactions.ts` | Client Hook für State-Management (optimistic UI) |
| `src/types/review-reactions.ts` | TypeScript Types (ReactionType, Counts, API Response) |

### Zu modifizierende Dateien

| Pfad | Änderung |
|------|----------|
| `prisma/schema.prisma` | `ReviewReaction` Model + Enum + Relations zu `Review` & `TwitchUser` |
| `src/app/reviews/[slug]/page.tsx` | `ReviewReactions` in Review-Detail einbinden (nach Header, vor Content) |
| `src/components/reviews/ReviewCard.tsx` | Optional: `reactionsSummary` Prop für Top-1 Emoji auf Karten |
| `src/lib/prisma.ts` | Evtl. Cache-Tags für Reactions definieren |
| `.env.example` | `FEATURE_REVIEW_REACTIONS=true` hinzufügen |

---

## 3. Datenfluss

### GET `/api/reviews/[id]/reactions` (Review-Detail)
```
1. Client (ReviewReactions) → fetch `/api/reviews/[id]/reactions`
2. API Route:
   a. Prüfe Feature-Flag
   b. Validiere reviewId (CUID)
   c. Hole Session (getServerSession) → userId oder null
   d. `unstable_cache` mit Key `review-reactions:${reviewId}` (TTL 60s)
      - Query: `ReviewReaction.groupBy({ by: ['type'], where: { reviewId }, _count: true })`
      - Query (wenn userId): `ReviewReaction.findUnique({ where: { userId_reviewId: { userId, reviewId } } })`
   e. Response: { counts, total, myReaction }
3. Client: Setzt State, rendert Buttons
```

### POST `/api/reviews/[id]/reactions` (Reaktion setzen/wechseln)
```
1. Client → POST { type } mit Session-Cookie
2. API Route:
   a. Feature-Flag, Auth-Check (401 wenn keine Session)
   b. Zod-Validierung: type ∈ ReactionType
   c. Prisma Transaktion:
      - Upsert: `ReviewReaction.upsert({
          where: { userId_reviewId: { userId, reviewId } },
          create: { userId, reviewId, type },
          update: { type }  // Wechsel: alte Type wird überschrieben
        })`
   d. `revalidateTag('review-reactions-' + reviewId)` (Cache-Invaliderung)
   e. Response: neue Counts + total + myReaction
3. Client: Optimistic UI confirmiert, Toast bei Fehler
```

### DELETE `/api/reviews/[id]/reactions?type=THUMBS_UP`
```
1. Client → DELETE mit Query-Param type
2. API Route: Analog POST, aber `delete` statt `upsert`
3. Cache-Invaliderung, Response
```

---

## 4. Arbeitspakete (3–10 kleine, einzeln lauffähige Pakete)

| Paket | Beschreibung | Abhängigkeit | Geschätzter Aufwand |
|-------|--------------|--------------|---------------------|
| **PKG-1: DB-Migration & Model** | Prisma Schema erweitern (Enum + Model), Migration erzeugen & anwenden | — | 15 Min |
| **PKG-2: Types & Schemas** | `src/types/review-reactions.ts`, `src/lib/schemas/reaction-schema.ts` (Zod) | PKG-1 | 10 Min |
| **PKG-3: Server Logic** | `src/lib/review-reactions.ts` — `getCounts()`, `getUserReaction()`, `toggleReaction()` | PKG-2 | 20 Min |
| **PKG-4: API Routes** | `src/app/api/reviews/[id]/reactions/route.ts` (GET, POST, DELETE) + Feature-Flag + Rate-Limit | PKG-3 | 25 Min |
| **PKG-5: Client Types & Hook** | `src/types/review-reactions.ts` (Client), `src/hooks/useReviewReactions.ts` (optimistic UI, SWR/fetch) | PKG-2 | 20 Min |
| **PKG-6: UI Component** | `src/components/reviews/ReviewReactions.tsx` + `ReviewReactionsSkeleton.tsx` + Styles (Tailwind) | PKG-5 | 30 Min |
| **PKG-7: Review-Detail Integration** | Einbindung in `src/app/reviews/[slug]/page.tsx` (nach Header, vor Content), SSR-Counts via `unstable_cache` | PKG-4, PKG-6 | 15 Min |
| **PKG-8: Review-Card Enhancement** | `ReviewCard.tsx` — optionale `reactionsSummary` Prop (Top-1 Emoji + Count) | PKG-4 | 15 Min |
| **PKG-9: Tests** | Unit (Logic, Schema, Hook), Integration (API), E2E (Flow) | PKG-4, PKG-6 | 40 Min |
| **PKG-10: Doku & Flag** | `CHANGELOG.md`, `README.md`, `.env.example`, Feature-Flag Default setzen, PROGRESS.md aktualisieren | PKG-9 | 10 Min |

**Gesamt:** ~3.5h reine Implementierung (ohne Wartezeiten)

---

## 5. Wiederverwendbarkeit & Bestehendes

### Vorhandene Patterns nutzen
- **API-Struktur:** Wie `src/app/api/votes/route.ts` (POST/DELETE, Auth, Zod, Prisma)
- **Optimistic UI:** Wie `src/components/comments/CommentVoting.tsx` (lokaler State + Server-Sync)
- **Caching:** `unstable_cache` Pattern aus `src/lib/search-relevance.ts` / `src/lib/collections.ts`
- **Feature-Flag:** `FEATURE_REVIEW_COLLECTIONS` in `src/lib/collections.ts` als Vorbild
- **Toast:** `useToast` Hook aus `src/hooks/use-toast.ts`
- **Skeleton:** `SearchSkeleton.tsx` als Vorbild für `ReviewReactionsSkeleton.tsx`
- **Accessibility:** `CommentVoting` / `FollowButton` als Referenz (aria-label, focus-visible, keyboard)

### Keine neuen Dependencies
- Emojis als Unicode (kein `emoji-picker-react` oder ähnliche)
- Keine Animation-Library (CSS Transition reicht)
- Zod, Prisma, Next.js, React, Tailwind — alles bereits im Projekt

---

## 6. Cache-Strategie

| Ebene | Key | TTL | Invaliderung |
|-------|-----|-----|--------------|
| `unstable_cache` (Server) | `review-reactions:${reviewId}` | 60s | `revalidateTag('review-reactions-' + reviewId)` bei POST/DELETE |
| Client (SWR/React Query) | `/api/reviews/${id}/reactions` | 30s (stale-while-revalidate) | Mutate nach optimistischem Update |
| Review-Detail (RSC) | `review:${slug}` | 30s | Separater Tag, nicht direkt betroffen |

**Wichtig:** `GET` Route nutzt `unstable_cache` mit `tags: ['review-reactions-' + reviewId]`. `POST/DELETE` rufen `revalidateTag` auf.

---

## 7. Fehlerbehandlung & Edge Cases

| Szenario | Behandlung |
|----------|------------|
| User nicht authentifiziert (POST/DELETE) | 401 `{ error: "Nicht authentifiziert" }` |
| Ungültiger `type` Parameter | 400 `{ error: "Ungültiger Reaktionstyp" }` (Zod) |
| Review nicht gefunden / nicht published | 404 (Prisma `findUnique` auf Review prüft Status) |
| DB Unique Constraint Violation (Race) | Prisma `upsert` handhabt atomar; `update` überschreibt Type |
| Rate Limit überschritten | 429 `{ error: "Zu viele Anfragen" }` |
| Netzwerkfehler Client-seitig | Optimistic Rollback, Toast "Fehler, bitte erneut versuchen" |

---

## 8. Barrierefreiheit (Checkliste für Implementierung)

- [ ] Buttons: `<button type="button">` mit `aria-pressed="true/false"`
- [ ] `aria-label`: "X Nutzer finden dies hilfreich (Deine Reaktion: Daumen hoch)"
- [ ] `aria-live="polite"` auf Zähler-Container für Ansagen bei Änderungen
- [ ] Fokus-Indikator: `focus-visible:ring-2 focus-visible:ring-primary`
- [ ] Tastatur: Tab durch Buttons, Enter/Space toggelt
- [ ] Screen-Reader-Text: Versteckter Summary-Text (`sr-only`)
- [ ] Tooltip für Nicht-Eingeloggte: `role="tooltip"` + `aria-describedby`
- [ ] Farbkontrast: Mind. 4.5:1 (Tailwind `text-muted-foreground` auf `bg-background`)

---

## 9. Rollout & Feature-Flag

```typescript
// src/lib/feature-flags.ts (neu oder bestehende nutzen)
export const FEATURE_REVIEW_REACTIONS = process.env.FEATURE_REVIEW_REACTIONS !== 'false';
```

- Default: `true` (aktiv)
- Deaktivierung: `FEATURE_REVIEW_REACTIONS=false` → API 404, UI rendert `null`
- Keine DB-Migration nötig bei Deaktivierung (Tabelle bleibt, wird nur nicht genutzt)

---

## 10. Nächste Schritte (F4)

1. PKG-1 bis PKG-4: Backend (DB, Logic, API) — **zuerst, damit Frontend dagegen entwickeln kann**
2. PKG-5 bis PKG-7: Frontend (Hook, Component, Integration)
3. PKG-8: Review-Card Enhancement (optional, kann nachgereicht werden)
4. PKG-9: Tests (parallel zur Implementierung)
5. PKG-10: Doku & Cleanup

**Commit-Strategie:** Nach jedem Paket Commit + Push (Conventional Commits: `feat(review-reactions): ...`)

---

## 11. Offene Entscheidungen (aus Spec)

1. **Emoji-Set:** 6 Standard (👍 ❤️ 🎉 🤔 😢 😡) — **final für MVP**
2. **Self-Reaction:** Erlaubt (wie GitHub)
3. **Animation:** CSS Transition (`transition-transform duration-150`), kein Framer Motion
4. **Batch-API für Listen:** **Nicht im MVP** — Top-1 via `_count` auf Review-Query
5. **Toast:** Bestehende `useToast` / `Toaster` nutzen