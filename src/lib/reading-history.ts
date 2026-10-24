import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import type { ReadingHistory, Review } from '@prisma/client';

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

/**
 * Holt den Leseverlauf eines Users (paginiert, Cursor-basiert)
 * Verwendet unstable_cache mit 30s TTL und Tag-basierter Invaliderung
 */
export const getReadingHistory = unstable_cache(
  async (
    userId: string,
    cursor: string | null,
    limit: number
  ): Promise<ReadingHistoryResponse> => {
    const where = {
      userId,
      ...(cursor && { lastReadAt: { lt: new Date(cursor) } }),
    };

    const items = await prisma.readingHistory.findMany({
      where,
      include: readingHistoryWithReviewInclude,
      orderBy: { lastReadAt: 'desc' },
      take: limit + 1, // +1 für hasMore-Check
    });

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore
      ? resultItems[resultItems.length - 1].lastReadAt.toISOString()
      : null;

    return {
      items: resultItems.map(toReadingHistoryEntry),
      nextCursor,
    };
  },
  ['reading-history'],
  {
    tags: ['reading-history'],
    revalidate: 30, // 30 Sekunden
  }
);

/**
 * Holt einen einzelnen History-Eintrag für ein Review (für Review-Detail Badge)
 */
export const getReadingHistoryForReview = unstable_cache(
  async (userId: string, reviewId: string): Promise<ReadingHistoryEntry | null> => {
    const history = await prisma.readingHistory.findUnique({
      where: {
        userId_reviewId: { userId, reviewId },
      },
      include: readingHistoryWithReviewInclude,
    });

    if (!history) return null;
    return toReadingHistoryEntry(history);
  },
  ['reading-history-review'],
  {
    tags: ['reading-history'],
    revalidate: 30,
  }
);

/**
 * Trackt/aktualisiert Lesefortschritt (Upsert)
 * progress = max(alt, neu), scrollDepth = max(alt, neu), dwellTime += neu
 */
export async function trackReading(
  userId: string,
  input: TrackReadingInput
): Promise<ReadingHistory> {
  const { reviewId, progress, scrollDepth, dwellTime } = input;

  return prisma.readingHistory.upsert({
    where: {
      userId_reviewId: { userId, reviewId },
    },
    create: {
      userId,
      reviewId,
      progress,
      scrollDepth,
      dwellTime,
      lastReadAt: new Date(),
    },
    update: {
      progress: { increment: 0 }, // Platzhalter, wir nutzen raw SQL unten
      scrollDepth: { increment: 0 },
      dwellTime: { increment: dwellTime },
      lastReadAt: new Date(),
    },
  });
}

/**
 * Trackt Lesefortschritt mit korrekter Max-Logik (raw query für atomic max)
 */
export async function trackReadingAtomic(
  userId: string,
  input: TrackReadingInput
): Promise<ReadingHistory> {
  const { reviewId, progress, scrollDepth, dwellTime } = input;

  // Atomic upsert mit GREATEST für progress und scrollDepth
  const result = await prisma.$queryRaw<ReadingHistory[]>`
    INSERT INTO "reading_history" ("id", "user_id", "review_id", "progress", "scroll_depth", "dwell_time", "last_read_at", "created_at", "updated_at")
    VALUES (gen_random_uuid()::text, ${userId}, ${reviewId}, ${progress}, ${scrollDepth}, ${dwellTime}, NOW(), NOW(), NOW())
    ON CONFLICT ("user_id", "review_id") DO UPDATE SET
      "progress" = GREATEST("reading_history"."progress", EXCLUDED."progress"),
      "scroll_depth" = GREATEST("reading_history"."scroll_depth", EXCLUDED."scroll_depth"),
      "dwell_time" = "reading_history"."dwell_time" + EXCLUDED."dwell_time",
      "last_read_at" = NOW(),
      "updated_at" = NOW()
    RETURNING *
  `;

  return result[0];
}

/**
 * Löscht einen einzelnen History-Eintrag
 */
export async function deleteReadingHistoryEntry(
  userId: string,
  reviewId: string
): Promise<boolean> {
  const result = await prisma.readingHistory.deleteMany({
    where: { userId, reviewId },
  });
  return result.count > 0;
}

/**
 * Löscht den gesamten Leseverlauf eines Users
 */
export async function clearReadingHistory(userId: string): Promise<number> {
  const result = await prisma.readingHistory.deleteMany({
    where: { userId },
  });
  return result.count;
}