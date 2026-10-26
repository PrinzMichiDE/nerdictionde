import { z } from "zod";

/**
 * Zod-Schemas für Review-Serien (Admin & Public)
 * Konsistent mit Collections/Reactions/Compare Patterns
 */

// ============================================
// Admin Schemas
// ============================================

export const createSeriesSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(200),
  description: z.string().max(5000).optional(),
  coverImage: z.string().url("Ungültige Cover-URL").optional().or(z.literal("")),
});

export const updateSeriesSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  items: z
    .array(
      z.object({
        reviewId: z.string().cuid("Ungültige Review-ID"),
        seriesOrder: z.number().int().positive("Reihenfolge muss positiv sein"),
      })
    )
    .optional(),
});

export const reorderSeriesSchema = z.object({
  items: z.array(
    z.object({
      reviewId: z.string().cuid("Ungültige Review-ID"),
      seriesOrder: z.number().int().positive("Reihenfolge muss positiv sein"),
    })
  ),
  version: z.number().int().positive("Version muss positiv sein"),
});

export const addSeriesItemSchema = z.object({
  reviewId: z.string().cuid("Ungültige Review-ID"),
});

export const seriesParamsSchema = z.object({
  slug: z.string().min(1, "Slug ist erforderlich"),
});

export const seriesItemParamsSchema = z.object({
  slug: z.string().min(1),
  reviewId: z.string().cuid("Ungültige Review-ID"),
});

// ============================================
// Public Query Schemas (Extended for User Series)
// ============================================

export const seriesListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(100).optional(),
  sort: z.enum(["title", "createdAt", "partCount", "followersCount"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  type: z.enum(["ADMIN", "USER"]).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  ownerId: z.string().cuid().optional(),
});

// ============================================
// Type Exports
// ============================================

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;
export type UpdateSeriesInput = z.infer<typeof updateSeriesSchema>;
export type ReorderSeriesInput = z.infer<typeof reorderSeriesSchema>;
export type AddSeriesItemInput = z.infer<typeof addSeriesItemSchema>;
export type SeriesParams = z.infer<typeof seriesParamsSchema>;
export type SeriesItemParams = z.infer<typeof seriesItemParamsSchema>;
export type SeriesListQuery = z.infer<typeof seriesListQuerySchema>;

// ============================================
// Public Response Types (für API Contracts)
// ============================================

export interface PublicSeries {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  partCount: number;
  aggregateScore: number | null;
  followersCount: number;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string | null;
  ownerUsername: string | null;
  type: "ADMIN" | "USER";
  visibility: "PUBLIC" | "PRIVATE";
}

export interface PublicSeriesWithParts extends PublicSeries {
  parts: PublicSeriesPart[];
}

export interface PublicSeriesPart {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  category: string;
  score: number;
  coverImage: string | null;
  releaseDate: Date | null;
  excerpt: string | null;
  seriesOrder: number;
}

export interface SeriesListResponse {
  series: PublicSeries[];
  nextCursor: string | null;
}