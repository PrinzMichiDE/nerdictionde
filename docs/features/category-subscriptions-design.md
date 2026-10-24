# Design & Plan: Kategorie-Abos / Category Subscriptions

**Datum:** 2026-10-24  
**Status:** In Arbeit (F3)  
**Basiert auf:** `docs/features/category-subscriptions.md` (F2 Spec)  
**Geschätzter Gesamtaufwand:** ~5-6h

---

## 1. Architektonische Einordnung

### Bestehende Patterns wiederverwenden
| Pattern | Datei/Modul | Wiederverwendung für Category Subscriptions |
|---------|-------------|---------------------------------------------|
| **Follow-System** | `lib/follow.ts`, `hooks/useFollow.ts` | `CategorySubscription` ≙ `Follow` (User ↔ Category statt User ↔ User) |
| **Notifications** | `lib/notifications.ts`, `NotificationType` Enum | Neuer Type `CATEGORY_NEW_REVIEW`, Payload-Extension |
| **NotificationPrefs** | `lib/notification-prefs.ts`, `NotificationPrefs` Model | Neues Feld `categoryNewReviewEmail` |
| **Review Publish** | `lib/reviews.ts` (Server Action `publishReview`) | Side-Effect Hook für Notification-Trigger |
| **Settings Pages** | `/einstellungen/*` (Server Components + Client) | Neue Page `/einstellungen/kategorien`, Erweiterung `/einstellungen/benachrichtigungen` |
| **Cache Strategy** | `unstable_cache` mit Tag-Invaliderung (30s/60s TTLs) | Identisch: 60s Cache, Tag `category-subscriptions-{userId}` |
| **Optimistic UI** | `useCollectionFollow`, `useReviewReactions` | `useCategorySubscriptions` mit sofortigem Toggle + Rollback |

### Keine neuen Dependencies
- Alle Patterns nutzen bestehende: Prisma, Zod, Next.js Server Actions, React Hooks, Sonner (Toasts), shadcn/ui (Toggle, Card, Badge)

---

## 2. Datenfluss

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Review Publish │────▶│ createCategory   │────▶│ Notification Insert│
│  (Server Action)│     │ Notifications()  │     │ (Batch, uniqueKey) │
└─────────────────┘     └──────────────────┘     └────────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌──────────────────┐     ┌────────────────────┐
                       │ Get Subscribers  │     │ NotificationBell   │
                       │ (CategorySubscr) │     │ (Client, SSE/Poll) │
                       └──────────────────┘     └────────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Cache Invalidate │
                       │ (category-subscr-│
                       │  iptions-{userId})│
                       └──────────────────┘
```

**User-Side Flow (Abo-Management):**
```
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  User Klick │────▶│ POST/DELETE      │────▶│ Prisma Upsert/     │
│  Toggle     │     │ /api/me/categ... │     │ Delete             │
└─────────────┘     └──────────────────┘     └────────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌──────────────────┐     ┌────────────────────┐
                       │ Cache Invalidate │     │ Optimistic UI      │
                       │ + Toast          │     │ Update + Rollback  │
                       └──────────────────┘     └────────────────────┘
```

---

## 3. Cache-Strategie

| Query | Cache Key | TTL | Invaliderung |
|-------|-----------|-----|--------------|
| `getSubscribedCategories(userId)` | `category-subscriptions-{userId}` | 60s | POST/DELETE `/api/me/categories/subscriptions` |
| `getSubscribersForCategory(category)` | `category-subscribers-{category}` | 60s | POST/DELETE `/api/me/categories/subscriptions` (alle Kategorien) |
| `getNotificationPrefs(userId)` | `notification-prefs-{userId}` | 60s | PATCH `/api/me/notifications/prefs` |

**Implementation:** `unstable_cache` mit `tags` Array, `revalidateTag` in Server Actions.

---

## 4. Arbeitspakete (PKG-1 bis PKG-12)

### PKG-1: DB Migration & Prisma Schema
**Dateien:**
- `prisma/schema.prisma` (Erweiterung)
- `prisma/migrations/20261024XXXXXX_add_category_subscriptions/migration.sql`

**Änderungen:**
```prisma
// Neu: CategorySubscription Model
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

// Erweiterung: Notification
model Notification {
  // ... existing
  uniqueKey String?        @unique
}

