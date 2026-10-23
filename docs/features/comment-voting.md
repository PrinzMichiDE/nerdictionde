# Feature-Spezifikation: Kommentar-Voting (Up/Down) auf Reviews

**Status:** Spezifikation (F2)
**Feature-Branch:** `auto/dev`
**Zielgruppe:** Endnutzer von Nerdiction.de (Review-Leser und Kommentatoren)
**Priorität:** Typ D (neues Feature, nächster Roadmap-Kandidat)

---

## 1. Problem und Nutzen (Warum? Für wen?)

Kommentare auf Reviews können aktuell nicht bewertet werden. Nutzer können nicht ausdrücken, ob ein Kommentar hilfreich oder nicht hilfreich ist. Qualitätvolle Kommentare gehen in der Masse unter, und es gibt keine Möglichkeit, nützliche Beiträge hervorzuheben.

Nutzen: Hilfreiche Kommentare werden sichtbarer, Nutzer können sich an der Community-Diskussion beteiligen, bessere Erkennung von Qualitätsbeiträgen.

---

## 2. User Stories und Akzeptanzkriterien

### US-1: Kommentar bewerten
**Als** Nutzer, der einen Kommentar liest
**möchte ich** den Kommentar mit Daumen hoch (hilfreich) oder Daumen runter (nicht hilfreich) bewerten.
**Akzeptanzkriterien:**
- [ ] Jeder Kommentar hat Upvote- und Downvote-Buttons.
- [ ] Ein Klick auf Upvote/Downvote sendet das Voting an die API.
- [ ] Nach dem Voting wird der aktuelle Score angezeigt.
- [ ] Ein erneuter Klick auf denselben Button hebt das Voting auf.
- [ ] Ein Klick auf den anderen Button ändert das Voting (von hoch zu runter oder umgekehrt).

### US-2: Eigene Stimme sehen
**Als** angemeldeter Nutzer
**möchte ich** sehen, wie ich einen Kommentar bewertet habe.
**Akzeptanzkriterien:**
- [ ] Der aktive Button (hoch/runter) ist visuell hervorgehoben.
- [ ] Ohne Login können Nutzer nicht voten (Hinweis zum Einloggen).

### US-3: Kommentar-Score anzeigen
**Als** Leser
**möchte ich** den Gesamt-Score eines Kommentars sehen.
**Akzeptanzkriterien:**
- [ ] Jeder Kommentar zeigt seinen aktuellen Score (Summe aller Stimmen).
- [ ] Der Score wird nach jedem Voting aktualisiert.

---

## 3. Scope und Nicht-Scope

**In Scope:**
- Prisma-Migration: `score` (Int, @default(0)) auf Review-`Comment` hinzufügen.
- Votes-API erweitert: Aktualisiert `Comment.score` bei `targetType: "comment"` (neben bestehendem `ForumComment.score`).
- UI: Upvote/Downvote-Buttons in `CommentSection`, Score-Anzeige, visueller Hinweis auf eigene Stimme.
- Unit-Tests für die API-Erweiterung.

**Nicht-Scope:**
- Voting für Reviews (nur Kommentare).
- Kommentar-Sortierung nach Score.
- Voting ohne Login (nur Hinweis anzeigen).
- Kommentar-Authoren-Benachrichtigungen bei Votes.

---

## 4. Randfälle und Fehlerfälle

| Fall | Verhalten |
|------|-----------|
| Nicht eingeloggt | Voting-API liefert 401, UI zeigt Hinweis |
| Doppeltes Voting (dieselben Buttons) | Stimme wird entfernt (Toggle) |
| Stimme ändern (hoch → runter) | Stimme wird aktualisiert |
| Ungültiger targetId | 400 / Validierungsfehler |
| Kein Login-Token | requireTwitchAuth leitet ab / gibt 401 |

---

## 5. Auswirkungen auf bestehende Features und Abwärtskompatibilität

- `score` auf Comment ist nullable/hat Default 0: bestehende Kommentare bleiben mit score 0.
- Das Votes-API bleibt abwärtskompatibel: bestehende Targets (thread, comment=ForumComment) funktionieren unverändert.
- Keine Breaking Changes.

---

## 6. Datenmodell und Migrationen

### Änderung an `Comment`

