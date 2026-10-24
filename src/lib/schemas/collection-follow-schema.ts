import { z } from 'zod';

/**
 * Zod-Schemas für Collection Follow Feature
 * Validierung für API-Endpoints und Client-Seite
 */

// ============================================
// Parameter-Schemas
// ============================================

/**
 * Slug-Parameter für Collection Routes
 */
export const collectionSlugParamsSchema = z.object({
  slug: z.string().min(1).max(200),
});

/**
 * Follow-Status Response
 */
export const followStatusResponseSchema = z.object({
  isFollowing: z.boolean(),
  followersCount: z.number().int().nonnegative(),
});

/**
 * Follow/Unfollow Response
 */
export const followActionResponseSchema = z.object({
  followed: z.boolean(),
  followersCount: z.number().int().nonnegative(),
});

/**
 * Query-Parameter für gefolgte Collections (Pagination)
 */
export const followedCollectionsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

/**
 * Item in der Liste der gefolgten Collections
 */
export const followedCollectionItemSchema = z.object({
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
  followersCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
  isFollowing: z.literal(true), // immer true bei gefolgten Collections
});

/**
 * Response für GET /api/me/followed-collections
 */
export const followedCollectionsResponseSchema = z.object({
  collections: z.array(followedCollectionItemSchema),
  nextCursor: z.string().nullable(),
});

// ============================================
// Type-Exports (für TypeScript)
type ZodInfer<T> = z.infer<T>;

// Parameter Types
export type CollectionSlugParams = ZodInfer<typeof collectionSlugParamsSchema>;

// Response Types
export type FollowStatusResponse = ZodInfer<typeof followStatusResponseSchema>;
export type FollowActionResponse = ZodInfer<typeof followActionResponseSchema>;
export type FollowedCollectionsQuery = ZodInfer<typeof followedCollectionsQuerySchema>;
export type FollowedCollectionItem = ZodInfer<typeof followedCollectionItemSchema>;
export type FollowedCollectionsResponse = ZodInfer<typeof followedCollectionsResponseSchema>;

// ============================================
// Feature-Flag Helper
// ============================================

/**
 * Prüft ob Collection Follow Feature aktiviert ist
 */
export function isCollectionFollowEnabled(): boolean {
  return process.env.FEATURE_COLLECTIONS_FOLLOW !== 'false';
}