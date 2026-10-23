# Feature-Spezifikation: Kommentar-Antworten (verschachtelte Kommentare) auf Reviews

**Status:** Spezifikation (F2)
**Feature-Branch:** `auto/dev`
**Zielgruppe:** Endnutzer von Nerdiction.de (Review-Leser und Kommentatoren)
**Priorität:** Typ D (neues Feature, nächster Roadmap-Kandidat)

---

## 1. Problem und Nutzen (Warum? Für wen?)

Kommentare auf Reviews sind aktuell flach: Jeder Kommentar steht direkt unter dem Review, es gibt keine Möglichkeit, auf einen bestimmten Kommentar zu antworten. Diskussionen verlieren den Kontext, und Nutzer können nicht gezielt auf Einzelkommentare eingehen.

Nutzen: Gesprächskontext bleibt erhalten, Nutzer können gezielt auf Kommentare antworten, höhere Interaktion und Community-Bindung.

---

## 2. User Stories und Akzeptanzkriterien

### US-1: Auf einen Kommentar antworten
**Als** Nutzer, der einen Kommentar liest
**möchte ich** auf diesen spezifischen Kommentar antworten.
**Akzeptanzkriterien:**
- [ ] Jeder Kommentar hat eine "Antworten"-Schaltfläche.
- [ ] Klick öffnet ein Antwortformular direkt unter dem Kommentar.
- [ ] Gesendete Antwort wird als verschachtelter Kommentar unter dem Parent-Kommentar angezeigt.

### US-2: Verschachtelte Ansicht
**Als** Leser der Kommentare
**möchte ich** Antworten eingerückt unter ihrem Parent-Kommentar sehen.
**Akzeptanzkriterien:**
- [ ] Antworten sind visuell eingerückt (z. B. linker Rand oder Hintergrund).
- [ ] Die Ebenentiefe ist auf 2 Ebenen begrenzt (Kommentar → Antwort), keine tieferen Verschachtelungen.

### US-3: Antwort ohne Parent (Top-Level)
**Als** Nutzer
**möchte ich** weiterhin top-level Kommentare schreiben können.
**Akzeptanzkriterien:**
- [ ] Das bestehende Kommentarformular am Ende der Kommentarliste funktioniert unverändert (kein parentId).

### US-4: Fehlerbehandlung
**Als** Nutzer
**möchte ich** bei Fehlern eine klare Rückmeldung erhalten.
**Akzeptanzkriterien:**
- [ ] Leerer Kommentartext wird abgelehnt (Validierung).
- [ ] Ungültige parentId (nicht existierender Kommentar) wird abgelehnt.
- [ ] Server-Fehler zeigen eine generische Meldung, kein Stacktrace.

---

## 3. Scope und Nicht-Scope

**In Scope:**
- Prisma-Migration: `parentId` (String?, nullable) + Selbstreferenz-Relation auf `Comment`.
- API `POST /api/comments`: akzeptiert optionales `parentId`, validiert Existenz des Parent.
- API `GET /api/comments?reviewId=...`: gibt Kommentare inkl. `parentId` zurück (für Client-seitiges Nesting).
- UI: "Antworten"-Button pro Kommentar, Antwortformular, eingerückte Ansicht.
- Unit-Tests für API und Validierung.
- Graceful Degradation: Seite funktioniert auch ohne Antworten.

**Nicht-Scope:**
- Unbegrenzte Verschachtelungstiefe (max. 2 Ebenen).
- E-Mail-Benachrichtigungen bei Antworten.
- Kommentar-Editieren/Löschen (bereits vorhanden oder nicht im Scope).
- Kommentar-Voting (separater Roadmap-Eintrag).

---

## 4. Randfälle und Fehlerfälle

| Fall | Verhalten |
|------|-----------|
| Antwort auf nicht existierenden Kommentar | 400 / Validierungsfehler |
| Antwort auf eigene Antwort (3. Ebene) | Abgelehnt (max. 2 Ebenen) |
| Leerer Kommentartext | 400 / Validierungsfehler |
| Parent-Kommentar gelöscht | Antwort bleibt, parentId wird null (onDelete: SetNull) |
| Race-Condition bei gleichzeitigen Antworten | Jede Antwort bekommt eigenen Datensatz |

---

## 5. Auswirkungen auf bestehende Features und Abwärtskompatibilität

