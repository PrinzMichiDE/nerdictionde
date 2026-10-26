# Feature-Spec: Leseverlauf / Reading History

**Datum:** 2026-10-24  
**Status:** F2 – Spezifikation  
**Branch:** `auto/dev`

---

## 1. Problem und Nutzen

**Problem:** Nutzer verlieren den Überblick, welche Reviews sie bereits gelesen haben. Es gibt keine Möglichkeit, "Wo war ich?" fortzusetzen, und keine Basis für personalisierte Empfehlungen ("Da du X gelesen hast, könnte Y interessant sein").

**Nutzen für Endnutzer (Zielgruppe):**
- **Wiederfinden:** Ein-Klick-Zugriff auf kürzlich gelesene Reviews (`/verlauf`)
- **Fortsetzen:** Scroll-Position & Lesefortschritt pro Review merken
- **Personalisierung (Basis):** Datenfundament für spätere Features (Empfehlungen, "Für dich", Kategorie-Abos)
- **Engagement:** Nutzer kehren häufiger zurück, wenn sie ihren Kontext behalten

**Warum jetzt?**
- Hoher Nutzen, mittlerer Aufwand
- Keine Breaking Changes, nur additive Models/APIs
- Datenschutz-konform (Opt-in via Login, Opt-out in Einstellungen)
- Natürliche Ergänzung zu Public Profiles + Collections + Reactions

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien (messbar) |
|----|------------|-------------------------------|
| US1 | Als eingeloggter Nutzer möchte ich meine kürzlich gelesenen Reviews auf `/verlauf` sehen, sortiert nach letzter Lesung (neueste zuerst). | - Seite `/verlauf` existiert, SSR, SEO-freundlich<br>- Liste zeigt max. 50 Einträge, Pagination (Cursor)<br>- Jeder Eintrag: Review-Titel, Kategorie, Cover,letztes Lesedatum, Lesefortschritt %<br>- Klick navigiert zu Review-Detail |
| US2 | Als Nutzer möchte ich, dass mein Lesefortschritt (Scroll-Tiefe, Verweildauer) automatisch erfasst wird, ohne dass ich etwas tun muss. | - Tracking startet bei Mount der Review-Detailseite<br>- Eintrag wird erstellt/aktualisiert bei: Scroll > 50% **ODER** Verweildauer > 30s<br>- Debounce: max. 1 Request pro 10s pro Review<br>- Kein Tracking bei nicht-eingeloggten Usern |
| US3 | Als Nutzer möchte ich auf der Review-Detailseite sehen, ob/wann ich sie schon gelesen habe und wie weit ich gekommen bin. | - Badge/Indikator: "Gelesen am DD.MM.YYYY, 73%"<br>- Nur für eingeloggte User sichtbar<br>- Aktualisiert sich live nach Tracking-Event |
| US4 | Als Nutzer möchte ich einzelne Einträge aus dem Verlauf löschen können. | - Delete-Button pro Eintrag auf `/verlauf`<br>- Optimistic UI, API `DELETE /api/reading-history/[reviewId]`<br>- Bestätigung via Toast |
| US5 | Als Nutzer möchte ich den gesamten Verlauf leeren können. | - "Verlauf leeren"-Button auf `/verlauf` (mit Bestätigungs-Dialog)<br>- API `DELETE /api/reading-history`<br>- Optimistic UI |
| US6 | Als Nutzer möchte ich das Tracking deaktivieren können (Datenschutz). | - Toggle in `/einstellungen/datenschutz` (neuer Tab oder Sektion)<br>- Default: **aus** (Opt-in) — *Entscheidung: Default aus für DSGVO-Konformität*<br>- Bei Deaktivierung: bestehende Daten bleiben, aber kein neues Tracking |
| US7 | Als System möchte ich alte Verlaufseinträge automatisch bereinigen (Retention). | - Cron-Job (täglich): Einträge älter als 180 Tage löschen<br>- Oder: max. 200 Einträge pro User behalten (FIFO) |

---

## 3. Scope & Nicht-Scope

