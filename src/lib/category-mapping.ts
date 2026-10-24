import { ReviewCategory } from '@prisma/client';

/**
 * Maps Review.category (String: "game" | "hardware" | "amazon" | "movie" | "series")
 * to ReviewCategory Enum (GAMES | HARDWARE | MOVIES | SERIES)
 */
export function mapReviewCategoryToEnum(category: string): ReviewCategory | null {
  const mapping: Record<string, ReviewCategory> = {
    game: 'GAMES',
    hardware: 'HARDWARE',
    amazon: 'HARDWARE', // Amazon products are hardware
    movie: 'MOVIES',
    series: 'SERIES',
  };

  const normalized = category.toLowerCase().trim();
  return mapping[normalized] ?? null;
}

/**
 * Maps ReviewCategory Enum to Review.category String
 */
export function mapEnumToReviewCategory(enumValue: ReviewCategory): string {
  const mapping: Record<ReviewCategory, string> = {
    GAMES: 'game',
    HARDWARE: 'hardware',
    MOVIES: 'movie',
    SERIES: 'series',
  };

  return mapping[enumValue];
}

/**
 * Gets the display label for a ReviewCategory
 */
export function getCategoryLabel(category: ReviewCategory): string {
  const labels: Record<ReviewCategory, string> = {
    GAMES: 'Games',
    HARDWARE: 'Hardware',
    MOVIES: 'Movies',
    SERIES: 'Series',
  };
  return labels[category];
}

/**
 * Gets all valid ReviewCategory enum values
 */
export function getAllReviewCategories(): ReviewCategory[] {
  return ['GAMES', 'HARDWARE', 'MOVIES', 'SERIES'];
}