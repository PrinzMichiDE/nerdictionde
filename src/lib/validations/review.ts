import { z } from "zod";

/**
 * Zod Schemas for Review Validation
 * Ensures type safety and input validation for all review-related operations
 */

export const ReviewCategorySchema = z.enum(["game", "hardware", "amazon"]);
export const ReviewStatusSchema = z.enum(["draft", "published"]);

export const ReviewCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  title_en: z.string().max(200, "English title must be less than 200 characters").optional().nullable(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  category: ReviewCategorySchema.default("game"),
  content: z.string().min(1, "Content is required").max(50000, "Content must be less than 50000 characters"),
  content_en: z.string().max(50000, "English content must be less than 50000 characters").optional().nullable(),
  score: z.number().int().min(0).max(100).default(0),
  pros: z.array(z.string().max(500)).default([]),
  pros_en: z.array(z.string().max(500)).default([]),
  cons: z.array(z.string().max(500)).default([]),
  cons_en: z.array(z.string().max(500)).default([]),
  images: z.array(z.string().url("Invalid image URL")).default([]),
  youtubeVideos: z.array(z.string().url("Invalid YouTube URL")).default([]),
  status: ReviewStatusSchema.default("draft"),
  igdbId: z.number().int().positive().optional().nullable(),
  steamAppId: z.string().optional().nullable(),
  amazonAsin: z.string().regex(/^[A-Z0-9]{10}$/, "Invalid Amazon ASIN format").optional().nullable(),
  affiliateLink: z.string().url("Invalid affiliate link URL").optional().nullable(),
  hardwareId: z.string().optional().nullable(),
  specs: z.record(z.unknown()).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  createdAt: z.string().datetime().optional(),
});

export const ReviewUpdateSchema = ReviewCreateSchema.partial().extend({
  id: z.string().uuid("Invalid review ID"),
});

export const ReviewQuerySchema = z.object({
  category: ReviewCategorySchema.optional(),
  status: ReviewStatusSchema.or(z.literal("all")).optional(),
  query: z.string().max(200).optional(),
  sort: z.enum(["date-desc", "date-asc", "score-desc", "score-asc", "title-asc", "title-desc"]).default("date-desc"),
  minScore: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(100)).optional(),
  maxScore: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(100)).optional(),
  dateFilter: z.enum(["all", "7d", "30d", "90d", "year"]).default("all"),
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100)).default(12),
  all: z.string().transform((val) => val === "true").optional(),
});

export type ReviewCreateInput = z.infer<typeof ReviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof ReviewUpdateSchema>;
export type ReviewQueryInput = z.infer<typeof ReviewQuerySchema>;
