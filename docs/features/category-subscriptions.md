# Feature Spec: Kategorie-Abos (Category Subscriptions)

## Problem und Nutzen
**Warum?** Nutzer wollen automatisch benachrichtigt werden, wenn neue Reviews in ihren Interessensbereichen (Games, Hardware, Movies, Series) erscheinen. Erhöht Retention, bringt Traffic zurück auf die Seite, nutzt bestehende Notification-Infrastruktur.

**Für wen?** Alle registrierten Nutzer (TwitchUser), die Benachrichtigungen für bestimmte Kategorien aktivieren möchten.

## User Stories & Akzeptanzkriterien

### US1: Kategorie abonnieren/abbestellen
- **Als** eingeloggter Nutzer
- **Will ich** Kategorien (Games, Hardware, Movies, Series) abonnieren/abbestellen
- **Damit** ich über neue Reviews in diesen Kategorien informiert werde

**Akzeptanzkriterien:**
- [ ] Seite `/einstellungen/kategorien` zeigt 4 Kategorien mit Toggle-Switches
- [ ] Klick auf Toggle abonniert/abbestellt sofort (optimistic UI)
- [ ] Toast bestätigt Aktion ("Games abonniert" / "Games abbestellt")
- [ ] Bei Fehler Rollback + Fehler-Toast
- [ ] Feature-Flag `FEATURE_CATEGORY_SUBSCRIPTIONS` schaltet Feature komplett ab (404)

### US2: Abonnierte Kategorien auf Startseite anzeigen
- **Als** eingeloggter Nutzer mit aktiven Abos
- **Will ich** meine abonnierten Kategorien als Chips auf der Startseite sehen
- **Damit** ich schnell zu neuen Reviews in diesen Kategorien springen kann

**Akzeptanzkriterien:**
- [ ] Chips erscheinen nur bei eingeloggten Nutzern mit Abos
- [ ] Klick auf Chip führt zu `/suche?category=GAMES` (entsprechend)
- [ ] Chips nutzen Prisma Enum-Werte (GAMES, HARDWARE, MOVIES, SERIES)

### US3: Abonnierte Kategorien auf öffentlichem Profil
- **Als** Besucher eines öffentlichen Profils
- **Will ich** sehen, welche Kategorien der Nutzer abonniert hat
- **Damit** ich seine Interessen verstehe

**Akzeptanzkriterien:**
- [ ] Nur bei öffentlichen Profilen (`userProfile.isPublic = true`)
- [ ] Chips wie auf Startseite, verlinkt auf Suche

### US4: Push-Benachrichtigung bei neuem Review
- **Als** Nutzer mit Kategorie-Abo
- **Will ich** eine In-App-Benachrichtigung erhalten, wenn ein neues Review in meiner Kategorie veröffentlicht wird
- **Damit** ich es sofort lesen kann

**Akzeptanzkriterien:**
- [ ] Bei Veröffentlichung eines Reviews (`status: draft → published`) werden Notifications erstellt
- [ ] Notification Type: `category_new_review`
- [ ] Titel: "Neuer Review in {CategoryLabel}"
- [ ] Link: `/reviews/{slug}`
- [ ] Dedupe via `uniqueKey: category-review-{reviewId}-{userId}`
- [ ] Nur Nutzer mit `NotificationPreference` (on-site) erhalten Notification

### US5: E-Mail-Benachrichtigung (Opt-in)
- **Als** Nutzer mit Kategorie-Abo
- **Will ich** optional E-Mails bei neuen Reviews erhalten
- **Damit** ich auch außerhalb der App informiert bin

**Akzeptanzkriterien:**
- [ ] Toggle in Einstellungen: "E-Mail bei neuen Kategorie-Reviews"
- [ ] Default: aus (Opt-in)
- [ ] Cron-Job prüft stündlich neue Reviews und sendet E-Mails an Nutzer mit aktiviertem Toggle
- [ ] Respektiert `NotificationPreference.categoryNewReviewEmail`

## Scope
**In Scope:**
- 4 Kategorien: Games, Hardware, Movies, Series
- In-App Notifications bei neuer Veröffentlichung
- UI in `/einstellungen/kategorien`, Startseite, öffentliches Profil
- Feature-Flag für schnelles Deaktivieren
- E-Mail Opt-in (später via Cron)

**Out of Scope:**
- Sub-Kategorien (z.B. "Indie Games", "GPUs")
- Frequenz-Einstellungen (sofort/täglich/wöchentlich) – initial nur sofort
- Rich Push Notifications (Web Push) – nur In-App
- Admin-Interface für Kategorie-Management

## Randfälle & Fehlerfälle
- Nutzer abonniert Kategorie, die keine Reviews hat → leere Notification-Liste, kein Fehler
- Review hat Kategorie "amazon" → Mapping zu HARDWARE (amazon = Hardware-Produkte)
- Review-Kategorie ändert sich nach Veröffentlichung → Notification bereits gesendet, keine Nachbearbeitung
- Nutzer deaktiviert Profil-Öffentlichkeit → Chips verschwinden auf öffentlichem Profil
- Feature-Flag aus → alle API-Routen geben 404, UI-Komponenten rendern nichts

