import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { ReviewCategory, NotificationType } from '@prisma/client';

// 1. Get User's Subscriptions (cached 60s)
export const getSubscribedCategories = unstable_cache(
  async (userId: string): Promise<ReviewCategory[]> => {
    const subs = await prisma.categorySubscription.findMany({
      where: { userId },
      select: { category: true },
    });
    return subs.map((s) => s.category);
  },
  ['category-subscriptions'],
  { tags: ['category-subscriptions'], revalidate: 60 }
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
      update: {},
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
    return subs.map((s) => s.userId);
  },
  ['category-subscribers'],
  { tags: ['category-subscribers'], revalidate: 60 }
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

  // Filter users who have notification preference enabled (on-site)
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      userId: { in: subscriberIds },
    },
    select: { userId: true },
  });
  const targetUserIds = prefs.map((p) => p.userId);
  if (targetUserIds.length === 0) return 0;

  // Batch insert with skipDuplicates (uniqueKey handles dedup)
  const notifications = targetUserIds.map((userId) => ({
    userId,
    type: NotificationType.category_new_review,
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
  revalidateTag('category-subscriptions', '');
  revalidateTag('category-subscribers', '');
}