```prisma
model Comment {
  id        String   @id @default(cuid())
  text      String
  review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  reviewId  String
  author    String
  parentId   String?
  parent     Comment?   @relation("CommentParent", fields: [parentId], references: [id], onDelete: SetNull)
  children   Comment[]  @relation("CommentParent")
  score     Int        @default(0)  // neu: Kommentar-Score durch Voting
  createdAt DateTime @default(now())

  @@index([reviewId])
  @@index([parentId])
}
```

### Migration (reversibel)

**Vorwärts:** Spalte `score` (Int, default 0) hinzufügen.

**Rückwärts:** Spalte `score` droppen. Bestehende Daten bleiben intakt.

---

## 7. API-Änderungen

### `POST /api/votes` (bestehend, geändert)

Die Route aktualisiert bereits bei `targetType: "comment"` den `ForumComment.score`. Ergänzt um:

```typescript
if (targetType === "comment") {
  await prisma.comment.update({
    where: { id: targetId },
    data: { score: newScore },
  });
}
```

(nach dem bestehenden `ForumComment`-Update)

Response bleibt gleich: `{ success: true, data: { score, userVote } }`.

---

## 8. UI/UX-Ablauf

Auf jedem Kommentar in `CommentSection`:
- Upvote-Button (▲) und Downvote-Button (▼) nebeneinander.
- Aktueller Score zwischen den Buttons.
- Aktiver Button (eigene Stimme) ist hervorgehoben (z. B. blaue Farbe für Upvote, rot für Downvote).
- Bei nicht eingeloggten Nutzern: Buttons sind deaktiviert mit Hinweis "Einloggen zum Voting".

Zustände:
- Lade: während Voting verarbeitet wird.
- Erfolg: Score aktualisiert, Button-Zustand angepasst.
- Fehler: Fehlermeldung, Zustand zurücksetzen.

Barrierefreiheit: `aria-label` auf Buttons, `aria-pressed` für aktiven Zustand, Fokus-Indikatoren.

---

## 9. Sicherheit und Datenschutz

- Voting erfordert Authentifizierung (`requireTwitchAuth`).
- `@@unique([userId, targetType, targetId])` verhindert doppelte Stimmen.
- Keine neuen Datenfelder mit Nutzerdaten (nur Score-Integer).
- Keine Secrets im Code.

---

## 10. Performance-Erwartung

- Einzelne `vote.aggregate` für Score-Berechnung (bereits im bestehenden API).
- Einzelne `comment.update` für Score-Speicherung.
- Keine N+1.

---

## 11. Teststrategie

**Unit-Tests (vitest):**
- [ ] Votes-API: `targetType: "comment"` aktualisiert `Comment.score`.
- [ ] Votes-API: Toggle (dasselbe Voting entfernt Stimme).
- [ ] Votes-API: Änderung (hoch → runter aktualisiert Stimme).
- [ ] Votes-API: Nicht eingeloggt → 401.
- [ ] UI: Upvote/Downvote-Buttons vorhanden (bei manuellem Test).

**Integrationstests:**
- (bei Test-Datenbank verfügbar)

**E2E:**
- Nicht im MVP.

---

## 12. Rollout-Plan

- Feature ohne Feature-Flag (additive Änderung, reversibler Migration).
- Migration läuft automatisch mit `prisma migrate dev` / `prisma migrate deploy`.
- Bestehende Kommentare bleiben mit score 0.

---

## 13. Review (nach F6 ausgefüllt)

**Ergebnis:** Alle Checklisten-Punkte erfüllt.

- Alle 3 User Stories implementiert und getestet (5 Votes-API-Tests, alle grün).
- Randfälle: nicht eingeloggt → 401; Toggle (gleicher Wert entfernt Stimme); Änderung (hoch → runter aktualisiert); ungültiges targetId → 400.
- `requireTwitchAuth` schützt das Voting; `@@unique([userId, targetType, targetId])` verhindert doppelte Stimmen.
- Keine Performance-Fallen: einzelne vote.aggregate für Score, einzelne comment.update.
- Migration reversibel (score-Spalte droppbar), bestehende Daten intakt (Default 0).
- Abwärtskompatibel: Votes-API bleibt für thread/forum-comment unverändert.
- UI: Upvote/Downvote-Buttons, Score-Anzeige, eigener Stimmen-Status (aria-pressed), Lade-/Fehlerzustände.
- Barrierefreiheit: aria-label, aria-pressed, Fokus-Indikatoren (shadcn Button).
- Code konsistent mit bestehender Architektur (App Router, Prisma, shadcn/ui, deutsche UI-Texte).
- Lint auf neuen Dateien sauber (0 Errors).