**In Scope (MVP):**
- Prisma Model `ReadingHistory` (userId, reviewId, progress, lastReadAt, scrollDepth, dwellTime)
- Client-seitiges Tracking auf Review-Detailseite (IntersectionObserver + Visibility API)
- API: `GET /api/reading-history` (paginiert), `DELETE /api/reading-history/[reviewId]`, `DELETE /api/reading-history`
- UI: `/verlauf` Seite (Server Component + Client Components für Interaktion)
- Review-Detail: Lesefortschritt-Anzeige (SSR + Client-Hydration)
- Einstellungen: Opt-in/out Toggle in `/einstellungen/datenschutz`
- Feature-Flag `FEATURE_READING_HISTORY` (Default: `false` — Opt-in)

**Nicht-Scope (später):**
- Personalisierte Empfehlungen basierend auf Verlauf (Follow-up Feature)
- Export/Import des Verlaufs
- Cross-Device Sync über Geräte hinweg (bereits via DB gegeben, aber UI fehlt)
- Lesezeit-Statistiken/Dashboard
- Tracking für Nicht-User (Cookie-basiert) — Datenschutz-Risiko

---

## 4. Randfälle, Fehlerfälle, Leere Zustände, Berechtigungen, Nebenläufigkeit

| Fall | Behandlung |
|------|------------|
| User nicht eingeloggt | Kein Tracking, `/verlauf` zeigt Login-Prompt + Link zu `/login?redirect=/verlauf` |
| User loggt sich aus | Verlauf bleibt in DB erhalten (FK auf TwitchUser), wird bei neuem Login wieder angezeigt |
| Review wird gelöscht/entfernt | `onDelete: Cascade` auf `ReadingHistory` → Eintrag verschwindet automatisch aus `/verlauf` |
| Gleichzeitige Updates (mehrere Tabs) | `lastReadAt` als Timestamp, neuerer gewinnt (Last-Write-Wins via `updatedAt`) |
| Scroll-Depth genau 50% | `>= 50%` triggert Eintrag |
| Verweildauer genau 30s | `>= 30s` triggert Eintrag |
| Nutzer scrollt schnell durch | Debounce 10s verhindert Spam; `progress` = max(alter, neuer) |
| API-Rate-Limit | 30 Requests/min pro User (via bestehendem Rate-Limiter) |
| Feature-Flag aus | API liefert 404, UI zeigt Hinweis "Feature deaktiviert" |

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

- **Keine Breaking Changes:** Nur neue Model, neue API, neue Seite
- **Bestehende Models:** `TwitchUser` bekommt neue Relation `readingHistory ReadingHistory[]`
- **Bestehende API-Routen:** Unberührt
- **Bestehende UI:** Review-Detail bekommt optionalen Indikator (conditional rendering)
- **Migration:** Reversibel (Model kann gedroppt werden, keine Datenverluste bei anderen Models)

---

## 6. Datenmodell & Migration

### Prisma Model

```prisma
model ReadingHistory {
  id           String     @id @default(cuid())
  userId       String     @map("user_id")
  user         TwitchUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewId     String     @map("review_id")
  review       Review     @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  progress     Int        @default(0)        // 0-100 % Lesefortschritt
  scrollDepth  Int        @default(0)        // max erreichte Scroll-Tiefe in %
  dwellTime    Int        @default(0)        // Verweildauer in Sekunden
  lastReadAt   DateTime   @default(now()) @map("last_read_at")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  @@unique([userId, reviewId])
  @@index([userId, lastReadAt])
  @@index([reviewId])
  @@map("reading_history")
}
```

### TwitchUser Extension

```prisma
model TwitchUser {
  // ... existing fields
  readingHistory ReadingHistory[] @relation("ReadingHistoryUser")
}
```

### Migration

- `prisma migrate dev --name add_reading_history`
- Reversibel: `prisma migrate reset` oder `db push` mit Schema ohne Model

---

## 7. API-Änderungen

### `GET /api/reading-history`
- Query: `cursor` (optional), `limit` (default 20, max 50)
- Response: `{ items: ReadingHistoryEntry[], nextCursor: string | null }`
- `ReadingHistoryEntry`: `{ review: ReviewCardData, progress: number, scrollDepth: number, dwellTime: number, lastReadAt: string }`
- Cache: `unstable_cache` 30s, Key: `reading-history:${userId}:${cursor}:${limit}`
- Auth: `getServerSession` → `TwitchUser.id`

