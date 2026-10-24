# Feature-Spezifikation: Kategorie-Abos / Category Subscriptions

**Datum:** 2026-10-24  
**Status:** In Arbeit (F2)  
**Autor:** Autonomes Entwicklungsteam  
**Feature-Flag:** `FEATURE_CATEGORY_SUBSCRIPTIONS` (Default: `true`)

---

## 1. Problem und Nutzen

### Problem
Nutzer verpassen neue Reviews in ihren Interessensbereichen (Games, Hardware, Movies, Series), weil sie die Seite nicht regelmäßig besuchen oder die Startseite zu generisch ist. Es fehlt ein Mechanismus, der Nutzer proaktiv über neue Inhalte in ihren Präferenzen informiert.

### Nutzen (Warum? Für wen?)
- **Für Leser:** Erhalten Benachrichtigungen (On-Site + optional E-Mail), sobald ein Review in einer abonnierten Kategorie erscheint → höhere Retention, weniger verpasste Inhalte.
- **Für Autoren/Plattform:** Mehr Traffic auf neue Reviews kurz nach Veröffentlichung, stärkere Bindung, Messbarkeit über Notification-Opens.
- **Für SEO/Discovery:** Kategorie-Seiten werden häufiger besucht, interne Verlinkung gestärkt.

### Metriken (messbare Akzeptanzkriterien)
- ≥ 15% der eingeloggten Nutzer abonnieren mindestens eine Kategorie innerhalb von 30 Tagen.
- ≥ 25% Klickrate auf Kategorie-Benachrichtigungen (On-Site) innerhalb von 7 Tagen.
- Benachrichtigungs-Latenz: < 5 Minuten nach Review-Publikation bis Notification-Erstellung.

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| **US1** | Als eingeloggter Nutzer möchte ich Kategorien (Games, Hardware, Movies, Series) abonnieren/abbestellen, damit ich über neue Reviews informiert werde. | - UI in `/einstellungen/kategorien` zeigt alle 4 Kategorien mit Toggle-Schaltern<br>- Toggle speichert sofort (optimistische UI, Rollback bei Fehler)<br>- Toast-Bestätigung bei Erfolg/Fehler<br>- Standard: keine Kategorie abonniert (Opt-in) |
| **US2** | Als Nutzer erhalte ich eine On-Site-Benachrichtigung, wenn ein Review in einer abonnierten Kategorie veröffentlicht wird. | - `NotificationType.CATEGORY_NEW_REVIEW` wird erstellt bei Publish<br>- Empfänger: alle User mit `CategorySubscription` für diese Kategorie + `notificationPrefs.categoryNewReview = true`<br>- Notification enthält: Review-Titel, Kategorie, Link zu Review, Thumbnail<br>- Deduplizierung: max 1 Notification pro Review pro User |
| **US3** | Als Nutzer kann ich in den Benachrichtigungseinstellungen festlegen, ob ich Kategorie-Benachrichtigungen per E-Mail erhalten möchte. | - Erweiterung `NotificationPrefs`: `categoryNewReviewEmail: boolean` (Default: `false`)<br>- UI in `/einstellungen/benachrichtigungen`<br>- Respektiert globale `emailEnabled` |
| **US4** | Als Nutzer sehe ich meine abonnierten Kategorien auf der Startseite / im Profil als Badge/Chip. | - `/` (Startseite) zeigt Chips für abonnierte Kategorien (max 4)<br>- `/u/[username]` Profil zeigt Kategorie-Chips (öffentlich, nur wenn User das erlaubt)<br>- Klick auf Chip filtert `/suche?category=...` |
| **US5** | Als Admin/Autor wird bei Publikation eines Reviews automatisch die Benachrichtigung getriggert. | - Hook in Review-Publish-Flow (Server Action / API Route)<br>- Fire-and-forget (non-blocking)<br>- Fehler loggen, aber Publish nicht blockieren |

---

## 3. Scope & Nicht-Scope

### In Scope (MVP)
- 4 feste Kategorien: `GAMES`, `HARDWARE`, `MOVIES`, `SERIES` (Enum `ReviewCategory`)
- Model `CategorySubscription` (User ↔ Category, Unique)
- On-Site Notifications bei neuem Review in abonnierter Kategorie
- E-Mail-Preference für Kategorie-Benachrichtigungen (Opt-in)
- UI in `/einstellungen/kategorien` + `/einstellungen/benachrichtigungen`
- Badge/Chip-Anzeige auf Startseite & Profil
- Feature-Flag `FEATURE_CATEGORY_SUBSCRIPTIONS`

