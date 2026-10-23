# Feature-Spezifikation: Newsletter Double-Optin + Bestätigungsseite

**Status:** Spezifikation (F2)
**Feature-Branch:** `auto/dev`
**Zielgruppe:** Endnutzer von Nerdiction.de (deutsche Review-Plattform)
**Priorität:** Typ D (neues Feature), nach 2 erledigten Typ-B/Aufgaben

---

## 1. Problem und Nutzen (Warum? Für wen?)

Die aktuelle Newsletter-Anmeldung (`POST /api/newsletter/subscribe`) setzt ein Abonnement sofort aktiv (`isActive: true`). Es gibt keine Bestätigung durch den E-Mail-Inhaber. Das ist für eine deutschsprachige Seite nicht DSGVO-konform: Double-Optin ist der anerkannte Standard, um sicherzustellen, dass nur der tatsächliche Besitzer einer E-Mail-Adresse das Abonnement auslöst.

Zusätzlich fehlt:
- Eine Bestätigungsseite, auf der Nutzer ihre Anmeldung bestätigen können.
- Eine Abmeldeseite.
- Eine Rückmeldung nach der Anmeldung, dass eine Bestätigung erforderlich ist.

Nutzen: Rechtssichere Newsletter-Anmeldung, sauberere Adressliste (keine fremdangemeldeten E-Mails), transparenter Nutzer-Flow.

---

## 2. User Stories und Akzeptanzkriterien

### US-1: Newsletter-Anmeldung mit Bestätigungshinweis
**Als** Besucher der Website
**möchte ich** mich für den Newsletter anmelden und einen Hinweis erhalten, dass ich meine Anmeldung bestätigen muss.
**Akzeptanzkriterien:**
- [ ] `POST /api/newsletter/subscribe` legt ein Abonnement mit `isActive = false` und einem `confirmationToken` an.
- [ ] Die Antwort enthält eine Erfolgsmeldung, dass eine Bestätigung erforderlich ist.
- [ ] Bestehende, bereits aktive Abonnements bleiben unverändert (Rückwärtskompatibilität).

### US-2: Bestätigung per Link
**Als** Nutzer, der sich angemeldet hat
**möchte ich** meine Anmeldung über eine Bestätigungsseite bestätigen.
**Akzeptanzkriterien:**
- [ ] `GET /newsletter/confirm/[token]` validiert den Token und setzt `isActive = true` sowie `confirmedAt`.
- [ ] Bei ungültigem oder bereits verbrauchtem Token wird eine Fehlermeldung angezeigt.
- [ ] Bei Erfolg wird eine Bestätigungsseite angezeigt ("Danke, Ihr Abonnement ist aktiv.").

### US-3: Abmeldung
**Als** Abonnent
**möchte ich** mich vom Newsletter abmelden.
**Akzeptanzkriterien:**
- [ ] `GET /newsletter/unsubscribe/[token]` setzt `isActive = false` und `unsubscribedAt`.
- [ ] Bei ungültigem Token wird eine Fehlermeldung angezeigt.

### US-4: Keine Anmeldung ohne Bestätigung
**Als** Systembetreiber
**möchte ich** sicherstellen, dass unbestätigte Abonnements keine E-Mails erhalten.
**Akzeptanzkriterien:**
- [ ] `isActive = false` für neue Abonnements bis zur Bestätigung.
- [ ] Bestehende Abonnements mit `isActive = true` bleiben aktiv.

---

## 3. Scope und Nicht-Scope

**In Scope:**
- Prisma-Migration: `confirmationToken` (String?, @unique), `confirmedAt` (DateTime?) auf `NewsletterSubscription`; `isActive`-Default auf `false`.
- API `POST /api/newsletter/subscribe`: Token generieren, `isActive: false`, Erfolgsmeldung anpassen.
- Seite `/newsletter/confirm/[token]`: Bestätigungs-Logik + UI.
- Seite `/newsletter/unsubscribe/[token]`: Abmeld-Logik + UI.
- Unit-Tests für die neuen API-Routen und die Bestätigungs-Logik.
- Anpassung der Erfolgsmeldung in `NewsletterSignup` (Komponente auf Startseite).

**Nicht-Scope:**
- Echte E-Mail-Versendung (kein E-Mail-Provider konfiguriert; Token wird in der API-Antwort / auf der Erfolgsseite sichtbar gemacht für den MVP).
- Abmeldung ohne Token (E-Mail-basiert).
- Token-Ablauf/Verfall (einmal bestätigt, bleibt bestätigt).
- Wiederholtes Versenden von Bestätigungs-E-Mails.

---

## 4. Randfälle und Fehlerfälle

| Fall | Verhalten |
|------|-----------|
| Ungültiger Token bei `/confirm` | Fehlerseite "Token ungültig" |
| Bereits bestätigter Token bei `/confirm` | Info "Bereits bestätigt" (kein Fehler) |
| Ungültiger Token bei `/unsubscribe` | Fehlerseite "Token ungültig" |
| Race-Condition bei doppeltem `subscribe` | `upsert` behandelt idempotent (existierender Datensatz wird reaktiviert mit neuem Token) |
| Leerer/fehlender Token in URL | 400 / Fehlerseite |
| Datenbank-Fehler | 500 mit generischer Meldung, kein Stacktrace nach außen |

---

## 5. Auswirkungen auf bestehende Features und Abwärtskompatibilität

- Bestehende `NewsletterSubscription`-Datensätze mit `isActive = true` bleiben aktiv (Migration ändert keine vorhandenen Zeilen).
- `isActive`-Default ändert sich auf `false` (betrifft nur Neuanmeldungen).
- Die API-Antwort von `POST /api/newsletter/subscribe` ändert die Erfolgsmeldung leicht; die Struktur (`success`, `message`, `data`) bleibt gleich.
- Keine Breaking Changes an bestehenden Endpunkten.

