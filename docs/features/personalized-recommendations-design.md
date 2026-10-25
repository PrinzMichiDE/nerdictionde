# Feature Design: Personalisierte Empfehlungen

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP ROUTER                         │
├─────────────────────────────────────────────────────────────────┤
│  / (Home)                    │  /reviews/[slug] (Detail)        │
│  ├─ RecommendationsSection   │  ├─ ReviewRecommendations        │
│  │  (Server Component)       │  │  (Client Component)           │
│  │  └─ fetchRecommendations() │  └─ fetchReviewRecommendations() │
│  └─ /api/recommendations     │  /api/reviews/[slug]/recommendations │
│       (GET, POST dismiss)    │         (GET)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER LOGIC (lib/recommendations.ts)        │
│  ├─ getRecommendations(userId, options)                         │
│  ├─ getReviewRecommendations(reviewId, userId?, options)        │
│  ├─ dismissRecommendation(userId, reviewId, reason)             │
│  ├─ computeContentScore(candidate, userSignals)                 │
│  ├─ computeUserUserScore(candidate, userSignals)                │
│  ├─ computeItemItemScore(candidate, userSignals)                │
│  ├─ computeTrendingScore(candidate)                             │
│  ├─ applyMMR(candidates, lambda)                                │
│  └─ generateReason(candidate, userSignals, scores)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Prisma)                        │
│  ├─ TwitchUser (Ratings, Bookmarks, Follows, History, Subs)    │
│  ├─ Review (Category, Tags, Metadata, Scores)                   │
│  ├─ ReviewRating, Bookmark, Follow, ReadingHistory,            │
│  │  CategorySubscription                                        │
│  └─ RecommendationDismiss (NEU)                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Cache-Strategie:**
- `unstable_cache` mit Tags für Invaliderung
- Home: `recommendations:home:{userId}` (TTL 5 Min, Tags: `user:{userId}:recs`, `review:{reviewId}`)
- Detail: `recommendations:detail:{reviewId}` (TTL 15 Min, Tags: `review:{reviewId}`)
- Invaliderung bei: Rating, Bookmark, Follow, ReadingHistory, CategorySub, Dismiss → `revalidateTag('user:{userId}:recs')`

---

## 2. Bestehende Wiederverwendbare Komponenten

| Komponente | Pfad | Wiederverwendung |
|------------|------|------------------|
| Review Card | `src/components/reviews/ReviewCard.tsx` | Basis für Empfehlungs-Karten (Prop `reason`, `dismissible`) |
| Skeleton | `src/components/ui/skeleton.tsx` | Loading-States |
| Toast | `src/hooks/use-toast.ts` | Dismiss-Bestätigung |
| Feature-Flag | `src/lib/feature-flags.ts` | `FEATURE_PERSONALIZED_RECOMMENDATIONS` |
| Auth/Session | `src/lib/auth.ts` | `getServerSession` in API Routes |
| Cache Helpers | `src/lib/cache.ts` | `unstable_cache` Wrapper, Tag-Invaliderung |
| Zod Schemas | `src/lib/*-schema.ts` Pattern | Neue `recommendation-schema.ts` |
| API Response Helper | `src/lib/api-response.ts` | `successResponse`, `errorResponse` |

---

## 3. Arbeitspakete (PKG-1 bis PKG-12)

### PKG-1: Datenbank-Migration & Model
- **Ziel:** `RecommendationDismiss` Model + Migration
- **Dateien:**
  - `prisma/schema.prisma` (Model hinzufügen)
  - `prisma/migrations/20261025XXXXXX_add_recommendation_dismiss/migration.sql` (auto via `prisma migrate dev`)
- **Acceptance:** `prisma migrate dev` läuft durch, `prisma db push` sync, Tabelle abfragbar

### PKG-2: Types & Zod-Schemas
- **Ziel:** TypeScript Types + Validierungsschemas
- **Dateien:**
  - `src/types/recommendations.ts` (Interfaces: `Recommendation`, `RecommendationReason`, `UserSignals`, `RecommendationStrategy`)
  - `src/lib/recommendation-schema.ts` (Zod: `dismissSchema`, `recommendationsQuerySchema`, `reviewRecommendationsQuerySchema`, Response-Schemas)
