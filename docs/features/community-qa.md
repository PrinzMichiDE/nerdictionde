# Feature Specification: Community Q&A auf Reviews

## 1. Problem und Nutzen

**Problem:** Nutzer haben Fragen zu Reviews (z. B. "Läuft das Spiel auf meiner GPU?", "Ist der DLC den Preis wert?", "Wie lange dauert die Kampagne?"). Aktuell können sie nur Kommentare schreiben, die aber nicht strukturiert als Fragen/ Antworten erkannt werden. Autoren und Community können nicht effizient auf spezifische Fragen eingehen.

**Nutzen:**
- **Community-Bildung:** Direkter Austausch zwischen Lesern und Autoren
- **SEO durch UGC:** Fragen & Antworten generieren einzigartigen Content für Long-Tail-Keywords
- **Nutzerbindung:** Wiederkehrende Nutzer, die Antworten auf ihre Fragen erhalten
- **Autor-Engagement:** Autoren sehen konkrete Fragen zu ihren Reviews
- **Wissensbasis:** Aufbau einer Wissensdatenbank pro Review über Zeit

**Zielgruppe:** Eingeloggte Nutzer (Twitch-User), die Reviews lesen und Fragen haben; Review-Autoren, die Expertise teilen.

---

## 2. User Stories & Akzeptanzkriterien

### US1: Frage zu einem Review stellen
**Als** eingeloggter Nutzer  
**möchte ich** eine Frage zu einem Review stellen  
**damit** ich Unklarheiten klären kann, bevor ich kaufe/spiele.

**Akzeptanzkriterien:**
- [ ] Auf `/reviews/[slug]` Button "Frage stellen" neben Kommentaren
- [ ] Modal/Inline-Form mit Titel (max 120 Zeichen) + optionalem Body (max 2000 Zeichen)
- [ ] Validierung: Titel Pflicht, keine leeren Einreichungen
- [ ] Nach Submit: Frage erscheint sofort optimistisch in Liste, Toast-Bestätigung
- [ ] Autor des Reviews erhält In-App-Benachrichtigung (Type `qa_new_question`)
- [ ] Frage wird server-seitig persistiert (Model `ReviewQA`)

### US2: Antwort auf eine Frage schreiben
**Als** eingeloggter Nutzer (inkl. Review-Autor)  
**möchte ich** auf eine Frage antworten  
**damit** ich mein Wissen teile / dem Fragesteller helfe.

**Akzeptanzkriterien:**
- [ ] Unter jeder Frage "Antworten"-Button
- [ ] Inline-Editor (Markdown-unterstützt, max 3000 Zeichen)
- [ ] Nach Submit: Antwort erscheint optimistisch unter Frage, Toast
- [ ] Fragesteller erhält Benachrichtigung (Type `qa_answer_added`)
- [ ] Mehrere Antworten pro Frage möglich (Threaded, flach, keine tiefen Verschachtelungen)

### US3: Beste Antwort markieren (Accepted Answer)
**Als** Fragesteller  
**möchte ich** eine Antwort als "gelöst" / "beste Antwort" markieren  
**damit** andere Nutzer die Lösung sofort sehen.

**Akzeptanzkriterien:**
- [ ] Nur Fragesteller sieht "Als Lösung markieren"-Button an jeder Antwort
- [ ] Ein Klick: Antwort erhält grünes Badge "✓ Lösung", Frage Status → `resolved`
- [ ] Nur eine Antwort pro Frage kann akzeptiert sein (Toggle: neue Auswahl hebt alte auf)
- [ ] Antwort-Autor erhält Benachrichtigung (Type `qa_answer_accepted`)
- [ ] In Frage-Liste: Chip "✓ Gelöst" bei resolved Fragen

### US4: Upvote/Downvote auf Fragen & Antworten
**Als** eingeloggter Nutzer  
**möchte ich** Fragen und Antworten bewerten  
**damit** die hilfreichsten nach oben rutschen.

**Akzeptanzkriterien:**
- [ ] Pfeil-hoch/runter Buttons an Frage und jeder Antwort (wie Comments)
- [ ] Optimistic UI, Zähler sofort aktualisiert, Rollback bei Fehler
- [ ] Eigenen Vote nicht erlaubt (Button disabled + Tooltip)
- [ ] Aggregierte Scores bestimmen Sortierung: Fragen nach Score, Antworten nach Score
- [ ] Persistenz in `QAVote` Model (wie `CommentVote`)

### US5: Q&A-Liste auf Review-Detailseite anzeigen
**Als** Leser eines Reviews  
**möchte ich** alle Fragen & Antworten sehen  
**damit** ich prüfen kann, ob meine Frage schon beantwortet wurde.

