# Feature-Spezifikation: Review als PDF exportieren

**Status:** Spezifikation (F2)
**Feature-Branch:** `auto/dev`
**Zielgruppe:** Endnutzer von Nerdiction.de (Review-Leser)
**Priorität:** Typ D (neues Feature, einziger verbleibender Roadmap-Kandidat)

---

## 1. Problem und Nutzen (Warum? Für wen?)

Nutzer möchten Reviews offline speichern, archivieren oder teilen können. Derzeit gibt es nur einen "Drucken"-Button, der `window.print()` aufruft und die gesamte Seite mit Navigation, Sidebar, Werbung etc. druckt. Ein sauberer PDF-Export nur des Review-Inhalts (Titel, Wertung, Pros/Cons, Fließtext, Bilder, Specs) fehlt.

Nutzen: Offline-Lesbarkeit, einfaches Teilen/Archivieren, professionelles Layout ohne Web-UI-Elemente.

---

## 2. User Stories und Akzeptanzkriterien

### US-1: PDF-Export-Button
**Als** Nutzer auf einer Review-Detailseite
**möchte ich** einen "Als PDF speichern"-Button sehen.
**Akzeptanzkriterien:**
- [ ] Button ist in `ReviewActions` neben "Drucken" und "Teilen" platziert.
- [ ] Button hat ein passendes Icon (Download/Datei) und Tooltip "Als PDF speichern".
- [ ] Klick startet den PDF-Download (nicht neuer Tab).

### US-2: PDF-Inhalt und Layout
**Als** Nutzer
**möchte ich** ein PDF erhalten, das nur den Review-Inhalt enthält.
**Akzeptanzkriterien:**
- [ ] PDF enthält: Titel, Kategorie, Score-Badge, Verdict-Text, Pros/Cons, Inhaltsverzeichnis (falls vorhanden), vollständigen Markdown-Content (gerendert), Bilder, Hardware-Specs (bei Games), Episode-Ratings (bei Series), Metadaten (Veröffentlichungsdatum, Kategorie, Tags).
- [ ] PDF enthält NICHT: Navigation, Sidebar, Kommentare, Deals-Widget, User-Rating-Section, Footer, "Drucken"-Button.
- [ ] Layout ist lesbar: ausreichende Ränder, serifenlose Schrift für Fließtext, serifenbetonte Überschriften, Score-Badge prominent.
- [ ] Deutsche und englische Version (je nach `?lang=`) werden korrekt exportiert.

### US-3: Generierung und Download
**Als** Nutzer
**möchte ich** dass das PDF zuverlässig generiert und heruntergeladen wird.
**Akzeptanzkriterien:**
- [ ] Klick → Ladezustand (Button disabled, Spinner) → Download startet automatisch.
- [ ] Dateiname: `<slug>-review.pdf` (z. B. `cyberpunk-2077-review.pdf`).
- [ ] Bei Serverfehler: Toast-Fehlermeldung, Button wieder aktiv.
- [ ] Generierung dauert < 10 Sekunden (Timeout-Schutz).

### US-4: Berechtigungen
**Als** System
**soll** der Export für veröffentlichte Reviews ohne Login möglich sein.
**Akzeptanzkriterien:**
- [ ] `GET /api/reviews/[slug]/pdf` ist öffentlich (kein Auth erforderlich).
- [ ] Draft-Reviews (status !== "published") geben 404.

---

## 3. Scope und Nicht-Scope

**In Scope:**
- API-Route `GET /api/reviews/[slug]/pdf` (oder `POST` mit Body für Sprache).
- Server-seitige PDF-Generierung mit `@react-pdf/renderer` (kein Headless-Chrome, keine externen Dienste).
- React-Komponente für PDF-Layout (wiederverwendbar, typisiert).
- Integration in `ReviewActions` (Client-Komponente).
- Unit-Tests für API und PDF-Komponente.
- Fehlerbehandlung, Ladezustände, Accessibility.

**Nicht-Scope:**
- Client-seitige PDF-Generierung (jsPDF/html2canvas – unzuverlässig bei komplexem Layout).
- Puppeteer/Playwright (schwer auf Vercel, Cold-Start-Latency).
- Wasserzeichen, Passwortschutz, Metadaten-Bearbeitung im PDF.
- Batch-Export mehrerer Reviews.
- PDF für Nicht-Veröffentlichte (Admin-only wäre separates Feature).

---

## 4. Randfälle und Fehlerfälle

