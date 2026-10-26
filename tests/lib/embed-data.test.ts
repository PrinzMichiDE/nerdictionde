// ============================================
// Embed Data Unit Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEmbedReviewData, getEmbedCollectionData, getEmbedSeriesData, getEmbedData } from '@/lib/embed-data';
import { isReviewEmbedEnabled } from '@/lib/feature-flags';
import { EmbedReviewData, EmbedCollectionData, EmbedSeriesData } from '@/types/embed';
import { Prisma } from '@prisma/client';
import { SeriesType, SeriesVisibility } from '@prisma/client';

// Mock environment
vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://nerdiction.de');

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  default: {
    review: { findUnique: vi.fn() },
    reviewCollection: { findUnique: vi.fn() },
    reviewSeries: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/feature-flags', () => ({
  isReviewEmbedEnabled: vi.fn(() => true),
  FEATURE_REVIEW_EMBED: true,
}));

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
}));

import prisma from '@/lib/prisma';

// Helper to create a full mock review object
function createMockReview(overrides: Partial<{
  slug: string;
  title: string;
  content: string;
  score: number;
  category: string;
  status: string;
  images: string[];
  pros: string[];
  cons: string[];
  specs: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}> = {}) {
  return {
    id: 'review_1',
    slug: 'test-review',
    title: 'Test Review',
    title_en: null,
    content: 'Test content for review.',
    content_en: null,
    score: 80,
    pros: [],
    pros_en: [],
    cons: [],
    cons_en: [],
    images: [],
    youtubeVideos: [],
    category: 'game',
    status: 'published',
    igdbId: null,
    tmdbId: null,
    steamAppId: null,
    epicId: null,
    gogId: null,
    amazonAsin: null,
    affiliateLink: null,
    hardwareId: null,
    specs: {} as Prisma.JsonValue,
    metadata: {} as Prisma.JsonValue,
    metaDescription: null,
    metaKeywords: null,
    releaseDate: null,
    userRatingCount: 0,
    userRatingAvg: 0,
    shareCounts: {},
    seriesId: null,
    seriesOrder: null,
    templateId: null,
    templateData: null,
    templateVersion: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Helper to create a full mock collection object
function createMockCollection(overrides: Partial<{
  slug: string;
  title: string;
  description: string | null;
  deletedAt: Date | null;
  isPublic: boolean;
  ownerId: string;
  owner: { username: string; displayName: string; profileImageUrl: string | null };
  coverImage: string | null;
  createdAt: Date;
  items: Array<{ position: number; review: { slug: string; title: string; score: number; images: string[] } }>;
}> = {}) {
  return {
    id: 'coll_1',
    slug: 'test-collection',
    title: 'Test Collection',
    description: 'Test description',
    isPublic: true,
    ownerId: 'user_1',
    owner: { username: 'user', displayName: 'User', profileImageUrl: null },
    itemCount: 0,
    followersCount: 0,
    shareCounts: {},
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    items: [],
    ...overrides,
  };
}

// Helper to create a full mock series object
function createMockSeries(overrides: Partial<{
  slug: string;
  title: string;
  description: string | null;
  visibility: SeriesVisibility;
  deletedAt: Date | null;
  coverImage: string | null;
  createdAt: Date;
  owner: { username: string; displayName: string; profileImageUrl: string | null } | null;
  items: Array<{ seriesOrder: number; review: { slug: string; title: string; score: number } }>;
  type: SeriesType;
}> = {}) {
  return {
    id: 'series_1',
    slug: 'test-series',
    title: 'Test Series',
    description: 'Test description',
    coverImage: null,
    partCount: 0,
    aggregateScore: null,
    shareCounts: {},
    followersCount: 0,
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ownerId: null,
    owner: null,
    visibility: SeriesVisibility.PUBLIC,
    type: SeriesType.ADMIN,
    items: [],
    ...overrides,
  };
}

describe('embed-data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isReviewEmbedEnabled).mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getEmbedReviewData', () => {
    it('returns null when feature disabled', async () => {
      vi.mocked(isReviewEmbedEnabled).mockReturnValue(false);
      const result = await getEmbedReviewData('test-slug');
      expect(result).toBeNull();
    });

    it('returns null when review not found', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null);
      const result = await getEmbedReviewData('test-slug');
      expect(result).toBeNull();
    });

    it('returns null when review not published', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue(createMockReview({ status: 'draft' }));
      const result = await getEmbedReviewData('test-slug');
      expect(result).toBeNull();
    });

    it('returns formatted review data', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue(createMockReview({
        slug: 'elden-ring',
        title: 'Elden Ring',
        content: 'FromSoftware masterpiece with open world exploration.',
        score: 95,
        category: 'game',
        status: 'published',
        images: ['https://example.com/cover.jpg'],
        pros: ['Open World', 'Combat'],
        cons: ['Technical issues'],
        specs: { Developer: 'FromSoftware' } as Prisma.JsonValue,
        metadata: { developer: 'FromSoftware', publisher: 'Bandai Namco', genres: ['RPG'], platforms: ['PC', 'PS5'] } as Prisma.JsonValue,
        createdAt: new Date('2024-03-15T10:00:00Z'),
      }));

      const result = await getEmbedReviewData('elden-ring');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('review');
      expect(result?.slug).toBe('elden-ring');
      expect(result?.title).toBe('Elden Ring');
      expect(result?.score).toBe(9.5);
      expect(result?.scoreLabel).toBe('Meisterwerk');
      expect(result?.categoryLabel).toBe('Games');
      expect(result?.coverImage).toBe('https://example.com/cover.jpg');
      expect(result?.author).toBeUndefined();
      expect(result?.specs.Developer).toBe('FromSoftware');
      expect(result?.specs.Publisher).toBe('Bandai Namco');
      expect(result?.specs.Genres).toEqual(['RPG']);
      expect(result?.specs.Platforms).toEqual(['PC', 'PS5']);
      expect(result?.url).toBe('https://nerdiction.de/reviews/elden-ring');
    });

    it('handles missing optional fields', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue(createMockReview({
        slug: 'minimal',
        title: 'Minimal Review',
        content: 'Short content.',
        score: 50,
        category: 'movie',
        status: 'published',
        images: [],
        pros: [],
        cons: [],
        specs: {} as Prisma.JsonValue,
        metadata: {} as Prisma.JsonValue,
        createdAt: new Date('2024-01-01'),
      }));

      const result = await getEmbedReviewData('minimal');

      expect(result).not.toBeNull();
      expect(result?.score).toBe(5);
      expect(result?.scoreLabel).toBe('Mittel');
      expect(result?.categoryLabel).toBe('Movies');
      expect(result?.coverImage).toBeNull();
    });
  });

  describe('getEmbedCollectionData', () => {
    it('returns null when feature disabled', async () => {
      vi.mocked(isReviewEmbedEnabled).mockReturnValue(false);
      const result = await getEmbedCollectionData('test-slug');
      expect(result).toBeNull();
    });

    it('returns null when collection not found', async () => {
      vi.mocked(prisma.reviewCollection.findUnique).mockResolvedValue(null);
      const result = await getEmbedCollectionData('test-slug');
      expect(result).toBeNull();
    });

    it('returns null when collection deleted', async () => {
      vi.mocked(prisma.reviewCollection.findUnique).mockResolvedValue(createMockCollection({ deletedAt: new Date() }));
      const result = await getEmbedCollectionData('deleted');
      expect(result).toBeNull();
    });

    it('returns null when collection not public', async () => {
      vi.mocked(prisma.reviewCollection.findUnique).mockResolvedValue(createMockCollection({ isPublic: false }));
      const result = await getEmbedCollectionData('private');
      expect(result).toBeNull();
    });

    it('returns formatted collection data', async () => {
      vi.mocked(prisma.reviewCollection.findUnique).mockResolvedValue(createMockCollection({
        slug: 'best-games',
        title: 'Best Games 2024',
        description: 'Top games',
        isPublic: true,
        owner: { username: 'max', displayName: 'Max', profileImageUrl: 'https://example.com/avatar.png' },
        coverImage: null,
        createdAt: new Date('2024-01-15'),
        items: [
          { position: 1, review: { slug: 'game-1', title: 'Game 1', score: 90, images: ['https://example.com/g1.jpg'] } },
          { position: 2, review: { slug: 'game-2', title: 'Game 2', score: 85, images: [] } },
        ],
      }));

      const result = await getEmbedCollectionData('best-games');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('collection');
      expect(result?.slug).toBe('best-games');
      expect(result?.title).toBe('Best Games 2024');
      expect(result?.itemCount).toBe(2);
      expect(result?.items).toHaveLength(2);
      expect(result?.items[0].position).toBe(1);
      expect(result?.items[0].review.title).toBe('Game 1');
      expect(result?.items[0].review.score).toBe(9);
      expect(result?.owner.avatar).toBe('https://example.com/avatar.png');
      expect(result?.url).toBe('https://nerdiction.de/listen/best-games');
    });

    it('filters out unpublished reviews', async () => {
      vi.mocked(prisma.reviewCollection.findUnique).mockResolvedValue(createMockCollection({
        slug: 'mixed',
        title: 'Mixed',
        isPublic: true,
        items: [
          { position: 1, review: { slug: 'pub', title: 'Published', score: 90, images: [] } },
        ],
      }));

      const result = await getEmbedCollectionData('mixed');
      expect(result?.items).toHaveLength(1);
    });

    it('uses first item image as cover when collection has no cover', async () => {
      vi.mocked(prisma.reviewCollection.findUnique).mockResolvedValue(createMockCollection({
        slug: 'no-cover',
        title: 'No Cover Collection',
        coverImage: null,
        items: [
          { position: 1, review: { slug: 'game-1', title: 'Game 1', score: 90, images: ['https://example.com/item1.jpg'] } },
        ],
      }));

      const result = await getEmbedCollectionData('no-cover');
      expect(result?.coverImage).toBe('https://example.com/item1.jpg');
    });
  });

  describe('getEmbedSeriesData', () => {
    it('returns null when feature disabled', async () => {
      vi.mocked(isReviewEmbedEnabled).mockReturnValue(false);
      const result = await getEmbedSeriesData('test-slug');
      expect(result).toBeNull();
    });

    it('returns null when series not found', async () => {
      vi.mocked(prisma.reviewSeries.findUnique).mockResolvedValue(null);
      const result = await getEmbedSeriesData('test-slug');
      expect(result).toBeNull();
    });

    it('returns null when series deleted', async () => {
      vi.mocked(prisma.reviewSeries.findUnique).mockResolvedValue(createMockSeries({ deletedAt: new Date() }));
      const result = await getEmbedSeriesData('deleted');
      expect(result).toBeNull();
    });

    it('returns null when series private', async () => {
      vi.mocked(prisma.reviewSeries.findUnique).mockResolvedValue(createMockSeries({ visibility: SeriesVisibility.PRIVATE }));
      const result = await getEmbedSeriesData('private');
      expect(result).toBeNull();
    });

    it('returns formatted series data', async () => {
      vi.mocked(prisma.reviewSeries.findUnique).mockResolvedValue(createMockSeries({
        slug: 'elden-ring-series',
        title: 'Elden Ring Series',
        description: 'All reviews',
        visibility: SeriesVisibility.PUBLIC,
        owner: { username: 'max', displayName: 'Max', profileImageUrl: 'https://example.com/avatar.png' },
        coverImage: 'https://example.com/cover.jpg',
        createdAt: new Date('2024-06-15'),
        items: [
          { seriesOrder: 1, review: { slug: 'base', title: 'Elden Ring', score: 95 } },
          { seriesOrder: 2, review: { slug: 'dlc', title: 'Shadow of the Erdtree', score: 90 } },
        ],
      }));

      const result = await getEmbedSeriesData('elden-ring-series');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('series');
      expect(result?.slug).toBe('elden-ring-series');
      expect(result?.title).toBe('Elden Ring Series');
      expect(result?.partCount).toBe(2);
      expect(result?.parts).toHaveLength(2);
      expect(result?.parts[0].order).toBe(1);
      expect(result?.parts[0].review.title).toBe('Elden Ring');
      expect(result?.parts[0].review.score).toBe(9.5);
      expect(result?.owner.username).toBe('max');
      expect(result?.url).toBe('https://nerdiction.de/serien/elden-ring-series');
    });

    it('handles series without owner', async () => {
      vi.mocked(prisma.reviewSeries.findUnique).mockResolvedValue(createMockSeries({
        slug: 'admin-series',
        title: 'Admin Series',
        owner: null,
      }));

      const result = await getEmbedSeriesData('admin-series');

      expect(result).not.toBeNull();
      expect(result?.owner.username).toBe('');
      expect(result?.owner.displayName).toBe('Nerdiction');
    });
  });

  describe('getEmbedData (unified)', () => {
    it('routes to review', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue(createMockReview({ status: 'published' }));
      const result = await getEmbedData('review', 'test');
      expect(result?.type).toBe('review');
    });

    it('routes to collection', async () => {
      vi.mocked(prisma.reviewCollection.findUnique).mockResolvedValue(createMockCollection({ isPublic: true }));
      const result = await getEmbedData('collection', 'test');
      expect(result?.type).toBe('collection');
    });

    it('routes to series', async () => {
      vi.mocked(prisma.reviewSeries.findUnique).mockResolvedValue(createMockSeries({ visibility: SeriesVisibility.PUBLIC }));
      const result = await getEmbedData('series', 'test');
      expect(result?.type).toBe('series');
    });
  });
});