**Akzeptanzkriterien:**
- [ ] Sektion "Fragen & Antworten" unter Review-Content, vor Kommentaren
- [ ] Standard-Sortierung: `resolved` zuerst, dann Score desc, dann neueste
- [ ] Pagination: 10 Fragen pro Seite, "Mehr laden" Button
- [ ] Pro Frage: Titel, Autor, Datum, Score, Badge "✓ Gelöst", Antwort-Count
- [ ] Expandierbar: Klick auf Frage klappt Antworten auf (Accordion)
- [ ] Empty State: "Noch keine Fragen. Sei der Erste!" + CTA Button
- [ ] SSR für erste Seite (SEO), Client-seitiges Nachladen

### US6: Eigene Fragen/ Antworten verwalten
**Als** Nutzer  
**möchte ich** meine eigenen Fragen & Antworten bearbeiten/löschen  
**damit** ich Fehler korrigieren oder zurückziehen kann.

**Akzeptanzkriterien:**
- [ ] In Profil `/u/[username]` Tab "Fragen & Antworten" (oder `/einstellungen/qa`)
- [ ] Liste eigener Fragen mit Status (offen/gelöst), Bearbeiten/Löschen
- [ ] Liste eigener Antworten, Bearbeiten/Löschen
- [ ] Löschen: Soft-Delete (`deletedAt`), Owner-Check
- [ ] Bearbeiten: Inline-Edit, `editedAt` Timestamp, History nicht nötig

---

## 3. Scope & Nicht-Scope

**In Scope:**
- Fragen & Antworten an Reviews gebunden
- Upvote/Downvote (wie Comments)
- Accepted Answer (wie StackOverflow)
- In-App Notifications (bestehende Notification-Infrastruktur)
- SSR + Client Hydration für SEO
- Optimistic UI für alle Mutations
- Feature-Flag `FEATURE_COMMUNITY_QA` (Default: `true`)
- Reversible Migration

**Nicht-Scope (explizit):**
- Keine tief verschachtelten Antworten (max 1 Ebene: Frage → Antworten)
- Keine Moderation-Queue (später: Report-Feature)
- Keine E-Mail-Benachrichtigungen (nur In-App, E-Mail später via Prefs)
- Keine Experten-Badges / Reputation-System (später)
- Keine Dateianhänge / Bilder in Q&A (nur Text + Markdown)
- Keine Q&A-Suche übergreifend (nur pro Review)

---

## 4. Randfälle, Fehlerfälle, Leere Zustände, Berechtigungen, Nebenläufigkeit

| Szenario | Behandlung |
|----------|------------|
| Unauthentifizierter Nutzer klickt "Frage stellen" | Redirect zu `/login?callbackUrl=/reviews/[slug]#qa` |
| Review ist nicht `published` | Keine Q&A-Sektion sichtbar (wie Kommentare) |
| Review gelöscht (`deletedAt`) | Q&A nur für Owner/Admin sichtbar, Read-only |
| Gleichzeitige Votes | DB-Constraint `unique(userId, qaId)` + `unique(userId, qaAnswerId)` verhindert Doppel-Votes |
| Frage gelöscht, Antworten existieren | Kaskadierendes Soft-Delete: Antworten `deletedAt` setzen |
| Accepted Answer gelöscht | Frage Status zurück auf `open`, Badge entfernt |
| Nutzer ändert Username | Anzeigename in Q&A via Join zu `TwitchUser` immer aktuell |
| Feature-Flag aus | API 404, UI Sektion komplett ausgeblendet |
| Rate-Limiting | 5 Fragen/Min, 10 Antworten/Min, 30 Votes/Min pro User (Redis/In-Memory) |

---

## 5. Auswirkungen auf bestehende Features

| Feature | Auswirkung |
|---------|------------|
| **Comments** | Keine Breaking Changes. Q&A ist separate Sektion. |
| **Reactions** | Keine Auswirkung. |
| **Notifications** | Erweiterung um 3 neue Types: `qa_new_question`, `qa_answer_added`, `qa_answer_accepted`. Wiederverwendet `createNotification` Batch-Insert. |
| **Search** | Keine Änderung (Q&A nicht in globaler Search, später evtl. `type: qa`). |
| **Profile** | Neuer Tab "Fragen & Antworten" auf `/u/[username]` (optional, nur wenn Feature-Flag an). |
| **Admin** | Keine Admin-UI nötig initial (Moderation später). |

---

## 6. Datenmodell & Migrationen

### Prisma Schema Erweiterungen