## Datenmodell & Migration

### Prisma Schema (bereits vorhanden)
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
  @@map("category_subscriptions")
}

model NotificationPreference {
  // ... existing fields
  categoryNewReviewEmail Boolean    @default(false) @map("category_new_review_email")
}
```

### Migration
- Reversible Migration `20261024xxxxxx_add_category_subscriptions`
- Erstellt Enum `ReviewCategory` und Tabelle `category_subscriptions`
- Down-Migration dropt Tabelle und Enum

### Mapping Review.category → ReviewCategory
Review.category (String): `"game" | "hardware" | "amazon" | "movie" | "series"`
ReviewCategory (Enum): `GAMES | HARDWARE | MOVIES | SERIES`

Mapping:
- `"game"` → `GAMES`
- `"hardware"` → `HARDWARE`
- `"amazon"` → `HARDWARE` (Amazon-Produkte = Hardware)
- `"movie"` → `MOVIES`
- `"series"` → `SERIES`

## API-Änderungen

### Bestehende Routes (bereits implementiert)
- `GET /api/me/categories/subscriptions` → Liste abonnierter Kategorien
- `POST /api/me/categories/subscriptions` → Kategorie abonnieren `{ category: ReviewCategory }`
- `DELETE /api/me/categories/subscriptions/:category` → Kategorie abbestellen

### Neue Routes (für E-Mail-Cron)
- `POST /api/admin/category-notifications/trigger` → Manuell triggern (Admin)
- `GET /api/admin/category-notifications/status` → Status der letzten Runs

## UI/UX Ablauf

### `/einstellungen/kategorien`
- Server Component prüft Feature-Flag + Auth
- Client Component `CategorySubscriptionsClient` lädt initiale Daten (Skeleton währenddessen)
- 4 Cards in Grid (sm:2, lg:4), jede mit Icon, Label, Beschreibung, Switch
- Switch: `aria-checked`, `aria-label`, `disabled` während Loading

### Startseite Chips
- `HomeSubscribedCategoryChips` Wrapper prüft Feature-Flag
- `SubscribedCategoryChips` nutzt `useCategorySubscriptions` Hook
- Badge-Links zu `/suche?category={ENUM}`

### Öffentliches Profil
- Server Component lädt `getSubscribedCategories` wenn `isPublic`
- Übergeben an `PublicProfile` Client Component
- Render als Badge-Links wie auf Startseite

## Sicherheit
- Alle API-Routen: `requireTwitchAuth` (nur eingeloggte Nutzer)
- User kann nur eigene Subscriptions lesen/schreiben
- `uniqueKey` in Notification verhindert Duplikate
- Keine PII in Logs
- Rate-Limit nicht nötig (max 4 Subscriptions pro User)

## Performance
- `unstable_cache` 60s für `getSubscribedCategories` und `getSubscribersForCategory`
- Tags: `category-subscriptions`, `category-subscribers`
- Invaliderung bei Mutation via `invalidateCategorySubscriptionCache(userId)`
- Notification-Erstellung: Batch-Insert mit `skipDuplicates`

## Teststrategie
- **Unit Tests** (`tests/lib/category-subscriptions.test.ts`): 8 Tests für alle lib-Funktionen
- **Integration Tests** (`tests/integration/category-subscriptions/api.test.ts`): 9 Tests für alle API-Routen (Auth, Feature-Flag, CRUD)
- **E2E Tests** (`tests/e2e/category-subscriptions.spec.ts`): 6 Tests für User-Flows (Sub/Unsub, Home-Chips, Profil-Chips, Email-Toggle)
- Alle Tests müssen grün sein vor Merge

## Rollout-Plan
1. Migration auf Staging anwenden, Tests laufen lassen
2. Feature-Flag `FEATURE_CATEGORY_SUBSCRIPTIONS=true` auf Staging
3. Manuelle Prüfung aller User Stories
4. Feature-Flag auf Production setzen
5. Cron-Job für E-Mails einrichten (separater Task)

## Review-Checkliste (F6)
- [ ] Alle AK getestet & erfüllt
- [ ] Randfälle behandelt (amazon-Mapping, Feature-Flag, leere Zustände)
- [ ] Eingaben validiert (Zod), Auth geprüft, keine Secrets
- [ ] Keine N+1-Abfragen (Batch-Insert, cached Reads)
- [ ] Migration reversibel, bestehende Daten intakt
- [ ] Abwärtskompatibilität gewahrt (neue Tabelle, keine Breaking Changes)
- [ ] Code-Stil konsistent, keine toten Codeteile
- [ ] UI: alle Zustände (Loading, Error, Empty, Success), a11y (ARIA, Fokus)