### Explizit Nicht-Scope (spätere Iterationen)
- Benutzerdefinierte Kategorien / Tags-Abos
- Push-Benachrichtigungen (Web Push / Mobile)
- Digest-E-Mails (täglich/wöchentlich zusammengefasst)
- Kategorie-spezifische Frequenz-Einstellungen (sofort / daily digest)
- A/B-Tests für Notification-Timing/-Wording
- Analytics-Dashboard für Kategorie-Abo-Conversion

---

## 4. Randfälle, Fehlerfälle, Leere Zustände, Berechtigungen, Nebenläufigkeit

### Randfälle
- **Review in mehreren Kategorien:** Notification pro User nur einmal (Deduplizierung via `Notification.uniqueKey = "category-review-{reviewId}-{userId}"`)
- **Kategorie ändern nachträglich:** Bestehende Subscriptions bleiben, neue Reviews nutzen neue Kategorie
- **Review unpublizieren:** Keine Notification-Rücknahme (bereits gesendet), aber keine neuen für unpublizierte
- **User löscht Account:** Cascade Delete auf `CategorySubscription` + `Notification`

### Fehlerfälle
- **DB-Unique-Constraint-Verletzung (Doppel-Abo):** Idempotent behandeln (Upsert), Toast "Bereits abonniert"
- **Notification-Erstellung schlägt fehl:** Loggen, Review-Publish nicht blockieren, Retry via Outbox-Pattern (später)
- **Cron/Trigger nicht verfügbar:** Fallback: Notification beim nächsten Seitenaufruf des Users prüfen (später)

### Leere Zustände
- **Keine Kategorien abonniert:** UI zeigt "Noch keine Kategorien abonniert. Wähle oben deine Interessen."
- **Keine Benachrichtigungen:** Standard-Empty-State der Notification-Liste

### Berechtigungen
- Nur eingeloggte User (Twitch OAuth) können abonnieren
- `requireTwitchAuth` Guard auf allen APIs
- Owner-Check: User kann nur eigene Subscriptions verwalten

### Nebenläufigkeit
- Toggle-Race-Condition: Optimistisches Locking via `version` Feld auf `CategorySubscription` (optional, MVP: idempotent Upsert reicht)
- Notification-Deduplizierung: Unique Constraint auf `Notification.uniqueKey`

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

| Feature | Auswirkung |
|---------|------------|
| **Notifications** | Neuer `NotificationType.CATEGORY_NEW_REVIEW`, erweitert `NotificationPayload` |
| **NotificationPrefs** | Neues Feld `categoryNewReviewEmail` (Default `false`) |
| **Review Publish** | Neuer Side-Effect: Notification-Erstellung (non-blocking) |
| **Startseite** | Zusätzliche Chips für abonnierte Kategorien (Client Component) |
| **Profil `/u/[username]`** | Optional: Kategorie-Chips anzeigen (Privacy-Setting später) |
| **Suche `/suche`** | Chip-Klick setzt `category` Filter (bereits vorhanden) |
| **Einstellungen** | Zwei neue Tabs/Sections: "Kategorien", "Benachrichtigungen" erweitert |

**Abwärtskompatibilität:** Volle Rückwärtskompatibilität. Keine Breaking Changes an bestehenden APIs/Models. Bestehende Nutzer haben keine Subscriptions (Opt-in).

---

## 6. Datenmodell & Migrationen

### Prisma Schema Erweiterungen

```prisma
enum ReviewCategory {
  GAMES
  HARDWARE
  MOVIES
  SERIES
}

model CategorySubscription {
  id        String         @id @default(cuid())
  userId    String
  category  ReviewCategory
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  user      TwitchUser     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, category])
  @@index([category])
}

model Notification {
  // ... existing fields
  type NotificationType
  // NEW:
  uniqueKey String?        @unique // für Deduplizierung: "category-review-{reviewId}-{userId}"
}

enum NotificationType {
  // ... existing
  CATEGORY_NEW_REVIEW
}

model NotificationPrefs {
  // ... existing fields
  categoryNewReviewEmail Boolean @default(false)
}
```

