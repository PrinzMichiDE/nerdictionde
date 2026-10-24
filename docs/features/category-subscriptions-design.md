# Design & Plan: Kategorie-Abos (Category Subscriptions)

## Architektur-Übersicht

Das Feature nutzt bestehende Infrastruktur:
- **Auth**: `requireTwitchAuth` (Twitch OAuth)
- **Notifications**: `Notification` Model + `NotificationType.category_new_review`
- **Preferences**: `NotificationPreference.categoryNewReviewEmail`
- **Caching**: `unstable_cache` mit Tags (`category-subscriptions`, `category-subscribers`)
- **Feature-Flag**: `FEATURE_CATEGORY_SUBSCRIPTIONS`

Neu: `CategorySubscription` Model + `ReviewCategory` Enum

## Datenfluss

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Admin     │────▶│  PUT /api/reviews│────▶│ createCategoryNotif │
│  veröffentlicht│     │  [id] (published)│     │  (fire-and-forget)  │
└─────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                         │
                    ┌────────────────────────────────────┼────────────────────┐
                    ▼                                    ▼                    ▼
            ┌───────────────┐                  ┌─────────────────┐    ┌──────────────┐
            │ getSubscribers│                  │ filter by       │    │ createMany   │
            │ ForCategory   │                  │ NotificationPref│    │ Notifications│
            │ (cached 60s)  │                  │ (on-site only)  │    │ (batch)      │
            └───────────────┘                  └─────────────────┘    └──────────────┘
```

## Bestehende Wiederverwendung

| Komponente | Wiederverwendet? | Anpassung |
|------------|------------------|-----------|
| `Notification` Model | Ja | Neuer Type `category_new_review` |
| `NotificationPreference` | Ja | Feld `categoryNewReviewEmail` existiert |
| `requireTwitchAuth` | Ja | Keine |
| `unstable_cache` Pattern | Ja | Neue Tags |
| `useCategorySubscriptions` Hook | Ja | Neu, aber Pattern wie `useFollow` |
| Toast (`sonner`) | Ja | Keine |
| Switch Component | Ja | Keine |

## Arbeitspakete (logische Reihenfolge)

### PKG-1: Migration & Prisma Schema ✅ (Schema bereits vorhanden)
- [ ] Migration `20261024xxxxxx_add_category_subscriptions` erstellen
- [ ] `ReviewCategory` Enum + `CategorySubscription` Tabelle
- [ ] `prisma migrate dev` ausführen, `prisma generate`
- [ ] Verifizieren: `prisma db pull` zeigt neue Tabelle

### PKG-2: Category Mapping Utility
- [ ] `src/lib/category-mapping.ts` erstellen
- [ ] `mapReviewCategoryToEnum(category: string): ReviewCategory | null`
- [ ] `mapEnumToReviewCategory(enum: ReviewCategory): string`
- [ ] Tests für Mapping (inkl. "amazon" → HARDWARE)

### PKG-3: Lib Fixes (Mapping Integration)
- [ ] `src/lib/category-subscriptions.ts`: `createCategoryNotifications` nutzt Mapping
- [ ] `src/app/api/reviews/[id]/route.ts`: Mapping statt `as any` Cast
- [ ] Type-Safety: `ReviewCategory` Import aus `@prisma/client`

### PKG-4: API Routes Verifikation (bereits implementiert)
- [ ] `GET /api/me/categories/subscriptions` ✅
- [ ] `POST /api/me/categories/subscriptions` ✅
- [ ] `DELETE /api/me/categories/subscriptions/[category]` ✅
- [ ] Zod-Schemas ✅
- [ ] Feature-Flag Check ✅

### PKG-5: UI Components Verifikation (bereits implementiert)
- [ ] `CategorySubscriptionCard` ✅
- [ ] `CategorySubscriptionsClient` ✅
- [ ] Page `/einstellungen/kategorien` ✅
- [ ] `HomeSubscribedCategoryChips` + `SubscribedCategoryChips` ✅
- [ ] `PublicProfile` Integration ✅

### PKG-6: Hook Verifikation (bereits implementiert)
- [ ] `useCategorySubscriptions` ✅ (optimistic UI, Rollback, Toast)

### PKG-7: E-Mail Cron Job (Neu)
- [ ] `scripts/send-category-notification-emails.ts` erstellen
- [ ] Query: Reviews der letzten Stunde mit `status=published`
- [ ] Für jede Category: Subscribers mit `categoryNewReviewEmail=true` holen
- [ ] E-Mail versenden (nodemailer/Resend) mit Unsubscribe-Link
- [ ] Logging + Error-Handling
- [ ] Cron-Entry in `package.json` oder externer Scheduler

### PKG-8: Tests Ausführen & Fixes
- [ ] `npm test` → alle Unit/Integration Tests grün
- [ ] `npm run test:e2e` → E2E Tests grün (falls Playwright konfiguriert)
- [ ] Falls fehlende Mocks/Setup: nachrüsten

### PKG-9: Self-Review (F6)
- [ ] Diff prüfen gegen Checkliste in Spec
- [ ] Alle Befunde beheben

### PKG-10: Verifikation & Docs (F7-F9)
- [ ] `npm run verify` (Build, Typecheck, Lint, Tests)
- [ ] CHANGELOG.md, README.md, ROADMAP.md aktualisieren
- [ ] `.env.example` um `FEATURE_CATEGORY_SUBSCRIPTIONS` ergänzen
- [ ] PROGRESS.md aktualisieren
- [ ] Commit + Push

## Abhängigkeiten

```
PKG-1 (Migration) 
    → PKG-2 (Mapping) 
        → PKG-3 (Lib Fixes) 
            → PKG-8 (Tests)
                → PKG-9 (Review)
                    → PKG-10 (Verify/Docs)
