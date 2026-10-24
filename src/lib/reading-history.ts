import type { ReadingHistory, Review, TwitchUser } from '@prisma/client';

/**
 * Reading History Entry mit Review-Daten für API-Response
 */
export interface ReadingHistoryEntry {
  review: {
    id: string;
    slug: string;
    title: string;
    category: string;
    images: string[];
    score: number;
  };
  progress: number;
  scrollDepth: number;
  dwellTime: number;
  lastReadAt: string; // ISO 8601
}

/**
 * Paginierte Antwort für GET /api/reading-history
 */
export interface ReadingHistoryResponse {
  items: ReadingHistoryEntry[];
  nextCursor: string | null;
}

/**
 * Input für Tracking-API (POST /api/reading-history/track)
 */
export interface TrackReadingInput {
  reviewId: string;
  progress: number;      // 0-100
  scrollDepth: number;   // 0-100
  dwellTime: number;     // Sekunden (Delta seit letztem Send)
}

/**
 * Prisma Include für ReadingHistory mit Review
 */
export const readingHistoryWithReviewInclude = {
  review: {
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      images: true,
      score: true,
    },
  },
} as const;

/**
 * Transformiert Prisma ReadingHistory + Review zu API-Response Entry
 */
export function toReadingHistoryEntry(
  history: ReadingHistory & { review: Pick<Review, 'id' | 'slug' | 'title' | 'category' | 'images' | 'score'> }
): ReadingHistoryEntry {
  return {
    review: {
      id: history.review.id,
      slug: history.review.slug,
      title: history.review.title,
      category: history.review.category,
      images: history.review.images,
      score: history.review.score,
    },
    progress: history.progress,
    scrollDepth: history.scrollDepth,
    dwellTime: history.dwellTime,
    lastReadAt: history.lastReadAt.toISOString(),
  };
}

/**
 * Cache-Tag für Reading History eines Users
 */
export function readingHistoryCacheTag(userId: string): string {
  return `reading-history:${userId}`;
}

/**
 * Cache-Tag für Reading History eines spezifischen Reviews eines Users
 */
export function readingHistoryReviewCacheTag(userId: string, reviewId: string): string {
  return `reading-history:${userId}:${reviewId}`;
}