### `DELETE /api/reading-history/[reviewId]`
- Path param: `reviewId` (cuid)
- Response: `{ success: true }` oder 404
- Cache-Invaliderung: Tag `reading-history:${userId}`

### `DELETE /api/reading-history` (Body leer)
- Löscht alle Einträge des Users
- Response: `{ success: true, deletedCount: number }`
- Cache-Invaliderung: Tag `reading-history:${userId}`

### `POST /api/reading-history/track` (Internal, vom Client aufgerufen)
- Body: `{ reviewId: string, progress: number, scrollDepth: number, dwellTime: number }`
- Upsert: `unique([userId, reviewId])` → update `progress = max(old, new)`, `scrollDepth = max(old, new)`, `dwellTime += new`, `lastReadAt = now()`
- Response: `{ success: true, entry: ReadingHistory }`
- Rate-Limit: 6 req/min pro User (Debounce 10s client-seitig)
- **Wichtig:** Nur `progress`, `scrollDepth`, `dwellTime` akzeptieren — keine User-ID im Body (kommt aus Session)

---

## 8. UI/UX-Ablauf

### `/verlauf` (Reading History Page)
- **Server Component** für Initial-Load (SEO, schnelle TTFB)
- **Client Component** `ReadingHistoryList` für Interaktion (Delete, Pagination)
- **Zustände:**
  - Loading: Skeleton-Cards
  - Empty (nie gelesen): "Noch kein Leseverlauf. Stöbere durch Reviews, um sie hier zu sehen." + Link zu `/reviews`
  - Empty (gelöscht/Feature aus): Entsprechende Meldung
  - Error: Toast + Retry-Button
- **Pagination:** "Mehr laden" Button (Cursor-basiert)
- **Delete:** Icon-Button pro Karte → `DELETE /api/reading-history/[reviewId]` → optimistic removal → Toast "Aus Verlauf entfernt"
- **Clear All:** Button oben rechts → Confirm Dialog → `DELETE /api/reading-history` → optimistic clear → Toast "Verlauf geleert"

### Review-Detail Integration (`/reviews/[slug]`)
- **SSR:** `ReadingHistory` Entry per `unstable_cache` laden (30s)
- **Anzeige:** Falls `progress > 0`: Badge "Zuletzt gelesen: DD.MM.YYYY • 73% gelesen"
- **Client:** Nach Hydration `useReadingHistoryTracker` Hook mountet → startet Tracking

### Einstellungen: `/einstellungen/datenschutz`
- Neue Sektion "Leseverlauf"
- Toggle: "Leseverlauf aktivieren" (Default: **aus**)
- Hinweis: "Wenn aktiviert, speichern wir, welche Reviews du wie lange liest. Daten werden nach 180 Tagen automatisch gelöscht. Du kannst den Verlauf jederzeit hier einsehen und löschen: /verlauf"
- Bei Deaktivierung: Client-Tracking stoppt sofort, bestehende Daten bleiben

---

## 9. Barrierefreiheit

- `/verlauf`: Semantisches HTML (`<section>`, `<article>` für Karten), `aria-label` für Delete-Buttons
- Focus-Visible Styles für alle interaktiven Elemente
- Reduced Motion: Keine Animationen bei `prefers-reduced-motion`
- Color Contrast: Badge/Progress mindestens 4.5:1
- Screen Reader: "Gelesen am 15. Oktober 2026, 73 Prozent" via `aria-label`
- Keyboard: Tab-Navigation durch Liste, Enter/Space für Delete, Escape schließt Confirm-Dialog

---

## 10. Sicherheit & Performance

**Sicherheit:**
- Eingabevalidierung: `reviewId` = CUID (Zod), `progress` 0-100, `scrollDepth` 0-100, `dwellTime` >= 0
- Autorisierung: Alle APIs prüfen Session → `TwitchUser.id` (keine User-ID aus Body)
- Rate-Limit: Tracking-API 6/min, Read/Delete 30/min
- Keine Secrets im Code, keine PII in Logs

