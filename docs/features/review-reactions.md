# Feature-Spec: Review Reactions (Emoji-Reaktionen)

**Status:** F2 Spec — In Arbeit  
**Datum:** 2026-10-24  
**Branch:** `auto/dev`  
**Verwandt:** `docs/DECISIONS.md` (Eintrag 2026-10-24), `docs/ROADMAP.md` (Typ D)

---

## 1. Problem & Nutzen

**Problem:** Leser wollen schnell Feedback zu Reviews geben, ohne einen Kommentar zu schreiben. Autoren wollen sehen, wie ihre Reviews ankommen. Aktuell gibt es nur User-Ratings (0-10) und Kommentare — beides hat höhere Hürde.

**Nutzen:**
- **Niedrigschwelliges Engagement:** Ein Klick statt Text eingeben
- **Schnelles Stimmungsbild:** Auf einen Blick sehen, wie ein Review ankommt (hilfreich, lustig, überraschend, etc.)
- **Autoren-Feedback:** Motivation durch sichtbare Reaktionen
- **Social Proof:** Hohe Reaktionszahlen signalisieren Qualität/Relevanz
- **Keine Breaking Changes:** Reines Add-on zu bestehendem Review-System

**Zielgruppe:** Endnutzer (Leser) und Review-Autoren (Redaktion + Community)

---

## 2. User Stories & Akzeptanzkriterien

### US1: Reaktionen auf Review anzeigen
**Als** Leser  
**will ich** die Reaktionen (Emoji + Zähler) unter einem Review sehen  
**damit** ich die Stimmung der Community erfasse.

**Akzeptanzkriterien:**
- [ ] Auf `/reviews/[slug]` werden alle 6 Emojis mit aktuellen Zählern angezeigt (👍 ❤️ 🎉 🤔 😢 😡)
- [ ] Zähler zeigen aggregierte Anzahl pro Emoji (Summe aller User)
- [ ] Eigene Reaktion ist visuell hervorgehoben (ausgefülltes Icon, anderer Background)
- [ ] Barrierefrei: `aria-label` pro Button ("X Nutzer finden dies hilfreich"), Fokus-Indikator, Tastaturbedienbar
- [ ] SSR: Initial-Load enthält Reaktions-Zähler (SEO, kein Layout-Shift)

### US2: Reaktion setzen / entfernen
**Als** angemeldeter Nutzer (TwitchUser)  
**will ich** auf ein Emoji klicken, um meine Reaktion zu setzen oder zu entfernen (Toggle)  
**damit** ich meine Meinung ausdrücke, ohne zu kommentieren.

**Akzeptanzkriterien:**
- [ ] Klick auf nicht-aktives Emoji → POST `/api/reviews/[id]/reactions` → Zähler +1, Icon gefüllt
- [ ] Klick auf bereits aktives Emoji → DELETE `/api/reviews/[id]/reactions?type=...` → Zähler -1, Icon Outline
- [ ] Optimistic UI: Sofortige visuelle Änderung, Rollback bei Fehler + Toast
- [ ] Ein Nutzer kann pro Review maximal **eine** Reaktion haben (Wechsel möglich: Klick auf anderes Emoji → alte entfernt, neue gesetzt)
- [ ] Nicht angemeldete Nutzer: Buttons disabled + Tooltip "Anmelden zum Reagieren"
- [ ] Rate-Limit: max 30 Requests/Min pro User (Schutz vor Spam)

### US3: Reaktionen in Review-Listen (Karten)
**Als** Leser auf Übersichtsseiten  
**will ich** die Top-Reaktion (höchster Zähler) auf Review-Karten sehen  
**damit** ich schnell scannen kann, welche Reviews "beliebt" sind.

**Akzeptanzkriterien:**
- [ ] Auf `/reviews`, `/suche`, `/u/[username]`, `/listen/[slug]`: Review-Card zeigt Top-Emoji + Zähler (z. B. "👍 42")
- [ ] Keine Detail-Anzeige aller 6 Emojis auf Karten (Platz)
- [ ] Fallback: Keine Reaktionen → nichts anzeigen

---

## 3. Scope & Nicht-Scope