// Erweiterung: NotificationPrefs
model NotificationPrefs {
  // ... existing
  categoryNewReviewEmail Boolean @default(false)
}

// Erweiterung: NotificationType Enum
enum NotificationType {
  // ... existing
  CATEGORY_NEW_REVIEW
}
```

**Migration (reversibel):**
```sql
-- Up
CREATE TABLE "CategorySubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" "ReviewCategory" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CategorySubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CategorySubscription_userId_category_key" ON "CategorySubscription"("userId", "category");
CREATE INDEX "CategorySubscription_category_idx" ON "CategorySubscription"("category");
ALTER TABLE "CategorySubscription" ADD CONSTRAINT "CategorySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TwitchUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD COLUMN "uniqueKey" TEXT;
CREATE UNIQUE INDEX "Notification_uniqueKey_key" ON "Notification"("uniqueKey");

ALTER TABLE "NotificationPrefs" ADD COLUMN "categoryNewReviewEmail" BOOLEAN NOT NULL DEFAULT false;

ALTER TYPE "NotificationType" ADD VALUE 'CATEGORY_NEW_REVIEW';

-- Down
ALTER TYPE "NotificationType" DROP VALUE 'CATEGORY_NEW_REVIEW';
ALTER TABLE "NotificationPrefs" DROP COLUMN "categoryNewReviewEmail";
DROP INDEX "Notification_uniqueKey_key";
ALTER TABLE "Notification" DROP COLUMN "uniqueKey";
DROP TABLE "CategorySubscription";
```

**Verifikation:** `npx prisma migrate dev`, `npx prisma generate`, `npm run type-check`

---

### PKG-2: Types & Zod Schemas
**Datei:** `src/lib/category-subscription-schema.ts`

```typescript
import { z } from 'zod';
import { ReviewCategory } from '@prisma/client';

// Request Schemas
export const subscribeCategorySchema = z.object({
  category: z.nativeEnum(ReviewCategory),
});

export const categoryParamSchema = z.object({
  category: z.nativeEnum(ReviewCategory),
});

// Response Schemas
export const subscribedCategoriesResponseSchema = z.object({
  categories: z.array(z.nativeEnum(ReviewCategory)),
});

export const subscribeResponseSchema = z.object({
  subscribed: z.boolean(),
  category: z.nativeEnum(ReviewCategory),
});

export const unsubscribeResponseSchema = z.object({
  unsubscribed: z.boolean(),
  category: z.nativeEnum(ReviewCategory),
});

// Types
export type SubscribeCategoryInput = z.infer<typeof subscribeCategorySchema>;
export type CategoryParam = z.infer<typeof categoryParamSchema>;
export type SubscribedCategoriesResponse = z.infer<typeof subscribedCategoriesResponseSchema>;
export type SubscribeResponse = z.infer<typeof subscribeResponseSchema>;
export type UnsubscribeResponse = z.infer<typeof unsubscribeResponseSchema>;
```

**Verifikation:** `npm run type-check`

---

### PKG-3: Server Logic
**Datei:** `src/lib/category-subscriptions.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { ReviewCategory, NotificationType } from '@prisma/client';

// 1. Get User's Subscriptions (cached 60s)
export const getSubscribedCategories = unstable_cache(
  async (userId: string): Promise<ReviewCategory[]> => {
    const subs = await prisma.categorySubscription.findMany({
      where: { userId },
      select: { category: true },
    });
    return subs.map(s => s.category);
  },
  ['category-subscriptions'],
  { tags: (userId: string) => [`category-subscriptions-${userId}`], revalidate: 60 }
);

// 2. Toggle Subscription (Upsert/Delete)
export async function toggleSubscription(
  userId: string,
  category: ReviewCategory,
  subscribe: boolean
): Promise<{ subscribed: boolean; category: ReviewCategory }> {
  if (subscribe) {
    await prisma.categorySubscription.upsert({
      where: { userId_category: { userId, category } },
      create: { userId, category },
      update: {}, // no-op
    });
    return { subscribed: true, category };
  } else {
    await prisma.categorySubscription.deleteMany({
      where: { userId, category },
    });
    return { subscribed: false, category };
  }
}

