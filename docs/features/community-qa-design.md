# Design & Plan: Community Q&A auf Reviews

## Architektur-Übersicht

Das Feature fügt sich nahtlos in die bestehende Architektur ein:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Review Detail Page                         │
│  (Server Component: SSR Q&A List + Client Components für Interact)│
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │  QA API  │   │  Vote API│   │ Accept   │
       │  Routes  │   │  Routes  │   │  API     │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                  ┌──────────────────┐
                  │  lib/qa.ts       │
                  │  (Server Logic)  │
                  └────────┬─────────┘
                           ▼
                  ┌──────────────────┐
                  │    Prisma        │
                  │  (ReviewQA,      │
                  │   QAAnswer,      │
                  │   QAVote)        │
                  └──────────────────┘
```

**Wiederverwendete Patterns:**
- `unstable_cache` + Tag-Invaliderung (wie `review-reactions`, `collections-follow`)
- Optimistic UI via Custom Hooks (wie `useReviewReactions`, `useCollectionFollow`)
- Zod Schemas für Validation (wie `review-reactions-schema`, `collections-follow-schema`)
- Notification Trigger via `createNotification` Batch-Insert (wie `collection-follow`, `comment-voting`)
- Feature-Flag Guard in API Routes

---

## Datenfluss

### Lese-Flow (SSR)
1. `ReviewDetailPage` (Server Component) ruft `getQAList(reviewSlug, cursor?)` auf
2. `getQAList` prüft Cache (`review:{slug}:qa`), sonst DB-Query mit `include: { author, answers: { include: { author, votes } } }`
3. serialisierte Daten an Client Components übergeben
4. Client: `QAList` rendert `QAQuestion` Cards mit `QAAnswers` Accordion

### Schreib-Flow (Client → API → DB → Cache Invaliderung)
1. User Action (Frage stellen, Antworten, Voten, Accept)
2. Custom Hook (`useQA`, `useQAVote`) → Optimistic Update lokaler State
3. `fetch` an API Route
4. API: Auth + Validation + `qa.ts` Server Logic + Prisma Transaction
5. Success: `revalidateTag('review:{slug}:qa')` + `revalidateTag('review:{slug}:qa:{questionId}')`
6. Hook: Toast Success, Optimistic State bestätigt
7. Error: Rollback Optimistic State, Toast Error

---

## Arbeitspakete (PKG-1 bis PKG-12)

### PKG-1: DB-Migration & Prisma Models
**Ziel:** Models `ReviewQA`, `QAAnswer`, `QAVote` + Enum `QAStatus` + `NotificationType` Erweiterung
**Dateien:**
- `prisma/schema.prisma` (Models + Enum + Indizes)
- `prisma/migrations/20261025000000_add_community_qa/migration.sql` (auto-generiert via `prisma migrate dev`)
**Validierung:** `prisma migrate dev`, `prisma db push`, `prisma generate` — Build grün

### PKG-2: Types & Zod-Schemas
**Ziel:** TypeScript Types + Zod Validation Schemas für alle API Inputs/Outputs
**Dateien:**
- `src/lib/qa-schema.ts` (alle Schemas: `createQuestionSchema`, `updateQuestionSchema`, `createAnswerSchema`, `voteSchema`, `acceptSchema`, `qaListQuerySchema`, Response Schemas)
- `src/types/qa.ts` (inferierte Types + UI Types: `QAQuestionWithAnswers`, `QAAnswerWithVotes`, `QAVoteStatus`)
**Validierung:** `npm run type-check`, Unit-Tests für Schemas

### PKG-3: Server Logic (`lib/qa.ts`)
**Ziel:** Reine Server-Funktionen (kein Next.js), wiederverwendbar für API & Scripts
**Funktionen:**
- `getQAList(reviewId, cursor?, limit?)` — gecacht 60s, Tag `review:{reviewId}:qa`
- `getQAById(questionId)` — gecacht 60s, Tag `review:{reviewId}:qa:{questionId}`
- `createQuestion(reviewId, authorId, title, body?)`
- `updateQuestion(questionId, authorId, title, body?)`
- `deleteQuestion(questionId, authorId)` — Soft-Delete + Kaskade Answers
- `createAnswer(questionId, authorId, body)`
- `updateAnswer(answerId, authorId, body)`
- `deleteAnswer(answerId, authorId)`
- `toggleVote(userId, questionId?, answerId?, value: 1 | -1 | 0)` — Upsert Vote, Score denormalisiert updaten
- `acceptAnswer(questionId, answerId, requesterId)` — Prüft Owner, toggelt `isAccepted`, updatet `acceptedAnswerId` + `status`
- `invalidateQACache(reviewId, questionId?)` — Tag-Invaliderung
**Validierung:** Unit-Tests für jede Funktion (Mock Prisma)

### PKG-4: API Routes — Fragen CRUD
**Dateien:**
- `src/app/api/reviews/[slug]/qa/route.ts` (GET + POST)
- `src/app/api/reviews/[slug]/qa/[questionId]/route.ts` (GET + PATCH + DELETE)
**Features:** Feature-Flag Guard, Auth, Validation, Rate-Limit (5/min Create), Cache-Tags
**Validierung:** Integration-Tests (GET, POST, PATCH, DELETE, Auth, 404, 403, Flag)

### PKG-5: API Routes — Antworten CRUD
**Dateien:**
- `src/app/api/reviews/[slug]/qa/[questionId]/answers/route.ts` (POST)
- `src/app/api/reviews/[slug]/qa/[questionId]/answers/[answerId]/route.ts` (PATCH + DELETE)
**Features:** Wie PKG-4, Rate-Limit (10/min Create)
**Validierung:** Integration-Tests

### PKG-6: API Routes — Votes & Accept
**Dateien:**
- `src/app/api/reviews/[slug]/qa/[questionId]/vote/route.ts` (POST)
- `src/app/api/reviews/[slug]/qa/[questionId]/answers/[answerId]/vote/route.ts` (POST)
- `src/app/api/reviews/[slug]/qa/[questionId]/accept/route.ts` (POST)
**Features:** Auth, Self-Vote Prevention, Optimistic Locking via `version` Feld (optional), Rate-Limit (30/min)
**Validierung:** Integration-Tests

### PKG-7: Client Types & Hooks
**Dateien:**
- `src/hooks/useQA.ts` — `useQAList(reviewSlug)`, `useQAMutations()` (createQuestion, updateQuestion, deleteQuestion, createAnswer, updateAnswer, deleteAnswer, acceptAnswer)
- `src/hooks/useQAVote.ts` — `useQAVote(questionId?)`, `useQAAnswerVote(answerId?)` — Optimistic UI, Rollback, Toast
**Pattern:** Wie `useReviewReactions`, `useCollectionFollow` — SWR-Style mit `useState` + `useCallback` Mutations

### PKG-8: UI Components — Frage-Liste & Frage-Card
**Dateien:**
- `src/components/qa/QAList.tsx` — Container: lädt via `useQAList`, rendert `QAQuestion` Array, Pagination "Mehr laden", Empty State, Loading Skeleton
- `src/components/qa/QAQuestion.tsx` — Accordion (`<details>`), Titel, Meta (Autor, Datum, Score), Badge "✓ Gelöst", `QAAnswers` Slot
- `src/components/qa/QAQuestionSkeleton.tsx` — Loading State
- `src/components/qa/QAEmptyState.tsx` — CTA "Frage stellen"

### PKG-9: UI Components — Antworten & Formulare
**Dateien:**
- `src/components/qa/QAAnswers.tsx` — Liste `QAAnswer`, Sortierung: Accepted zuerst, dann Score desc
- `src/components/qa/QAAnswer.tsx` — Body (Markdown rendered), Meta, Vote Buttons, "Als Lösung markieren" (nur für Fragesteller, nur wenn nicht selbst), Edit/Delete Menu (Owner)
- `src/components/qa/QAAnswerForm.tsx` — Inline Markdown Editor (Textarea + Preview Toggle), Char-Counter, Submit/Cancel
- `src/components/qa/QAQuestionForm.tsx` — Modal oder Inline (entscheidung: Inline unter Liste), Titel + Body, Char-Counter
- `src/components/qa/QAVoteButtons.tsx` — Pfeil hoch/runter, Score, `aria-pressed`, disabled bei eigenem Content

### PKG-10: Review-Detail Integration
**Dateien:**
- `src/app/reviews/[slug]/page.tsx` — Import `QASection` (Client Component), Platzierung vor Comments
- `src/components/reviews/QASection.tsx` — Wrapper: Prüft Feature-Flag, Review Status (published), rendert `QAList` + `QAQuestionForm` (für eingeloggte)
- SSR: `getQAList` Aufruf in Page, Daten an `QASection` als `initialData` Props

### PKG-11: Tests
**Unit Tests:**
- `tests/lib/qa-schema.test.ts` — Schema Validierung
- `tests/lib/qa.test.ts` — Server Logic (Mock Prisma)
- `tests/hooks/useQA.test.ts` — Hook Logic (Mock fetch)
- `tests/hooks/useQAVote.test.ts` — Vote Logic

**Integration Tests:**
- `tests/api/reviews/qa.test.ts` — Alle API Routes (CRUD, Votes, Accept, Auth, Flag, Pagination, Sortierung)

**Ziel:** 30+ Unit + 25+ Integration Tests, alle grün

### PKG-12: Doku, Flag, Changelog, Cleanup
**Dateien:**
- `CHANGELOG.md` — Eintrag unter `## [Unreleased]`
- `README.md` — Feature-Beschreibung in Feature-Liste
- `.env.example` — `FEATURE_COMMUNITY_QA=true`
- `docs/features/community-qa.md` — Review-Sektion (F6) ausfüllen
- `docs/PROGRESS.md` — Zusammenfassung ergänzen
- `docs/ROADMAP.md` — Feature als erledigt markieren
- Lint/Type-Check/Build/Tests final prüfen