### In Scope (MVP)
- 6 feste Emojis: `THUMBS_UP` (👍), `HEART` (❤️), `PARTY` (🎉), `THINKING` (🤔), `CRY` (😢), `ANGRY` (😡)
- Reaktionen nur auf **Reviews** (nicht auf Kommentare, News, Listen — später erweiterbar)
- Persistenz pro `TwitchUser` + `Review` (unique constraint)
- API: `GET /api/reviews/[id]/reactions` (Zähler + eigene Reaktion), `POST /api/reviews/[id]/reactions`, `DELETE /api/reviews/[id]/reactions`
- UI-Komponente `ReviewReactions` (Client Component für Interaktion)
- SSR-Hydration: Zähler server-seitig, eigene Reaktion via Client-Fetch nach Hydration
- Feature-Flag `FEATURE_REVIEW_REACTIONS` (Default: `true`)

### Out of Scope (nicht in diesem Feature)
- Reaktionen auf Kommentare, News, Collections, Forum-Threads
- Benutzerdefinierte Emojis / Emoji-Picker
- Reaktionen anonym / ohne Login
- Benachrichtigungen bei Reaktionen auf eigene Reviews
- Analytics / Dashboards für Reaktionen
- Retroaktiver Import alter Daten

---

## 4. Randfälle, Fehlerfälle, Berechtigungen, Nebenläufigkeit

| Fall | Verhalten |
|------|-----------|
| User nicht angemeldet | Buttons disabled, Tooltip "Anmelden zum Reagieren", Klick öffnet Login-Modal |
| User klickt schnell doppelt | Idempotenz: Client disables Button während Request; Server prüft Unique Constraint |
| Netzwerkfehler bei POST/DELETE | Optimistic UI rollback, Toast "Fehler, bitte erneut versuchen", Button re-enabled |
| Review gelöscht / nicht veröffentlicht | 404 / 403, UI zeigt keine Reaktionen |
| Gleichzeitige Reaktionen (Race Condition) | DB Unique Constraint (`userId`, `reviewId`) verhindert Duplikate; `ON CONFLICT DO UPDATE` für Wechsel |
| Emoji-Type ungültig | 400 Bad Request, Validierung gegen Enum |
| Review-ID ungültig (nicht CUID) | 400 Bad Request |

**Nebenläufigkeit:** Optimistisches Locking nicht nötig (kein Zähler-Inkrement im App-Code, DB macht `count`). Einziger Konflikt: User wechselt Reaktion → `DELETE` alte + `INSERT` neue in Transaktion oder `UPSERT`.

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

- **Keine Breaking Changes:** Neue Tabelle, neue API, neue UI-Komponente. Bestehende Reviews, Ratings, Kommentare, Bookmarks, Follows unverändert.
- **Review-Detailseite:** `ReviewReactions` Komponente wird in `ReviewDetailContent` (oder ähnlich) eingebunden, nach Meta/Score, vor Inhalt.
- **Review-Cards:** `ReviewCard` erhält optionale `reactionsSummary` Prop (Top-Emoji + Count).
- **Caching:** `unstable_cache` für Review-Detail (30s) und Listen (60s) muss Reaktions-Zähler inkludieren oder separat cachen (empfohlen: separater Cache-Key `review-reactions:{reviewId}`, TTL 60s).
- **Feature-Flag:** `FEATURE_REVIEW_REACTIONS` steuert API + UI. Bei `false`: 404 auf API, UI rendert nichts.

---

## 6. Datenmodell & Migration

### Neues Prisma Model

```prisma
model ReviewReaction {
  id        String   @id @default(cuid())
  userId    String
  user      TwitchUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewId  String
  review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  type      ReactionType
  createdAt DateTime @default(now())

  @@unique([userId, reviewId]) // Ein User, eine Reaktion pro Review
  @@index([reviewId])
  @@index([userId])
  @@map("review_reactions")
}

enum ReactionType {
  THUMBS_UP
  HEART
  PARTY
  THINKING
  CRY
  ANGRY
}
```

### Migration
- **Reversibel:** `DROP TABLE review_reactions; DROP TYPE ReactionType;` (keine Daten in anderen Tabellen betroffen)
- **Keine Data-Migration nötig:** Neu, leer initial.

