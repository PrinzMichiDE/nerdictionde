import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewCategory, NotificationType } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  categorySubscription: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  notificationPreference: {
    findMany: vi.fn(),
  },
  notification: {
    createMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}));

vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));

// Import after mocking
const { getSubscribedCategories, toggleSubscription, getSubscribersForCategory, createCategoryNotifications, invalidateCategorySubscriptionCache } = await import('@/lib/category-subscriptions');

describe('category-subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubscribedCategories', () => {
    it('returns empty array for user with no subscriptions', async () => {
      mockPrisma.categorySubscription.findMany.mockResolvedValue([]);
      
      const result = await getSubscribedCategories('user_1');
      
      expect(result).toEqual([]);
      expect(mockPrisma.categorySubscription.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_1' },
        select: { category: true },
      });
    });

    it('returns array of categories for user with subscriptions', async () => {
      mockPrisma.categorySubscription.findMany.mockResolvedValue([
        { category: ReviewCategory.GAMES },
        { category: ReviewCategory.HARDWARE },
      ]);
      
      const result = await getSubscribedCategories('user_1');
      
      expect(result).toEqual([ReviewCategory.GAMES, ReviewCategory.HARDWARE]);
    });
  });

  describe('toggleSubscription', () => {
    it('upserts subscription when subscribe=true', async () => {
      mockPrisma.categorySubscription.upsert.mockResolvedValue({});
      
      const result = await toggleSubscription('user_1', ReviewCategory.GAMES, true);
      
      expect(result).toEqual({ subscribed: true, category: ReviewCategory.GAMES });
      expect(mockPrisma.categorySubscription.upsert).toHaveBeenCalledWith({
        where: { userId_category: { userId: 'user_1', category: ReviewCategory.GAMES } },
        create: { userId: 'user_1', category: ReviewCategory.GAMES },
        update: {},
      });
    });

    it('deletes subscription when subscribe=false', async () => {
      mockPrisma.categorySubscription.deleteMany.mockResolvedValue({ count: 1 });
      
      const result = await toggleSubscription('user_1', ReviewCategory.GAMES, false);
      
      expect(result).toEqual({ subscribed: false, category: ReviewCategory.GAMES });
      expect(mockPrisma.categorySubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user_1', category: ReviewCategory.GAMES },
      });
    });
  });

  describe('getSubscribersForCategory', () => {
    it('returns empty array for category with no subscribers', async () => {
      mockPrisma.categorySubscription.findMany.mockResolvedValue([]);
      
      const result = await getSubscribersForCategory(ReviewCategory.GAMES);
      
      expect(result).toEqual([]);
      expect(mockPrisma.categorySubscription.findMany).toHaveBeenCalledWith({
        where: { category: ReviewCategory.GAMES },
        select: { userId: true },
      });
    });

    it('returns array of userIds for category with subscribers', async () => {
      mockPrisma.categorySubscription.findMany.mockResolvedValue([
        { userId: 'user_1' },
        { userId: 'user_2' },
      ]);
      
      const result = await getSubscribersForCategory(ReviewCategory.GAMES);
      
      expect(result).toEqual(['user_1', 'user_2']);
    });
  });

  describe('createCategoryNotifications', () => {
    it('returns 0 when no subscribers', async () => {
      mockPrisma.categorySubscription.findMany.mockResolvedValue([]);
      
      const result = await createCategoryNotifications(
        'review_1',
        'Test Review',
        'test-review',
        ReviewCategory.GAMES,
        'https://example.com/image.jpg'
      );
      
      expect(result).toBe(0);
    });

    it('creates notifications for subscribers with preferences', async () => {
      mockPrisma.categorySubscription.findMany
        .mockResolvedValueOnce([{ userId: 'user_1' }, { userId: 'user_2' }]); // getSubscribersForCategory
      mockPrisma.notificationPreference.findMany
        .mockResolvedValueOnce([{ userId: 'user_1' }, { userId: 'user_2' }]); // prefs filter
      mockPrisma.notification.createMany
        .mockResolvedValueOnce({ count: 2 });

      const result = await createCategoryNotifications(
        'review_1',
        'Test Review',
        'test-review',
        ReviewCategory.GAMES,
        'https://example.com/image.jpg'
      );

      expect(result).toBe(2);
      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'user_1',
            type: NotificationType.category_new_review,
            title: 'Neuer Review in Games',
            message: 'Test Review',
            link: '/reviews/test-review',
            imageUrl: 'https://example.com/image.jpg',
            uniqueKey: 'category-review-review_1-user_1',
          },
          {
            userId: 'user_2',
            type: NotificationType.category_new_review,
            title: 'Neuer Review in Games',
            message: 'Test Review',
            link: '/reviews/test-review',
            imageUrl: 'https://example.com/image.jpg',
            uniqueKey: 'category-review-review_1-user_2',
          },
        ],
        skipDuplicates: true,
      });
    });

    it('filters out users without notification preference', async () => {
      mockPrisma.categorySubscription.findMany
        .mockResolvedValueOnce([{ userId: 'user_1' }, { userId: 'user_2' }, { userId: 'user_3' }]);
      mockPrisma.notificationPreference.findMany
        .mockResolvedValueOnce([{ userId: 'user_1' }, { userId: 'user_3' }]); // user_2 has no pref
      mockPrisma.notification.createMany
        .mockResolvedValueOnce({ count: 2 });

      const result = await createCategoryNotifications(
        'review_1',
        'Test Review',
        'test-review',
        ReviewCategory.GAMES
      );

      expect(result).toBe(2);
      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ userId: 'user_1' }),
            expect.objectContaining({ userId: 'user_3' }),
          ]),
        })
      );
      // user_2 should not be in the notifications
      const callData = mockPrisma.notification.createMany.mock.calls[0][0].data;
      expect(callData.map((d: { userId: string }) => d.userId)).not.toContain('user_2');
    });

    it('uses correct category labels', async () => {
      // Test HARDWARE
      mockPrisma.categorySubscription.findMany.mockResolvedValueOnce([{ userId: 'user_1' }]);
      mockPrisma.notificationPreference.findMany.mockResolvedValueOnce([{ userId: 'user_1' }]);
      mockPrisma.notification.createMany.mockResolvedValueOnce({ count: 1 });

      await createCategoryNotifications('review_1', 'Test', 'test', ReviewCategory.HARDWARE);
      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ title: 'Neuer Review in Hardware' }),
          ]),
        })
      );

      // Test MOVIES - need to reset mocks for next call
      vi.clearAllMocks();
      mockPrisma.categorySubscription.findMany.mockResolvedValueOnce([{ userId: 'user_1' }]);
      mockPrisma.notificationPreference.findMany.mockResolvedValueOnce([{ userId: 'user_1' }]);
      mockPrisma.notification.createMany.mockResolvedValueOnce({ count: 1 });

      await createCategoryNotifications('review_2', 'Test', 'test', ReviewCategory.MOVIES);
      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ title: 'Neuer Review in Movies' }),
          ]),
        })
      );

      // Test SERIES
      vi.clearAllMocks();
      mockPrisma.categorySubscription.findMany.mockResolvedValueOnce([{ userId: 'user_1' }]);
      mockPrisma.notificationPreference.findMany.mockResolvedValueOnce([{ userId: 'user_1' }]);
      mockPrisma.notification.createMany.mockResolvedValueOnce({ count: 1 });

      await createCategoryNotifications('review_3', 'Test', 'test', ReviewCategory.SERIES);
      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ title: 'Neuer Review in Series' }),
          ]),
        })
      );
    });
  });

  describe('invalidateCategorySubscriptionCache', () => {
    it('calls revalidateTag for both cache tags', async () => {
      const { revalidateTag } = await import('next/cache');
      await invalidateCategorySubscriptionCache('user_1');
      
      expect(revalidateTag).toHaveBeenCalledWith('category-subscriptions', '');
      expect(revalidateTag).toHaveBeenCalledWith('category-subscribers', '');
    });
  });
});