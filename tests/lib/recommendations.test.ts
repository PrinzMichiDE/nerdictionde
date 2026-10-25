import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getHomeRecommendationsCore,
  getDetailRecommendationsCore,
  dismissRecommendation,
  isDismissed,
  getDismissedReviewIds,
} from '@/lib/recommendations';

// Mock all dependencies
vi.mock('@/lib/recommendations-signals', () => ({
  getUserSignals: vi.fn(),
  hasSignificantSignals: vi.fn(),
  createEmptySignals: vi.fn(() => ({
    ratedReviews: new Map(),
    bookmarkedReviews: new Set(),
    followedUserIds: new Set(),
    readReviewIds: new Set(),
    subscribedCategories: new Set(),
  })),
}));

vi.mock('@/lib/recommendations-candidates', () => ({
  getContentCandidates: vi.fn(),
  getCollaborativeCandidates: vi.fn(),
  getTrendingCandidates: vi.fn(),
  mergeCandidates: vi.fn(),
  getReviewSignals: vi.fn(),
  getContentCandidatesForReview: vi.fn(),
}));

vi.mock('@/lib/recommendations-scoring', () => ({
  computeContentScore: vi.fn(),
  computeUserUserScore: vi.fn(),
  computeItemItemScore: vi.fn(),
  computeTrendingScore: vi.fn(),
  calculateFinalScore: vi.fn(),
  applyMMR: vi.fn(),
  generateReason: vi.fn(),
  determineStrategy: vi.fn(),
  DEFAULT_SCORING_CONFIG: {
    weights: { content: 0.4, userUser: 0.3, itemItem: 0.2, trending: 0.1 },
    mmrLambda: 0.3,
    candidateLimit: 50,
    homeLimit: 10,
    detailLimit: 5,
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    recommendationDismiss: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { getUserSignals, hasSignificantSignals } from '@/lib/recommendations-signals';
import {
  getContentCandidates,
  getCollaborativeCandidates,
  getTrendingCandidates,
  mergeCandidates,
  getReviewSignals,
  getContentCandidatesForReview,
} from '@/lib/recommendations-candidates';
import {
  computeContentScore,
  computeUserUserScore,
  computeItemItemScore,
  computeTrendingScore,
  calculateFinalScore,
  applyMMR,
  generateReason,
  determineStrategy,
} from '@/lib/recommendations-scoring';
import prisma from '@/lib/prisma';
import type { UserSignals, ReviewWithTags } from '@/types/recommendations';

const createMockReview = (overrides: Partial<ReviewWithTags> = {}): ReviewWithTags => {
  const base: ReviewWithTags = {
    id: 'rev1',
    slug: 'test-review',
    title: 'Test Review',
    title_en: null,
    category: 'game',
    score: 85,
    images: ['https://example.com/img.jpg'],
    metaDescription: 'A test review',
    releaseDate: new Date('2024-01-15'),
    userRatingAvg: 8.5,
    userRatingCount: 42,
    metadata: { developer: 'Test Dev', publisher: 'Test Pub' },
    tags: [{ tag: { name: 'Action', slug: 'action' } }],
  };
  return { ...base, ...overrides };
};

const createMockSignals = (overrides: Partial<UserSignals> = {}): UserSignals => ({
  ratedReviews: new Map<string, number>(),
  bookmarkedReviews: new Set<string>(),
  followedUserIds: new Set<string>(),
  readReviewIds: new Set<string>(),
  subscribedCategories: new Set<string>(),
  ...overrides,
});

describe('Recommendations Main Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHomeRecommendationsCore', () => {
    it('returns cold-start recommendations for new user', async () => {
      const emptySignals = createMockSignals();
      vi.mocked(getUserSignals).mockResolvedValue(emptySignals);
      vi.mocked(hasSignificantSignals).mockReturnValue(false);
      
      const trendingCandidates = [createMockReview({ id: 'trending1' })];
      vi.mocked(getTrendingCandidates).mockResolvedValue(trendingCandidates);
      
      vi.mocked(computeContentScore).mockReturnValue(0.5);
      vi.mocked(computeUserUserScore).mockReturnValue(0.1);
      vi.mocked(computeItemItemScore).mockReturnValue(0.05);
      vi.mocked(computeTrendingScore).mockReturnValue(0.6);
      vi.mocked(calculateFinalScore).mockReturnValue(0.5);
      vi.mocked(applyMMR).mockImplementation((reviews) => reviews);
      vi.mocked(generateReason).mockReturnValue({
        type: 'trending',
        label: 'Aktuell beliebt',
      });
      vi.mocked(determineStrategy).mockReturnValue('cold-start');

      const result = await getHomeRecommendationsCore('new-user', 5);

      expect(result.recommendations).toHaveLength(1);
      expect(result.strategy).toBe('cold-start');
      expect(getTrendingCandidates).toHaveBeenCalled();
    });

    it('returns personalized recommendations for user with signals', async () => {
      const signals = createMockSignals({
        ratedReviews: new Map([['rev1', 9]]),
        bookmarkedReviews: new Set(['rev2']),
      });
      vi.mocked(getUserSignals).mockResolvedValue(signals);
      vi.mocked(hasSignificantSignals).mockReturnValue(true);
      
      vi.mocked(getContentCandidates).mockResolvedValue([createMockReview({ id: 'content1' })]);
      vi.mocked(getCollaborativeCandidates).mockResolvedValue([createMockReview({ id: 'collab1' })]);
      vi.mocked(getTrendingCandidates).mockResolvedValue([createMockReview({ id: 'trending1' })]);
      vi.mocked(mergeCandidates).mockImplementation((...sources) => sources.flat());
      
      vi.mocked(computeContentScore).mockReturnValue(0.6);
      vi.mocked(computeUserUserScore).mockReturnValue(0.3);
      vi.mocked(computeItemItemScore).mockReturnValue(0.1);
      vi.mocked(computeTrendingScore).mockReturnValue(0.5);
      vi.mocked(calculateFinalScore).mockReturnValue(0.55);
      vi.mocked(applyMMR).mockImplementation((reviews) => reviews);
      vi.mocked(generateReason).mockReturnValue({
        type: 'rated_similar',
        label: 'Weil du ähnliches bewertet hast',
      });
      vi.mocked(determineStrategy).mockReturnValue('content-based');

      const result = await getHomeRecommendationsCore('user-with-signals', 5);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.strategy).toBe('content-based');
      expect(getContentCandidates).toHaveBeenCalled();
      expect(getCollaborativeCandidates).toHaveBeenCalled();
      expect(getTrendingCandidates).toHaveBeenCalled();
    });

    it('respects limit parameter', async () => {
      const signals = createMockSignals({ ratedReviews: new Map([['rev1', 9]]) });
      vi.mocked(getUserSignals).mockResolvedValue(signals);
      vi.mocked(hasSignificantSignals).mockReturnValue(true);
      
      vi.mocked(getContentCandidates).mockResolvedValue([]);
      vi.mocked(getCollaborativeCandidates).mockResolvedValue([]);
      vi.mocked(getTrendingCandidates).mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => createMockReview({ id: `trend${i}` }))
      );
      vi.mocked(mergeCandidates).mockImplementation((...sources) => sources.flat());
      
      vi.mocked(computeContentScore).mockReturnValue(0.5);
      vi.mocked(computeUserUserScore).mockReturnValue(0.1);
      vi.mocked(computeItemItemScore).mockReturnValue(0.05);
      vi.mocked(computeTrendingScore).mockReturnValue(0.5);
      vi.mocked(calculateFinalScore).mockReturnValue(0.5);
      vi.mocked(applyMMR).mockImplementation((reviews) => reviews);
      vi.mocked(generateReason).mockReturnValue({
        type: 'trending',
        label: 'Trending',
      });
      vi.mocked(determineStrategy).mockReturnValue('trending');

      const result = await getHomeRecommendationsCore('user', 3);

      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getDetailRecommendationsCore', () => {
    it('returns content-based recommendations for review', async () => {
      vi.mocked(getReviewSignals).mockResolvedValue({
        category: 'game',
        tagSlugs: ['action'],
        developer: 'FromSoftware',
        publisher: 'Bandai Namco',
      });
      vi.mocked(getUserSignals).mockResolvedValue(createMockSignals());
      
      vi.mocked(getContentCandidatesForReview).mockResolvedValue([createMockReview({ id: 'detail1' })]);
      vi.mocked(getTrendingCandidates).mockResolvedValue([]);
      vi.mocked(mergeCandidates).mockImplementation((...sources) => sources.flat());
      
      vi.mocked(computeContentScore).mockReturnValue(0.7);
      vi.mocked(computeUserUserScore).mockReturnValue(0.1);
      vi.mocked(computeItemItemScore).mockReturnValue(0.05);
      vi.mocked(computeTrendingScore).mockReturnValue(0.5);
      vi.mocked(calculateFinalScore).mockReturnValue(0.6);
      vi.mocked(applyMMR).mockImplementation((reviews) => reviews);
      vi.mocked(generateReason).mockReturnValue({
        type: 'same_developer',
        label: 'Von FromSoftware',
      });
      vi.mocked(determineStrategy).mockReturnValue('content-based');

      const result = await getDetailRecommendationsCore('review1', 'user1', 3);

      expect(result.recommendations).toHaveLength(1);
      expect(result.strategy).toBe('content-based');
      expect(getContentCandidatesForReview).toHaveBeenCalled();
    });

    it('works without userId (anonymous)', async () => {
      vi.mocked(getReviewSignals).mockResolvedValue({
        category: 'game',
        tagSlugs: ['action'],
        developer: undefined,
        publisher: undefined,
      });
      
      vi.mocked(getContentCandidatesForReview).mockResolvedValue([createMockReview({ id: 'anon1' })]);
      vi.mocked(getTrendingCandidates).mockResolvedValue([]);
      vi.mocked(mergeCandidates).mockImplementation((...sources) => sources.flat());
      
      vi.mocked(computeContentScore).mockReturnValue(0.5);
      vi.mocked(computeUserUserScore).mockReturnValue(0.0);
      vi.mocked(computeItemItemScore).mockReturnValue(0.05);
      vi.mocked(computeTrendingScore).mockReturnValue(0.5);
      vi.mocked(calculateFinalScore).mockReturnValue(0.5);
      vi.mocked(applyMMR).mockImplementation((reviews) => reviews);
      vi.mocked(generateReason).mockReturnValue({
        type: 'tag_overlap',
        label: 'Thematisch ähnlich',
      });
      vi.mocked(determineStrategy).mockReturnValue('content-based');

      const result = await getDetailRecommendationsCore('review1', undefined, 3);

      expect(result.recommendations).toHaveLength(1);
    });
  });

  describe('dismissRecommendation', () => {
    it('creates dismiss record with expiry', async () => {
      vi.mocked(prisma.recommendationDismiss.upsert).mockResolvedValue({
        id: 'dismiss1',
        userId: 'user1',
        reviewId: 'review1',
        reason: 'not_interested',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await dismissRecommendation('user1', 'review1', 'not_interested');

      expect(prisma.recommendationDismiss.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_reviewId: { userId: 'user1', reviewId: 'review1' } },
          create: expect.objectContaining({
            userId: 'user1',
            reviewId: 'review1',
            reason: 'not_interested',
            expiresAt: expect.any(Date),
          }),
          update: expect.objectContaining({
            reason: 'not_interested',
            expiresAt: expect.any(Date),
          }),
        })
      );
    });

    it('uses default reason when not provided', async () => {
      vi.mocked(prisma.recommendationDismiss.upsert).mockResolvedValue({
        id: 'dismiss2',
        userId: 'user1',
        reviewId: 'review1',
        reason: 'not_interested',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await dismissRecommendation('user1', 'review1');

      expect(prisma.recommendationDismiss.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ reason: 'not_interested' }),
          update: expect.objectContaining({ reason: 'not_interested' }),
        })
      );
    });
  });

  describe('isDismissed', () => {
    it('returns true when dismissed', async () => {
      vi.mocked(prisma.recommendationDismiss.findUnique).mockResolvedValue({
        id: 'dismiss1',
        userId: 'user1',
        reviewId: 'review1',
        reason: 'not_interested',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await isDismissed('user1', 'review1');

      expect(result).toBe(true);
    });

    it('returns false when not dismissed', async () => {
      vi.mocked(prisma.recommendationDismiss.findUnique).mockResolvedValue(null);

      const result = await isDismissed('user1', 'review1');

      expect(result).toBe(false);
    });
  });

  describe('getDismissedReviewIds', () => {
    it('returns set of dismissed review IDs', async () => {
      vi.mocked(prisma.recommendationDismiss.findMany).mockResolvedValue([
        {
          id: 'dismiss1',
          userId: 'user1',
          reviewId: 'rev1',
          reason: 'not_interested',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'dismiss2',
          userId: 'user1',
          reviewId: 'rev2',
          reason: 'not_interested',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ]);

      const result = await getDismissedReviewIds('user1');

      expect(result).toEqual(new Set(['rev1', 'rev2']));
    });

    it('returns empty set when no dismisses', async () => {
      vi.mocked(prisma.recommendationDismiss.findMany).mockResolvedValue([]);

      const result = await getDismissedReviewIds('user1');

      expect(result).toEqual(new Set());
    });
  });
});