```prisma
enum QAStatus {
  OPEN
  RESOLVED
  CLOSED  // z.B. bei Off-Topic, Spam (Admin only)
}

model ReviewQA {
  id          String   @id @default(cuid())
  reviewId    String   @index
  review      Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  authorId    String   @index
  author      TwitchUser @relation(fields: [authorId], references: [id], onDelete: Cascade)
  title       String   @db.VarChar(120)
  body        String?  @db.Text  // Markdown, optional
  status      QAStatus @default(OPEN)
  score       Int      @default(0)  // denormalisierter Vote-Score
  answerCount Int      @default(0)  // denormalisiert
  acceptedAnswerId String? @unique  // zeigt auf QAAnswer
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  editedAt    DateTime?
  deletedAt   DateTime?

  answers     QAAnswer[]
  votes       QAVote[]

  @@index([reviewId, status, score])
  @@index([authorId, createdAt])
}

model QAAnswer {
  id        String   @id @default(cuid())
  questionId String  @index
  question  ReviewQA @relation(fields: [questionId], references: [id], onDelete: Cascade)
  authorId  String   @index
  author    TwitchUser @relation(fields: [authorId], references: [id], onDelete: Cascade)
  body      String   @db.Text  // Markdown
  score     Int      @default(0)
  isAccepted Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  editedAt  DateTime?
  deletedAt DateTime?

  votes     QAVote[]

  @@index([questionId, isAccepted, score])
  @@index([authorId, createdAt])
}

model QAVote {
  id         String   @id @default(cuid())
  userId     String   @index
  user       TwitchUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  questionId String?  @index
  question   ReviewQA? @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answerId   String?  @index
  answer     QAAnswer? @relation(fields: [answerId], references: [id], onDelete: Cascade)
  value      Int      // +1 oder -1
  createdAt  DateTime @default(now())

  @@unique([userId, questionId])
  @@unique([userId, answerId])
  @@index([questionId])
  @@index([answerId])
}
```

**Migration:** Reversibel (`down` löscht Models). Keine Datenverluste bei bestehendem Schema.

**Bestehende Models erweitern:**
- `NotificationType` Enum um `qa_new_question`, `qa_answer_added`, `qa_answer_accepted` erweitern.

---

## 7. API-Änderungen

### Neue API Routes

| Route | Method | Beschreibung |
|-------|--------|--------------|
| `/api/reviews/[slug]/qa` | GET | Liste Fragen (paginiert, sortiert) |
| `/api/reviews/[slug]/qa` | POST | Neue Frage erstellen |
| `/api/reviews/[slug]/qa/[questionId]` | GET | Einzelne Frage + Antworten |
| `/api/reviews/[slug]/qa/[questionId]` | PATCH | Frage bearbeiten (Owner) |
| `/api/reviews/[slug]/qa/[questionId]` | DELETE | Frage löschen (Owner, Soft-Delete) |
| `/api/reviews/[slug]/qa/[questionId]/answers` | POST | Antwort erstellen |
| `/api/reviews/[slug]/qa/[questionId]/answers/[answerId]` | PATCH | Antwort bearbeiten (Owner) |
| `/api/reviews/[slug]/qa/[questionId]/answers/[answerId]` | DELETE | Antwort löschen (Owner) |
| `/api/reviews/[slug]/qa/[questionId]/accept` | POST | Antwort als akzeptiert markieren (Fragesteller only) |
| `/api/reviews/[slug]/qa/[questionId]/vote` | POST | Vote auf Frage (+1/-1/0) |
| `/api/reviews/[slug]/qa/[questionId]/answers/[answerId]/vote` | POST | Vote auf Antwort |

### Response Format (Beispiel)

```typescript
// GET /api/reviews/[slug]/qa
{
  questions: [
    {
      id: "qa_1",
      title: "Läuft Cyberpunk auf RTX 3060?",
      body: "Ich habe eine RTX 3060 12GB...",
      status: "RESOLVED",
      score: 5,
      answerCount: 3,
      acceptedAnswerId: "ans_2",
      author: { id: "u1", username: "gamer123", displayName: "Gamer", profileImageUrl: "..." },
      createdAt: "2026-10-25T10:00:00Z",
      answers: [
        { id: "ans_1", body: "Ja, läuft gut auf High...", score: 2, isAccepted: false, author: {...}, createdAt: "..." },
        { id: "ans_2", body: "Auf 1080p High 60fps stabil.", score: 8, isAccepted: true, author: {...}, createdAt: "..." },
      ]
    }
  ],
  nextCursor: "qa_15",
  totalCount: 42
}
```

---

## 8. UI/UX-Ablauf

### Review-Detailseite (`/reviews/[slug]`)

```
┌─────────────────────────────────────────────┐
│ Review Content                              │
├─────────────────────────────────────────────┤
│ 💬 Fragen & Antworten (12)    [Frage stellen]│
├─────────────────────────────────────────────┤
│ ┌─ ✓ Gelöst  ▲5  👤gamer123  2h  3 Antworten ┐
│ │ Läuft Cyberpunk auf RTX 3060?             │
│ │ [Ausklappen]                              │
│ └───────────────────────────────────────────┘
│ ┌─ ▲2  👤techfan  5h  1 Antwort             │
│ │ Wie lang ist die Hauptstory?              │
│ │ [Ausklappen]                              │
│ └───────────────────────────────────────────┘
│ [Mehr laden]                                │
└─────────────────────────────────────────────┘
```

