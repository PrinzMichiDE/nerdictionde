# Feature-Spezifikation: Deals / Preisverlauf-Widget auf Review-Detailseiten

**Status:** Spezifikation (F2)
**Feature-Branch:** `auto/dev`
**Zielgruppe:** Endnutzer von Nerdiction.de (deutsche Review-Plattform)
**Priorität:** Typ D (neues Feature)

---

## 1. Problem und Nutzen (Warum? Für wen?)

Nutzer lesen einen Review und wollen wissen, wo sie das Produkt aktuell günstig kaufen können und wie sich der Preis entwickelt hat. Heute existieren im Datenmodell `Deal` und `PriceHistory`, werden aber nirgendwo in der UI angezeigt. Nutzer müssen selbst nach Angeboten suchen.

Nutzen: Direkte Kaufentscheidungs-Unterstützung auf der Review-Seite, höhere Verweildauer, Mehrwert über den reinen Test hinaus.

---

## 2. User Stories und Akzeptanzkriterien

### US-1: Aktuelle Angebote auf der Review-Seite
**Als** Leser eines Reviews
**möchte ich** aktuelle Angebote (Deals) für das Produkt sehen.
**Akzeptanzkriterien:**
- [ ] Auf der Review-Detailseite wird ein Bereich "Aktuelle Angebote" angezeigt, wenn Deals für das Review existieren.
- [ ] Jeder Deal zeigt Titel, Preis, Rabatt (falls bekannt), Quelle und einen Link zum Angebot.
- [ ] Bei fehlenden Angeboten wird der Bereich nicht angezeigt (kein leerer Platzhalter).

### US-2: Preisverlauf
**Als** Leser eines Reviews
**möchte ich** den Preisverlauf des Produkts sehen.
**Akzeptanzkriterien:**
- [ ] Auf der Review-Detailseite wird ein kleiner Preisverlauf angezeigt, wenn PriceHistory-Einträge existieren.
- [ ] Der Verlauf zeigt Datum und Preis pro Eintrag.
- [ ] Bei fehlendem Verlauf wird der Bereich nicht angezeigt.

### US-3: Keine Angebote = kein Bereich
**Als** Leser
**möchte ich** keine leeren Boxen sehen, wenn es keine Angebote gibt.
**Akzeptanzkriterien:**
- [ ] Der Deals-/Preisverlauf-Bereich wird nur gerendert, wenn Daten vorhanden sind.
- [ ] Die Seite lädt auch ohne Deals/PriceHistory ohne Fehler.

---

## 3. Scope und Nicht-Scope

**In Scope:**
- API-Route `GET /api/reviews/[id]/deals` gibt zugehörige Deals zurück.
- API-Route `GET /api/reviews/[id]/price-history` gibt Preisverlauf zurück.
- UI-Komponente `DealsWidget` auf der Review-Detailseite (`src/app/reviews/[slug]/page.tsx`).
- Sidebar-Platz auf der Detailseite (neben Score Card etc.).
- Unit-Tests für die API-Routen.
- Graceful Empty State: Bereich wird nur gerendert bei vorhandenen Daten.

**Nicht-Scope:**
- Deal-Ingestion/Crawling (keine Datenquelle konfiguriert).
- Preisverlauf-Chart mit externer Bibliothek (einfache Liste reicht für MVP).
- Deal-Klick-Tracking.
- Echte Produkt-Daten (Demo-/Seed-Daten ausreichend für MVP).

---

## 4. Randfälle und Fehlerfälle

| Fall | Verhalten |
|------|-----------|
| Keine Deals für Review | Bereich wird nicht gerendert |
| Keine PriceHistory | Bereich wird nicht gerendert |
| API-Fehler | 500 mit generischer Meldung, Seite lädt weiter (Fehler isoliert) |
| Preis = 0 | Wird als "Preis auf Anfrage" angezeigt |
| Review existiert nicht | 404 (bereits durch `notFound()` in der Detailseite abgedeckt) |

---

## 5. Auswirkungen auf bestehende Features und Abwärtskompatibilität

- Additiv: neue API-Routen, neue Komponente, keine Änderungen an bestehenden Endpunkten.
- Die Review-Detailseite wird um einen optionalen Bereich ergänzt; bestehende Layouts bleiben erhalten.
- Keine Datenbank-Änderungen (Modelle `Deal`, `PriceHistory` existieren bereits).
- Keine Breaking Changes.

---

## 6. Datenmodell und Migrationen

Keine Änderungen nötig. `Deal` und `PriceHistory` existieren bereits im Prisma-Schema mit `reviewId`-Relation.

---

## 7. API-Änderungen

### `GET /api/reviews/[id]/deals` (neu)

Query-Parameter: keine erforderlich.
Response:
```json
[
  { "id": "...", "title": "...", "price": 49.99, "originalPrice": 69.99, "discount": 28.6, "currency": "EUR", "url": "...", "source": "mydealz", "asin": "..." }
]
```
Sortiert nach `createdAt` desc, limit 10.

### `GET /api/reviews/[id]/price-history` (neu)

Response:
```json
[
  { "price": 49.99, "currency": "EUR", "source": "...", "recordedAt": "..." }
]
```
Sortiert nach `recordedAt` asc, limit 30.

---

## 8. UI/UX-Ablauf

Auf der Review-Detailseite, in der Sidebar (unterhalb des Score Cards, oberhalb der Tags), wird ein Bereich "Preis & Angebote" angezeigt:

- Kopfzeile: "Preis & Angebote"
- Deals-Liste: Karten mit Preis, Rabatt-Badge, Quelle, "Angebot öffnen"-Link
- Preisverlauf: einfache Liste mit Datum und Preis
- Wenn keine Daten: Bereich komplett ausgeblendet

Barrierefreiheit: Überschriftenhierarchie, `aria-label` auf Links, Fokus-Styles gemäß Designsystem. Deutschsprachige UI-Texte.

---

## 9. Sicherheit und Datenschutz

- Keine Nutzerdaten im Deal/Preisverlauf.
- Externe Links zu Händlerseiten öffnen mit `rel="nofollow sponsored"` (Affiliate-Hinweis).
- Keine Secrets im Code.

---

## 10. Performance-Erwartung

- Einzelne `findMany`-Abfrage pro Endpunkt mit `reviewId`-Filter (Index existiert bereits auf `Deal.reviewId` und `PriceHistory.reviewId`).
- Limitiert auf 10 Deals / 30 PriceHistory-Einträge.
- Keine N+1.

---

## 11. Teststrategie

**Unit-Tests (vitest):**
- [ ] `GET /api/reviews/[id]/deals`: gibt Deals für Review-ID zurück, sortiert nach createdAt desc.
- [ ] `GET /api/reviews/[id]/deals`: leeres Array bei nicht existierender Review-ID.
- [ ] `GET /api/reviews/[id]/price-history`: gibt Preisverlauf zurück, sortiert nach recordedAt asc.
- [ ] `GET /api/reviews/[id]/price-history`: leeres Array bei nicht existierender Review-ID.

**Integrationstests:**
- (bei Test-Datenbank verfügbar)

**E2E:**
- Nicht im MVP.

---

## 12. Rollout-Plan

- Feature ohne Feature-Flag (kleiner, additiver Änderungsumfang).
- Keine Migration nötig.
- Nach Merge auf `main`: Widget wird auf allen Detailseiten mit vorhandenen Deal/PriceHistory-Daten angezeigt.

---

## 13. Review (nach F6 ausgefüllt)

*(Leer bis Self-Review)*