---

## Cache-Strategie

| Cache Key | TTL | Tags | Invaliderung bei |
|-----------|-----|------|------------------|
| `review:{reviewId}:qa` | 60s | `review:{reviewId}:qa` | Frage CRUD, Answer CRUD, Vote, Accept |
| `review:{reviewId}:qa:{questionId}` | 60s | `review:{reviewId}:qa:{questionId}` | Question/Answer Update, Vote, Accept |
| `user:{userId}:qa` | 60s | `user:{userId}:qa` | User eigene QA CRUD |

**Implementation:** `unstable_cache` in `lib/qa.ts` mit `tags` Array. Invaliderung via `revalidateTag` in API Routes nach erfolgreicher Mutation.

---

## a11y-Checkliste (pro Komponente)

| Komponente | Prüfpunkte |
|------------|------------|
| `QASection` | `aria-labelledby="qa-heading"`, Heading `h2#qa-heading` |
| `QAList` | `role="list"`, `aria-label="Fragen & Antworten"` |
| `QAQuestion` | `<details>/<summary>` nativ, `summary` als Button-ähnlich, `aria-expanded` |
| `QAVoteButtons` | `<button aria-pressed={voted}>`, `aria-label="Upvote (Score: 5)"`, `disabled` bei Owner |
| `QAQuestionForm` / `QAAnswerForm` | `<form>`, Labels via `<label htmlFor>`, `aria-describedby` für Char-Counter, `aria-invalid` bei Fehler |
| `QAAnswer` (Accept Button) | `aria-pressed={isAccepted}`, `aria-label="Als Lösung markieren"` |
| Fokus-Management | Nach Submit: Fokus auf neue Frage/Antwort; Nach Delete: Fokus auf Liste |
| Reduced Motion | CSS: `@media (prefers-reduced-motion: reduce) { .accordion-content { transition: none; } }` |

