import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserSignals, hasSignificantSignals, getSignalStrength } from '@/lib/recommendations-signals';

// Mock the entire prisma module with proper vi.fn() mocks
vi.mock('@/lib/prisma', () => ({
  default: {
    userRating: { findMany: vi.fn() },
    bookmark: { findMany: vi.fn() },
    follow: { findMany: vi.fn() },
    readingHistory: { findMany: vi.fn() },
    categorySubscription: { findMany: vi.fn() },
  },
}));

import prisma from '@/lib/prisma';

const mockUserRatingFindMany = prisma.userRating.findMany as unknown as ReturnType<typeof vi.fn>;
const mockBookmarkFindMany = prisma.bookmark.findMany as unknown as ReturnType<typeof vi.fn>;
const mockFollowFindMany = prisma.follow.findMany as unknown as ReturnType<typeof vi.fn>;
const mockReadingHistoryFindMany = prisma.readingHistory.findMany as unknown as ReturnType<typeof vi.fn>;
const mockCategorySubscriptionFindMany = prisma.categorySubscription.findMany as unknown as ReturnType<typeof vi.fn>;

describe('Recommendations Signals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUserSignals', () => {
    it('returns all signal types correctly mapped', async () => {
      const mockRatings = [
        { reviewId: 'rev1', score: 9 },
        { reviewId: 'rev2', score: 7 },
      ];
      const mockBookmarks = [{ reviewId: 'rev3' }, { reviewId: 'rev4' }];
      const mockFollows = [{ followingId: 'user2' }, { followingId: 'user3' }];
      const mockHistory = [{ reviewId: 'rev5' }, { reviewId: 'rev6' }];
      const mockSubs = [{ category: 'GAMES' }, { category: 'HARDWARE' }];

      mockUserRatingFindMany.mockResolvedValue(mockRatings);
      mockBookmarkFindMany.mockResolvedValue(mockBookmarks);
      mockFollowFindMany.mockResolvedValue(mockFollows);
      mockReadingHistoryFindMany.mockResolvedValue(mockHistory);
      mockCategorySubscriptionFindMany.mockResolvedValue(mockSubs);

      const signals = await fetchUserSignals('user1');

      expect(signals.ratedReviews).toBeInstanceOf(Map);
      expect(signals.ratedReviews.get('rev1')).toBe(9);
      expect(signals.ratedReviews.get('rev2')).toBe(7);

      expect(signals.bookmarkedReviews).toBeInstanceOf(Set);
      expect(signals.bookmarkedReviews.has('rev3')).toBe(true);
      expect(signals.bookmarkedReviews.has('rev4')).toBe(true);

      expect(signals.followedUserIds).toBeInstanceOf(Set);
      expect(signals.followedUserIds.has('user2')).toBe(true);
      expect(signals.followedUserIds.has('user3')).toBe(true);

      expect(signals.readReviewIds).toBeInstanceOf(Set);
      expect(signals.readReviewIds.has('rev5')).toBe(true);
      expect(signals.readReviewIds.has('rev6')).toBe(true);

      expect(signals.subscribedCategories).toBeInstanceOf(Set);
      expect(signals.subscribedCategories.has('GAMES')).toBe(true);
      expect(signals.subscribedCategories.has('HARDWARE')).toBe(true);
    });

    it('handles empty signals gracefully', async () => {
      mockUserRatingFindMany.mockResolvedValue([]);
      mockBookmarkFindMany.mockResolvedValue([]);
      mockFollowFindMany.mockResolvedValue([]);
      mockReadingHistoryFindMany.mockResolvedValue([]);
      mockCategorySubscriptionFindMany.mockResolvedValue([]);

      const signals = await fetchUserSignals('user1');

      expect(signals.ratedReviews.size).toBe(0);
      expect(signals.bookmarkedReviews.size).toBe(0);
      expect(signals.followedUserIds.size).toBe(0);
      expect(signals.readReviewIds.size).toBe(0);
      expect(signals.subscribedCategories.size).toBe(0);
    });

    it('fetches all signal sources in parallel', async () => {
      mockUserRatingFindMany.mockResolvedValue([]);
      mockBookmarkFindMany.mockResolvedValue([]);
      mockFollowFindMany.mockResolvedValue([]);
      mockReadingHistoryFindMany.mockResolvedValue([]);
      mockCategorySubscriptionFindMany.mockResolvedValue([]);

      await fetchUserSignals('user1');

      expect(mockUserRatingFindMany).toHaveBeenCalledTimes(1);
      expect(mockBookmarkFindMany).toHaveBeenCalledTimes(1);
      expect(mockFollowFindMany).toHaveBeenCalledTimes(1);
      expect(mockReadingHistoryFindMany).toHaveBeenCalledTimes(1);
      expect(mockCategorySubscriptionFindMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasSignificantSignals', () => {
    it('returns false for cold user (no signals)', () => {
      const signals = {
        ratedReviews: new Map<string, number>(),
        bookmarkedReviews: new Set<string>(),
        followedUserIds: new Set<string>(),
        readReviewIds: new Set<string>(),
        subscribedCategories: new Set<string>(),
      };
      expect(hasSignificantSignals(signals)).toBe(false);
    });

    it('returns false for user with 2 signals', () => {
      const signals = {
        ratedReviews: new Map<string, number>([['rev1', 9]]),
        bookmarkedReviews: new Set<string>(['rev2']),
        followedUserIds: new Set<string>(),
        readReviewIds: new Set<string>(),
        subscribedCategories: new Set<string>(),
      };
      expect(hasSignificantSignals(signals)).toBe(false);
    });

    it('returns true for user with 3 signals', () => {
      const signals = {
        ratedReviews: new Map<string, number>([['rev1', 9]]),
        bookmarkedReviews: new Set<string>(['rev2']),
        followedUserIds: new Set<string>(['user2']),
        readReviewIds: new Set<string>(),
        subscribedCategories: new Set<string>(),
      };
      expect(hasSignificantSignals(signals)).toBe(true);
    });

    it('returns true for user with 3 category subscriptions', () => {
      const signals = {
        ratedReviews: new Map<string, number>(),
        bookmarkedReviews: new Set<string>(),
        followedUserIds: new Set<string>(),
        readReviewIds: new Set<string>(),
        subscribedCategories: new Set<string>(['GAMES', 'HARDWARE', 'MOVIES']),
      };
      expect(hasSignificantSignals(signals)).toBe(true);
    });
  });

  describe('getSignalStrength', () => {
    it('returns cold for < 5 signals', () => {
      const signals = {
        ratedReviews: new Map<string, number>([['rev1', 9]]),
        bookmarkedReviews: new Set<string>(['rev2']),
        followedUserIds: new Set<string>(),
        readReviewIds: new Set<string>(),
        subscribedCategories: new Set<string>(),
      };
      expect(getSignalStrength(signals)).toBe('cold');
    });

    it('returns warm for 5-19 signals', () => {
      const signals = {
        ratedReviews: new Map<string, number>([
          ['rev1', 9],
          ['rev2', 8],
          ['rev3', 7],
        ]),
        bookmarkedReviews: new Set<string>(['rev4', 'rev5']),
        followedUserIds: new Set<string>(['user2']),
        readReviewIds: new Set<string>(),
        subscribedCategories: new Set<string>(),
      };
      expect(getSignalStrength(signals)).toBe('warm');
    });

    it('returns hot for >= 20 signals', () => {
      const signals = {
        ratedReviews: new Map<string, number>(
          Array.from({ length: 15 }, (_, i) => [`rev${i}`, 8 + (i % 3)])
        ),
        bookmarkedReviews: new Set<string>(
          Array.from({ length: 5 }, (_, i) => `book${i}`)
        ),
        followedUserIds: new Set<string>(),
        readReviewIds: new Set<string>(),
        subscribedCategories: new Set<string>(),
      };
      expect(getSignalStrength(signals)).toBe('hot');
    });
  });
});