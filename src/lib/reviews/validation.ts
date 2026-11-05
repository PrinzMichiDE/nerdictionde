/**
 * reviews — Validation
 *
 * Zod schemas for validating review update requests. Strict typing, no `any`.
 * Compatible with Zod v4.
 */

import { z } from "zod";

/**
 * Allowed fields for updating a review. Read-only and relation fields are
 * explicitly excluded to prevent mass assignment.
 */
export const updateReviewSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  title_en: z.string().max(200).optional().nullable(),
  slug: z.string().min(1).max(200).optional(),
  category: z.enum(["game", "movie", "series", "hardware"]).optional(),
  content: z.string().min(1).optional(),
  content_en: z.string().optional().nullable(),
  score: z.coerce.number().min(0).max(100).optional(),
  pros: z.array(z.string()).max(20).optional(),
  pros_en: z.array(z.string()).max(20).optional().nullable(),
  cons: z.array(z.string()).max(20).optional(),
  cons_en: z.array(z.string()).max(20).optional().nullable(),
  images: z.array(z.string()).max(20).optional(),
  youtubeVideos: z.array(z.string()).max(20).optional(),
  status: z.enum(["draft", "published"]).optional(),
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

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

/**
 * Raw body type including protected fields, used for safe destructuring
 * before passing validated data to the service layer.
 */
export interface RawUpdateBody {
  title?: string;
  title_en?: string | null;
  slug?: string;
  category?: "game" | "movie" | "series" | "hardware";
  content?: string;
  content_en?: string | null;
  score?: number;
  pros?: string[];
  pros_en?: string[] | null;
  cons?: string[];
  cons_en?: string[] | null;
  images?: string[];
  youtubeVideos?: string[];
  status?: "draft" | "published";
  steamAppId?: string | null;
  epicId?: string | null;
  gogId?: string | null;
  specs?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  releaseDate?: string | null;
  templateId?: string | null;
  templateData?: Record<string, unknown> | null;
  // Protected fields — must never reach the database directly
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: unknown;
  userRatings?: unknown;
}

/**
 * Validates and sanitizes a review update body. Throws ZodError on invalid input.
 */
export function validateUpdateReviewBody(
  body: unknown
): UpdateReviewInput {
  return updateReviewSchema.parse(body);
}
