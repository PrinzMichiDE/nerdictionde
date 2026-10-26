# Feature Specification: Erweiterte Benachrichtigungs-Präferenzen

## 1. Problem und Nutzen

**Problem:** Aktuell haben Nutzer nur begrenzte Kontrolle über Benachrichtigungen. Es gibt ein globales Opt-in/Out für Kategorie-Abos und Follow-Benachrichtigungen, aber keine granulare Steuerung pro:
- Benachrichtigungs-Typ (neue Review, neue Antwort, Follow, Like, Erwähnung, Serien-Update, etc.)
- Kanal (In-App, E-Mail, Push)
- Frequenz (sofort, täglich, wöchentlich, monatlich)
- Stummschaltung pro Objekt (spezifische Review, Liste, Serie, Nutzer)

**Nutzen:**
- **Retention:** Nutzer bleiben länger, da sie nur relevante Benachrichtigungen erhalten
- **Kontrolle:** DSGVO-konforme Selbstbestimmung über Kommunikation
- **Weniger Abmeldungen:** Granulare Einstellungen verhindern komplettes Abmelden
- **Engagement:** Digest-Optionen bündeln Benachrichtigungen sinnvoll

**Zielgruppe:** Alle eingeloggten Nutzer (Twitch-Auth)

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| US1 | Als Nutzer möchte ich pro Benachrichtigungs-Typ einstellen, ob ich In-App, E-Mail oder Push erhalte | - Checkbox-Matrix: Typ × Kanal (In-App / E-Mail / Push)<br>- Änderungen sofort wirksam<br>- Standard: In-App an, E-Mail aus, Push aus |
| US2 | Als Nutzer möchte ich die Frequenz pro Kanal wählen (sofort / täglich / wöchentlich) | - Radio-Buttons pro Kanal: "Sofort", "Täglich (08:00)", "Wöchentlich (Mo 08:00)"<br>- "Sofort" = Echtzeit, andere = Digest<br>- Digest fasst alle Benachrichtigungen des Zeitraums zusammen |
| US3 | Als Nutzer möchte ich einzelne Objekte stummschalten (Review, Liste, Serie, Nutzer) | - "Stummschalten" Button in Benachrichtigung & auf Objekt-Seite<br>- Gemutete Objekte erscheinen nicht in In-App/Digest/Push<br>- Liste gemuteter Objekte in Einstellungen einseh- & entfernbar |
| US4 | Als Nutzer möchte ich eine Übersicht aller Einstellungen an einer Stelle | - Seite `/einstellungen/benachrichtigungen`<br>- Tabs: "Typen & Kanäle", "Frequenz", "Stummschaltungen"<br>- Mobile: Accordion statt Tabs |
| US5 | Als Nutzer möchte ich Benachrichtigungen testen können | - "Test-Benachrichtigung senden" Button pro Kanal<br>- Erzeugt Demo-Notification in In-App / Test-E-Mail / Test-Push |
| US6 | Als System sollen Digest-E-Mails/Pushes automatisch versendet werden | - Cron-Job: Täglich 08:00 UTC, Wöchentlich Mo 08:00 UTC<br>- Batch-Insert für Performance<br>- Nur Nutzer mit entsprechender Frequenz-Einstellung |
| US7 | Als Nutzer möchte ich Push-Benachrichtigungen abonnieren können (Web Push API) | - "Push aktivieren" Button fordert Browser-Permission an<br>- VAPID Keys in `.env`<br>- Subscription in DB gespeichert, widerrufbar |

---

## 3. Scope & Nicht-Scope

### In Scope
- Preference Model für Typ × Kanal × Frequenz
- Mute Model für Objekt-basierte Stummschaltung
- Settings UI `/einstellungen/benachrichtigungen`
- Digest-Cron (täglich, wöchentlich)
- Web Push Subscription (VAPID)
- Test-Notification Endpoint
- Integration in bestehende Notification-Erstellung (dedupe, batch)

### Nicht-Scope
- SMS / WhatsApp / Telegram Kanäle
- Native Mobile Push (FCM/APNs) — nur Web Push
- A/B-Tests für Default-Einstellungen
- ML-basierte Frequenz-Optimierung
- Benachrichtigungs-Verlauf Export (bereits über In-App Feed)

---

## 4. Randfälle, Fehlerfälle, Berechtigungen

| Szenario | Behandlung |
|----------|------------|
| Nutzer nicht eingeloggt | 401, Redirect zu Login |
| Ungültige Frequenz/Kanal-Kombi | 400, Zod-Validierung |
| Push-Permission verweigert | Toast-Fehler, UI zeigt "Blockiert" |
| VAPID Keys fehlen | Feature-Flag `FEATURE_PUSH_NOTIFICATIONS` = false, Push-UI ausgeblendet |
| Cron-Job fehlschlägt | Retry mit Exponential Backoff, Alert in Logs |
| Nutzer löscht Account | Cascade Delete auf Preferences + Mutes + Push-Subscriptions |
| Gleichzeitige Preference-Änderung | Optimistisches Locking via `version` Feld |
| Digest leer | Keine E-Mail/Push versenden |