### Bestehende Models erweitern
- `Review` Relation: `reactions ReviewReaction[]` (optional, für Prisma-Include)
- `TwitchUser` Relation: `reviewReactions ReviewReaction[]` (optional)

---

## 7. API-Design

### GET `/api/reviews/[id]/reactions`
**Response 200:**
```json
{
  "counts": { "THUMBS_UP": 42, "HEART": 12, "PARTY": 5, "THINKING": 3, "CRY": 1, "ANGRY": 0 },
  "total": 63,
  "myReaction": "THUMBS_UP" | null
}
```
- `counts`: Objekt mit allen 6 Types (0 wenn keine)
- `total`: Summe aller Reaktionen
- `myReaction`: Nur bei authentifiziertem User, sonst `null`
- Cache: `Cache-Control: public, max-age=60, stale-while-revalidate=300`

### POST `/api/reviews/[id]/reactions`
**Body:** `{ "type": "THUMBS_UP" }`  
**Validation:** `type` ∈ `ReactionType` Enum  
**Response 201:** `{ "success": true, "counts": {...}, "total": 64, "myReaction": "THUMBS_UP" }`  
**Response 409:** Wenn User bereits andere Reaktion hat → Server führt Wechsel atomar durch (löscht alte, setzt neue), gibt neuen Stand zurück.

### DELETE `/api/reviews/[id]/reactions?type=THUMBS_UP`
**Response 200:** `{ "success": true, "counts": {...}, "total": 63, "myReaction": null }`  
**Response 404:** Keine solche Reaktion vorhanden.

---

## 8. UI/UX-Ablauf

### Review-Detailseite (`/reviews/[slug]`)
```
[Review Header: Titel, Score, Meta]
[ReviewReactions Komponente]
  ├─ Container: flex wrap gap-2
  ├─ 6 Buttons (Emoji + Zähler)
  │   ├─ Default: Outline, grauer Zähler
  │   ├─ Active (eigene): Filled, Primary-Farbe, Zähler bold
  │   ├─ Hover: Scale 1.1, Tooltip mit Label
  │   ├─ Focus-visible: Ring (Accessibility)
  │   └─ Disabled (nicht eingeloggt): Opacity 50, Cursor not-allowed, Tooltip
  └─ Screen-Reader-Text: "42 Nutzer finden dies hilfreich. Deine Reaktion: Daumen hoch."
[Review Inhalt]
```

### Review-Card (Übersichten)
```
[Card Header: Bild, Kategorie, Titel]
[Meta: Score, Autor, Datum]
[Reactions Summary: 👍 42]  ← nur Top-1, wenn total > 0
[Excerpt / Tags]
```

### States
| State | Darstellung |
|-------|-------------|
| Loading (SSR) | Skeleton: 6 graue Platzhalter (Pulse-Animation) |
| Loading (Client-Fetch own reaction) | Zähler sichtbar, Buttons disabled bis `myReaction` geladen |
| Error | Toast "Reaktionen konnten nicht geladen werden", Buttons disabled |
| Empty (keine Reaktionen) | Alle Zähler 0, Buttons enabled (eingeloggt) / disabled (nicht eingeloggt) |
| Success (nach Klick) | Optimistic: sofort Update, dann Server-Response confirmiert |

### Barrierefreiheit
- Buttons: `<button type="button" aria-label="...">` mit `aria-pressed="true/false"`
- Zähler: `aria-live="polite"` für Änderungen
- Tooltip für Nicht-Eingeloggte: `role="tooltip"`
- Fokus-Reihenfolge: Tab durch 6 Buttons, Enter/Space toggelt
- Screen-Reader: Versteckter Text mit Zusammenfassung (z. B. "Insgesamt 63 Reaktionen. Deine Reaktion: Daumen hoch.")

---

## 9. Sicherheit & Performance