```

PKG-4, PKG-5, PKG-6 sind unabhängig und bereits implementiert.

## Cache-Strategie

| Funktion | Cache-Key | TTL | Tags | Invaliderung |
|----------|-----------|-----|------|--------------|
| `getSubscribedCategories(userId)` | `category-subscriptions:${userId}` | 60s | `category-subscriptions` | `invalidateCategorySubscriptionCache(userId)` |
| `getSubscribersForCategory(category)` | `category-subscribers:${category}` | 60s | `category-subscribers` | `invalidateCategorySubscriptionCache(userId)` |

## a11y-Checkliste
- [ ] Switch: `role="switch"`, `aria-checked`, `aria-label`
- [ ] Cards: `aria-live="polite"` für Skeleton
- [ ] Chips: `aria-label="Abonnierte Kategorien"` auf nav
- [ ] Focus-Visible auf allen interaktiven Elementen
- [ ] Reduced Motion: keine Animationen bei Switch-Toggle
- [ ] Farbkontrast: Badge `variant="outline"` auf Profil/Startseite

## Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Migration schlägt fehl (Enum-Kollision) | Niedrig | Hoch | `prisma migrate dev` auf Staging first, Down-Script testen |
| "amazon" Reviews bekommen keine Notifications | Mittel | Mittel | Mapping zu HARDWARE, Log für unbekannte Kategorien |
| E-Mail-Cron nicht zuverlässig | Mittel | Niedrig | Initial nur In-App, E-Mail als Follow-up |
| Cache-Stale bei hoher Last | Niedrig | Niedrig | TTL 60s, Tag-Invaliderung bei Mutation |
| Feature-Flag vergessen in neuem Code | Niedrig | Mittel | ESLint-Regel oder Code-Review-Checkliste |

## Geschätzter Aufwand
- PKG-1: 15 min (Migration erstellen & anwenden)
- PKG-2: 20 min (Mapping Utility + Tests)
- PKG-3: 15 min (Lib Fixes)
- PKG-7: 45 min (Cron Job + E-Mail Template)
- PKG-8: 30 min (Tests laufen, Fixes)
- PKG-9: 15 min (Review)
- PKG-10: 15 min (Verify, Docs)
- **Gesamt: ~2.5h**

## Nächste Schritte
1. PKG-1: Migration erstellen (`prisma migrate dev --name add_category_subscriptions`)
2. PKG-2: Mapping Utility
3. PKG-3: Lib Fixes
4. PKG-7: Cron Job (optional, kann später folgen)
5. PKG-8-10: Tests, Review, Verify, Docs