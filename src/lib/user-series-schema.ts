import { z } from "zod";

/**
 * Zod-Schemas für User-Serien (User-Created Series)
 * Konsistent mit Collections/Reactions/Compare/Admin-Series Patterns
 */

// ============================================
// User Series Schemas (Auth Required, Owner/Collaborator)
// ============================================

export const createUserSeriesSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(200),
  description: z.string().max(5000).optional(),
  coverImage: z.string().url("Ungültige Cover-URL").optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  reviewIds: z.array(z.string().cuid("Ungültige Review-ID")).max(50, "Maximal 50 Reviews pro Serie").optional(),
});

export const updateUserSeriesSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  items: z
    .array(
      z.object({
        reviewId: z.string().cuid("Ungültige Review-ID"),
        seriesOrder: z.number().int().positive("Reihenfolge muss positiv sein"),
      })
    )
    .optional(),
});

export const reorderUserSeriesSchema = z.object({
  items: z.array(
    z.object({
      reviewId: z.string().cuid("Ungültige Review-ID"),
      seriesOrder: z.number().int().positive("Reihenfolge muss positiv sein"),
    })
  ),
  version: z.number().int().positive("Version muss positiv sein"),
});

export const addUserSeriesItemSchema = z.object({
  reviewId: z.string().cuid("Ungültige Review-ID"),
});

export const userSeriesParamsSchema = z.object({
  slug: z.string().min(1, "Slug ist erforderlich"),
});

export const userSeriesItemParamsSchema = z.object({
  slug: z.string().min(1),
  reviewId: z.string().cuid("Ungültige Review-ID"),
});

// ============================================
// Follow Schemas
// ============================================

export const followUserSeriesSchema = z.object({
  // Empty body for POST, just needs slug in params
});

export const userSeriesFollowParamsSchema = z.object({
  slug: z.string().min(1, "Slug ist erforderlich"),
});

// ============================================
// Collaborator Schemas
// ============================================

export const inviteCollaboratorSchema = z.object({
  userId: z.string().cuid("Ungültige Nutzer-ID"),
  role: z.enum(["EDITOR"]).default("EDITOR"), // OWNER only via transfer
});

export const updateCollaboratorSchema = z.object({
  role: z.enum(["OWNER", "EDITOR"]),
});

export const collaboratorParamsSchema = z.object({
  slug: z.string().min(1),
  userId: z.string().cuid("Ungültige Nutzer-ID"),
});

// ============================================
// Public Query Schemas (Extended from Admin Series)
// ============================================

export const seriesListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(100).optional(),
  sort: z.enum(["title", "createdAt", "partCount", "followersCount"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  type: z.enum(["ADMIN", "USER"]).optional(), // NEW: Filter by series type
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(), // NEW: Filter by visibility (only PUBLIC for non-auth)
  ownerId: z.string().cuid().optional(), // NEW: Filter by owner
});

export const userSeriesListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

// ============================================
// Type Exports
// ============================================

export type CreateUserSeriesInput = z.infer<typeof createUserSeriesSchema>;
export type UpdateUserSeriesInput = z.infer<typeof updateUserSeriesSchema>;
export type ReorderUserSeriesInput = z.infer<typeof reorderUserSeriesSchema>;
export type AddUserSeriesItemInput = z.infer<typeof addUserSeriesItemSchema>;
export type UserSeriesParams = z.infer<typeof userSeriesParamsSchema>;
export type UserSeriesItemParams = z.infer<typeof userSeriesItemParamsSchema>;
export type FollowUserSeriesInput = z.infer<typeof followUserSeriesSchema>;
export type UserSeriesFollowParams = z.infer<typeof userSeriesFollowParamsSchema>;
export type InviteCollaboratorInput = z.infer<typeof inviteCollaboratorSchema>;
export type UpdateCollaboratorInput = z.infer<typeof updateCollaboratorSchema>;
export type CollaboratorParams = z.infer<typeof collaboratorParamsSchema>;
export type SeriesListQuery = z.infer<typeof seriesListQuerySchema>;
export type UserSeriesListQuery = z.infer<typeof userSeriesListQuerySchema>;

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
  isFollowing?: boolean;
  isOwner?: boolean;
  isCollaborator?: boolean;
  collaboratorRole?: "OWNER" | "EDITOR";
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

export interface UserSeriesListResponse {
  series: PublicSeries[];
  nextCursor: string | null;
}

// ============================================
// User Series Detail for Edit View
// ============================================

export interface UserSeriesEditData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  version: number;
  partCount: number;
  aggregateScore: number | null;
  followersCount: number;
  items: {
    reviewId: string;
    seriesOrder: number;
    review: {
      id: string;
      slug: string;
      title: string;
      title_en: string | null;
      category: string;
      score: number;
      images: string[];
      releaseDate: Date | null;
      content: string | null;
    };
  }[];
  collaborators: {
    userId: string;
    username: string;
    displayName: string;
    role: "OWNER" | "EDITOR";
    invitedAt: Date;
    acceptedAt: Date | null;
  }[];
}

// ============================================
// Follow Response Types
// ============================================

export interface FollowStatusResponse {
  isFollowing: boolean;
  followersCount: number;
}

export interface FollowToggleResponse {
  followed: boolean;
  followersCount: number;
}

// ============================================
// Collaborator Response Types
// ============================================

export interface CollaboratorResponse {
  userId: string;
  username: string;
  displayName: string;
  role: "OWNER" | "EDITOR";
  invitedAt: Date;
  acceptedAt: Date | null;
}

export interface CollaboratorsListResponse {
  collaborators: CollaboratorResponse[];
}

// ============================================
// Permission Types
// ============================================

export type UserSeriesPermission = "OWNER" | "EDITOR" | "VIEWER" | "NONE";

export interface PermissionCheckResult {
  permission: UserSeriesPermission;
  isOwner: boolean;
  isCollaborator: boolean;
  collaboratorRole: "OWNER" | "EDITOR" | null;
}