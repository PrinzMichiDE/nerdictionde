// ============================================
// Zod Schemas for Recommendations API
// ============================================

import { z } from 'zod';

export const dismissReasonSchema = z.enum(['not_interested', 'already_read', 'irrelevant']);

export const dismissRecommendationSchema = z.object({
  reviewId: z.string().cuid({ message: 'Ungültige Review-ID' }),
  reason: dismissReasonSchema.default('not_interested'),
});

export type DismissRecommendationInput = z.infer<typeof dismissRecommendationSchema>;

export const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  cursor: z.string().optional(),
});

export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;

export const reviewRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type ReviewRecommendationsQuery = z.infer<typeof reviewRecommendationsQuerySchema>;

export const recommendationReasonSchema = z.object({
  type: z.enum([
    'rated_similar',
    'bookmarked_similar',
    'followed_user',
    'category_subscription',
    'same_developer',
    'same_publisher',
    'tag_overlap',
    'trending',
    'top_rated',
  ]),
  label: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const reviewSummarySchema = z.object({
  id: z.string().cuid(),
  slug: z.string(),
  title: z.string(),
  title_en: z.string().nullable().optional(),
  category: z.string(),
  score: z.number().int().min(0).max(100),
  images: z.array(z.string().url()),
  metaDescription: z.string().nullable().optional(),
  releaseDate: z.union([z.date(), z.string().datetime()]).nullable().optional(),
  userRatingAvg: z.number().optional(),
  userRatingCount: z.number().int().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const recommendationItemSchema = z.object({
  review: reviewSummarySchema,
  reason: recommendationReasonSchema,
  score: z.number().min(0).max(1),
});

export const recommendationsResponseSchema = z.object({
  recommendations: z.array(recommendationItemSchema),
  nextCursor: z.string().optional(),
  strategy: z.enum([
    'content-based',
    'user-user',
    'item-item',
    'trending',
    'cold-start',
    'hybrid',
  ]),
});

export const dismissResponseSchema = z.object({
  success: z.boolean(),
});