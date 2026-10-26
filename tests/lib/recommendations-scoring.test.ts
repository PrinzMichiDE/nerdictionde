import { describe, it, expect } from 'vitest';
import {
  computeContentScore,
  computeUserUserScore,
  computeItemItemScore,
  computeTrendingScore,
  calculateFinalScore,
  applyMMR,
  generateReason,
  determineStrategy,
  DEFAULT_SCORING_CONFIG,
} from '@/lib/recommendations-scoring';
import type { UserSignals, ReviewWithTags } from '@/types/recommendations';

const createMockReview = (overrides: Partial<ReviewWithTags> = {}): ReviewWithTags => ({
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

const createMockSignals = (overrides: Partial<UserSignals> = {}): UserSignals => ({
  ratedReviews: new Map<string, number>(),
  bookmarkedReviews: new Set<string>(),
  followedUserIds: new Set<string>(),
  readReviewIds: new Set<string>(),
  subscribedCategories: new Set<string>(),
  ...overrides,
});

describe('Recommendations Scoring', () => {
  describe('computeContentScore', () => {
    it('returns base score for review with tags', () => {
      const review = createMockReview({ tags: [{ tag: { name: 'Action', slug: 'action' } }] });
      const signals = createMockSignals();

      const score = computeContentScore(review, signals);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('includes editorial score in calculation', () => {
      const highScoreReview = createMockReview({ score: 100 });
      const lowScoreReview = createMockReview({ score: 50 });
      const signals = createMockSignals();

      const highScore = computeContentScore(highScoreReview, signals);
      const lowScore = computeContentScore(lowScoreReview, signals);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('includes user rating average when available', () => {
      const highRatedReview = createMockReview({ userRatingAvg: 9.5, userRatingCount: 100 });
      const lowRatedReview = createMockReview({ userRatingAvg: 5.0, userRatingCount: 100 });
      const signals = createMockSignals();

      const highScore = computeContentScore(highRatedReview, signals);
      const lowScore = computeContentScore(lowRatedReview, signals);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('handles missing user ratings gracefully', () => {
      const review = createMockReview({ userRatingAvg: null, userRatingCount: 0 });
      const signals = createMockSignals();

      const score = computeContentScore(review, signals);

      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeUserUserScore', () => {
    it('returns base score when user has follows', () => {
      const review = createMockReview();
      const signals = createMockSignals({ followedUserIds: new Set(['user2', 'user3']) });

      const score = computeUserUserScore(review, signals);

      expect(score).toBe(0.1);
    });

    it('returns 0 when user has no follows', () => {
      const review = createMockReview();
      const signals = createMockSignals({ followedUserIds: new Set() });

      const score = computeUserUserScore(review, signals);

      expect(score).toBe(0);
    });
  });

  describe('computeItemItemScore', () => {
    it('returns baseline score', () => {
      const review = createMockReview();
      const signals = createMockSignals();

      const score = computeItemItemScore(review, signals);

      expect(score).toBe(0.05);
    });
  });

  describe('computeTrendingScore', () => {
    it('combines editorial score and user ratings', () => {
      const review = createMockReview({ score: 90, userRatingAvg: 9.0, userRatingCount: 100 });

      const score = computeTrendingScore(review);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('gives recency boost for recent releases', () => {
      const recentReview = createMockReview({
        releaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      });
      const oldReview = createMockReview({
        releaseDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
      });

      const recentScore = computeTrendingScore(recentReview);
      const oldScore = computeTrendingScore(oldReview);

      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('handles missing release date', () => {
      const review = createMockReview({ releaseDate: null });

      const score = computeTrendingScore(review);

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('caps score at 1', () => {
      const review = createMockReview({ score: 100, userRatingAvg: 10, userRatingCount: 1000 });

      const score = computeTrendingScore(review);

      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateFinalScore', () => {
    it('computes weighted sum correctly', () => {
      const scores = { content: 0.8, userUser: 0.6, itemItem: 0.4, trending: 0.7 };
      const weights = DEFAULT_SCORING_CONFIG.weights;

      const final = calculateFinalScore(scores, weights);

      const expected =
        scores.content * weights.content +
        scores.userUser * weights.userUser +
        scores.itemItem * weights.itemItem +
        scores.trending * weights.trending;

      expect(final).toBeCloseTo(expected, 5);
    });

    it('handles zero weights', () => {
      const scores = { content: 1, userUser: 1, itemItem: 1, trending: 1 };
      const weights = { content: 0, userUser: 0, itemItem: 0, trending: 0 };

      const final = calculateFinalScore(scores, weights);

      expect(final).toBe(0);
    });
  });

  describe('applyMMR', () => {
    it('returns single candidate as-is', () => {
      const candidates = [createMockReview({ id: 'a' })];
      const scores = new Map([['a', 0.9]]);

      const result = applyMMR(candidates, scores, 0.3);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('selects highest scored candidate first', () => {
      const candidates = [
        createMockReview({ id: 'low', score: 50 }),
        createMockReview({ id: 'high', score: 90 }),
      ];
      const scores = new Map([['low', 0.3], ['high', 0.9]]);

      const result = applyMMR(candidates, scores, 0.3);

      expect(result[0].id).toBe('high');
    });

    it('diversifies selection with lambda > 0', () => {
      // Two very similar reviews (same category, tags, developer)
      const similar1 = createMockReview({
        id: 'sim1',
        category: 'game',
        tags: [{ tag: { name: 'Action', slug: 'action' } }],
        metadata: { developer: 'Dev1', publisher: 'Pub1' },
      });
      const similar2 = createMockReview({
        id: 'sim2',
        category: 'game',
        tags: [{ tag: { name: 'Action', slug: 'action' } }],
        metadata: { developer: 'Dev1', publisher: 'Pub1' },
      });
      // One different review
      const different = createMockReview({
        id: 'diff',
        category: 'movie',
        tags: [{ tag: { name: 'Drama', slug: 'drama' } }],
        metadata: { developer: 'Dev2', publisher: 'Pub2' },
      });

      const candidates = [similar1, similar2, different];
      const scores = new Map([['sim1', 0.9], ['sim2', 0.85], ['diff', 0.8]]);

      const result = applyMMR(candidates, scores, 0.5);

      // With high lambda, should pick diverse candidates
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('sim1'); // Highest score first
      // Second should be 'diff' due to diversity (less similar to sim1 than sim2)
    });

    it('with lambda=0, behaves like pure relevance sort', () => {
      const candidates = [
        createMockReview({ id: 'a', score: 70 }),
        createMockReview({ id: 'b', score: 90 }),
        createMockReview({ id: 'c', score: 80 }),
      ];
      const scores = new Map([['a', 0.7], ['b', 0.9], ['c', 0.8]]);

      const result = applyMMR(candidates, scores, 0);

      expect(result.map(r => r.id)).toEqual(['b', 'c', 'a']);
    });
  });

  describe('generateReason', () => {
    it('returns rated_similar reason when user has high ratings', () => {
      const review = createMockReview();
      const signals = createMockSignals({
        ratedReviews: new Map([['rated1', 9], ['rated2', 8]]),
      });
      const scores = { content: 0.6, userUser: 0.1, itemItem: 0.05, trending: 0.1 };

      const reason = generateReason(review, signals, scores);

      expect(reason.type).toBe('rated_similar');
      expect(reason.label).toContain('bewertet hast');
    });

    it('returns category_subscription reason when subscribed', () => {
      const review = createMockReview({ category: 'game' });
      const signals = createMockSignals({
        subscribedCategories: new Set(['GAMES']),
      });
      const scores = { content: 0.3, userUser: 0.1, itemItem: 0.05, trending: 0.1 };

      const reason = generateReason(review, signals, scores);

      expect(reason.type).toBe('category_subscription');
      expect(reason.label).toContain('Games');
    });

    it('returns same_developer reason when metadata matches', () => {
      const review = createMockReview({ metadata: { developer: 'FromSoftware' } });
      const signals = createMockSignals();
      const scores = { content: 0.4, userUser: 0.1, itemItem: 0.05, trending: 0.1 };

      const reason = generateReason(review, signals, scores);

      expect(reason.type).toBe('same_developer');
      expect(reason.label).toContain('FromSoftware');
    });

    it('returns same_publisher reason when metadata matches', () => {
      const review = createMockReview({ metadata: { publisher: 'Bandai Namco' } });
      const signals = createMockSignals();
      const scores = { content: 0.3, userUser: 0.1, itemItem: 0.05, trending: 0.1 };

      const reason = generateReason(review, signals, scores);

      expect(reason.type).toBe('same_publisher');
      expect(reason.label).toContain('Bandai Namco');
    });

    it('returns tag_overlap reason for thematic similarity', () => {
      const review = createMockReview({
        tags: [
          { tag: { name: 'Action', slug: 'action' } },
          { tag: { name: 'RPG', slug: 'rpg' } },
        ],
        metadata: { developer: 'Test Dev' }, // No publisher
      });
      const signals = createMockSignals();
      const scores = { content: 0.25, userUser: 0.1, itemItem: 0.05, trending: 0.1 };

      const reason = generateReason(review, signals, scores);

      expect(reason.type).toBe('tag_overlap');
      expect(reason.label).toContain('Action');
    });

    it('returns trending reason for highly trending reviews', () => {
      const review = createMockReview({ score: 95, userRatingAvg: 9.8, userRatingCount: 500 });
      const signals = createMockSignals();
      const scores = { content: 0.1, userUser: 0.0, itemItem: 0.0, trending: 0.8 };

      const reason = generateReason(review, signals, scores);

      expect(reason.type).toBe('trending');
      expect(reason.label).toContain('beliebt');
    });

    it('returns top_rated as fallback', () => {
      const review = createMockReview({ score: 80 });
      const signals = createMockSignals();
      const scores = { content: 0.1, userUser: 0.0, itemItem: 0.0, trending: 0.1 };

      const reason = generateReason(review, signals, scores);

      expect(reason.type).toBe('top_rated');
      expect(reason.label).toContain('bewertet');
    });
  });

  describe('determineStrategy', () => {
    it('returns cold-start for new users', () => {
      const signals = createMockSignals();
      const strategy = determineStrategy(signals, false);
      expect(strategy).toBe('cold-start');
    });

    it('returns cold-start for users with only 2 signals', () => {
      const signals = createMockSignals({
        ratedReviews: new Map([['r1', 8]]),
        bookmarkedReviews: new Set(['b1']),
      });
      const strategy = determineStrategy(signals, false);
      expect(strategy).toBe('cold-start');
    });

    it('returns content-based for users with ratings/bookmarks', () => {
      const signals = createMockSignals({
        ratedReviews: new Map([['r1', 8], ['r2', 9], ['r3', 7]]),
      });
      const strategy = determineStrategy(signals, false);
      expect(strategy).toBe('content-based');
    });

    it('returns hybrid for users with follows and signals', () => {
      const signals = createMockSignals({
        ratedReviews: new Map([['r1', 8]]),
        followedUserIds: new Set(['u1', 'u2']),
      });
      const strategy = determineStrategy(signals, true);
      expect(strategy).toBe('hybrid');
    });

    it('returns trending for users with only follows', () => {
      const signals = createMockSignals({
        followedUserIds: new Set(['u1']),
      });
      const strategy = determineStrategy(signals, false);
      expect(strategy).toBe('trending');
    });
  });
});