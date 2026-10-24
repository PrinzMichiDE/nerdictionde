import { describe, it, expect } from 'vitest';
import {
  mapReviewCategoryToEnum,
  mapEnumToReviewCategory,
  getCategoryLabel,
  getAllReviewCategories,
} from '@/lib/category-mapping';
import { ReviewCategory } from '@prisma/client';

describe('category-mapping', () => {
  describe('mapReviewCategoryToEnum', () => {
    it('maps "game" to GAMES', () => {
      expect(mapReviewCategoryToEnum('game')).toBe(ReviewCategory.GAMES);
    });

    it('maps "hardware" to HARDWARE', () => {
      expect(mapReviewCategoryToEnum('hardware')).toBe(ReviewCategory.HARDWARE);
    });

    it('maps "amazon" to HARDWARE', () => {
      expect(mapReviewCategoryToEnum('amazon')).toBe(ReviewCategory.HARDWARE);
    });

    it('maps "movie" to MOVIES', () => {
      expect(mapReviewCategoryToEnum('movie')).toBe(ReviewCategory.MOVIES);
    });

    it('maps "series" to SERIES', () => {
      expect(mapReviewCategoryToEnum('series')).toBe(ReviewCategory.SERIES);
    });

    it('handles case insensitivity', () => {
      expect(mapReviewCategoryToEnum('GAME')).toBe(ReviewCategory.GAMES);
      expect(mapReviewCategoryToEnum('Game')).toBe(ReviewCategory.GAMES);
      expect(mapReviewCategoryToEnum('AMAZON')).toBe(ReviewCategory.HARDWARE);
    });

    it('handles whitespace', () => {
      expect(mapReviewCategoryToEnum(' game ')).toBe(ReviewCategory.GAMES);
    });

    it('returns null for unknown category', () => {
      expect(mapReviewCategoryToEnum('unknown')).toBeNull();
      expect(mapReviewCategoryToEnum('')).toBeNull();
    });
  });

  describe('mapEnumToReviewCategory', () => {
    it('maps GAMES to "game"', () => {
      expect(mapEnumToReviewCategory(ReviewCategory.GAMES)).toBe('game');
    });

    it('maps HARDWARE to "hardware"', () => {
      expect(mapEnumToReviewCategory(ReviewCategory.HARDWARE)).toBe('hardware');
    });

    it('maps MOVIES to "movie"', () => {
      expect(mapEnumToReviewCategory(ReviewCategory.MOVIES)).toBe('movie');
    });

    it('maps SERIES to "series"', () => {
      expect(mapEnumToReviewCategory(ReviewCategory.SERIES)).toBe('series');
    });
  });

  describe('getCategoryLabel', () => {
    it('returns correct labels', () => {
      expect(getCategoryLabel(ReviewCategory.GAMES)).toBe('Games');
      expect(getCategoryLabel(ReviewCategory.HARDWARE)).toBe('Hardware');
      expect(getCategoryLabel(ReviewCategory.MOVIES)).toBe('Movies');
      expect(getCategoryLabel(ReviewCategory.SERIES)).toBe('Series');
    });
  });

  describe('getAllReviewCategories', () => {
    it('returns all 4 categories', () => {
      const categories = getAllReviewCategories();
      expect(categories).toHaveLength(4);
      expect(categories).toContain(ReviewCategory.GAMES);
      expect(categories).toContain(ReviewCategory.HARDWARE);
      expect(categories).toContain(ReviewCategory.MOVIES);
      expect(categories).toContain(ReviewCategory.SERIES);
    });
  });

  describe('roundtrip consistency', () => {
    it('enum -> string -> enum returns same value', () => {
      const allCategories = getAllReviewCategories();
      for (const cat of allCategories) {
        const str = mapEnumToReviewCategory(cat);
        const back = mapReviewCategoryToEnum(str);
        expect(back).toBe(cat);
      }
    });

    it('string -> enum -> string returns same value (for known categories)', () => {
      const knownCategories = ['game', 'hardware', 'movie', 'series', 'amazon'];
      for (const str of knownCategories) {
        const en = mapReviewCategoryToEnum(str);
        if (en) {
          const back = mapEnumToReviewCategory(en);
          // Note: "amazon" maps to HARDWARE which maps back to "hardware"
          // This is expected behavior
          if (str !== 'amazon') {
            expect(back).toBe(str);
          }
        }
      }
    });
  });
});