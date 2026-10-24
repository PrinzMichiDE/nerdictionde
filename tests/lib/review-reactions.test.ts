import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactionType } from '@/types/review-reactions';

vi.mock('@/lib/prisma', () => ({
  default: {
    reviewReaction: {
      groupBy: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
    },
  },
}));

import { getReactionCounts, getUserReaction, getReviewReactionsData, toggleReaction, removeReaction, ensureReviewPublished } from '@/lib/review-reactions';
import prisma from '@/lib/prisma';

const mockGroupBy = vi.mocked(prisma.reviewReaction.groupBy);
const mockFindUnique = vi.mocked(prisma.reviewReaction.findUnique);
const mockUpsert = vi.mocked(prisma.reviewReaction.upsert);
const mockDelete = vi.mocked(prisma.reviewReaction.delete);
const mockReviewFindUnique = vi.mocked(prisma.review.findUnique);

const REACTION_TYPES: ReactionType[] = ['THUMBS_UP', 'HEART', 'PARTY', 'THINKING', 'CRY', 'ANGRY'];

describe('review-reactions server logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReactionCounts', () => {
    it('returns zero counts when no reactions exist', async () => {
      mockGroupBy.mockResolvedValue([]);

      const counts = await getReactionCounts('clx1234567890abcdefghijkl');

      expect(counts).toEqual({
        THUMBS_UP: 0,
        HEART: 0,
        PARTY: 0,
        THINKING: 0,
        CRY: 0,
        ANGRY: 0,
      });
    });

    it('aggregates counts correctly from groupBy result', async () => {
      mockGroupBy.mockResolvedValue([
        { type: 'THUMBS_UP', _count: { type: 42 } },
        { type: 'HEART', _count: { type: 12 } },
        { type: 'PARTY', _count: { type: 5 } },
      ] as any);

      const counts = await getReactionCounts('clx1234567890abcdefghijkl');

      expect(counts).toEqual({
        THUMBS_UP: 42,
        HEART: 12,
        PARTY: 5,
        THINKING: 0,
        CRY: 0,
        ANGRY: 0,
      });
    });
  });

  describe('getUserReaction', () => {
    it('returns null when user has no reaction', async () => {
      mockFindUnique.mockResolvedValue(null);

      const reaction = await getUserReaction('user-1', 'clx1234567890abcdefghijkl');

      expect(reaction).toBeNull();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId_reviewId: { userId: 'user-1', reviewId: 'clx1234567890abcdefghijkl' } },
        select: { type: true },
      });
    });

    it('returns reaction type when user has reacted', async () => {
      mockFindUnique.mockResolvedValue({ type: 'HEART' } as any);

      const reaction = await getUserReaction('user-1', 'clx1234567890abcdefghijkl');

      expect(reaction).toBe('HEART');
    });
  });

  describe('getReviewReactionsData', () => {
    it('combines counts and user reaction', async () => {
      mockGroupBy.mockResolvedValue([
        { type: 'THUMBS_UP', _count: { type: 10 } },
      ] as any);
      mockFindUnique.mockResolvedValue({ type: 'THUMBS_UP' } as any);

      const data = await getReviewReactionsData('clx1234567890abcdefghijkl', 'user-1');

      expect(data).toEqual({
        counts: {
          THUMBS_UP: 10,
          HEART: 0,
          PARTY: 0,
          THINKING: 0,
          CRY: 0,
          ANGRY: 0,
        },
        total: 10,
        myReaction: 'THUMBS_UP',
      });
    });

    it('returns null myReaction when userId is null', async () => {
      mockGroupBy.mockResolvedValue([]);

      const data = await getReviewReactionsData('clx1234567890abcdefghijkl', null);

      expect(data.myReaction).toBeNull();
      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  describe('toggleReaction', () => {
    it('upserts reaction and returns updated data', async () => {
      mockUpsert.mockResolvedValue({
        id: 'reaction-1',
        userId: 'user-1',
        reviewId: 'clx1234567890abcdefghijkl',
        type: 'HEART',
        createdAt: new Date(),
      } as any);
      mockGroupBy.mockResolvedValue([{ type: 'HEART', _count: { type: 1 } }] as any);
      mockFindUnique.mockResolvedValue({ type: 'HEART' } as any);

      const data = await toggleReaction('user-1', 'clx1234567890abcdefghijkl', 'HEART');

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId_reviewId: { userId: 'user-1', reviewId: 'clx1234567890abcdefghijkl' } },
        create: { userId: 'user-1', reviewId: 'clx1234567890abcdefghijkl', type: 'HEART' },
        update: { type: 'HEART' },
      });
      expect(data.myReaction).toBe('HEART');
      expect(data.total).toBe(1);
    });
  });

  describe('removeReaction', () => {
    it('deletes reaction and returns updated data', async () => {
      mockFindUnique
        .mockResolvedValueOnce({ type: 'THUMBS_UP', userId: 'user-1', reviewId: 'clx1234567890abcdefghijkl', id: 'r1', createdAt: new Date() } as any)
        .mockResolvedValueOnce(null);
      mockDelete.mockResolvedValue({ id: 'r1' } as any);
      mockGroupBy.mockResolvedValue([]);

      const data = await removeReaction('user-1', 'clx1234567890abcdefghijkl', 'THUMBS_UP');

      expect(mockDelete).toHaveBeenCalledWith({
        where: { userId_reviewId: { userId: 'user-1', reviewId: 'clx1234567890abcdefghijkl' } },
      });
      expect(data.total).toBe(0);
      expect(data.myReaction).toBeNull();
    });

    it('does nothing if reaction type does not match', async () => {
      mockFindUnique.mockResolvedValue({ type: 'HEART' } as any);
      mockGroupBy.mockResolvedValue([{ type: 'HEART', _count: { type: 1 } }] as any);

      const data = await removeReaction('user-1', 'clx1234567890abcdefghijkl', 'THUMBS_UP');

      expect(mockDelete).not.toHaveBeenCalled();
      expect(data.total).toBe(1);
      expect(data.myReaction).toBe('HEART');
    });
  });

  describe('ensureReviewPublished', () => {
    it('returns true for published review', async () => {
      mockReviewFindUnique.mockResolvedValue({ status: 'published' } as any);

      const result = await ensureReviewPublished('clx1234567890abcdefghijkl');

      expect(result).toBe(true);
    });

    it('returns false for draft review', async () => {
      mockReviewFindUnique.mockResolvedValue({ status: 'draft' } as any);

      const result = await ensureReviewPublished('clx1234567890abcdefghijkl');

      expect(result).toBe(false);
    });

    it('returns false for non-existent review', async () => {
      mockReviewFindUnique.mockResolvedValue(null);

      const result = await ensureReviewPublished('clx1234567890abcdefghijkl');

      expect(result).toBe(false);
    });
  });
});