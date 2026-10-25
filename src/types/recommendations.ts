import { z } from 'zod';

// ============================================
// Types
// ============================================

export type RecommendationStrategy = 
  | 'content-based'
  | 'user-user'
  | 'item-item'
  | 'trending'
  | 'cold-start'
  | 'hybrid';

export interface RecommendationReason {
  type: 'rated_similar' | 'bookmarked_similar' | 'followed_user' | 'category_subscription' | 'same_developer' | 'same_publisher' | 'tag_overlap' | 'trending' | 'top_rated';
  label: string;
  metadata?: Record<string, unknown>;
}

export interface RecommendationItem {
  review: ReviewSummary;
  reason: RecommendationReason;
  score: number;
}

export interface ReviewSummary {
  id: string;
  slug: string;
  title: string;
  title_en?: string | null;
  category: string;
  score: number;
  images: string[];
  metaDescription?: string | null;
  releaseDate?: Date | null;
  userRatingAvg?: number;
  userRatingCount?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UserSignals {
  ratedReviews: Map<string, number>;           // reviewId -> score (0-10)
  bookmarkedReviews: Set<string>;              // reviewIds
  followedUserIds: Set<string>;                // userIds
  readReviewIds: Set<string>;                  // reviewIds from reading history (>50% progress)
  subscribedCategories: Set<string>;           // category strings: GAMES, HARDWARE, MOVIES, SERIES
}

export interface RecommendationResult {
  recommendations: RecommendationItem[];
  nextCursor?: string;
  strategy: RecommendationStrategy;
}

export interface DismissReason {
  value: 'not_interested' | 'already_read' | 'irrelevant';
  label: string;
}

export const DISMISS_REASONS: DismissReason[] = [
  { value: 'not_interested', label: 'Nicht interessant' },
  { value: 'already_read', label: 'Bereits gelesen' },
  { value: 'irrelevant', label: 'Nicht relevant' },
];

// ============================================
// Zod Schemas
// ============================================

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

export type RecommendationReasonOutput = z.infer<typeof recommendationReasonSchema>;

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

export type ReviewSummaryOutput = z.infer<typeof reviewSummarySchema>;

export const recommendationItemSchema = z.object({
  review: reviewSummarySchema,
  reason: recommendationReasonSchema,
  score: z.number().min(0).max(1),
});

export type RecommendationItemOutput = z.infer<typeof recommendationItemSchema>;

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

export type RecommendationsResponseOutput = z.infer<typeof recommendationsResponseSchema>;

export const dismissResponseSchema = z.object({
  success: z.boolean(),
});

export type DismissResponseOutput = z.infer<typeof dismissResponseSchema>;