---

## 5. Auswirkungen auf bestehende Features

| Feature | Auswirkung |
|---------|------------|
| Bestehende Notifications (`lib/notification-helpers.ts`) | Werden durch `shouldNotify(userId, type, channel)` gefiltert |
| Kategorie-Abos | Nutzen neue Frequenz-Logik statt sofort-only |
| Follow-System | Nutzen neue Frequenz-Logik |
| Review Reactions / Q&A / Collections | Nutzen neue Kanäle & Frequenzen |
| Feed (`/feed`) | Unverändert (In-App Feed bleibt Echtzeit) |

**Abwärtskompatibilität:** Bestehende Nutzer ohne Preferences erhalten Default-Einstellungen (In-App sofort, E-Mail/Push aus). Migration fügt Default-Rows für alle bestehenden Nutzer hinzu.

---

## 6. Datenmodell & Migrationen

### Prisma Schema Erweiterungen

```prisma
enum NotificationChannel {
  IN_APP
  EMAIL
  PUSH
}

enum NotificationFrequency {
  IMMEDIATE
  DAILY
  WEEKLY
}

model NotificationPreference {
  id            String               @id @default(cuid())
  userId        String
  user          TwitchUser           @relation(fields: [userId], references: [id], onDelete: Cascade)
  type          NotificationType     // Bestehender Enum: review_new, review_comment, qa_answer, etc.
  channel       NotificationChannel
  frequency     NotificationFrequency @default(IMMEDIATE)
  enabled       Boolean              @default(true)
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  @@unique([userId, type, channel])
  @@index([userId])
}

model NotificationMute {
  id            String       @id @default(cuid())
  userId        String
  user          TwitchUser   @relation(fields: [userId], references: [id], onDelete: Cascade)
  targetType    MuteTargetType // REVIEW, COLLECTION, SERIES, USER
  targetId      String
  createdAt     DateTime     @default(now())

  @@unique([userId, targetType, targetId])
  @@index([userId])
}

enum MuteTargetType {
  REVIEW
  COLLECTION
  SERIES
  USER
}

model PushSubscription {
  id            String       @id @default(cuid())
  userId        String
  user          TwitchUser   @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint      String       @unique
  p256dh        String       // VAPID key
  auth          String       // VAPID key
  userAgent     String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([userId])
}

// Bestehendes TwitchUser erweitern
model TwitchUser {
  // ... bestehende Felder
  notificationPreferences NotificationPreference[]
  notificationMutes       NotificationMute[]
  pushSubscriptions       PushSubscription[]
}
```

### Migration
- Reversibel: `DROP TABLE NotificationPreference; DROP TABLE NotificationMute; DROP TABLE PushSubscription;`
- Default-Preferences für bestehende Nutzer via Seed-Script nach Migration

---

## 7. API-Änderungen

