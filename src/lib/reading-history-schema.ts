import { z } from 'zod';

/**
 * Query-Parameter für GET /api/reading-history
 */
export const readingHistoryQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ReadingHistoryQuery = z.infer<typeof readingHistoryQuerySchema>;

/**
 * Body für POST /api/reading-history/track
 */
export const trackReadingBodySchema = z.object({
  reviewId: z.string().cuid(),
  progress: z.number().int().min(0).max(100),
  scrollDepth: z.number().int().min(0).max(100),
  dwellTime: z.number().int().min(0),
});

export type TrackReadingBody = z.infer<typeof trackReadingBodySchema>;

/**
 * Path-Parameter für DELETE /api/reading-history/[reviewId]
 */
export const readingHistoryParamsSchema = z.object({
  reviewId: z.string().cuid(),
});

export type ReadingHistoryParams = z.infer<typeof readingHistoryParamsSchema>;

/**
 * Response-Schemas für API-Dokumentation/Validierung
 */
export const readingHistoryEntrySchema = z.object({
  review: z.object({
    id: z.string().cuid(),
    slug: z.string(),
    title: z.string(),
    category: z.string(),
    images: z.array(z.string().url()),
    score: z.number().int().min(0).max(100),
  }),
  progress: z.number().int().min(0).max(100),
  scrollDepth: z.number().int().min(0).max(100),
  dwellTime: z.number().int().min(0),
  lastReadAt: z.string().datetime({ offset: true }),
});

export type ReadingHistoryEntrySchema = z.infer<typeof readingHistoryEntrySchema>;

export const readingHistoryResponseSchema = z.object({
  items: z.array(readingHistoryEntrySchema),
  nextCursor: z.string().datetime({ offset: true }).nullable(),
});

export type ReadingHistoryResponseSchema = z.infer<typeof readingHistoryResponseSchema>;

export const trackReadingResponseSchema = z.object({
  success: z.literal(true),
  entry: z.object({
    id: z.string().cuid(),
    userId: z.string().cuid(),
    reviewId: z.string().cuid(),
    progress: z.number().int().min(0).max(100),
    scrollDepth: z.number().int().min(0).max(100),
    dwellTime: z.number().int().min(0),
    lastReadAt: z.string().datetime({ offset: true }),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  }),
});

export type TrackReadingResponseSchema = z.infer<typeof trackReadingResponseSchema>;

export const deleteReadingHistoryResponseSchema = z.object({
  success: z.literal(true),
  deletedCount: z.number().int().min(0).optional(),
});

export type DeleteReadingHistoryResponseSchema = z.infer<typeof deleteReadingHistoryResponseSchema>;