---

## 6. Datenmodell und Migrationen

### Änderung an `NewsletterSubscription`

```prisma
model NewsletterSubscription {
  id              String   @id @default(cuid())
  email           String   @unique
  source          String?
  subscribedAt    DateTime @default(now())
  unsubscribedAt  DateTime?
  isActive        Boolean  @default(false)   // geändert von true -> false
  confirmationToken String? @unique          // neu
  confirmedAt     DateTime?                  // neu

  @@index([email])
  @@index([isActive])
}
```

### Migration (reversibel)

**Vorwärts:** Spalten `confirmationToken` (nullable, unique), `confirmedAt` (nullable) hinzufügen; Default von `isActive` auf `false` setzen.

**Rückwärts:** Spalten entfernen; Default von `isActive` auf `true` zurücksetzen. Bestehende Daten bleiben intakt.

---

## 7. API-Änderungen

### `POST /api/newsletter/subscribe` (bestehend, geändert)

Request: `{ email: string, source?: string }` (Zod-Validierung bleibt).
Response bei Erfolg:
```json
{ "success": true, "message": "Danke! Bitte bestätige deine Anmeldung über den Link, den du erhalten hast.", "data": { "id": string, "email": string } }
```
Intern: Token generieren (`crypto.randomUUID()`), `isActive: false`, `confirmationToken` setzen.

### `GET /newsletter/confirm/[token]` (neue Seite, Server Component)

- Token aus URL validieren.
- Subscription finden, `isActive = true`, `confirmedAt = now()`.
- Erfolg: Bestätigungs-UI. Fehler: Fehler-UI.

### `GET /newsletter/unsubscribe/[token]` (neue Seite, Server Component)

- Token aus URL validieren.
- Subscription finden, `isActive = false`, `unsubscribedAt = now()`.
- Erfolg: Abmeld-Bestätigungs-UI. Fehler: Fehler-UI.

---

## 8. UI/UX-Ablauf

### Anmeldung (bestehend, angepasst)
Nutzer trägt E-Mail in `NewsletterSignup` ein → `POST /api/newsletter/subscribe` → Erfolgsmeldung: "Danke! Bitte bestätige deine Anmeldung..." (kein "Sie sind angemeldet"-Falschversprechen).

### Bestätigung (neu)
Nutzer klickt Bestätigungslink → `/newsletter/confirm/[token]` → Seite zeigt "Danke! Dein Newsletter-Abonnement ist jetzt aktiv." oder Fehler.

### Abmeldung (neu)
Nutzer klickt Abmeldelink → `/newsletter/unsubscribe/[token]` → Seite zeigt "Du wurdest abgemeldet." oder Fehler.

### Zustände
- Lade: während Bestätigung/Abmeldung verarbeitet wird.
- Erfolg: klare Bestätigungsmeldung.
- Fehler: klare Fehlermeldung mit Möglichkeit, erneut anzumelden (Link zur Startseite/Newsletter-Anmeldung).

### Barrierefreiheit
- Überschriftenhierarchie (`<h1>` auf Bestätigungs-/Abmeldeseite).
- `aria-label` auf Links/Buttons.
- Fokus-Styles gemäß Designsystem.
- Deutschsprachige UI-Texte.

---

## 9. Sicherheit und Datenschutz

- Token ist kryptografisch stark (`crypto.randomUUID()`).
- Token ist `@unique` in der Datenbank (keine Dubletten).
- Keine E-Mail-Adressen in URLs (nur Token).
- Bestätigung/Abmeldung nur mit gültigem Token möglich.
- Keine Secrets im Code.
- Eingabevalidierung via Zod (bestehend).
- Datenschutz: nur notwendige Felder gespeichert (E-Mail, Token, Zeitstempel).

---

## 10. Performance-Erwartung

- Bestätigung/Abmeldung: einzelne Datenbank-Abfrage (findUnique + update), unter 100 ms.
- Keine N+1-Abfragen.
- Keine zusätzlichen Re-Renders (Server Components).

---

## 11. Teststrategie

**Unit-Tests (vitest/tsx):**
- [ ] `subscribe` API: legt `isActive: false` mit Token an.
- [ ] `subscribe` API: idempotent bei doppelter E-Mail.
- [ ] `confirm` Seite: ungültiger Token → Fehler.
- [ ] `confirm` Seite: gültiger Token → `isActive: true`, `confirmedAt` gesetzt.
- [ ] `confirm` Seite: bereits bestätigter Token → kein Fehler, Info.
- [ ] `unsubscribe` Seite: gültiger Token → `isActive: false`, `unsubscribedAt` gesetzt.
- [ ] `unsubscribe` Seite: ungültiger Token → Fehler.

**Integrationstests:**
- [ ] Flow: Anmeldung → Bestätigung → aktiv (gegen Test-Datenbank, falls verfügbar).

**E2E:**
- [ ] Nicht im MVP (keine E2E-Abhängigkeit installiert; bei Bedarf später über `e2e`).

---

## 12. Rollout-Plan

- Feature ohne Feature-Flag (kleiner, rückgängig machbarer Änderungsumfang).
- Migration ist reversibel.
- Nach Merge auf `main`: bestehende Abonnements bleiben aktiv, neue erfordern Bestätigung.
- Default `isActive: false` bewusst gesetzt.

---

## 13. Review (nach F6 ausgefüllt)

*(Leer bis Self-Review)*