### Neue Routes

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/user/notification-preferences` | GET | Alle Preferences des Nutzers (grouped by type) |
| `/api/user/notification-preferences` | PATCH | Bulk-Update Preferences (Array von {type, channel, frequency, enabled}) |
| `/api/user/notification-preferences/test` | POST | Test-Notification senden (body: {channel, type?}) |
| `/api/user/notification-mutes` | GET | Alle gemuteten Objekte |
| `/api/user/notification-mutes` | POST | Objekt stummschalten (body: {targetType, targetId}) |
| `/api/user/notification-mutes/[id]` | DELETE | Stummschaltung aufheben |
| `/api/user/push-subscription` | GET | Aktive Push-Subscription |
| `/api/user/push-subscription` | POST | Push-Subscription speichern (body: {endpoint, p256dh, auth}) |
| `/api/user/push-subscription` | DELETE | Push-Subscription löschen |
| `/api/cron/notification-digest` | POST | Cron-Endpoint für Daily/Weekly Digest (Auth via CRON_SECRET) |

### Bestehende Routes (Erweiterung)
- Alle Notification-Erstellungs-Funktionen (`createNotification`, `createBatchNotifications`) prüfen jetzt Preferences & Mutes

---

## 8. UI/UX-Ablauf

### Seite `/einstellungen/benachrichtigungen`

**Tab 1: Typen & Kanäle**
- Tabelle: Zeilen = NotificationType (alle Enum-Werte), Spalten = Kanäle (In-App, E-Mail, Push)
- Zellen: Checkbox (enabled) + bei E-Mail/Push: Frequency-Select (Sofort/Täglich/Wöchentlich)
- In-App immer "Sofort" (kein Frequency-Select)
- Tooltip pro Typ mit Beschreibung

**Tab 2: Frequenz** (Alternative Ansicht)
- Karten pro Kanal: In-App (nur Info: "Immer sofort"), E-Mail (Radio: Sofort/Täglich/Wöchentlich), Push (Radio: Sofort/Täglich/Wöchentlich)
- Erklärung: "Täglich fasst alle Benachrichtigungen um 08:00 zusammen"

**Tab 3: Stummschaltungen**
- Liste: Typ (Icon), Name (Link), "Entstummen" Button
- Leerzustand: "Keine stummschalteten Objekte"

**Mobile:** Accordion statt Tabs, Checkbox-Matrix scrollbar horizontal

### Zustände
- **Loading:** Skeleton für Tabelle
- **Error:** Toast + Inline-Fehler bei Speichern
- **Success:** Toast "Gespeichert"
- **Push nicht unterstützt:** Banner "Dein Browser unterstützt keine Push-Benachrichtigungen"

### Barrierefreiheit
- `role="table"` mit `aria-label`
- Checkboxen mit `<label>` + `aria-describedby` für Tooltip
- Radio-Groups mit `role="radiogroup"` + `aria-label`
- Focus-Management bei Tab-Wechsel
- Reduced Motion: Keine Animationen bei `@media (prefers-reduced-motion)`

---

## 9. Sicherheit & Performance

### Sicherheit
- **Autorisierung:** Alle Routes prüfen Session (`requireAuth` / `getServerSession`)
- **Validierung:** Zod-Schemas für alle Inputs
- **Rate-Limit:** Test-Endpoint: 5 req/min, Push-Subscribe: 10 req/min
- **VAPID Keys:** Nur in Server-Env, nie im Client
- **Digest-Cron:** Auth via `CRON_SECRET` Header (Vercel Cron / GitHub Actions)

### Performance
- `unstable_cache` für Preferences (60s, Tag: `notif-prefs:{userId}`)
- `unstable_cache` für Mutes (60s, Tag: `notif-mutes:{userId}`)
- Batch-Insert bei Digest (max 1000 Nutzer pro Batch)
- Push-Versand asynchron (fire-and-forget, nicht blockierend)
- Indizes auf `userId` in allen neuen Tabellen

---

## 10. Teststrategie

### Unit Tests (`tests/lib/notification-preferences.test.ts`)
- Preference-Logik: `shouldNotify(userId, type, channel)` → boolean
- Frequenz-Logik: `shouldIncludeInDigest(userId, type, channel, frequency)` → boolean
- Mute-Logik: `isMuted(userId, targetType, targetId)` → boolean
- Default-Preferences Generation

### Integration Tests (`tests/api/notification-preferences.test.ts`)
- GET/PATCH Preferences (Auth, Validierung, Persistenz)
- GET/POST/DELETE Mutes
- GET/POST/DELETE Push-Subscription
- Test-Notification Endpoint
- Cron-Digest Endpoint (Mock Zeit, Prüfe Batch-Insert)

### E2E Tests (`tests/enhanced-notification-preferences.e2e.ts`)
- Settings-Seite lädt, Tabs funktionieren
- Checkbox toggeln → Speichern → Reload → Wert bleibt
- Frequency ändern → Speichern
- Objekt stummschalten via Button auf Review-Seite → erscheint in Tab 3
- Push aktivieren → Permission Dialog → Subscription gespeichert
- Test-E-Mail versenden (Mock SMTP)

---

## 11. Rollout-Plan & Feature-Flags

| Flag | Default | Beschreibung |
|------|---------|--------------|
| `FEATURE_ENHANCED_NOTIFICATION_PREFS` | `true` | Haupt-Flag für Preferences UI & API |
| `FEATURE_NOTIFICATION_DIGEST` | `true` | Digest-Cron & Frequenz-Logik |
| `FEATURE_PUSH_NOTIFICATIONS` | `false` | Web Push (braucht VAPID Keys in Env) |
| `FEATURE_NOTIFICATION_MUTES` | `true` | Objekt-Stummschaltung |

**Rollout:**
1. Flags auf `false` deployen
2. Migration ausführen
3. Flags auf `true` schalten (außer Push)
4. VAPID Keys generieren & in Prod-Env setzen → Push-Flag auf `true`
5. Cron-Job in Vercel/Renderer einrichten

---

## 12. Review-Checkliste (F6)

- [ ] Alle User Stories implementiert & getestet
- [ ] Randfälle: Unauthenticated, Invalid Input, Push Blocked, Missing VAPID, Cron Failure
- [ ] Eingaben validiert (Zod), Autorisierung geprüft, keine Secrets im Client
- [ ] Keine N+1 Abfragen (Batch-Loading Preferences/Mutes), Indizes gesetzt
- [ ] Migration reversibel, Default-Preferences für Bestandsnutzer
- [ ] Abwärtskompatibel: Bestehende Notifications funktionieren ohne Preferences
- [ ] Code-Stil konsistent (bestehende Patterns: `lib/notification-helpers.ts`, `lib/feed.ts`)
- [ ] UI: Alle Zustände (Loading, Error, Empty, Success), a11y (ARIA, Keyboard, Reduced Motion)
- [ ] Feature-Flags dokumentiert in `.env.example`
- [ ] CHANGELOG, README, ROADMAP aktualisiert