// 3. Get All Subscriber UserIds for a Category (cached 60s)
export const getSubscribersForCategory = unstable_cache(
  async (category: ReviewCategory): Promise<string[]> => {
    const subs = await prisma.categorySubscription.findMany({
      where: { category },
      select: { userId: true },
    });
    return subs.map(s => s.userId);
  },
  ['category-subscribers'],
  { tags: (category: ReviewCategory) => [`category-subscribers-${category}`], revalidate: 60 }
);

// 4. Create Notifications for New Review in Category
export async function createCategoryNotifications(
  reviewId: string,
  reviewTitle: string,
  reviewSlug: string,
  category: ReviewCategory,
  thumbnailUrl?: string
): Promise<number> {
  const subscriberIds = await getSubscribersForCategory(category);
  if (subscriberIds.length === 0) return 0;

  // Filter users who have notification preference enabled
  const prefs = await prisma.notificationPrefs.findMany({
    where: {
      userId: { in: subscriberIds },
      categoryNewReview: true, // existing field for on-site
    },
    select: { userId: true },
  });
  const targetUserIds = prefs.map(p => p.userId);
  if (targetUserIds.length === 0) return 0;

  // Batch insert with skipDuplicates (uniqueKey handles dedup)
  const notifications = targetUserIds.map(userId => ({
    userId,
    type: NotificationType.CATEGORY_NEW_REVIEW,
    title: `Neuer Review in ${getCategoryLabel(category)}`,
    message: reviewTitle,
    link: `/reviews/${reviewSlug}`,
    imageUrl: thumbnailUrl,
    uniqueKey: `category-review-${reviewId}-${userId}`,
  }));

  const result = await prisma.notification.createMany({
    data: notifications,
    skipDuplicates: true, // respects uniqueKey unique constraint
  });

  return result.count;
}

// Helper
function getCategoryLabel(category: ReviewCategory): string {
  const labels: Record<ReviewCategory, string> = {
    GAMES: 'Games',
    HARDWARE: 'Hardware',
    MOVIES: 'Movies',
    SERIES: 'Series',
  };
  return labels[category];
}

// 5. Invalidate Cache (called from Server Actions)
export async function invalidateCategorySubscriptionCache(userId: string): Promise<void> {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(`category-subscriptions-${userId}`);
  // Also invalidate subscriber lists for all categories (simpler: invalidate all)
  for (const cat of ['GAMES', 'HARDWARE', 'MOVIES', 'SERIES'] as ReviewCategory[]) {
    revalidateTag(`category-subscribers-${cat}`);
  }
}
```

**Verifikation:** `npm run type-check`

---

### PKG-4: API Routes - Subscriptions
**Datei:** `src/app/api/me/categories/subscriptions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReviewCategory } from '@prisma/client';
import {
  subscribeCategorySchema,
  categoryParamSchema,
  subscribedCategoriesResponseSchema,
  subscribeResponseSchema,
  unsubscribeResponseSchema,
} from '@/lib/category-subscription-schema';
import { invalidateCategorySubscriptionCache } from '@/lib/category-subscriptions';

// GET /api/me/categories/subscriptions
export async function GET() {
  const session = await requireTwitchAuth();
  const categories = await prisma.categorySubscription.findMany({
    where: { userId: session.user.id },
    select: { category: true },
  });
  return NextResponse.json(
    subscribedCategoriesResponseSchema.parse({ categories: categories.map(c => c.category) })
  );
}

// POST /api/me/categories/subscriptions
export async function POST(request: NextRequest) {
  const session = await requireTwitchAuth();
  const body = await request.json();
  const { category } = subscribeCategorySchema.parse(body);

  await prisma.categorySubscription.upsert({
    where: { userId_category: { userId: session.user.id, category } },
    create: { userId: session.user.id, category },
    update: {},
  });

  await invalidateCategorySubscriptionCache(session.user.id);

  return NextResponse.json(
    subscribeResponseSchema.parse({ subscribed: true, category })
  );
}

// DELETE /api/me/categories/subscriptions/:category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const session = await requireTwitchAuth();
  const { category } = categoryParamSchema.parse(await params);

  await prisma.categorySubscription.deleteMany({
    where: { userId: session.user.id, category },
  });

  await invalidateCategorySubscriptionCache(session.user.id);

  return NextResponse.json(
    unsubscribeResponseSchema.parse({ unsubscribed: true, category })
  );
}
```

**Verifikation:** `npm run type-check`, manueller API-Test

---

### PKG-5: Notification Prefs API Erweiterung
**Datei:** `src/app/api/me/notifications/prefs/route.ts` (Erweiterung)

```typescript
// PATCH Body Schema Erweiterung
const updateNotificationPrefsSchema = z.object({
  // ... existing fields
  categoryNewReviewEmail: z.boolean().optional(),
});