- **Acceptance:** `type-check` grün, Schemas exportiert, Tests für Schemas

### PKG-3: Server Logic — Signal Extraction
- **Ziel:** Nutzer-Signale laden (Ratings, Bookmarks, Follows, History, Subs)
- **Datei:** `src/lib/recommendations-signals.ts`
- **Funktionen:**
  - `getUserSignals(userId): Promise<UserSignals>` — cached (TTL 5 Min, Tag `user:{userId}:signals`)
  - Signale: `ratedReviews: Map<reviewId, score>`, `bookmarkedReviews: Set<reviewId>`, `followedUserIds: Set<userId>`, `readReviewIds: Set<reviewId>`, `subscribedCategories: Set<Category>`
- **Acceptance:** Unit-Tests für Signal-Extraktion, Cache-Verhalten

### PKG-4: Server Logic — Candidate Generation
- **Ziel:** Kandidaten-Pool für User/Review generieren
- **Datei:** `src/lib/recommendations-candidates.ts`
- **Funktionen:**
  - `getContentCandidates(userSignals, excludeIds, limit): Promise<Review[]>`
  - `getCollaborativeCandidates(userSignals, excludeIds, limit): Promise<Review[]>`
  - `getTrendingCandidates(excludeIds, limit): Promise<Review[]>`
  - `mergeCandidates(...): Review[]` — Union + Dedupe
- **Acceptance:** Unit-Tests mit Mock-DB, Candidate-Counts plausibel

### PKG-5: Server Logic — Scoring & Ranking
- **Ziel:** Scoring-Algorithmen + MMR + Reason-Generierung
- **Datei:** `src/lib/recommendations-scoring.ts`
- **Funktionen:**
  - `computeContentScore(candidate, userSignals): number`
  - `computeUserUserScore(candidate, userSignals): number`
  - `computeItemItemScore(candidate, userSignals): number`
  - `computeTrendingScore(candidate): number`
  - `calculateFinalScore(scores, weights): number` — Gewichte aus Config
  - `applyMMR(candidates, scores, lambda): Review[]`
  - `generateReason(candidate, userSignals, scores): RecommendationReason`
- **Acceptance:** Unit-Tests für jede Scoring-Funktion, MMR, Reason-Templates

### PKG-6: Server Logic — Main Entry & Dismiss
- **Ziel:** Hauptfunktionen + Dismiss-Logik
- **Datei:** `src/lib/recommendations.ts`
- **Funktionen:**
  - `getRecommendations(userId, { limit, cursor }): Promise<RecommendationResult>`
  - `getReviewRecommendations(reviewId, userId?, { limit }): Promise<RecommendationResult>`
  - `dismissRecommendation(userId, reviewId, reason): Promise<void>`
  - Cache-Wrapper mit `unstable_cache` + Tags
  - Invaliderung-Helper: `invalidateUserRecommendations(userId)`
- **Acceptance:** Integration-Tests (Mock Prisma), Cache-Verhalten, Dismiss-Persistenz

### PKG-7: API Routes — Home Recommendations
- **Ziel:** `GET /api/recommendations`, `POST /api/recommendations/dismiss`
- **Dateien:**
  - `src/app/api/recommendations/route.ts` (GET + POST)
  - `src/app/api/recommendations/dismiss/route.ts` (POST) — oder kombiniert in route.ts
- **Features:** Auth-Check, Zod-Validierung, Feature-Flag, Rate-Limit, Cache-Headers
- **Acceptance:** Integration-Tests (Supertest), Auth, Validation, Flag, Dismiss

### PKG-8: API Routes — Review Detail Recommendations
- **Ziel:** `GET /api/reviews/[slug]/recommendations`
- **Datei:** `src/app/api/reviews/[slug]/recommendations/route.ts`
- **Features:** Optional Auth (für Personalisierung), Feature-Flag, Cache, Exclude Current Review
- **Acceptance:** Integration-Tests, Ohne/mit Auth, Exclude-Current

