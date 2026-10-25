import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getContentCandidates,
  getCollaborativeCandidates,
  getTrendingCandidates,
  mergeCandidates,
  getReviewSignals,
  getContentCandidatesForReview,
} from '@/lib/recommendations-candidates';
import type { UserSignals } from '@/types/recommendations';

// Mock prisma with vi.fn() inside factory
vi.mock('@/lib/prisma', () => ({
  default: {
    review: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    userRating: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';

const mockReviewFindMany = prisma.review.findMany as unknown as ReturnType<typeof vi.fn>;
const mockReviewFindUnique = prisma.review.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockUserRatingFindMany = prisma.userRating.findMany as unknown as ReturnType<typeof vi.fn>;

type ReviewOverrides = Partial<{
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  category: string;
  score: number;
  images: string[];
  metaDescription: string | null;
  releaseDate: Date | null;
  userRatingAvg: number | null;
  userRatingCount: number | null;
  metadata: Record<string, unknown> | null;
  tags: Array<{ tag: { name: string; slug: string } }>;
}>;

const createMockReview = (overrides: ReviewOverrides = {}) => ({
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
  ...overrides,
});

describe('Recommendations Candidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContentCandidates', () => {
    it('returns empty array when no liked reviews', async () => {
      const signals: UserSignals = {
        ratedReviews: new Map(),
        bookmarkedReviews: new Set(),
        followedUserIds: new Set(),
        readReviewIds: new Set(),
        subscribedCategories: new Set(),
      };

      const result = await getContentCandidates(signals);
      expect(result).toEqual([]);
      expect(mockReviewFindMany).not.toHaveBeenCalled();
    });

    it('fetches liked reviews and finds similar by category', async () => {
      const signals: UserSignals = {
        ratedReviews: new Map([['liked1', 9]]),
        bookmarkedReviews: new Set(),
        followedUserIds: new Set(),
        readReviewIds: new Set(),
        subscribedCategories: new Set(),
      };

      mockReviewFindMany
        .mockResolvedValueOnce([
          { category: 'game', tags: [{ tag: { name: 'Action', slug: 'action' } }], metadata: {} },
        ])
        .mockResolvedValueOnce([createMockReview({ id: 'candidate1' })]);

      const result = await getContentCandidates(signals);

      expect(mockReviewFindMany).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('candidate1');
    });

    it('excludes specified review IDs', async () => {
      const signals: UserSignals = {
        ratedReviews: new Map([['liked1', 9]]),
        bookmarkedReviews: new Set(),
        followedUserIds: new Set(),
        readReviewIds: new Set(),
        subscribedCategories: new Set(),
      };

      mockReviewFindMany
        .mockResolvedValueOnce([
          { category: 'game', tags: [], metadata: {} },
        ])
        .mockResolvedValueOnce([createMockReview({ id: 'candidate1' })]);

      await getContentCandidates(signals, {
        excludeIds: new Set(['candidate1']),
      });

      expect(mockReviewFindMany).toHaveBeenCalledTimes(2);
    });

    it('extracts developers and publishers from metadata', async () => {
      const signals: UserSignals = {
        ratedReviews: new Map([['liked1', 9]]),
        bookmarkedReviews: new Set(),
        followedUserIds: new Set(),
        readReviewIds: new Set(),
        subscribedCategories: new Set(),
      };

      mockReviewFindMany
        .mockResolvedValueOnce([
          {
            category: 'game',
            tags: [],
            metadata: { developer: 'CD Projekt', publisher: 'Bandai Namco' },
          },
        ])
        .mockResolvedValueOnce([]);

      await getContentCandidates(signals);

      const secondCall = mockReviewFindMany.mock.calls[1][0];
      expect(secondCall.where.OR).toContainEqual(
        expect.objectContaining({
          metadata: expect.objectContaining({
            path: ['developer'],
            array_contains: ['CD Projekt'],
          }),
        })
      );
    });
  });

  describe('getCollaborativeCandidates', () => {
    it('returns empty array when no followed users', async () => {
      const signals: UserSignals = {
        ratedReviews: new Map(),
        bookmarkedReviews: new Set(),
        followedUserIds: new Set(),
        readReviewIds: new Set(),
        subscribedCategories: new Set(),
      };

      const result = await getCollaborativeCandidates(signals);
      expect(result).toEqual([]);
      expect(mockUserRatingFindMany).not.toHaveBeenCalled();
    });

    it('fetches high-rated reviews from followed users', async () => {
      const signals: UserSignals = {
        ratedReviews: new Map(),
        bookmarkedReviews: new Set(),
        followedUserIds: new Set(['user2', 'user3']),
        readReviewIds: new Set(),
        subscribedCategories: new Set(),
      };

      mockUserRatingFindMany.mockResolvedValue([
        { review: createMockReview({ id: 'collab1' }) },
        { review: createMockReview({ id: 'collab2' }) },
      ]);

      const result = await getCollaborativeCandidates(signals);

      expect(mockUserRatingFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: { in: ['user2', 'user3'] },
            score: { gte: 8 },
          }),
        })
      );
      expect(result).toHaveLength(2);
    });

    it('deduplicates reviews from multiple followed users', async () => {
      const signals: UserSignals = {
        ratedReviews: new Map(),
        bookmarkedReviews: new Set(),
        followedUserIds: new Set(['user2', 'user3']),
        readReviewIds: new Set(),
        subscribedCategories: new Set(),
      };

      mockUserRatingFindMany.mockResolvedValue([
        { review: createMockReview({ id: 'same-review' }) },
        { review: createMockReview({ id: 'same-review' }) },
        { review: createMockReview({ id: 'other-review' }) },
      ]);

      const result = await getCollaborativeCandidates(signals);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['same-review', 'other-review']);
    });
  });

  describe('getTrendingCandidates', () => {
    it('fetches recent popular reviews', async () => {
      mockReviewFindMany.mockResolvedValue([createMockReview({ id: 'trending1' })]);

      const result = await getTrendingCandidates();

      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            createdAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
          orderBy: expect.arrayContaining([
            expect.objectContaining({ userRatingAvg: 'desc' }),
            expect.objectContaining({ userRatingCount: 'desc' }),
          ]),
        })
      );
      expect(result).toHaveLength(1);
    });

    it('excludes specified review IDs', async () => {
      mockReviewFindMany.mockResolvedValue([]);

      await getTrendingCandidates({ excludeIds: new Set(['exclude1']) });

      const call = mockReviewFindMany.mock.calls[0][0];
      expect(call.where.id.notIn).toContain('exclude1');
    });
  });

  describe('mergeCandidates', () => {
    it('merges multiple sources and deduplicates', () => {
      const source1 = [createMockReview({ id: 'a' }), createMockReview({ id: 'b' })];
      const source2 = [createMockReview({ id: 'b' }), createMockReview({ id: 'c' })];
      const source3 = [createMockReview({ id: 'd' })];

      const result = mergeCandidates(source1, source2, source3);

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('handles empty sources', () => {
      const result = mergeCandidates([], [createMockReview({ id: 'a' })], []);
      expect(result).toHaveLength(1);
    });
  });

  describe('getReviewSignals', () => {
    it('extracts category, tags, developer, publisher', async () => {
      mockReviewFindUnique.mockResolvedValue({
        category: 'game',
        tags: [{ tag: { slug: 'action' } }, { tag: { slug: 'rpg' } }],
        metadata: { developer: 'FromSoftware', publisher: 'Bandai Namco' },
      });

      const result = await getReviewSignals('review1');

      expect(result).toEqual({
        category: 'game',
        tagSlugs: ['action', 'rpg'],
        developer: 'FromSoftware',
        publisher: 'Bandai Namco',
      });
    });

    it('handles missing review', async () => {
      mockReviewFindUnique.mockResolvedValue(null);

      const result = await getReviewSignals('nonexistent');

      expect(result).toEqual({ category: '', tagSlugs: [] });
    });

    it('handles missing metadata', async () => {
      mockReviewFindUnique.mockResolvedValue({
        category: 'movie',
        tags: [{ tag: { slug: 'sci-fi' } }],
        metadata: null,
      });

      const result = await getReviewSignals('review1');

      expect(result).toEqual({
        category: 'movie',
        tagSlugs: ['sci-fi'],
        developer: undefined,
        publisher: undefined,
      });
    });
  });

  describe('getContentCandidatesForReview', () => {
    it('finds candidates by category, tags, developer, publisher', async () => {
      mockReviewFindMany.mockResolvedValue([createMockReview({ id: 'candidate1' })]);

      const result = await getContentCandidatesForReview(
        {
          category: 'game',
          tagSlugs: ['action', 'rpg'],
          developer: 'FromSoftware',
          publisher: 'Bandai Namco',
        },
        { excludeIds: new Set(['current-review']) }
      );

      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { notIn: ['current-review'] },
            OR: expect.arrayContaining([
              expect.objectContaining({ category: 'game' }),
              expect.objectContaining({
                tags: expect.objectContaining({
                  some: expect.objectContaining({
                    tag: expect.objectContaining({ slug: { in: ['action', 'rpg'] } }),
                  }),
                }),
              }),
              expect.objectContaining({
                metadata: expect.objectContaining({ path: ['developer'], equals: 'FromSoftware' }),
              }),
              expect.objectContaining({
                metadata: expect.objectContaining({ path: ['publisher'], equals: 'Bandai Namco' }),
              }),
            ]),
          }),
        })
      );
      expect(result).toHaveLength(1);
    });

    it('works with minimal signals (only category)', async () => {
      mockReviewFindMany.mockResolvedValue([]);

      await getContentCandidatesForReview({ category: 'movie', tagSlugs: [] });

      const call = mockReviewFindMany.mock.calls[0][0];
      expect(call.where.OR).toContainEqual({ category: 'movie' });
    });
  });
});