| Fall | Verhalten |
|------|-----------|
| Review nicht gefunden / nicht veröffentlicht | 404 |
| PDF-Generierung wirft Exception | 500, Toast "PDF konnte nicht erstellt werden" |
| Sehr langer Content (viele Bilder/Tabellen) | Paginierung im PDF, keine Abstürze |
| Sprache `?lang=en` | Englische Titel/Content/Pros/Cons falls vorhanden |
| Spezielle Zeichen im Titel/Slug | Dateiname sanitized (nur ASCII, keine Pfad-Trennzeichen) |
| Gleichzeitige Requests | Keine Race Conditions (stateless Generierung) |

---

## 5. Auswirkungen auf bestehende Features und Abwärtskompatibilität

- Keine Änderungen an Datenmodell oder Migrationen.
- `ReviewActions` erhält einen weiteren Button (additiv).
- Bestehende "Drucken"-Funktion (`window.print()`) bleibt unverändert.
- Keine Breaking Changes.

---

## 6. Datenmodell und Migrationen

Keine Änderungen am Prisma-Schema. Bestehende Review-Felder werden gelesen.

---

## 7. API-Änderungen

### `GET /api/reviews/[slug]/pdf?lang=de|en`

**Response:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="<slug>-review.pdf"`
- Body: PDF-Bytes

**Fehler:**
- 404: Review nicht gefunden oder nicht veröffentlicht
- 500: Generierungsfehler

---

## 8. UI/UX-Ablauf

### ReviewActions (Client)
- Neuer Button `<Button variant="outline" size="sm" onClick={handlePdfExport}>` mit `Download`-Icon.
- `handlePdfExport`: `fetch(`/api/reviews/${slug}/pdf?lang=${lang}`)`, `blob()`, `URL.createObjectURL()`, `<a download>`, `click()`, `revokeObjectURL()`.
- Ladezustand: `disabled`, `Loader2`-Icon, `aria-busy="true"`.
- Fehler: `toast.error("PDF konnte nicht erstellt werden")`.

### PDF-Layout (Server Component / React-PDF)
- **Deckblatt**: Titel, Kategorie-Badge, Score-Ring (SVG), Verdict-Satz, Pros/Cons.
- **Inhaltsverzeichnis**: Falls Headings vorhanden (aus Markdown extrahiert).
- **Content**: Markdown → React-PDF-Komponenten (Text, Headings, Listen, Tabellen, Bilder).
- **Bilder**: Als `<Image>` mit `src` (Vercel Blob URLs sind öffentlich).
- **Footer**: Seitenzahl, "Erstellt von Nerdiction.de am {Datum}", kanonische URL.

### Barrierefreiheit
- Button: `aria-label="Review als PDF herunterladen"`.
- Ladezustand: `aria-busy="true"`, `aria-live="polite"` für Status.
- PDF: Getaggt (tags für Screenreader), logische Lesereihenfolge.

---

## 9. Sicherheit und Datenschutz

- Keine Nutzerdaten im PDF (nur öffentliche Review-Daten).
- Keine Auth-Tokens, Cookies oder Secrets in der Generierung.
- Rate-Limit: Optional via Middleware (z. B. 10/min pro IP) – kann später nachgerüstet werden.
- `Content-Security-Policy` Header nicht nötig (PDF ist Download).

---

## 10. Performance-Erwartung

- PDF-Generierung < 3 Sekunden typisch, < 10 Sekunden Hard-Limit (Vercel Function Timeout).
- Bilder: Werden als URL referenziert (nicht embedded), PDF bleibt klein (< 2 MB typisch).
- Caching: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` (PDFs sind deterministisch pro slug+lang+updatedAt).
- Keine N+1: Ein `prisma.review.findUnique` mit allen nötigen Relationen.

---

## 11. Teststrategie

**Unit-Tests (vitest):**
- [ ] API-Route: 404 für nicht existierenden Slug.
- [ ] API-Route: 404 für Draft-Review.
- [ ] API-Route: 200 + PDF-Bytes für veröffentlichtes Review (Mock Prisma).
- [ ] PDF-Komponente: Rendert ohne Fehler (Smoke-Test mit `@react-pdf/renderer` Test-Utils).
- [ ] `ReviewActions`: PDF-Button vorhanden, Klick ruft fetch auf, Ladezustand, Fehler-Toast.

**Integrationstests:**
- (optional, bei Test-DB) Echter API-Call → PDF validieren (Header, Dateigröße > 0).

**E2E:**
- Nicht im MVP (kein e2e-Setup für PDF-Download).

---

## 12. Rollout-Plan

- Feature ohne Feature-Flag (additiv, keine Breaking Changes).
- Deployment: Standard `vercel deploy` / `next build`.
- Nach Deploy: Manuelle Prüfung auf 3 Reviews (Game, Movie, Hardware).

---

## 13. Review (nach F6 ausgefüllt)

*Wird nach F6 befüllt.*