---

## Abhängigkeiten & Risiken

| Abhängigkeit | Status |
|--------------|--------|
| Prisma Client v6 | ✅ Vorhanden |
| `unstable_cache` / `revalidateTag` | ✅ Next.js 16 unterstützt |
| Notification System | ✅ Vorhanden (`lib/notification.ts`) |
| Markdown Rendering | ✅ Vorhanden (`react-markdown` in Comments) |
| Toast System | ✅ Vorhanden (`useToast` Hook) |
| Auth (`requireTwitchAuth`) | ✅ Vorhanden |

**Risiken:**
- **Migration:** Reversibel, aber `QAVote` unique Constraints erfordern saubere Down-Migration
- **Performance:** Denormalisierte Scores müssen bei Votes atomar updatet werden (Prisma `$transaction`)
- **Concurrency:** Accept Answer Race Condition → `version` Feld auf `ReviewQA` für optimistisches Locking (optional, später)

---

## Schätzung

| Paket | Aufwand |
|-------|---------|
| PKG-1 Migration | 0.5h |
| PKG-2 Schemas | 0.5h |
| PKG-3 Server Logic | 1.5h |
| PKG-4 API Fragen | 1h |
| PKG-5 API Antworten | 0.5h |
| PKG-6 API Votes/Accept | 0.5h |
| PKG-7 Hooks | 1h |
| PKG-8 UI Liste/Frage | 1h |
| PKG-9 UI Antworten/Forms | 1.5h |
| PKG-10 Integration | 0.5h |
| PKG-11 Tests | 2h |
| PKG-12 Doku/Flag | 0.5h |
| **Total** | **~11h** |

---

## Nächste Schritte

1. **F1 Commit:** `docs(feature): select community-qa` → push
2. **F2 Commit:** `docs(feature): spec community-qa` → push (bereits erstellt)
3. **F3 Commit:** `docs(feature): design community-qa` → push (dieses Dokument)
4. **F4 Start:** PKG-1 bis PKG-12 sequentiell, je Paket Commit + Push