### Sicherheit
- **Autorisierung:** Nur authentifizierte `TwitchUser` (Session-Cookie) dürfen POST/DELETE. Prüfen in API-Route via `getServerSession()`.
- **Validierung:** `zod` Schema für `type` (Enum), `reviewId` (CUID Format).
- **Rate-Limit:** `rate-limit` Middleware (oder `upstash-ratelimit` falls vorhanden) — 30 req/min pro User.
- **CSRF:** Next.js CSRF-Schutz via SameSite Cookie + Origin-Check.
- **Keine Secrets:** Keine API-Keys im Client-Code.

### Performance
- **DB:** Index auf `reviewId` (für Aggregation), `userId` (für eigene Reaktion), Unique auf `(userId, reviewId)`.
- **Abfrage:** `GROUP BY type` + `COUNT` für Zähler; `WHERE userId = ? AND reviewId = ?` für eigene Reaktion.
- **Caching:** `unstable_cache` für `GET` (60s TTL). Invaliderung bei POST/DELETE via `revalidateTag('review-reactions-' + reviewId)`.
- **N+1 Vermeidung:** Auf Listen-Seiten: `reviewReactions` nicht pro Card laden, sondern aggregiert via Subquery oder separater API-Call für Batch (z. B. `GET /api/reviews/reactions?ids=slug1,slug2,...` — MVP: weglassen, nur Top-1 via Review-Include mit `_count`).

---

## 10. Teststrategie

### Unit-Tests (`vitest`)
- `lib/review-reactions.ts`: `getReactionCounts`, `getUserReaction`, `toggleReaction` (Logik, Edge Cases)
- `components/reviews/ReviewReactions.test.tsx`: Rendering, Interaktion, States, Accessibility (Testing Library)
- `lib/schemas/reaction-schema.ts`: Zod-Validierung (gültig/ungültig)

### Integration-Tests (`vitest` + Test-DB)
- `api/reviews/[id]/reactions.test.ts`: GET (auth / unauth), POST (neu, wechsel, duplikat), DELETE (existiert, nicht existiert), Rate-Limit, Validierung
- DB-Constraints: Unique Constraint, Foreign Keys, Cascade Delete

### E2E-Tests (`e2e` / Playwright) — wenn `e2e.config.ts` existiert
- Flow: Login → Review öffnen → Reaktion klicken → Zähler steigt → erneut klicken → Zähler sinkt → anderes Emoji klicken → Wechsel
- Nicht eingeloggt: Buttons disabled, Tooltip
- Review-Card: Top-Emoji sichtbar

### Test-Daten
- Seed: 3 Reviews, 5 User, verschiedene Reaktionen (Verteilung testen)

---

## 11. Rollout-Plan & Feature-Flag

- **Feature-Flag:** `FEATURE_REVIEW_REACTIONS` (Env Var, Default `true`)
- **Rollout:** Sofort für alle (kein Risiko, additive Feature)
- **Fallback:** Flag `false` → API 404, UI rendert nichts, keine DB-Änderung
- **Monitoring:** Log POST/DELETE Requests, Fehler-Rate, Latenz

---

## 12. Offene Fragen / Entscheidungen (für F3 Design)

1. **Emoji-Set final?** 6 Standard (GitHub-kompatibel) oder 8 (plus 🚀, 👀)?
2. **Reaktion auf eigenen Review erlauben?** Ja (Self-Reaction erlaubt, wie GitHub).
3. **Animation:** Framer Motion für Count-Transition? (MVP: CSS Transition, kein Framer Motion Dependency)
4. **Batch-API für Listen?** MVP: Nein, nur Top-1 via `_count` im Review-Query. Später: `GET /api/reviews/reactions?ids=...`
5. **Toast-Bibliothek:** Bestehende `useToast` / `Toaster` nutzen.

---

## 13. Review-Sektion (F6) — Platzhalter

> Wird nach Implementierung ausgefüllt.

| Check | Status | Bemerkung |
|-------|--------|-----------|
| Alle AK erfüllt & getestet |  |  |
| Randfälle & Fehlerpfade behandelt |  |  |
| Eingaben validiert, Autorisierung geprüft |  |  |
| Keine Performance-Fallen (N+1, Cache) |  |  |
| Migration reversibel |  |  |
| Abwärtskompatibilität gewahrt |  |  |
| Code-Stil & Architektur konsistent |  |  |
| UI: Alle States, a11y beachtet |  |  |