// In PATCH handler:
const { categoryNewReviewEmail, ...rest } = updateNotificationPrefsSchema.parse(body);

const updateData: any = { ...rest };
if (categoryNewReviewEmail !== undefined) {
  updateData.categoryNewReviewEmail = categoryNewReviewEmail;
}

await prisma.notificationPrefs.upsert({
  where: { userId: session.user.id },
  create: { userId: session.user.id, ...updateData },
  update: updateData,
});

// Invalidate cache
revalidateTag(`notification-prefs-${session.user.id}`);
```

**Verifikation:** `npm run type-check`

---

### PKG-6: Review Publish Hook (Notification Trigger)
**Datei:** `src/lib/reviews.ts` (Erweiterung der `publishReview` Server Action)

```typescript
import { createCategoryNotifications } from '@/lib/category-subscriptions';
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from '@/lib/feature-flags';

// In publishReview Server Action, nach erfolgreichem Publish:
if (FEATURE_CATEGORY_SUBSCRIPTIONS && review.category) {
  // Fire-and-forget: nicht awaiten, Fehler nur loggen
  createCategoryNotifications(
    review.id,
    review.title,
    review.slug,
    review.category,
    review.coverImageUrl
  ).catch(err => {
    console.error('[CategorySubscriptions] Failed to create notifications:', err);
  });
}
```

**Verifikation:** `npm run type-check`, manueller Publish-Test

---

### PKG-7: Client Hook & Types
**Datei:** `src/hooks/useCategorySubscriptions.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { ReviewCategory } from '@prisma/client';
import { toast } from 'sonner';