### Migration (reversibel)
- **Up:** `CREATE TABLE CategorySubscription`, `ADD COLUMN uniqueKey` auf `Notification`, `ADD COLUMN categoryNewReviewEmail` auf `NotificationPrefs`, `ALTER TYPE NotificationType ADD VALUE 'CATEGORY_NEW_REVIEW'`
- **Down:** `DROP TABLE CategorySubscription`, `DROP COLUMN uniqueKey`, `DROP COLUMN categoryNewReviewEmail`, `ALTER TYPE NotificationType DROP VALUE 'CATEGORY_NEW_REVIEW'` (PostgreSQL: `ALTER TYPE ... DROP VALUE` erfordert keine abhängigen Objekte)

### Indizes
- `CategorySubscription(category)` für effizientes Finden aller Subscriber einer Kategorie
- `Notification(uniqueKey)` Unique für Deduplizierung

---

## 7. API-Änderungen

### Neue Endpoints

| Method | Path | Beschreibung |
|--------|------|--------------|
| `GET` | `/api/me/categories/subscriptions` | Liste abonnierte Kategorien (Array `ReviewCategory[]`) |
| `POST` | `/api/me/categories/subscriptions` | Kategorie abonnieren (Body: `{ category: ReviewCategory }`) |
| `DELETE` | `/api/me/categories/subscriptions/:category` | Kategorie abbestellen |
| `GET` | `/api/me/notifications/prefs` | Bereits vorhanden, liefert nun `categoryNewReviewEmail` mit |
| `PATCH` | `/api/me/notifications/prefs` | Bereits vorhanden, akzeptiert nun `categoryNewReviewEmail` |

### Bestehende Endpoints (Erweiterung)
- Review-Publish-API (interne Server Action): triggert `createCategoryNotifications(reviewId)`

### Request/Response Schemas (Zod)
```typescript
// POST /api/me/categories/subscriptions
const subscribeSchema = z.object({
  category: z.enum(['GAMES', 'HARDWARE', 'MOVIES', 'SERIES']),
});

// Response: { subscribed: true, category: 'GAMES' }

// GET /api/me/categories/subscriptions
// Response: { categories: ['GAMES', 'HARDWARE'] }
```

---

## 8. UI/UX-Ablauf

### `/einstellungen/kategorien` (Server Component + Client Interactions)
```
┌─────────────────────────────────────────────────────┐
│  Kategorie-Abos                                     │
│  ─────────────────────────────────────────────────  │
│  Erhalte Benachrichtigungen, sobald ein neues       │
│  Review in deinen Kategorien erscheint.             │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ 🎮 Games    │  │ 🖥 Hardware │  │ 🎬 Movies   │  │
│  │ [Toggle ON] │  │ [Toggle OFF]│  │ [Toggle OFF]│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                     │
│  ┌─────────────┐                                   │
│  │ 📺 Series   │                                   │
│  │ [Toggle OFF]│                                   │
│  └─────────────┘                                   │
└─────────────────────────────────────────────────────┘
```
- **Loading:** Skeleton pro Karte während Initial-Load
- **Error:** Toast "Fehler beim Speichern. Bitte versuche es erneut."
- **Success:** Toast "Games abonniert" / "Games abbestellt"
- **a11y:** `<fieldset>` + `<legend>`, Toggle als `<button role="switch" aria-checked>`, Fokus-Ring, Screen-Reader-Text

### `/einstellungen/benachrichtigungen` (Erweiterung)
- Neuer Abschnitt "Kategorie-Benachrichtigungen"
- Checkbox: "E-Mail bei neuen Reviews in abonnierten Kategorien"
- Deaktiviert, wenn `emailEnabled = false` oder keine Kategorien abonniert

### Startseite `/` (Client Component `SubscribedCategoryChips`)
- Horizontale Scroll-Liste Chips (max 4, bei 4 alle sichtbar)
- Chip: Kategorie-Icon + Name, Klick → `/suche?category=GAMES`
- Nur sichtbar, wenn ≥ 1 Kategorie abonniert

### Profil `/u/[username]` (Erweiterung)
- Bereich "Interessen" mit Kategorie-Chips (read-only)
- Sichtbar nur wenn User `profilePublic = true` (bestehendes Feld)

---

