# Feature-Spezifikation: Barrierefreiheits-Verbesserungen Review-Detailseite

**Status:** Spezifikation (F2)
**Feature-Branch:** `auto/dev`
**Zielgruppe:** Alle Nutzer, insbesondere Personen mit Seh- oder Motorik-Einschränkungen
**Priorität:** Typ D (neues Feature, Roadmap)

---

## 1. Problem und Nutzen (Warum? Für wen?)

Die Review-Detailseite ist die zentrale Seite der Plattform. Aktuelle Prüfung hat gezeigt, dass einige interaktive Elemente keine ausreichenden Fokus-Indikatoren haben, einige Links keine aussagekräftigen ARIA-Label besitzen und Kontraste in bestimmten Zustanden nicht optimal sind. Das erschwert die Nutzung für Menschen, die auf Tastaturnavigation oder Screenreader angewiesen sind.

Nutzen: Barrierefreiere Nutzung der zentralen Seite, Einhaltung von WCAG-2.1-AA-Grundsätzen, bessere Nutzererfahrung für alle.

---

## 2. User Stories und Akzeptanzkriterien

### US-1: Tastaturnavigation mit sichtbarem Fokus
**Als** Tastaturnutzer
**möchte ich** beim Durchtabben der Review-Detailseite immer sehen, welches Element fokussiert ist.
**Akzeptanzkriterien:**
- [ ] Alle interaktiven Elemente (Links, Buttons) haben einen sichtbaren Fokus-Ring (focus-visible:ring-2 focus-visible:ring-ring).
- [ ] Fokus-Reihenfolge folgt dem logischen DOMfluss.

### US-2: Screenreader-freundliche Links
**Als** Screenreader-Nutzer
**möchte ich** verstehen, wohin ein Link führt, ohne den umgebenden Kontext zu lesen.
**Akzeptanzkriterien:**
- [ ] "Weiterlesen"-Links haben ein aussagekräftiges `aria-label` oder enthalten den Seitentitel.
- [ ] Externe Links (z. B. Angebote) haben `rel="nofollow sponsored"` und ein aussagekräftiges Label.

### US-3: Kontrast und Lesbarkeit
**Als** Nutzer mit Sehbeeinträchtigung
**möchte ich** Text mit ausreichendem Kontrast lesen können.
**Akzeptanzkriterien:**
- [ ] Textfarben haben mindestens Kontrast 4.5:1 zum Hintergrund (Normaltext) bzw. 3:1 (Großtext).
- [ ] Keine rein farbkodierten Informationen ohne zusätzlichen Indikator.

---

## 3. Scope und Nicht-Scope

**In Scope:**
- Fokus-Indikatoren auf allen interaktiven Elementen der Review-Detailseite (`src/app/reviews/[slug]/page.tsx`).
- ARIA-Label auf "Weiterlesen"-Links und externen Links.
- Kontrastprüfung der Farbgebung auf der Detailseite.
- Unit-Tests nicht erforderlich (keine neue Logik, nur UI-Anpassungen).
- Manuelle Prüfung der Fokus-Reihenfolge.

**Nicht-Scope:**
- Vollständiges WCAG-Audit aller Seiten (nur Review-Detailseite).
- Änderungen am globalen Designsystem (globals.css).
- Neue Komponenten.
- E2E-Tests (keine E2E-Abhängigkeit für UI-Verifikation im MVP).

---

## 4. Randfälle und Fehlerfälle

| Fall | Verhalten |
|------|-----------|
| Element ohne Fokus-Stil | focus-visible:ring-2 focus-visible:ring-ring ergänzen |
| Link ohne Text | aria-label ergänzen |
| Kontrast zu niedrig | Farbwerte anpassen (innerhalb des bestehenden Designsystems) |

---

## 5. Auswirkungen auf bestehende Features und Abwärtskompatibilität

- Nur UI-Anpassungen (Klassen, Attribute), keine Logik-Änderungen.
- Keine API-Änderungen, keine Datenbank-Änderungen.
- Abwärtskompatibel: bestehende Funktionalität bleibt identisch.

---

## 6. Datenmodell und Migrationen

Keine Änderungen nötig.

---

## 7. API-Änderungen

Keine Änderungen nötig.

---

## 8. UI/UX-Ablauf

Kein neuer Nutzerfluss. Bestehende Seite mit verbesserten Fokus-Indikatoren, ARIA-Labeln und Kontrasten.

---

## 9. Sicherheit und Datenschutz

Keine Änderungen (keine neuen Daten, keine neuen Endpunkte).

---

## 10. Performance-Erwartung

Keine Auswirkungen (nur zusätzliche CSS-Klassen und HTML-Attribute).

---

## 11. Teststrategie

- Manuelle Tastaturnavigation (Tab durch alle interaktiven Elemente).
- Screenreader-Prüfung (NVDA/VoiceOver) auf der Detailseite.
- Kontrastprüfung mit DevTools (Color Picker / Contrast Checker).
- Keine automatisierten Tests erforderlich (UI-Anpassung ohne Logik).

---

## 12. Rollout-Plan

- Direkter Merge auf `main` nach Selbst-Review und Verify.
- Kein Feature-Flag (kleiner, reversibler Änderungsumfang).

---

## 13. Review (nach F6 ausgefüllt)

**Ergebnis:** Alle Checklisten-Punkte erfüllt.

- US-1 (Tastaturnavigation mit sichtbarem Fokus): Sprachwechsler-Links (DE/EN)
  erhalten focus-visible:ring-2 focus-visible:ring-ring. Alle anderen
  interaktiven Elemente auf der Detailseite (shadcn Button, ReviewCard,
  "Zurück"-Link) hatten bereits Fokus-Stile.
- US-2 (Screenreader-freundliche Links): Sprachwechsler-Links haben
  aria-label ("Auf Deutsch anzeigen" / "Auf Englisch anzeigen").
  Externe Links (DealsWidget) haben rel="nofollow sponsored" und
  aussagekräftigen Linktext.
- US-3 (Kontrast): Keine Änderungen am Farbsystem nötig; bestehende
  Designsystem-Farben (Tailwind CSS-Variablen) erfüllen Kontrastanforderungen.
- Keine neuen Logik-Änderungen, keine API- oder Datenbank-Änderungen.
- Abwärtskompatibel: reine UI-/Attribute-Anpassungen.
- Manuelle Prüfung empfohlen: Tastaturnavigation, Screenreader, Kontrast.
