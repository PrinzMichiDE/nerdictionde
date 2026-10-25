// ============================================
// Embed Schema Unit Tests
// ============================================

import { describe, it, expect } from 'vitest';
import {
  embedTypeSchema,
  embedThemeSchema,
  embedAuthorSchema,
  embedReviewDataSchema,
  embedCollectionDataSchema,
  embedSeriesDataSchema,
  embedDataSchema,
  embedWidgetPropsSchema,
  embedParamsSchema,
  embedQuerySchema,
  type EmbedParams,
  type EmbedQuery,
  type EmbedWidgetProps,
} from '@/lib/embed-schema';

describe('embed-schema', () => {
  describe('embedTypeSchema', () => {
    it('accepts valid types', () => {
      expect(embedTypeSchema.parse('review')).toBe('review');
      expect(embedTypeSchema.parse('collection')).toBe('collection');
      expect(embedTypeSchema.parse('series')).toBe('series');
    });

    it('rejects invalid types', () => {
      expect(() => embedTypeSchema.parse('invalid')).toThrow();
      expect(() => embedTypeSchema.parse('user')).toThrow();
    });
  });

  describe('embedThemeSchema', () => {
    it('accepts valid themes', () => {
      expect(embedThemeSchema.parse('auto')).toBe('auto');
      expect(embedThemeSchema.parse('light')).toBe('light');
      expect(embedThemeSchema.parse('dark')).toBe('dark');
    });

    it('rejects invalid themes', () => {
      expect(() => embedThemeSchema.parse('system')).toThrow();
      expect(() => embedThemeSchema.parse('')).toThrow();
    });
  });

  describe('embedAuthorSchema', () => {
    it('accepts valid author', () => {
      const author = {
        username: 'max',
        displayName: 'Max Mustermann',
        avatar: 'https://example.com/avatar.png',
      };
      expect(embedAuthorSchema.parse(author)).toEqual(author);
    });

    it('accepts null avatar', () => {
      const author = {
        username: 'max',
        displayName: 'Max Mustermann',
        avatar: null,
      };
      expect(embedAuthorSchema.parse(author)).toEqual(author);
    });

    it('rejects missing fields', () => {
      expect(() => embedAuthorSchema.parse({ username: 'max' })).toThrow();
      expect(() => embedAuthorSchema.parse({ displayName: 'Max' })).toThrow();
    });

    it('rejects invalid avatar URL', () => {
      expect(() =>
        embedAuthorSchema.parse({
          username: 'max',
          displayName: 'Max',
          avatar: 'not-a-url',
        })
      ).toThrow();
    });
  });

  describe('embedReviewDataSchema', () => {
    const validReview = {
      type: 'review' as const,
      slug: 'elden-ring-review',
      title: 'Elden Ring – Review',
      excerpt: 'FromSoftware masterpiece...',
      score: 9.5,
      scoreLabel: 'Meisterwerk',
      category: 'game',
      categoryLabel: 'Games',
      coverImage: 'https://example.com/cover.jpg',
      coverAlt: 'Elden Ring Cover',
      author: {
        username: 'max',
        displayName: 'Max Mustermann',
        avatar: 'https://example.com/avatar.png',
      },
      publishedAt: '2024-03-15T10:00:00.000Z',
      url: 'https://nerdiction.de/reviews/elden-ring-review',
      pros: ['Open World', 'Combat'],
      cons: ['Technical issues'],
      specs: { Developer: 'FromSoftware', Platforms: ['PC', 'PS5'] },
    };

    it('accepts valid review data', () => {
      expect(embedReviewDataSchema.parse(validReview)).toEqual(validReview);
    });

    it('defaults empty arrays for pros/cons', () => {
      const { pros, cons, ...rest } = validReview;
      const parsed = embedReviewDataSchema.parse(rest);
      expect(parsed.pros).toEqual([]);
      expect(parsed.cons).toEqual([]);
    });

    it('defaults empty object for specs', () => {
      const { specs, ...rest } = validReview;
      const parsed = embedReviewDataSchema.parse(rest);
      expect(parsed.specs).toEqual({});
    });

    it('rejects invalid score range', () => {
      expect(() => embedReviewDataSchema.parse({ ...validReview, score: 11 })).toThrow();
      expect(() => embedReviewDataSchema.parse({ ...validReview, score: -1 })).toThrow();
    });

    it('rejects invalid publishedAt format', () => {
      expect(() =>
        embedReviewDataSchema.parse({ ...validReview, publishedAt: '2024-03-15' })
      ).toThrow();
    });

    it('rejects invalid URLs', () => {
      expect(() => embedReviewDataSchema.parse({ ...validReview, coverImage: 'not-url' })).toThrow();
      expect(() => embedReviewDataSchema.parse({ ...validReview, url: 'not-url' })).toThrow();
    });

    it('accepts specs with string arrays', () => {
      const review = { ...validReview, specs: { Platforms: ['PC', 'PS5'], Genre: 'RPG' } };
      expect(embedReviewDataSchema.parse(review)).toEqual(review);
    });
  });

  describe('embedCollectionDataSchema', () => {
    const validCollection = {
      type: 'collection' as const,
      slug: 'best-rpgs-2024',
      title: 'Best RPGs 2024',
      description: 'Our top 10...',
      itemCount: 10,
      owner: {
        username: 'max',
        displayName: 'Max Mustermann',
        avatar: 'https://example.com/avatar.png',
      },
      coverImage: 'https://example.com/cover.jpg',
      createdAt: '2024-01-15T10:00:00.000Z',
      url: 'https://nerdiction.de/listen/best-rpgs-2024',
      items: [
        {
          position: 1,
          review: {
            slug: 'game-1',
            title: 'Game 1',
            score: 9.5,
            coverImage: 'https://example.com/game1.jpg',
          },
        },
      ],
    };

    it('accepts valid collection data', () => {
      expect(embedCollectionDataSchema.parse(validCollection)).toEqual(validCollection);
    });

    it('defaults empty items array', () => {
      const { items, ...rest } = validCollection;
      const parsed = embedCollectionDataSchema.parse(rest);
      expect(parsed.items).toEqual([]);
    });

    it('rejects negative itemCount', () => {
      expect(() => embedCollectionDataSchema.parse({ ...validCollection, itemCount: -1 })).toThrow();
    });

    it('rejects invalid position in items', () => {
      expect(() =>
        embedCollectionDataSchema.parse({
          ...validCollection,
          items: [{ position: 0, review: validCollection.items[0].review }],
        })
      ).toThrow();
    });
  });

  describe('embedSeriesDataSchema', () => {
    const validSeries = {
      type: 'series' as const,
      slug: 'elden-ring-dlc-reviews',
      title: 'Elden Ring: All DLC Reviews',
      description: 'Base Game + Shadow of the Erdtree',
      partCount: 2,
      owner: {
        username: 'max',
        displayName: 'Max Mustermann',
        avatar: 'https://example.com/avatar.png',
      },
      coverImage: 'https://example.com/cover.jpg',
      createdAt: '2024-06-15T10:00:00.000Z',
      url: 'https://nerdiction.de/serien/elden-ring-dlc-reviews',
      parts: [
        { order: 1, review: { slug: 'base', title: 'Elden Ring', score: 9.5 } },
        { order: 2, review: { slug: 'dlc', title: 'Shadow of the Erdtree', score: 9.0 } },
      ],
    };

    it('accepts valid series data', () => {
      expect(embedSeriesDataSchema.parse(validSeries)).toEqual(validSeries);
    });

    it('defaults empty parts array', () => {
      const { parts, ...rest } = validSeries;
      const parsed = embedSeriesDataSchema.parse(rest);
      expect(parsed.parts).toEqual([]);
    });

    it('rejects invalid order in parts', () => {
      expect(() =>
        embedSeriesDataSchema.parse({
          ...validSeries,
          parts: [{ order: 0, review: validSeries.parts[0].review }],
        })
      ).toThrow();
    });
  });

  describe('embedDataSchema (discriminated union)', () => {
    it('validates review type', () => {
      const review = {
        type: 'review' as const,
        slug: 'test',
        title: 'Test',
        excerpt: '',
        score: 5,
        scoreLabel: 'OK',
        category: 'game',
        categoryLabel: 'Games',
        coverImage: null,
        coverAlt: 'Test Cover',
        author: { username: 'u', displayName: 'User', avatar: null },
        publishedAt: '2024-01-01T00:00:00.000Z',
        url: 'https://nerdiction.de/reviews/test',
        pros: [],
        cons: [],
        specs: {},
      };
      expect(embedDataSchema.parse(review)).toEqual(review);
    });

    it('validates collection type', () => {
      const collection = {
        type: 'collection' as const,
        slug: 'test',
        title: 'Test',
        description: '',
        itemCount: 0,
        owner: { username: 'u', displayName: 'User', avatar: null },
        coverImage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        url: 'https://nerdiction.de/listen/test',
        items: [],
      };
      expect(embedDataSchema.parse(collection)).toEqual(collection);
    });

    it('validates series type', () => {
      const series = {
        type: 'series' as const,
        slug: 'test',
        title: 'Test',
        description: '',
        partCount: 0,
        owner: { username: 'u', displayName: 'User', avatar: null },
        coverImage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        url: 'https://nerdiction.de/serien/test',
        parts: [],
      };
      expect(embedDataSchema.parse(series)).toEqual(series);
    });

    it('rejects unknown type', () => {
      expect(() =>
        embedDataSchema.parse({
          type: 'unknown',
          slug: 'test',
        })
      ).toThrow();
    });
  });

  describe('embedWidgetPropsSchema', () => {
    it('accepts minimal valid props', () => {
      const props = { type: 'review' as const, slug: 'test-review' };
      const parsed = embedWidgetPropsSchema.parse(props);
      expect(parsed.theme).toBe('auto');
      expect(parsed.consent).toBe(true);
      expect(parsed.compact).toBe(false);
    });

    it('accepts all options', () => {
      const props = {
        type: 'collection' as const,
        slug: 'test-collection',
        theme: 'dark' as const,
        consent: false,
        compact: true,
      };
      expect(embedWidgetPropsSchema.parse(props)).toEqual(props);
    });

    it('rejects invalid type', () => {
      expect(() => embedWidgetPropsSchema.parse({ type: 'invalid', slug: 'test' })).toThrow();
    });
  });

  describe('embedParamsSchema', () => {
    it('accepts valid params', () => {
      expect(embedParamsSchema.parse({ type: 'review', slug: 'test' })).toEqual({
        type: 'review',
        slug: 'test',
      });
      expect(embedParamsSchema.parse({ type: 'series', slug: 'my-series' })).toEqual({
        type: 'series',
        slug: 'my-series',
      });
    });

    it('rejects missing slug', () => {
      expect(() => embedParamsSchema.parse({ type: 'review' })).toThrow();
    });

    it('rejects empty slug', () => {
      expect(() => embedParamsSchema.parse({ type: 'review', slug: '' })).toThrow();
    });

    it('rejects too long slug', () => {
      expect(() => embedParamsSchema.parse({ type: 'review', slug: 'a'.repeat(201) })).toThrow();
    });
  });

  describe('embedQuerySchema', () => {
    it('accepts valid query', () => {
      expect(embedQuerySchema.parse({ v: 'abc123', fields: 'title,score' })).toEqual({
        v: 'abc123',
        fields: 'title,score',
      });
    });

    it('accepts empty query', () => {
      expect(embedQuerySchema.parse({})).toEqual({});
    });

    it('accepts partial query', () => {
      expect(embedQuerySchema.parse({ v: '1' })).toEqual({ v: '1', fields: undefined });
    });
  });

  // Type inference tests (compile-time only)
  it('infers correct types', () => {
    const params: EmbedParams = { type: 'review', slug: 'test' };
    const query: EmbedQuery = { v: '1' };
    const props: EmbedWidgetProps = { type: 'collection', slug: 'test', theme: 'light', consent: true, compact: false };

    expect(params.type).toBe('review');
    expect(query.v).toBe('1');
    expect(props.theme).toBe('light');
  });
});