## 9. Barrierefreiheit (a11y)

- **Semantic HTML:** `<fieldset>`/`<legend>` für Kategorie-Gruppe, `<button role="switch">` für Toggles
- **ARIA:** `aria-checked` auf Toggles, `aria-live="polite"` für Toast-Container
- **Tastatur:** Tab-Navigation, Space/Enter für Toggle, Escape schließt Toasts
- **Fokus:** Sichtbarer Fokus-Ring (`focus-visible:ring-2`)
- **Color Contrast:** Chips/Toggles mind. 4.5:1 (Tailwind `text-primary` / `bg-primary`)
- **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` für Chip-Hover-Animationen
- **Screen Reader:** Kategorie-Name + Status ("Games, abonniert") via `aria-label`

---

## 10. Sicherheit

### Eingabevalidierung
- Zod-Schema auf allen API-Routes (Category Enum Validation)
- `requireTwitchAuth` Guard (Session Validation)
- Owner-Check: `userId` aus Session === `userId` in DB

### Autorisierung
- Keine Admin-Rechte nötig (Self-Service)
- Notification-Erstellung: Server-seitig nur bei `status = PUBLISHED` Reviews

### Datenschutz
- Opt-in Default (keine Kategorie abonniert)
- E-Mail Opt-in Default `false`
- DSGVO: User kann alle Subscriptions löschen (`DELETE /api/me/categories/subscriptions/:category`)
- Keine Tracking-Daten an Dritte

### Rate Limiting
- API: `10 req/min` pro User für Subscribe/Unsubscribe (bestehender Rate-Limiter)
- Notification-Erstellung: Kein Limit (Server-seitig, pro Review einmalig)

---

## 11. Performance-Erwartung

| Metrik | Ziel |
|--------|------|
| API `GET /api/me/categories/subscriptions` | < 50ms (cached 60s via `unstable_cache`) |
| API `POST/DELETE /api/me/categories/subscriptions` | < 100ms (DB Write + Cache Invalidation) |
| Notification-Erstellung pro Review | < 200ms für bis zu 10.000 Subscriber (Batch-Insert) |
| Startseite Chips Render | < 10ms (Client-seitig aus Session/Cache) |
| DB Query: Subscriber für Kategorie | Index Scan auf `CategorySubscription(category)` → < 10ms |

### Caching
- `GET /api/me/categories/subscriptions`: `unstable_cache` 60s, Tag `category-subscriptions-{userId}`
- Invaliderung bei POST/DELETE auf gleichen Tag
- Notification-Prefs: `unstable_cache` 60s, Tag `notification-prefs-{userId}`

---

## 12. Teststrategie

### Unit Tests (`tests/lib/category-subscriptions.test.ts`)
- `getSubscribedCategories(userId)` → liefert korrektes Array
- `toggleSubscription(userId, category)` → Upsert/Delete, Idempotenz
- `getSubscribersForCategory(category)` → liefert UserIds
- `createCategoryNotifications(review)` → erstellt Notifications für alle Subscriber, Deduplizierung via `uniqueKey`

### Integration Tests (`tests/api/me/categories.test.ts`)
- `GET /api/me/categories/subscriptions` → 200, leeres Array initial
- `POST /api/me/categories/subscriptions` → 200, Kategorie in Response
- `POST` doppelt → 200, idempotent (kein Fehler)
- `DELETE /api/me/categories/subscriptions/GAMES` → 200, Kategorie entfernt
- Unauthenticated → 401
- Invalid Category → 400

### Integration Tests (`tests/api/reviews/publish-notifications.test.ts`)
- Review Publish triggert Notification-Erstellung für Subscriber
- Notification enthält korrekte Payload (reviewId, title, category, slug)
- Keine Notification für User ohne Subscription
- Keine Duplicate-Notifications (uniqueKey)

### E2E Tests (Playwright, `tests/e2e/category-subscriptions.spec.ts`)
- User loggt ein, besucht `/einstellungen/kategorien`
- Toggle "Games" → Toast erscheint, Chip auf Startseite sichtbar
- Neuer Review in "Games" veröffentlicht (Admin) → Notification erscheint in Glocke
- Klick Notification → landet auf Review-Detailseite
- E-Mail-Pref in `/einstellungen/benachrichtigungen` toggelbar

---

## 13. Rollout-Plan & Feature-Flag

| Phase | Beschreibung | Flag |
|-------|--------------|------|
| **1. Dev/Staging** | Vollständige Implementierung, Tests grün | `FEATURE_CATEGORY_SUBSCRIPTIONS=true` |
| **2. Canary (5% User)** | Flag auf `true` für 5% (Middleware/Random) | `FEATURE_CATEGORY_SUBSCRIPTIONS=canary` |
| **3. Full Rollout** | Flag auf `true` für alle | `FEATURE_CATEGORY_SUBSCRIPTIONS=true` |
| **Rollback** | Flag auf `false` → UI ausgeblendet, APIs geben 404, DB bleibt unangetastet | `FEATURE_CATEGORY_SUBSCRIPTIONS=false` |

**Flag-Implementierung:**
```typescript
// lib/feature-flags.ts
export const FEATURE_CATEGORY_SUBSCRIPTIONS = process.env.FEATURE_CATEGORY_SUBSCRIPTIONS === 'true';
```

---

## 14. Review-Checkliste (F6 - Self-Review)

*Wird nach Implementierung ausgefüllt.*

| Kriterium | Status | Bemerkung |
|-----------|--------|-----------|
| Alle Akzeptanzkriterien erfüllt & getestet | ⬜ | |
| Randfälle & Fehlerpfade behandelt | ⬜ | |
| Eingaben validiert, Autorisierung geprüft | ⬜ | |
| Keine Performance-Fallen (N+1, Indizes) | ⬜ | |
| Migration reversibel, Daten intakt | ⬜ | |
| Abwärtskompatibilität gewahrt | ⬜ | |
| Code-Stil & Architektur konsistent | ⬜ | |
| UI: Alle Zustände, a11y beachtet | ⬜ | |

---

## 15. Offene Fragen / Entscheidungen

| Frage | Entscheidung | Begründung |
|-------|--------------|------------|
| Wie werden Kategorien definiert? | Festes Enum `ReviewCategory` (4 Werte) | Einfach, stabil, passt zu bestehendem `Review.category` Feld |
| Notification-Deduplizierung Key-Format? | `category-review-{reviewId}-{userId}` | Eindeutig, suchbar, kompakt |
| Batch-Insert für Notifications? | Ja, `prisma.notification.createMany({ skipDuplicates: true })` | Performant, nutzt Unique Constraint |
| Cron vs Event-Driven für Notification? | Event-Driven bei Publish (Server Action) | Echtzeit, keine Cron-Latenz, einfacher |
| E-Mail-Versand synchron oder Queue? | Queue (später), MVP: nur Pref speichern | Nicht blockierend, Skalierbarkeit |

---

## 16. Nächste Schritte (F3 - Design & Plan)

1. **PKG-1:** DB Migration & Prisma Schema (`CategorySubscription`, `Notification.uniqueKey`, `NotificationPrefs.categoryNewReviewEmail`, `NotificationType.CATEGORY_NEW_REVIEW`)
2. **PKG-2:** Types & Zod Schemas (`category-subscriptions.ts`, `category-subscription-schema.ts`)
3. **PKG-3:** Server Logic (`lib/category-subscriptions.ts`: `getSubscriptions`, `toggleSubscription`, `getSubscribersForCategory`, `createCategoryNotifications`)
4. **PKG-4:** API Routes (`/api/me/categories/subscriptions` GET/POST/DELETE)
5. **PKG-5:** Notification Prefs API Erweiterung (`/api/me/notifications/prefs` PATCH)
6. **PKG-6:** Review Publish Hook (Notification Trigger in `lib/reviews.ts` / Server Action)
7. **PKG-7:** Client Hook & Types (`hooks/useCategorySubscriptions.ts`)
8. **PKG-8:** UI Components (`CategorySubscriptionCard.tsx`, `SubscribedCategoryChips.tsx`)
9. **PKG-9:** Settings Pages (`/einstellungen/kategorien/page.tsx`, Erweiterung `/einstellungen/benachrichtigungen`)
10. **PKG-10:** Startseite & Profil Integration (Chips)
11. **PKG-11:** Tests (Unit, Integration, E2E)
12. **PKG-12:** Doku & Flag (CHANGELOG, README, .env.example, PROGRESS.md, ROADMAP.md)

**Geschätzter Aufwand:** ~5-6h