### PKG-9: Client Hooks
- **Ziel:** `useRecommendations`, `useDismissRecommendation`
- **Datei:** `src/hooks/useRecommendations.ts`
- **Features:** SWR/TanStack Query Pattern (oder custom fetch + State), Optimistic UI für Dismiss, Error/Loading States
- **Acceptance:** Unit-Tests (React Testing Library), Optimistic Dismiss, Refetch nach Dismiss

### PKG-10: UI Components — Home Section
- **Ziel:** `RecommendationsSection` (Server Component) + `RecommendationCard` (Client)
- **Dateien:**
  - `src/components/recommendations/RecommendationsSection.tsx` (Server, fetch + Grid)
  - `src/components/recommendations/RecommendationCard.tsx` (Client, Dismiss-Button, Reason-Badge)
  - `src/components/recommendations/RecommendationSkeleton.tsx`
- **Integration:** In `src/app/page.tsx` (Homepage) einbinden
- **Acceptance:** Visuell konsistent mit ReviewCard, a11y, Responsive Grid, Dismiss funktioniert

### PKG-11: UI Components — Review Detail Section
- **Ziel:** `ReviewRecommendations` (Client Component)
- **Datei:** `src/components/recommendations/ReviewRecommendations.tsx`
- **Features:** Horizontal Scroll (Mobile) / Grid (Desktop), Kein Dismiss, Reason-Badge
- **Integration:** In `src/app/reviews/[slug]/page.tsx` vor Kommentare/Q&A
- **Acceptance:** Visuell passend, Responsive, Laden/Error/Empty

### PKG-12: Einstellungen Toggle, Doku & Cleanup
- **Ziel:** Toggle in `/einstellungen`, CHANGELOG, README, .env.example, ROADMAP, PROGRESS
- **Dateien:**
  - `src/app/einstellungen/page.tsx` (Toggle hinzufügen)
  - `src/lib/feature-flags.ts` (Flag bereits da, nur Default prüfen)
  - `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `.env.example`, `docs/PROGRESS.md`
  - Config: `src/lib/recommendations-config.ts` (Gewichte, Limits aus Env)
- **Acceptance:** Toggle funktioniert, Doku vollständig, Build/Type-Check/Lint/Tests grün

---

## 4. Datenfluss-Details

### Home Recommendations (`GET /api/recommendations`)
```
Request → Auth → Feature-Flag → Rate-Limit
    → Cache Check (recommendations:home:{userId})
    │   Hit → Return
    │   Miss → getUserSignals(userId) [cached]
    │          → getContentCandidates + getCollaborativeCandidates + getTrendingCandidates
    │          → mergeCandidates → exclude (read, dismissed, own, unpublished)
    │          → compute Scores → applyMMR → generateReasons → take(limit)
    │          → Cache Store → Return
```

### Review Detail Recommendations (`GET /api/reviews/[slug]/recommendations`)
```
Request → Feature-Flag → Rate-Limit
    → Cache Check (recommendations:detail:{reviewId})
    │   Hit → Return
    │   Miss → getReviewSignals(reviewId) [Category, Tags, Dev, Pub]
    │          → getContentCandidates (basierend auf Review-Signalen)
    │          → exclude (current, unpublished)
    │          → compute Content/Item-Item/Trending Scores
    │          → applyMMR → generateReasons → take(limit)
    │          → Cache Store → Return
```

### Dismiss (`POST /api/recommendations/dismiss`)
```
Request → Auth → Validate (Zod) → Feature-Flag → Rate-Limit
    → Prisma upsert RecommendationDismiss (ON CONFLICT DO NOTHING)
    → revalidateTag(`user:{userId}:recs`)
    → Return Success
