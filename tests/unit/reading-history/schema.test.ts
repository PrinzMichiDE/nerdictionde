import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readingHistoryQuerySchema, trackReadingBodySchema, readingHistoryParamsSchema } from '@/lib/reading-history-schema';

describe('Reading History Schemas', () => {
  describe('readingHistoryQuerySchema', () => {
    it('should parse valid query with defaults', () => {
      const result = readingHistoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.cursor).toBeUndefined();
      }
    });

    it('should parse valid query with custom limit and cursor', () => {
      const result = readingHistoryQuerySchema.safeParse({
        limit: '30',
        cursor: '2024-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(30);
        expect(result.data.cursor).toBe('2024-01-01T00:00:00.000Z');
      }
    });

    it('should reject limit > 50', () => {
      const result = readingHistoryQuerySchema.safeParse({ limit: '51' });
      expect(result.success).toBe(false);
    });

    it('should reject limit < 1', () => {
      const result = readingHistoryQuerySchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid cursor format', () => {
      const result = readingHistoryQuerySchema.safeParse({ cursor: 'invalid-date' });
      expect(result.success).toBe(false);
    });
  });

  describe('trackReadingBodySchema', () => {
    it('should parse valid tracking body', () => {
      const result = trackReadingBodySchema.safeParse({
        reviewId: 'ck1234567890abcdef123456',
        progress: 75,
        scrollDepth: 80,
        dwellTime: 120,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.progress).toBe(75);
        expect(result.data.scrollDepth).toBe(80);
        expect(result.data.dwellTime).toBe(120);
      }
    });

    it('should reject invalid reviewId', () => {
      const result = trackReadingBodySchema.safeParse({
        reviewId: 'invalid-id',
        progress: 50,
        scrollDepth: 50,
        dwellTime: 30,
      });
      expect(result.success).toBe(false);
    });

    it('should reject progress > 100', () => {
      const result = trackReadingBodySchema.safeParse({
        reviewId: 'ck1234567890abcdef123456',
        progress: 101,
        scrollDepth: 50,
        dwellTime: 30,
      });
      expect(result.success).toBe(false);
    });

    it('should reject progress < 0', () => {
      const result = trackReadingBodySchema.safeParse({
        reviewId: 'ck1234567890abcdef123456',
        progress: -1,
        scrollDepth: 50,
        dwellTime: 30,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative dwellTime', () => {
      const result = trackReadingBodySchema.safeParse({
        reviewId: 'ck1234567890abcdef123456',
        progress: 50,
        scrollDepth: 50,
        dwellTime: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('readingHistoryParamsSchema', () => {
    it('should parse valid reviewId', () => {
      const result = readingHistoryParamsSchema.safeParse({
        reviewId: 'ck1234567890abcdef123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid reviewId', () => {
      const result = readingHistoryParamsSchema.safeParse({
        reviewId: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});