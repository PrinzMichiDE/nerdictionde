# Design & Plan: Erweiterte Benachrichtigungs-Präferenzen

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client (React)                             │
│  /einstellungen/benachrichtigungen (Tabs + Forms)               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Typen&Kanäle│ │  Frequenz   │ │ Stummschalt.│               │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘               │
└─────────┼───────────────┼───────────────┼──────────────────────┘
          │               │               │
          ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                         │
│  /api/user/notification-preferences  (GET, PATCH)               │
│  /api/user/notification-preferences/test (POST)                 │
│  /api/user/notification-mutes        (GET, POST, DELETE)        │
│  /api/user/push-subscription         (GET, POST, DELETE)        │
│  /api/cron/notification-digest       (POST)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server Logic (lib/)                          │
│  lib/notification-preferences.ts  (Core Logic)                  │
│  lib/notification-mutes.ts        (Mute Logic)                  │
│  lib/push-notifications.ts        (Web Push VAPID)              │
│  lib/notification-digest.ts       (Digest Aggregation)          │
│  lib/notification-helpers.ts      (Erweitert: shouldNotify)     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database (Prisma/PostgreSQL)               │
│  NotificationPreference  |  NotificationMute  |  PushSubscription│
└─────────────────────────────────────────────────────────────────┘
```

## 2. Bestehende Patterns Wiederverwenden

| Pattern | Quelle | Wiederverwendung |
|---------|--------|------------------|
| `unstable_cache` + Tag-Invaliderung | `lib/feed.ts`, `lib/review-reactions.ts` | Preferences & Mutes Caching |
| Zod-Schemas + `validateRequest` | `lib/*-schema.ts` | Alle API Input-Validierung |
| `requireAuth` / `getServerSession` | `lib/auth.ts` | Autorisierung in allen Routes |
| Notification Helper Functions | `lib/notification-helpers.ts` | Extension: `shouldNotify()` Filter |
| Batch-Insert Notifications | `lib/notification-helpers.ts` | Digest Batch-Insert |
| Feature-Flag Guard | `lib/feature-flags.ts` | Alle neuen Features hinter Flags |
| Optimistic UI + Toast | `hooks/use*.ts` | Settings Forms, Mute Buttons |

## 3. Arbeitspakete (PKG-1 bis PKG-10)

### PKG-1: DB Migration & Prisma Models ✅ (Schätzung: 30 min)
- Prisma Schema: `NotificationPreference`, `NotificationMute`, `PushSubscription`, Enums
- Migration via `prisma db push` (Shadow-DB Probleme umgehen)
- Default-Preferences Seed für Bestandsnutzer
- Feature-Flags in `lib/feature-flags.ts` + `.env.example`

### PKG-2: Types & Zod-Schemas ✅ (Schätzung: 45 min)
- `src/lib/notification-preferences-schema.ts`
  - `NotificationType` Enum (aus bestehendem `NotificationType` ableiten)
  - `NotificationChannel`, `NotificationFrequency`, `MuteTargetType` Enums
  - Schemas: `preferenceUpdateSchema`, `muteCreateSchema`, `pushSubscriptionSchema`, `testNotificationSchema`
  - Response Types: `UserPreferences`, `UserMutes`, `PushSubscriptionData`
- Unit-Tests: `tests/lib/notification-preferences-schema.test.ts`

### PKG-3: Server Core Logic ✅ (Schätzung: 1.5h)
- `src/lib/notification-preferences.ts`
  - `getUserPreferences(userId)` — cached, grouped by type
  - `updateUserPreferences(userId, updates[])` — bulk upsert, cache invalidation
  - `getDefaultPreferences()` — Default-Matrix (In-App: IMMEDIATE/true, Email: IMMEDIATE/false, Push: IMMEDIATE/false)
  - `shouldNotify(userId, type, channel)` — prüft Preference + Mute
  - `shouldIncludeInDigest(userId, type, channel)` — prüft Frequency
- `src/lib/notification-mutes.ts`
  - `getUserMutes(userId)` — cached
  - `muteTarget(userId, targetType, targetId)` — upsert
  - `unmuteTarget(userId, muteId)` — delete
  - `isMuted(userId, targetType, targetId)` — boolean check
- `src/lib/push-notifications.ts`
  - `getVapidKeys()` — aus Env
  - `sendPushNotification(subscription, payload)` — web-push Library
  - `generateVapidKeys()` — Helper für Setup
- Unit-Tests: `tests/lib/notification-preferences.test.ts`, `tests/lib/notification-mutes.test.ts`

### PKG-4: API Routes — Preferences & Test ✅ (Schätzung: 1h)
- `src/app/api/user/notification-preferences/route.ts` — GET, PATCH
- `src/app/api/user/notification-preferences/test/route.ts` — POST
- Feature-Flag Guards
- Rate-Limit (Test: 5/min, Update: 30/min)
- Integration-Tests: `tests/api/notification-preferences.test.ts`

### PKG-5: API Routes — Mutes & Push ✅ (Schätzung: 45 min)
- `src/app/api/user/notification-mutes/route.ts` — GET, POST
- `src/app/api/user/notification-mutes/[id]/route.ts` — DELETE
- `src/app/api/user/push-subscription/route.ts` — GET, POST, DELETE
- VAPID Public Key Exposure via GET `/api/user/push-subscription` (nur Public Key)
- Integration-Tests: `tests/api/notification-mutes.test.ts`, `tests/api/push-subscription.test.ts`

### PKG-6: Digest Logic & Cron ✅ (Schätzung: 1h)
- `src/lib/notification-digest.ts`
  - `buildDailyDigest(userId)` — sammelt alle IMMEDIATE/DAILY Notifications seit letztem Digest
  - `buildWeeklyDigest(userId)` — sammelt seit letztem Weekly
  - `sendDigestEmail(userId, notifications[])` — Nodemailer Template
  - `sendDigestPush(userId, notifications[])` — web-push Batch
- `src/app/api/cron/notification-digest/route.ts` — POST, CRON_SECRET Auth
  - Query: `?frequency=daily|weekly`
  - Batch-Processing (1000 Nutzer pro Batch)
  - Logging & Metriken
- Vercel Cron Config: `vercel.json` — Daily 08:00, Weekly Mon 08:00

### PKG-7: Integration in bestehende Notification-Erstellung ✅ (Schätzung: 45 min)
- `src/lib/notification-helpers.ts` erweitern:
  - `shouldNotifyUser(userId, type, channel)` — nutzt Preferences + Mutes
  - `createNotification` / `createBatchNotifications` — filtern vor Insert
  - Channel-spezifische Erstellung: In-App (DB), Email (Queue), Push (Queue)
- Bestehende Helper (`createReviewCommentNotification`, `createQAAnswerNotification`, etc.) bleiben unverändert, nutzen nur neuen Filter

### PKG-8: Client Hooks & Types ✅ (Schätzung: 45 min)
- `src/hooks/useNotificationPreferences.ts`
  - `usePreferences()` — SWR/Cache für GET
  - `useUpdatePreferences()` — Mutate + Optimistic Update
  - `useTestNotification()` — POST Test
- `src/hooks/useNotificationMutes.ts`
  - `useMutes()` — SWR
  - `useMuteTarget()` / `useUnmuteTarget()` — Mutations
- `src/hooks/usePushSubscription.ts`
  - `usePushSubscription()` — SWR
  - `useSubscribePush()` / `useUnsubscribePush()` — Mutations + Browser Permission Handling

### PKG-9: UI Components & Settings Page ✅ (Schätzung: 2h)
- `src/components/settings/NotificationPreferencesTabs.tsx` — Tab-Navigation
- `src/components/settings/NotificationTypeChannelMatrix.tsx` — Checkbox-Matrix (Tab 1)
- `src/components/settings/NotificationFrequencyCards.tsx` — Radio-Karten (Tab 2)
- `src/components/settings/NotificationMutesList.tsx` — Liste mit Entstummen (Tab 3)
- `src/components/settings/PushSubscriptionManager.tsx` — Push aktivieren/deaktivieren + VAPID Key Anzeige
- `src/app/einstellungen/benachrichtigungen/page.tsx` — Server Page (lädt Initial Data)
- `src/app/einstellungen/benachrichtigungen/NotificationSettingsClient.tsx` — Client Component
- Mute-Button Integration: `src/components/reviews/ReviewActions.tsx` (neuer "Stummschalten" Button), `src/components/series/SeriesDetail.tsx`, `src/components/collections/CollectionDetail.tsx`, `src/components/profiles/PublicProfile.tsx`

### PKG-10: Tests, Doku & Verify ✅ (Schätzung: 1h)
- E2E Tests: `tests/enhanced-notification-preferences.e2e.ts`
- Doku: CHANGELOG.md, README.md, ROADMAP.md, .env.example, PROGRESS.md
- `npm run verify` (Build, Type-Check, Lint, Tests)
- Self-Review Checkliste (F6) abarbeiten

---

## 4. Datenfluss-Details

### Preference Check Flow
```
Notification Event (z.B. neuer Kommentar)
         │
         ▼
createNotification(userId, type, ...)
         │
         ▼
shouldNotifyUser(userId, type, IN_APP) ──→ true? ──→ DB Insert (In-App)
         │
         ├─ shouldNotifyUser(userId, type, EMAIL) ──→ true? ──→ Email Queue
         │
         └─ shouldNotifyUser(userId, type, PUSH) ──→ true? ──→ Push Queue
```

### `shouldNotifyUser` Logic
```typescript
async function shouldNotifyUser(userId: string, type: NotificationType, channel: NotificationChannel): Promise<boolean> {
  // 1. Mute Check (schnell, cached)
  if (await isMutedForType(userId, type)) return false;
  
  // 2. Preference Check (cached)
  const prefs = await getUserPreferences(userId);
  const pref = prefs.find(p => p.type === type && p.channel === channel);
  if (!pref || !pref.enabled) return false;
  
  // 3. Frequency Check (nur für Digest-Relevanz, nicht für In-App)
  if (channel !== 'IN_APP' && pref.frequency !== 'IMMEDIATE') {
    // Wird in Digest aufgenommen, nicht sofort gesendet
    return false; 
  }
  
  return true;
}
```

### Digest Flow (Daily 08:00 Cron)
```
Cron Trigger (/api/cron/notification-digest?frequency=daily)
         │
         ▼
Alle User mit DAILY/Weekly Preferences laden (Batch)
         │
         ▼
Für jeden User: buildDailyDigest(userId)
         │
         ▼
Notifications seit letztem Digest sammeln (WHERE createdAt > lastDigestAt)
         │
         ▼
Group by Type, Template rendern
         │
         ▼
sendDigestEmail + sendDigestPush (fire-and-forget)
         │
         ▼
lastDigestAt aktualisieren
```

---

## 5. Cache-Strategie

| Daten | TTL | Tags | Invaliderung |
|-------|-----|------|--------------|
| User Preferences | 60s | `notif-prefs:{userId}` | PATCH /api/user/notification-preferences |
| User Mutes | 60s | `notif-mutes:{userId}` | POST/DELETE /api/user/notification-mutes |
| Push Subscription | 60s | `push-sub:{userId}` | POST/DELETE /api/user/push-subscription |
| VAPID Public Key | 1h | `vapid-public` | Nie (statisch) |

---

## 6. Abhängigkeiten & Risiken

### Neue Dependencies
- `web-push` — Web Push Protocol (VAPID) — **bereits in package.json?** Prüfen
- `nodemailer` — E-Mail Versand — **bereits vorhanden?** Prüfen

### Risiken
| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| VAPID Keys fehlen in Prod | Mittel | Push funktioniert nicht | Flag `FEATURE_PUSH_NOTIFICATIONS` default `false`, Setup-Doku |
| Cron-Job läuft nicht | Niedrig | Keine Digests | Vercel Cron Monitoring + Alerting |
| Performance bei vielen Nutzern | Mittel | Digest dauert zu lange | Batch-Size 1000, Parallelisierung, Index auf `userId` + `createdAt` |
| Browser Push Permission verweigert | Hoch | Push nicht nutzbar | Graceful Degradation, UI zeigt Status "Blockiert" |
| Migration schlägt fehl | Niedrig | Datenverlust | Backup vor Migration, reversible Migration, Test auf Staging |

---

## 7. Schätzung & Meilensteine

| Paket | Aufwand | Kumulativ |
|-------|---------|-----------|
| PKG-1: DB & Models | 0.5h | 0.5h |
| PKG-2: Types & Schemas | 0.75h | 1.25h |
| PKG-3: Server Logic | 1.5h | 2.75h |
| PKG-4: API Preferences | 1h | 3.75h |
| PKG-5: API Mutes & Push | 0.75h | 4.5h |
| PKG-6: Digest & Cron | 1h | 5.5h |
| PKG-7: Integration | 0.75h | 6.25h |
| PKG-8: Client Hooks | 0.75h | 7h |
| PKG-9: UI & Settings Page | 2h | 9h |
| PKG-10: Tests, Doku, Verify | 1h | 10h |
| **Total** | | **~10h** |

---

## 8. Nächste Schritte

1. **PKG-1 starten:** Prisma Schema erweitern, `prisma db push`, Feature-Flags setzen
2. **PKG-2:** Zod-Schemas + Tests schreiben
3. **PKG-3:** Core Logic implementieren + Unit-Tests
4. **PKG-4/5:** API Routes + Integration-Tests
5. **PKG-6:** Digest Logic + Cron Endpoint
6. **PKG-7:** Bestehende Notification-Helpers anpassen
7. **PKG-8:** Client Hooks
8. **PKG-9:** UI Komponenten + Settings Page
9. **PKG-10:** E2E Tests, Doku, Verify, Push