```

---

## 5. Cache-Invaliderungstrigger

| Mutation | Invaliderung |
|----------|--------------|
| `POST /api/reviews/[slug]/rating` | `revalidateTag('user:{userId}:recs')`, `revalidateTag('review:{slug}')` |
| `POST /api/reviews/[slug]/bookmark` | `revalidateTag('user:{userId}:recs')` |
| `POST /api/users/[id]/follow` | `revalidateTag('user:{followerId}:recs')` |
| `POST /api/reading-history` (Track) | `revalidateTag('user:{userId}:recs')` |
| `POST /api/me/categories/subscriptions` | `revalidateTag('user:{userId}:recs')` |
| `POST /api/recommendations/dismiss` | `revalidateTag('user:{userId}:recs')` |

---

## 6. Konfiguration (Environment)

```env
# Feature Flag
FEATURE_PERSONALIZED_RECOMMENDATIONS=true

# Algorithm Weights (sum = 1.0)
REC_WEIGHT_CONTENT=0.4
REC_WEIGHT_USER_USER=0.3
REC_WEIGHT_ITEM_ITEM=0.2
REC_WEIGHT_TRENDING=0.1

# MMR Diversity
REC_MMR_LAMBDA=0.3

# Limits
REC_CANDIDATE_LIMIT=50
REC_HOME_LIMIT=10
REC_DETAIL_LIMIT=5
REC_DISMISS_TTL_DAYS=30

# Cache TTL (seconds)
REC_CACHE_TTL_HOME=300
REC_CACHE_TTL_DETAIL=900
REC_CACHE_TTL_SIGNALS=300
```

---

## 7. Abhängigkeiten & Risiken

| Abhängigkeit | Risiko | Mitigation |
|--------------|--------|------------|
| Reading History (Signale) | Noch nicht alle Nutzer haben History | Cold-Start Fallback, Progressive Enhancement |
| Prisma Query Performance | Komplexe Joins bei Candidate-Generation | Indizes, Candidate-Limit 50, später Materialized Views |
| Cache-Stampede bei Cache-Miss | Viele User gleichzeitig | `unstable_cache` deduped automatisch, TTL kurz |
| Cold-Start Quality | Neue Nutzer sehen generische Empfehlungen | Category-Subscriptions als Signal, Trending-Mix |
| Dismiss-Spam | Nutzer dismissen alles | Rate-Limit, TTL 30 Tage, keine harte Blockade |

---

## 8. Zeit-Schätzung

| Paket | Aufwand | Gesamt |
|-------|---------|--------|
| PKG-1: DB/Migration | 0.5h | 0.5h |
| PKG-2: Types/Schemas | 0.5h | 1h |
| PKG-3: Signal Extraction | 1h | 2h |
| PKG-4: Candidate Generation | 1h | 3h |
| PKG-5: Scoring/Ranking | 1.5h | 4.5h |
| PKG-6: Main Entry/Dismiss | 1h | 5.5h |
| PKG-7: API Home | 0.5h | 6h |
| PKG-8: API Detail | 0.5h | 6.5h |
| PKG-9: Client Hooks | 0.5h | 7h |
| PKG-10: UI Home | 1h | 8h |
| PKG-11: UI Detail | 0.5h | 8.5h |
| PKG-12: Settings/Docs | 0.5h | 9h |
| **Total** | | **~9h** |

---

## 9. Definition of Done (Feature)

- [ ] Spec vollständig (F2 ✅)
- [ ] Design vollständig (F3 ✅)
- [ ] Alle 12 Pakete implementiert, committed, gepusht (F4)
- [ ] Unit-Tests (Signals, Candidates, Scoring, MMR, Reason, Dismiss) — mind. 30 Tests
- [ ] Integration-Tests (API Routes: Home, Detail, Dismiss, Auth, Flag, Rate-Limit) — mind. 20 Tests
- [ ] E2E-Tests (Home Section, Detail Section, Dismiss, Settings Toggle, Cold-Start) — mind. 5 Tests
- [ ] Self-Review (F6) ohne offene Befunde
- [ ] `npm run verify` grün (Build, Type-Check, Lint, Tests)
- [ ] Doku & Changelog aktualisiert (F8)
- [ ] Feature in ROADMAP als erledigt markiert (F9)