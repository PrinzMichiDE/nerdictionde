/**
 * reviews — Create validation
 *
 * Zod schema for creating a new review via the API. Strict typing, no `any`.
 * Compatible with Zod v4.
 */

import { z } from "zod";

/**
 * Allowed fields for creating a review. Prevents mass assignment of
 * read-only or relation fields (id, createdAt, updatedAt, comments, etc.).
 */
export const createReviewSchema = z.object({
  title: z.string().min(1).max(200),
  title_en: z.string().max(200).optional().nullable(),
  slug: z.string().min(1).max(200).optional(),
  category: z.enum(["game", "movie", "series", "hardware"]).optional(),
  content: z.string().min(1),
  content_en: z.string().optional().nullable(),
  score: z.coerce.number().min(0).max(100).optional(),
  pros: z.array(z.string()).max(50).optional(),
  pros_en: z.array(z.string()).max(50).optional().nullable(),
  cons: z.array(z.string()).max(50).optional(),
  cons_en: z.array(z.string()).max(50).optional().nullable(),
  images: z.array(z.string()).max(50).optional(),
  youtubeVideos: z.array(z.string()).max(50).optional(),
  status: z.enum(["draft", "published"]).optional(),
  igdbId: z.coerce.number().int().positive().optional().nullable(),
  tmdbId: z.coerce.number().int().positive().optional().nullable(),
  hardwareId: z.string().optional().nullable(),
  steamAppId: z.string().optional().nullable(),
  epicId: z.string().optional().nullable(),
  gogId: z.string().optional().nullable(),
  specs: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  metaKeywords: z.string().max(200).optional().nullable(),
  releaseDate: z.string().datetime().optional().nullable(),
  templateId: z.string().optional().nullable(),
  templateData: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/**
 * Validates and sanitizes a review creation body. Throws ZodError on invalid input.
 */
export function validateCreateReviewBody(body: unknown): CreateReviewInput {
  return createReviewSchema.parse(body);
}
