import { describe, it, expect } from 'vitest';
import {
  dismissRecommendationSchema,
  recommendationsQuerySchema,
  reviewRecommendationsQuerySchema,
  recommendationReasonSchema,
  reviewSummarySchema,
  recommendationItemSchema,
  recommendationsResponseSchema,
  dismissResponseSchema,
} from '@/lib/recommendation-schema';

describe('Recommendation Schemas', () => {
  describe('dismissRecommendationSchema', () => {
    it('validates valid input with all fields', () => {
      const input = {
        reviewId: 'clx123abc456def789',
        reason: 'not_interested',
      };
      const result = dismissRecommendationSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviewId).toBe(input.reviewId);
        expect(result.data.reason).toBe('not_interested');
      }
    });

    it('validates valid input with default reason', () => {
      const input = {
        reviewId: 'clx123abc456def789',
      };
      const result = dismissRecommendationSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe('not_interested');
      }
    });

    it('rejects invalid reviewId (not a CUID)', () => {
      const input = {
        reviewId: 'invalid-id',
        reason: 'not_interested',
      };
      const result = dismissRecommendationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects invalid reason', () => {
      const input = {
        reviewId: 'clx123abc456def789',
        reason: 'invalid_reason',
      };
      const result = dismissRecommendationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing reviewId', () => {
      const input = {
        reason: 'not_interested',
      };
      const result = dismissRecommendationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('recommendationsQuerySchema', () => {
    it('validates with defaults', () => {
      const result = recommendationsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.cursor).toBeUndefined();
      }
    });

    it('validates with custom limit', () => {
      const result = recommendationsQuerySchema.safeParse({ limit: '5' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);
      }
    });

    it('rejects limit > 20', () => {
      const result = recommendationsQuerySchema.safeParse({ limit: '25' });
      expect(result.success).toBe(false);
    });

    it('rejects limit < 1', () => {
      const result = recommendationsQuerySchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });

    it('validates cursor', () => {
      const result = recommendationsQuerySchema.safeParse({ cursor: 'abc123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('abc123');
      }
    });
  });

  describe('reviewRecommendationsQuerySchema', () => {
    it('validates with defaults', () => {
      const result = reviewRecommendationsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);
      }
    });

    it('validates with custom limit', () => {
      const result = reviewRecommendationsQuerySchema.safeParse({ limit: '3' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(3);
      }
    });

    it('rejects limit > 10', () => {
      const result = reviewRecommendationsQuerySchema.safeParse({ limit: '15' });
      expect(result.success).toBe(false);
    });
  });

  describe('recommendationReasonSchema', () => {
    it('validates all reason types', () => {
      const types = [
        'rated_similar',
        'bookmarked_similar',
        'followed_user',
        'category_subscription',
        'same_developer',
        'same_publisher',
        'tag_overlap',
        'trending',
        'top_rated',
      ];

      for (const type of types) {
        const result = recommendationReasonSchema.safeParse({
          type,
          label: 'Test Label',
          metadata: { key: 'value' },
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid type', () => {
      const result = recommendationReasonSchema.safeParse({
        type: 'invalid_type',
        label: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('validates without metadata', () => {
      const result = recommendationReasonSchema.safeParse({
        type: 'rated_similar',
        label: 'Test',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('reviewSummarySchema', () => {
    const validReview = {
      id: 'clx123abc456def789',
      slug: 'test-review',
      title: 'Test Review',
      title_en: 'Test Review EN',
      category: 'game',
      score: 85,
      images: ['https://example.com/image.jpg'],
      metaDescription: 'A great review',
      releaseDate: new Date('2024-01-15'),
      userRatingAvg: 8.5,
      userRatingCount: 42,
      metadata: { developer: 'Test Dev' },
    };

    it('validates complete review', () => {
      const result = reviewSummarySchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('validates minimal review (optional fields omitted)', () => {
      const minimal = {
        id: 'clx123abc456def789',
        slug: 'test-review',
        title: 'Test Review',
        category: 'game',
        score: 85,
        images: [],
      };
      const result = reviewSummarySchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('validates with null optional fields', () => {
      const withNulls = {
        ...validReview,
        title_en: null,
        metaDescription: null,
        releaseDate: null,
        metadata: null,
      };
      const result = reviewSummarySchema.safeParse(withNulls);
      expect(result.success).toBe(true);
    });

    it('rejects invalid score (>100)', () => {
      const result = reviewSummarySchema.safeParse({ ...validReview, score: 101 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid score (<0)', () => {
      const result = reviewSummarySchema.safeParse({ ...validReview, score: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid image URL', () => {
      const result = reviewSummarySchema.safeParse({ ...validReview, images: ['not-a-url'] });
      expect(result.success).toBe(false);
    });
  });

  describe('recommendationItemSchema', () => {
    const validItem = {
      review: {
        id: 'clx123abc456def789',
        slug: 'test-review',
        title: 'Test Review',
        category: 'game',
        score: 85,
        images: ['https://example.com/image.jpg'],
      },
      reason: {
        type: 'rated_similar',
        label: 'Weil du ähnliches bewertet hast',
      },
      score: 0.87,
    };

    it('validates complete item', () => {
      const result = recommendationItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('rejects score > 1', () => {
      const result = recommendationItemSchema.safeParse({ ...validItem, score: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects score < 0', () => {
      const result = recommendationItemSchema.safeParse({ ...validItem, score: -0.1 });
      expect(result.success).toBe(false);
    });
  });

  describe('recommendationsResponseSchema', () => {
    const validResponse = {
      recommendations: [
        {
          review: {
            id: 'clx123abc456def789',
            slug: 'test-review',
            title: 'Test Review',
            category: 'game',
            score: 85,
            images: ['https://example.com/image.jpg'],
          },
          reason: {
            type: 'rated_similar',
            label: 'Weil du ähnliches bewertet hast',
          },
          score: 0.87,
        },
      ],
      nextCursor: 'cursor123',
      strategy: 'hybrid',
    };

    it('validates complete response', () => {
      const result = recommendationsResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('validates without nextCursor', () => {
      const { nextCursor, ...rest } = validResponse;
      const result = recommendationsResponseSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it('validates all strategy types', () => {
      const strategies = [
        'content-based',
        'user-user',
        'item-item',
        'trending',
        'cold-start',
        'hybrid',
      ];

      for (const strategy of strategies) {
        const result = recommendationsResponseSchema.safeParse({
          ...validResponse,
          strategy,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid strategy', () => {
      const result = recommendationsResponseSchema.safeParse({
        ...validResponse,
        strategy: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('dismissResponseSchema', () => {
    it('validates success response', () => {
      const result = dismissResponseSchema.safeParse({ success: true });
      expect(result.success).toBe(true);
    });

    it('validates failure response', () => {
      const result = dismissResponseSchema.safeParse({ success: false });
      expect(result.success).toBe(true);
    });
  });
});