interface UseCategorySubscriptionsReturn {
  subscribedCategories: ReviewCategory[];
  isLoading: boolean;
  toggleCategory: (category: ReviewCategory) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCategorySubscriptions(): UseCategorySubscriptionsReturn {
  const [subscribedCategories, setSubscribedCategories] = useState<ReviewCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/me/categories/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubscribedCategories(data.categories);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleCategory = useCallback(async (category: ReviewCategory) => {
    const currentlySubscribed = subscribedCategories.includes(category);
    const newSubscribed = !currentlySubscribed;

    // Optimistic Update
    setSubscribedCategories(prev =>
      newSubscribed
        ? [...prev, category]
        : prev.filter(c => c !== category)
    );

    try {
      const method = newSubscribed ? 'POST' : 'DELETE';
      const url = newSubscribed
        ? '/api/me/categories/subscriptions'
        : `/api/me/categories/subscriptions/${category}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: newSubscribed ? JSON.stringify({ category }) : undefined,
      });

      if (!res.ok) throw new Error('Failed to toggle');

      toast.success(newSubscribed ? `${getCategoryLabel(category)} abonniert` : `${getCategoryLabel(category)} abbestellt`);
    } catch (err) {
      // Rollback
      setSubscribedCategories(prev =>
        currentlySubscribed
          ? [...prev, category]
          : prev.filter(c => c !== category)
      );
      toast.error('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  }, [subscribedCategories]);

  // Initial fetch
  // useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]); // caller handles

  return { subscribedCategories, isLoading, toggleCategory, refresh: fetchSubscriptions };
}

function getCategoryLabel(category: ReviewCategory): string {
  const labels: Record<ReviewCategory, string> = {
    GAMES: 'Games',
    HARDWARE: 'Hardware',
    MOVIES: 'Movies',
    SERIES: 'Series',
  };
  return labels[category];
}
```

**Verifikation:** `npm run type-check`

---

### PKG-8: UI Components

#### 8a. `CategorySubscriptionCard.tsx`
**Datei:** `src/components/settings/CategorySubscriptionCard.tsx`

```tsx
'use client';

import { ReviewCategory } from '@prisma/client';
import { useCategorySubscriptions } from '@/hooks/useCategorySubscriptions';
import { Toggle } from '@/components/ui/toggle';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad2, Monitor, Film, Tv } from 'lucide-react';

const CATEGORY_ICONS: Record<ReviewCategory, React.ComponentType<{ className?: string }>> = {
  GAMES: Gamepad2,
  HARDWARE: Monitor,
  MOVIES: Film,
  SERIES: Tv,
};

const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  GAMES: 'Games',
  HARDWARE: 'Hardware',
  MOVIES: 'Movies',
  SERIES: 'Series',
};

const CATEGORY_DESCRIPTIONS: Record<ReviewCategory, string> = {
  GAMES: 'Neue Game-Reviews: Indie, AAA, Early Access',
  HARDWARE: 'Hardware-Tests: GPUs, CPUs, Peripherie, Displays',
  MOVIES: 'Film-Reviews: Kino, Streaming, Physical Media',
  SERIES: 'Serien-Reviews: Staffeln, Episoden, Streaming',
};

interface CategorySubscriptionCardProps {
  category: ReviewCategory;
}

export function CategorySubscriptionCard({ category }: CategorySubscriptionCardProps) {
  const { subscribedCategories, toggleCategory, isLoading } = useCategorySubscriptions();
  const isSubscribed = subscribedCategories.includes(category);
  const Icon = CATEGORY_ICONS[category];

  return (
    <Card className="flex items-center justify-between p-4 gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="font-medium truncate">{CATEGORY_LABELS[category]}</h3>
          <p className="text-sm text-muted-foreground truncate">{CATEGORY_DESCRIPTIONS[category]}</p>
        </div>
      </div>
      <Toggle
        role="switch"
        aria-checked={isSubscribed}
        aria-label={`${CATEGORY_LABELS[category]} ${isSubscribed ? 'abonniert' : 'nicht abonniert'}`}
        checked={isSubscribed}
        onCheckedChange={checked => toggleCategory(category)}
        disabled={isLoading}
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex-shrink-0"
      />
    </Card>
  );
}
```

#### 8b. `SubscribedCategoryChips.tsx` (Startseite/Profil)
**Datei:** `src/components/home/SubscribedCategoryChips.tsx`

```tsx
'use client';

import { ReviewCategory } from '@prisma/client';
import Link from 'next/link';
import { useCategorySubscriptions } from '@/hooks/useCategorySubscriptions';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Monitor, Film, Tv } from 'lucide-react';

const CATEGORY_ICONS: Record<ReviewCategory, React.ComponentType<{ className?: string }>> = {
  GAMES: Gamepad2,
  HARDWARE: Monitor,
  MOVIES: Film,
  SERIES: Tv,
};

const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  GAMES: 'Games',
  HARDWARE: 'Hardware',
  MOVIES: 'Movies',
  SERIES: 'Series',
};

const CATEGORY_HREFS: Record<ReviewCategory, string> = {
  GAMES: '/suche?category=GAMES',
  HARDWARE: '/suche?category=HARDWARE',
  MOVIES: '/suche?category=MOVIES',
  SERIES: '/suche?category=SERIES',
};

export function SubscribedCategoryChips() {
  const { subscribedCategories, isLoading } = useCategorySubscriptions();

  if (isLoading || subscribedCategories.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Abonnierte Kategorien" className="flex flex-wrap gap-2">
      {subscribedCategories.map(category => (
        <Link
          key={category}
          href={CATEGORY_HREFS[category]}
          className="inline-flex items-center gap-1.5"
        >
          <Badge variant="secondary" className="gap-1.5 px-2 py-1 h-auto">
            <CATEGORY_ICONS[category] className="h-3 w-3" aria-hidden="true" />
            <span>{CATEGORY_LABELS[category]}</span>
          </Badge>
        </Link>
      ))}
    </nav>
  );
}
```

**Verifikation:** `npm run type-check`, Storybook/manueller Check

---

### PKG-9: Settings Pages

#### 9a. `/einstellungen/kategorien/page.tsx` (Server Component)
**Datei:** `src/app/(app)/einstellungen/kategorien/page.tsx`

```tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from '@/lib/feature-flags';
import { CategorySubscriptionsClient } from './CategorySubscriptionsClient';

export default async function CategorySubscriptionsPage() {
  if (!FEATURE_CATEGORY_SUBSCRIPTIONS) {
    redirect('/einstellungen');
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/einstellungen/kategorien');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Kategorie-Abos</h1>
        <p className="text-muted-foreground mt-2">
          Erhalte Benachrichtigungen, sobald ein neues Review in deinen Interessensbereichen erscheint.
        </p>
      </header>
      <CategorySubscriptionsClient initialUserId={session.user.id} />
    </div>
  );
}
```

#### 9b. `CategorySubscriptionsClient.tsx` (Client Component)
**Datei:** `src/app/(app)/einstellungen/kategorien/CategorySubscriptionsClient.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ReviewCategory } from '@prisma/client';
import { CategorySubscriptionCard } from '@/components/settings/CategorySubscriptionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const ALL_CATEGORIES: ReviewCategory[] = ['GAMES', 'HARDWARE', 'MOVIES', 'SERIES'];

interface CategorySubscriptionsClientProps {
  initialUserId: string;
}

export function CategorySubscriptionsClient({ initialUserId }: CategorySubscriptionsClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-live="polite">
        {ALL_CATEGORIES.map(cat => (
          <Card key={cat} className="h-24">
            <CardContent className="flex items-center justify-between p-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ALL_CATEGORIES.map(category => (
        <CategorySubscriptionCard key={category} category={category} />
      ))}
    </div>
  );
}
```

#### 9c. Erweiterung `/einstellungen/benachrichtigungen/page.tsx`
**Datei:** `src/app/(app)/einstellungen/benachrichtigungen/page.tsx` (Bestehend - Erweiterung)

```tsx
// In der bestehenden Client Component für NotificationPrefs:
const [categoryNewReviewEmail, setCategoryNewReviewEmail] = useState(false);

// Nach Laden der Prefs:
setCategoryNewReviewEmail(prefs.categoryNewReviewEmail ?? false);

// In der JSX (neuer Abschnitt):
<fieldset className="space-y-4">
  <legend className="text-lg font-medium">Kategorie-Benachrichtigungen</legend>
  <p className="text-sm text-muted-foreground">
    Erhalte E-Mails, wenn neue Reviews in deinen abonnierten Kategorien erscheinen.
  </p>
  <div className="flex items-center justify-between">
    <div>
      <label htmlFor="categoryNewReviewEmail" className="font-medium">
        E-Mail bei neuen Kategorie-Reviews
      </label>
      <p className="text-sm text-muted-foreground">
        Benötigt: Mindestens eine abonnierte Kategorie + globale E-Mail-Benachrichtigungen aktiviert.
      </p>
    </div>
    <Switch
      id="categoryNewReviewEmail"
      checked={categoryNewReviewEmail && emailEnabled && hasSubscriptions}
      onCheckedChange={checked => {
        setCategoryNewReviewEmail(checked);
        updatePrefs({ categoryNewReviewEmail: checked });
      }}
      disabled={!emailEnabled || !hasSubscriptions}
      aria-disabled={!emailEnabled || !hasSubscriptions}
    />
  </div>
</fieldset>
```

**Verifikation:** `npm run type-check`, manueller UI-Test

---

### PKG-10: Startseite & Profil Integration

#### 10a. Startseite `/page.tsx` (Erweiterung)
```tsx
// In der bestehenden HomePage Client Component:
import { SubscribedCategoryChips } from '@/components/home/SubscribedCategoryChips';

// Im Hero-Bereich oder unter "Neueste Reviews":
<SubscribedCategoryChips />
```

#### 10b. Profil `/u/[username]/page.tsx` (Erweiterung)
```tsx
// In der bestehenden Profil-Page (Server Component):
// Lade Subscriptions für den Profil-User (public only wenn profilePublic=true)
const subscriptions = profilePublic
  ? await getSubscribedCategories(profileUser.id)
  : [];

// Im Profil-Header Bereich:
{subscriptions.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-4" aria-label="Interessen">
    {subscriptions.map(cat => (
      <Badge key={cat} variant="outline" className="gap-1.5">
        <CATEGORY_ICONS[cat] className="h-3 w-3" />
        {CATEGORY_LABELS[cat]}
      </Badge>
    ))}
  </div>
)}
```

**Verifikation:** `npm run type-check`, manueller UI-Test

---

### PKG-11: Tests

| Test-Datei | Art | Beschreibung |
|------------|-----|--------------|
| `tests/lib/category-subscriptions.test.ts` | Unit | `getSubscribedCategories`, `toggleSubscription`, `getSubscribersForCategory`, `createCategoryNotifications` (mit Mock-Prisma) |
| `tests/api/me/categories.test.ts` | Integration | GET/POST/DELETE `/api/me/categories/subscriptions` (Auth, Validation, Idempotenz, Cache-Invalidierung) |
| `tests/api/me/notifications.prefs.test.ts` | Integration | PATCH `categoryNewReviewEmail` |
| `tests/api/reviews/publish-notifications.test.ts` | Integration | Review Publish triggert `createCategoryNotifications` korrekt |
| `tests/e2e/category-subscriptions.spec.ts` | E2E | Full Flow: Login → Settings → Toggle → Home Chips → Notification Bell |

**Test-Coverage-Ziel:** ≥ 90% für neue Logik, alle AK abgedeckt.

---

### PKG-12: Doku & Flag

| Datei | Änderung |
|-------|----------|
| `CHANGELOG.md` | Neue Version Eintrag: "Added Category Subscriptions" |
| `README.md` | Datenmodell: `CategorySubscription` hinzufügen, Feature-Flag dokumentieren |
| `.env.example` | `FEATURE_CATEGORY_SUBSCRIPTIONS="true"` hinzufügen |
| `docs/PROGRESS.md` | Feature als "in Arbeit" → "erledigt" aktualisieren |
| `docs/ROADMAP.md` | Feature als `[x]` markieren, nächsten Kandidaten notieren |
| `docs/features/category-subscriptions.md` | Review-Sektion (F6) nach Self-Review ausfüllen |

---

## 5. Abhängigkeiten & Reihenfolge

```
PKG-1 (DB) → PKG-2 (Types) → PKG-3 (Server Logic) → PKG-4 (API Subscriptions)
                                                              ↓
                                              PKG-5 (Prefs API) ← PKG-3
                                                              ↓
                                              PKG-6 (Publish Hook) ← PKG-3
                                                              ↓
                                              PKG-7 (Client Hook) ← PKG-4
                                                              ↓
                                              PKG-8 (UI Components) ← PKG-7
                                                              ↓
                                              PKG-9 (Settings Pages) ← PKG-8
                                                              ↓
                                              PKG-10 (Home/Profil) ← PKG-8
                                                              ↓
                                              PKG-11 (Tests) ← PKG-4..10
                                                              ↓
                                              PKG-12 (Doku) ← PKG-11
```

**Parallelisierbar:** PKG-5 & PKG-6 können parallel zu PKG-4 laufen. PKG-8, PKG-9, PKG-10 können parallel nach PKG-7 laufen.

---

## 6. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Notification-Batch zu groß (10k+ User) | Mittel | Timeout | Chunked Insert (1000 pro Batch), `skipDuplicates` |
| UniqueKey-Kollision bei Race Condition | Niedrig | Duplicate Notification | `skipDuplicates: true` + Unique Constraint |
| Cache-Invaliderung vergessen | Mittel | Stale Data | Zentrale `invalidateCategorySubscriptionCache()` Funktion, in allen Mutations aufrufen |
| Feature-Flag vergessen in UI | Niedrig | UI zeigt Feature obwohl aus | Wrapper Component `FeatureGate` oder konsequente Checks |
| E-Mail-Versand blockiert Publish | Niedrig | Latenz | Fire-and-forget, Queue später, MVP nur Pref speichern |

---

## 7. Definition of Done (für dieses Feature)

- [ ] Spec vollständig (F2 ✅)
- [ ] Design dokumentiert (F3 ✅)
- [ ] Alle 12 Arbeitspakete implementiert & committet
- [ ] Unit Tests: ≥ 90% Coverage für neue Logik
- [ ] Integration Tests: Alle API-Endpoints getestet (Happy Path + Error Cases)
- [ ] E2E Tests: Critical User Journey (Abo → Notification → Click)
- [ ] Self-Review (F6) ohne offene Befunde
- [ ] `npm run verify` grün (Build, TypeCheck, Lint, Tests)
- [ ] Doku aktualisiert (CHANGELOG, README, .env.example, PROGRESS, ROADMAP)
- [ ] Migration reversibel getestet (Down-Migration)
- [ ] Keine Secrets im Diff
- [ ] Alles auf `auto/dev` gepusht