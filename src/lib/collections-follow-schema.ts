import { z } from 'zod';

/**
 * Zod Schemas für Collections Follow Feature
 * Wiederverwendet bestehende Patterns aus review-reactions-schema.ts, collections-schema.ts
 */

// ============================================
// Parameter Schemas
// ============================================

/** Slug-Parameter für Listen-Routes (bereits in collections-schema.ts definiert, hier für Follow-API) */
export const followParamsSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
});

// ============================================
// Request/Response Schemas
// ============================================

/** Follow/Unfollow Request Body (leer, aber für Konsistenz) */
export const followRequestSchema = z.object({}).strict();

/** Follow Status Response */
export const followStatusSchema = z.object({
  followed: z.boolean(),
  followerCount: z.number().int().nonnegative(),
});

/** Follow Toggle Response */
export const followToggleResponseSchema = z.object({
  followed: z.boolean(),
  followerCount: z.number().int().nonnegative(),
});

/** Gefolgte Listen Query Parameter */
export const followedCollectionsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Einzelne gefolgte Liste (für Response) */
export const followedCollectionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coverImage: z.string().nullable(),
  owner: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
  itemCount: z.number().int().nonnegative(),
  followerCount: z.number().int().nonnegative(),
  followedAt: z.date(),
});

/** Gefolgte Listen Response */
export const followedCollectionsResponseSchema = z.object({
  collections: z.array(followedCollectionSchema),
  nextCursor: z.string().nullable(),
});

/** Follower (für Owner-Modal) */
export const followerSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  profileImageUrl: z.string().nullable(),
  followedAt: z.date(),
});

/** Follower Response */
export const followersResponseSchema = z.object({
  followers: z.array(followerSchema),
  nextCursor: z.string().nullable(),
  totalCount: z.number().int().nonnegative(),
});

// ============================================
// Type Exports (inferred from Zod)
// ============================================

export type FollowParams = z.infer<typeof followParamsSchema>;
export type FollowRequest = z.infer<typeof followRequestSchema>;
export type FollowStatus = z.infer<typeof followStatusSchema>;
export type FollowToggleResponse = z.infer<typeof followToggleResponseSchema>;
export type FollowedCollectionsQuery = z.infer<typeof followedCollectionsQuerySchema>;
export type FollowedCollection = z.infer<typeof followedCollectionSchema>;
export type FollowedCollectionsResponse = z.infer<typeof followedCollectionsResponseSchema>;
export type Follower = z.infer<typeof followerSchema>;
export type FollowersResponse = z.infer<typeof followersResponseSchema>;

// ============================================
// Feature Flag
// ============================================

export const FEATURE_COLLECTIONS_FOLLOW = 'FEATURE_COLLECTIONS_FOLLOW';

export function isCollectionsFollowEnabled(): boolean {
  return process.env.FEATURE_COLLECTIONS_FOLLOW !== 'false';
}