- `parentId` ist nullable: bestehende Kommentare bleiben top-level (parentId = null).
- `GET /api/comments` Response-Struktur bleibt gleich, `parentId` wird ergänzt.
- Keine Breaking Changes an bestehenden Endpunkten.
- Keine Datenbank-Daten gehen verloren (Migration ist additiv).

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
  parentId   String?                                        // neu
  parent     Comment?   @relation("CommentParent", fields: [parentId], references: [id], onDelete: SetNull)
  children   Comment[]  @relation("CommentParent")          // neu
  createdAt DateTime @default(now())

  @@index([reviewId])
  @@index([parentId])                                      // neu
}
```

### Migration (reversibel)

**Vorwärts:** Spalte `parentId` (nullable) hinzufügen, Selbstreferenz-Relation anlegen, Index auf `parentId`.

**Rückwärts:** Relation entfernen, Spalte `parentId` droppen. Bestehende Daten bleiben intakt (parentId ist nullable).

---

## 7. API-Änderungen

### `POST /api/comments` (bestehend, geändert)

Request-Body ergänzt um optionales `parentId`:
```json
{ "text": "...", "author": "...", "reviewId": "...", "parentId": "..." }
```

Validierung:
- `text` erforderlich (bereits vorhanden)
- `parentId` optional; wenn gesetzt, muss ein Comment mit dieser ID existieren
- `parentId` darf nicht auf einen Kommentar verweisen, der selbst schon ein parentId hat (max. 2 Ebenen)

### `GET /api/comments?reviewId=...` (bestehend, geändert)

Response enthält jetzt auch `parentId` pro Kommentar.

---

## 8. UI/UX-Ablauf

### Kommentaransicht (bestehend, geändert)
- Jeder Kommentar-Karte: "Antworten"-Button (außer bei bereits 2. Ebene).
- Klick auf "Antworten": Antwortformular wird direkt unter dem Kommentar eingeblendet.
- Antwortformular: Textarea, Autor-Feld, "Absenden"-Button, "Abbrechen"-Link.
- Gesendete Antwort: erscheint eingerückt unter dem Parent-Kommentar.

### Zustände
- Leer: Antwortformular eingeblendet, Fokus auf Textarea.
- Lade: während Absenden läuft.
- Erfolg: Formular ausgeblendet, Antwort erscheint, Erfolgsmeldung.
- Fehler: Fehlermeldung unter dem Formular, Formular bleibt offen.

### Barrierefreiheit
- "Antworten"-Button mit `aria-label="Auf Kommentar antworten"`.
- Antwortformular mit korrekten Labeln.
- Fokus-Folgen nach Öffnen des Formulars.

---

## 9. Sicherheit und Datenschutz

- `parentId` wird serverseitig validiert (Existenz + Tiefenbegrenzung).
- Keine neuen Datenfelder mit Nutzerdaten (nur Referenz).
- Eingabevalidierung via Zod (bereits vorhanden, ergänzt um parentId).
- Keine Secrets im Code.

---

## 10. Performance-Erwartung

- Einzelne `findUnique`-Prüfung für parentId-Existenz.
- Kommentare werden mit `parentId` geladen (keine N+1, da flache Liste + Client-seitiges Nesting).
- Keine zusätzlichen Abfragen pro Kommentar.

---

## 11. Teststrategie

**Unit-Tests (vitest):**
- [ ] `POST /api/comments`: erstellt top-level Kommentar (parentId null).
- [ ] `POST /api/comments`: erstellt Antwort mit parentId.
- [ ] `POST /api/comments`: lehnt ungültige parentId ab (400).
- [ ] `POST /api/comments`: lehnt Antwort auf Antwort ab (3. Ebene, 400).
- [ ] `POST /api/comments`: lehnt leeren Text ab (400).
- [ ] `GET /api/comments`: gibt parentId mit zurück.

**Integrationstests:**
- (bei Test-Datenbank verfügbar)

**E2E:**
- Nicht im MVP.

---

## 12. Rollout-Plan

- Feature ohne Feature-Flag (additive Änderung, reversibler Migration).
- Migration läuft automatisch mit `prisma migrate dev` / `prisma migrate deploy`.
- Bestehende Kommentare bleiben top-level (parentId = null).

---

## 13. Review (nach F6 ausgefüllt)

*(Leer bis Self-Review)*