**Zustände:**
- **Loading:** Skeleton-Cards für Fragen
- **Error:** Inline-Fehler "Fragen konnten nicht geladen werden" + Retry-Button
- **Empty:** "Noch keine Fragen. Sei der Erste!" + Primary Button "Frage stellen"
- **Success:** Liste rendern, Accordion für Antworten

**Barrierefreiheit:**
- `<section aria-labelledby="qa-heading">` mit `h2 id="qa-heading">Fragen & Antworten`
- Accordion: `<details>/<summary>` nativ, `aria-expanded`
- Buttons: `aria-pressed` für Votes, `aria-label` für Aktionen
- Fokus-Management: Nach Submit Fokus auf neue Frage/Antwort
- Reduced Motion: Accordion-Animation respektiert `prefers-reduced-motion`

---

## 9. Sicherheit, Validierung, Performance

**Eingabevalidierung (Zod):**
- Frage Titel: 1-120 Zeichen, kein HTML, Strip Tags
- Frage Body: max 2000 Zeichen, Markdown erlaubt (sanitized)
- Antwort Body: max 3000 Zeichen, Markdown erlaubt (sanitized)
- Vote Value: Enum `[1, -1, 0]` (0 = Vote entfernen)

**Autorisierung:**
- Erstellen: Nur authentifizierte User
- Bearbeiten/Löschen: Owner-Check (`authorId === session.userId`)
- Accept Answer: Nur `question.authorId === session.userId`
- Vote: Authentifiziert, nicht Owner des Votable

**Performance:**
- `unstable_cache` 60s für Frage-Liste pro Review (`review:{slug}:qa`)
- Tag-basierte Invaliderung: `revalidateTag('review:{slug}:qa')` bei Mutations
- Denormalisierte `score`, `answerCount`, `acceptedAnswerId` auf `ReviewQA` für schnelle Listen
- Cursor-Pagination (max 10, Default 10)
- N+1 vermieden: `include: { author: true, answers: { include: { author: true, votes: true } } }` mit Limits

---

## 10. Teststrategie

**Unit Tests (`tests/lib/qa.test.ts`):**
- Schema Validierung (Titel, Body, Vote Values)
- Status-Transitions (OPEN → RESOLVED → OPEN)
- Score-Berechnung (Upvote/Downvote/Remove)
- Accepted Answer Toggle Logic

**Integration Tests (`tests/api/reviews/qa.test.ts`):**
- CRUD Fragen (Create, Read, Update, Delete)
- CRUD Antworten
- Vote API (Frage + Antwort)
- Accept Answer API (Berechtigungen, Toggle)
- Pagination & Sortierung
- Feature-Flag Guard (404 wenn aus)
- Auth-Guards (401, 403)
- Soft-Delete Verhalten

**E2E Tests (später, wenn e2e Setup existiert):**
- Frage stellen Flow
- Antwort schreiben & Accept
- Voting Interaktion
- SSR-Rendering der Q&A Sektion

---

## 11. Rollout-Plan & Feature-Flag

- **Feature-Flag:** `FEATURE_COMMUNITY_QA` (Env Var, Default `true`)
- **Rollout:** Sofort für alle (Default an), kann per Env Var deaktiviert werden
- **Migration:** `20261025000000_add_community_qa` (reversibel)
- **Backfill:** Kein Backfill nötig (neue Models)

---

## 12. Review-Checkliste (F6)

- [ ] Alle Akzeptanzkriterien der Spec sind erfüllt und getestet
- [ ] Randfälle und Fehlerpfade behandelt, keine unbehandelten Exceptions
- [ ] Eingaben validiert, Autorisierung geprüft, keine Secrets im Code
- [ ] Keine Performance-Fallen (N+1, unnötige Re-Renders, fehlende Indizes)
- [ ] Migrationen reversibel, bestehende Daten bleiben intakt
- [ ] Abwärtskompatibilität gewahrt, bestehende Tests grün
- [ ] Konsistenz mit Code-Stil und Architektur, keine toten Codeteile
- [ ] UI: alle Zustände vorhanden, Barrierefreiheit beachtet

---

## 13. Offene Fragen / Später

1. **Moderation:** Report-Button für Fragen/Antworten, Admin-Queue
2. **E-Mail Notifications:** Opt-in in Notification Preferences
3. **Reputation:** Punkte für akzeptierte Antworten, Badges
4. **Cross-Review Search:** "Ähnliche Fragen" über Reviews hinweg
5. **Rich Text:** Bilder/Code-Blöcke in Antworten (Markdown-It + Sanitizer)