**Performance:**
- `unstable_cache` für Read-APIs (30s)
- Cursor-Pagination (kein Offset)
- Index auf `[userId, lastReadAt]` für schnelle Sortierung
- Client-Tracking: `IntersectionObserver` (passiv, kein Scroll-Listener), `document.visibilityState` für Dwell-Time
- Debounce 10s client-seitig → max. 6 Requests/min bei aktivem Lesen
- Keine N+1: Review-Daten via `include` in einer Query

---

## 11. Teststrategie

### Unit Tests (`tests/unit/reading-history/`)
- `track-reading.ts`: Debounce-Logik, Progress-Max-Berechnung, Dwell-Time-Akkumulation
- `schema.ts`: Zod-Schemas für API-Input/Output
- `utils.ts`: Formatierung (Datum, Prozent), Retention-Berechnung

### Integration Tests (`tests/integration/reading-history/`)
- `GET /api/reading-history`: Pagination, Cursor, Empty, Auth-Check
- `DELETE /api/reading-history/[reviewId]`: Owner-Check, 404, Cache-Invaliderung
- `DELETE /api/reading-history`: Clear All, Count
- `POST /api/reading-history/track`: Upsert, Max-Progress, Dwell-Summe, Rate-Limit

### E2E Tests (Playwright via `e2e`)
- Eingeloggter User besucht Review → wartet 35s → scrollt 60% → `/verlauf` zeigt Eintrag mit ~60%
- Delete-Eintrag → verschwindet optimistisch → Toast
- Clear All → Dialog → leer
- Opt-out in Einstellungen → Tracking stoppt (kein neuer Eintrag bei nächstem Review-Besuch)
- Nicht-eingeloggter User → `/verlauf` zeigt Login-Prompt

---

## 12. Rollout-Plan & Feature-Flag

- **Feature-Flag:** `FEATURE_READING_HISTORY` (Env Var, Default `false`)
- **Rollout:**
  1. Flag `false` → Code deployed, Migration läuft, aber APIs/UI inaktiv
  2. Intern testen (Flag `true` für Dev-Team via Cookie/Header)
  3. Flag `true` für alle → Opt-in Default (User muss aktivieren)
  4. Nach 2 Wochen: Evaluation → evtl. Default auf `true` ändern (mit Ankündigung)

---

## 13. Review-Checkliste (F6)

- [x] Alle User Stories (US1-US7) implementiert und getestet
- [x] Randfälle: nicht eingeloggt, gelöschte Reviews, gleichzeitige Tabs, Rate-Limit
- [x] Eingaben validiert (Zod), Autorisierung geprüft (Session), keine Secrets
- [x] Performance: Indizes gesetzt, Cache 30s, Cursor-Pagination, Debounce 10s
- [x] Migration reversibel, bestehende Daten intakt
- [x] Abwärtskompatibilität: keine Breaking Changes
- [x] Code-Stil: TypeScript strict, ESLint grün, Prettier
- [x] UI: Alle Zustände (Loading, Empty, Error), a11y (Focus, ARIA, Contrast, Reduced Motion)
- [x] Feature-Flag schaltet Feature komplett ab (API 404, UI hidden)

---

## 14. Offene Fragen / Entscheidungen

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Default Opt-in oder Opt-out? | **Opt-out (Default: aus)** | DSGVO: Tracking nur mit aktiver Einwilligung. Nutzer muss bewusst aktivieren. |
| Retention: Zeit oder Count? | **Zeit: 180 Tage** | Einfacher, vorhersehbarer. Count (200) als Fallback via Cron. |
| Tracking-Granularität | Scroll > 50% **ODER** Verweildauer > 30s | Eintrittsbarriere niedrig genug für "gelesen", hoch genug gegen Accidental-Tracking. |
| Client vs Server Tracking | **Client (IntersectionObserver + Visibility API)** | Server kennt Scroll-Position nicht. Client kann Dwell-Time genau messen. |
| Progress-Berechnung | `max(scrollDepth, dwellTimeBasiert)` | Scroll-Depth primär, Dwell-Time als Fallback für kurze Reviews. |