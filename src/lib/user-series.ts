import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import {
  CreateUserSeriesInput,
  UpdateUserSeriesInput,
  ReorderUserSeriesInput,
  AddUserSeriesItemInput,
  SeriesListQuery,
  UserSeriesListQuery,
  PublicSeries,
  PublicSeriesWithParts,
  PublicSeriesPart,
  SeriesListResponse,
  UserSeriesListResponse,
  UserSeriesEditData,
  FollowStatusResponse,
  FollowToggleResponse,
  CollaboratorResponse,
  CollaboratorsListResponse,
  PermissionCheckResult,
  UserSeriesPermission,
} from "@/lib/user-series-schema";

/**
 * Core Logic für User-Serien (User-Created Series)
 * Server-seitig, nutzt Prisma & unstable_cache
 * Patterns analog zu lib/collections.ts, lib/review-reactions.ts, lib/review-series.ts
 */

// ============================================
// Cache Tags
// ============================================

export const USER_SERIES_CACHE_TAGS = {
  list: "series:list",
  detail: "series:detail",
  userList: "user-series",
  userFollows: "user-series-follows",
  review: "review",
  userSeriesDetail: "user-series-detail",
} as const;

function rt(tag: string) {
  revalidateTag(tag, "");
}

function rtWithSlug(tag: string, slug: string) {
  revalidateTag(`${tag}:${slug}`, "");
}

function rtWithUserId(tag: string, userId: string) {
  revalidateTag(`${tag}:${userId}`, "");
}

// ============================================
// Slug Generator (reused from review-series)
// ============================================

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.reviewSeries.findUnique({ where: { slug } })) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

// ============================================
// Aggregate Score Berechnung (reused)
// ============================================

export function computeAggregateScore(parts: { score: number }[]): number | null {
  if (parts.length === 0) return null;
  const sum = parts.reduce((acc, p) => acc + p.score, 0);
  return Math.round(sum / parts.length);
}

// ============================================
// Order Validierung (reused)
// ============================================

export function validateOrder(
  items: { reviewId: string; seriesOrder: number }[],
  _existingCount: number
): { valid: boolean; error?: string } {
  if (items.length === 0) return { valid: true };

  const orders = items.map((i) => i.seriesOrder).sort((a, b) => a - b);
  const expected = Array.from({ length: items.length }, (_, i) => i + 1);

  if (JSON.stringify(orders) !== JSON.stringify(expected)) {
    return { valid: false, error: "Reihenfolge muss lückenlos 1..N sein" };
  }

  const reviewIds = items.map((i) => i.reviewId);
  const uniqueReviewIds = new Set(reviewIds);
  if (uniqueReviewIds.size !== reviewIds.length) {
    return { valid: false, error: "Doppelte Review-IDs in Reorder" };
  }

  return { valid: true };
}

// ============================================
// Permission Checks
// ============================================

export async function checkUserSeriesPermission(
  userId: string,
  seriesId: string
): Promise<PermissionCheckResult> {
  const series = await prisma.reviewSeries.findUnique({
    where: { id: seriesId },
    select: {
      ownerId: true,
      type: true,
      visibility: true,
      collaborators: {
        where: { userId, acceptedAt: { not: null } },
        select: { role: true },
      },
    },
  });

  if (!series) {
    return { permission: "NONE", isOwner: false, isCollaborator: false, collaboratorRole: null };
  }

  // Admin-Serien: nur Admins können bearbeiten (hier: NONE für normale User)
  if (series.type === "ADMIN") {
    return { permission: "NONE", isOwner: false, isCollaborator: false, collaboratorRole: null };
  }

  // Owner-Check
  if (series.ownerId === userId) {
    return {
      permission: "OWNER",
      isOwner: true,
      isCollaborator: false,
      collaboratorRole: "OWNER",
    };
  }

  // Collaborator-Check (nur accepted)
  const collaborator = series.collaborators[0];
  if (collaborator) {
    const role = collaborator.role === "OWNER" ? "OWNER" : "EDITOR";
    return {
      permission: role,
      isOwner: false,
      isCollaborator: true,
      collaboratorRole: role,
    };
  }

  // Public Visibility Check
  if (series.visibility === "PUBLIC") {
    return { permission: "VIEWER", isOwner: false, isCollaborator: false, collaboratorRole: null };
  }

  // Private Serie, kein Zugriff
  return { permission: "NONE", isOwner: false, isCollaborator: false, collaboratorRole: null };
}

export async function requireUserSeriesPermission(
  userId: string,
  seriesId: string,
  required: "OWNER" | "EDITOR" = "EDITOR"
): Promise<PermissionCheckResult> {
  const result = await checkUserSeriesPermission(userId, seriesId);

  if (required === "OWNER" && result.permission !== "OWNER") {
    throw new Error("FORBIDDEN: Nur Owner darf diese Aktion ausführen");
  }

  if (required === "EDITOR" && !["OWNER", "EDITOR"].includes(result.permission)) {
    throw new Error("FORBIDDEN: Bearbeitungsrechte erforderlich");
  }

  return result;
}

// ============================================
// Public Read Operations (Cached) — Extended from review-series
// ============================================

export const getSeriesList = unstable_cache(
  async (query: SeriesListQuery): Promise<SeriesListResponse> => {
    const { cursor, limit, q, sort, order, type, visibility, ownerId } = query;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (visibility) {
      where.visibility = visibility;
    } else {
      // Default: nur öffentliche Serien anzeigen
      where.visibility = "PUBLIC";
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const orderBy: Record<string, "asc" | "desc"> = { [sort]: order };

    const series = await prisma.reviewSeries.findMany({
      where,
      orderBy,
      take: limit + 1,
      cursor: cursor ? { slug: cursor } : undefined,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImage: true,
        partCount: true,
        aggregateScore: true,
        followersCount: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        type: true,
        visibility: true,
        owner: { select: { username: true } },
      },
    });

    let nextCursor: string | null = null;
    if (series.length > limit) {
      const next = series.pop()!;
      nextCursor = next.slug;
    }

    return {
      series: series.map((s) => ({
        ...s,
        ownerUsername: s.owner?.username ?? null,
        owner: undefined,
      })) as PublicSeries[],
      nextCursor,
    };
  },
  ["series-list"],
  { tags: [USER_SERIES_CACHE_TAGS.list], revalidate: 60 }
);

// Wrapper für User-Serien Liste (nur eigene + Collaborator)
export const getUserSeriesList = unstable_cache(
  async (userId: string, query: UserSeriesListQuery): Promise<UserSeriesListResponse> => {
    const { cursor, limit, visibility } = query;

    const where: Record<string, unknown> = {
      deletedAt: null,
      type: "USER",
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: { userId, acceptedAt: { not: null } },
          },
        },
      ],
    };

    if (visibility) {
      where.visibility = visibility;
    }

    const series = await prisma.reviewSeries.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { slug: cursor } : undefined,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImage: true,
        partCount: true,
        aggregateScore: true,
        followersCount: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        type: true,
        visibility: true,
        owner: { select: { username: true } },
      },
    });

    let nextCursor: string | null = null;
    if (series.length > limit) {
      const next = series.pop()!;
      nextCursor = next.slug;
    }

    return {
      series: series.map((s) => ({
        ...s,
        ownerUsername: s.owner?.username ?? null,
        owner: undefined,
      })) as PublicSeries[],
      nextCursor,
    };
  },
  ["user-series-list"],
  { tags: [USER_SERIES_CACHE_TAGS.userList], revalidate: 60 }
);

export const getSeriesBySlug = unstable_cache(
  async (slug: string): Promise<PublicSeriesWithParts | null> => {
    const series = await prisma.reviewSeries.findUnique({
      where: { slug, deletedAt: null },
      include: {
        items: {
          orderBy: { seriesOrder: "asc" },
          include: {
            review: {
              select: {
                id: true,
                slug: true,
                title: true,
                title_en: true,
                category: true,
                score: true,
                images: true,
                releaseDate: true,
                content: true,
                seriesOrder: true,
              },
            },
          },
        },
        owner: { select: { id: true, username: true, displayName: true } },
      },
    });

    if (!series) return null;

    // Visibility-Check wird in der API Route gemacht (Auth-Check)
    // Hier nur Public-Serien oder wenn Owner/Collaborator -> API prüft vorher

    const parts: PublicSeriesPart[] = series.items.map((item) => ({
      id: item.review.id,
      slug: item.review.slug,
      title: item.review.title,
      title_en: item.review.title_en,
      category: item.review.category,
      score: item.review.score,
      coverImage: item.review.images[0] || null,
      releaseDate: item.review.releaseDate,
      excerpt: item.review.content ? item.review.content.slice(0, 200) : null,
      seriesOrder: item.seriesOrder,
    }));

    return {
      id: series.id,
      slug: series.slug,
      title: series.title,
      description: series.description,
      coverImage: series.coverImage,
      partCount: series.partCount,
      aggregateScore: series.aggregateScore,
      followersCount: series.followersCount,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      ownerId: series.ownerId,
      ownerUsername: series.owner?.username ?? null,
      type: series.type,
      visibility: series.visibility,
      parts,
    };
  },
  ["series-detail"],
  { tags: [USER_SERIES_CACHE_TAGS.detail], revalidate: 60 }
);

// Für User-Serien Detail (mit Follow-Status, Owner/Collaborator Info)
export const getUserSeriesDetail = unstable_cache(
  async (slug: string, userId?: string): Promise<PublicSeriesWithParts | null> => {
    const series = await prisma.reviewSeries.findUnique({
      where: { slug, deletedAt: null, type: "USER" },
      include: {
        items: {
          orderBy: { seriesOrder: "asc" },
          include: {
            review: {
              select: {
                id: true,
                slug: true,
                title: true,
                title_en: true,
                category: true,
                score: true,
                images: true,
                releaseDate: true,
                content: true,
                seriesOrder: true,
              },
            },
          },
        },
        owner: { select: { id: true, username: true, displayName: true } },
        followers: userId ? { where: { userId } } : false,
        collaborators: userId ? { where: { userId, acceptedAt: { not: null } } } : false,
      },
    });

    if (!series) return null;

    const parts: PublicSeriesPart[] = series.items.map((item) => ({
      id: item.review.id,
      slug: item.review.slug,
      title: item.review.title,
      title_en: item.review.title_en,
      category: item.review.category,
      score: item.review.score,
      coverImage: item.review.images[0] || null,
      releaseDate: item.review.releaseDate,
      excerpt: item.review.content ? item.review.content.slice(0, 200) : null,
      seriesOrder: item.seriesOrder,
    }));

    return {
      id: series.id,
      slug: series.slug,
      title: series.title,
      description: series.description,
      coverImage: series.coverImage,
      partCount: series.partCount,
      aggregateScore: series.aggregateScore,
      followersCount: series.followersCount,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      ownerId: series.ownerId,
      ownerUsername: series.owner?.username ?? null,
      type: series.type,
      visibility: series.visibility,
      parts,
      isFollowing: series.followers ? series.followers.length > 0 : false,
      isOwner: userId ? series.ownerId === userId : false,
      isCollaborator: series.collaborators ? series.collaborators.length > 0 : false,
      collaboratorRole: series.collaborators?.[0]?.role ?? null,
    };
  },
  ["user-series-detail"],
  { tags: [USER_SERIES_CACHE_TAGS.userSeriesDetail], revalidate: 60 }
);

// Für Edit-View (Owner/Collaborator only)
export const getUserSeriesForEdit = unstable_cache(
  async (slug: string, userId: string): Promise<UserSeriesEditData | null> => {
    const permission = await checkUserSeriesPermission(userId, slug);
    if (!["OWNER", "EDITOR"].includes(permission.permission)) {
      return null;
    }

    const series = await prisma.reviewSeries.findUnique({
      where: { slug, deletedAt: null },
      include: {
        items: {
          orderBy: { seriesOrder: "asc" },
          include: {
            review: { select: { id: true, slug: true, title: true, score: true, images: true } },
          },
        },
        owner: { select: { id: true, username: true, displayName: true } },
        collaborators: {
          where: { acceptedAt: { not: null } },
          include: { user: { select: { id: true, username: true, displayName: true } } },
        },
      },
    });

    if (!series) return null;

    return {
      id: series.id,
      slug: series.slug,
      title: series.title,
      description: series.description,
      coverImage: series.coverImage,
      visibility: series.visibility,
      version: series.version,
      partCount: series.partCount,
      aggregateScore: series.aggregateScore,
      followersCount: series.followersCount,
      items: series.items.map((item) => ({
        reviewId: item.reviewId,
        seriesOrder: item.seriesOrder,
        review: {
          id: item.review.id,
          slug: item.review.slug,
          title: item.review.title,
          score: item.review.score,
          images: item.review.images,
        },
      })),
      collaborators: series.collaborators.map((c) => ({
        userId: c.userId,
        username: c.user.username,
        displayName: c.user.displayName,
        role: c.role,
        invitedAt: c.invitedAt,
        acceptedAt: c.acceptedAt,
      })),
    };
  },
  ["user-series-edit"],
  { tags: [USER_SERIES_CACHE_TAGS.userSeriesDetail], revalidate: 30 }
);

// ============================================
// User Write Operations
// ============================================

export async function createUserSeries(userId: string, input: CreateUserSeriesInput) {
  const baseSlug = slugify(input.title);
  const slug = await generateUniqueSlug(baseSlug);

  const reviewIds = input.reviewIds ?? [];

  // Validierung: Reviews existieren und sind published
  if (reviewIds.length > 0) {
    const reviews = await prisma.review.findMany({
      where: { id: { in: reviewIds }, status: "published" },
      select: { id: true },
    });

    if (reviews.length !== reviewIds.length) {
      throw new Error("Eine oder mehrere Reviews nicht gefunden oder nicht veröffentlicht");
    }
  }

  const series = await prisma.$transaction(async (tx) => {
    // Serie erstellen
    const newSeries = await tx.reviewSeries.create({
      data: {
        slug,
        title: input.title,
        description: input.description || null,
        coverImage: input.coverImage || null,
        visibility: input.visibility,
        type: "USER",
        ownerId: userId,
      },
    });

    // Items hinzufügen
    for (let i = 0; i < reviewIds.length; i++) {
      const reviewId = reviewIds[i];
      await tx.reviewSeriesItem.create({
        data: {
          seriesId: newSeries.id,
          reviewId,
          seriesOrder: i + 1,
        },
      });

      await tx.review.update({
        where: { id: reviewId },
        data: { seriesId: newSeries.id, seriesOrder: i + 1 },
      });
    }

    // Aggregate Score berechnen
    let aggregateScore: number | null = null;
    if (reviewIds.length > 0) {
      const reviewScores = await tx.review.findMany({
        where: { id: { in: reviewIds } },
        select: { score: true },
      });
      aggregateScore = computeAggregateScore(reviewScores);
    }

    // Serie aktualisieren mit partCount und aggregateScore
    await tx.reviewSeries.update({
      where: { id: newSeries.id },
      data: {
        partCount: reviewIds.length,
        aggregateScore,
        version: 1,
      },
    });

    return newSeries;
  });

  // Cache invalidieren
  rt(USER_SERIES_CACHE_TAGS.list);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, userId);

  return series;
}

export async function updateUserSeries(userId: string, slug: string, input: UpdateUserSeriesInput) {
  const permission = await requireUserSeriesPermission(userId, slug, "EDITOR");

  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, type: true },
  });

  if (!series || series.type !== "USER") {
    throw new Error("Serie nicht gefunden oder keine User-Serie");
  }

  const data: Record<string, unknown> = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage || null;
  if (input.visibility !== undefined) data.visibility = input.visibility;

  // Items Update (Reorder/Add/Remove) wird separat via reorderUserSeries/addUserSeriesItem/removeUserSeriesItem gemacht
  // Hier nur Metadaten

  const updated = await prisma.reviewSeries.update({
    where: { slug },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.detail, slug);
  rt(USER_SERIES_CACHE_TAGS.list);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, userId);
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, slug);

  return updated;
}

export async function deleteUserSeries(userId: string, slug: string) {
  const permission = await requireUserSeriesPermission(userId, slug, "OWNER");

  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, type: true },
  });

  if (!series || series.type !== "USER") {
    throw new Error("Serie nicht gefunden oder keine User-Serie");
  }

  // Soft-Delete: Relations lösen, deletedAt setzen
  await prisma.$transaction(async (tx) => {
    // ReviewSeriesItem löschen und Review.seriesId/seriesOrder zurücksetzen
    const items = await tx.reviewSeriesItem.findMany({
      where: { seriesId: series.id },
      select: { reviewId: true },
    });

    await tx.reviewSeriesItem.deleteMany({
      where: { seriesId: series.id },
    });

    for (const item of items) {
      await tx.review.update({
        where: { id: item.reviewId },
        data: { seriesId: null, seriesOrder: null },
      });
    }

    // Collaborators löschen
    await tx.userSeriesCollaborator.deleteMany({
      where: { seriesId: series.id },
    });

    // Followers löschen
    await tx.userSeriesFollow.deleteMany({
      where: { seriesId: series.id },
    });

    // Serie soft-delete
    await tx.reviewSeries.update({
      where: { id: series.id },
      data: { deletedAt: new Date() },
    });
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.detail, slug);
  rt(USER_SERIES_CACHE_TAGS.list);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, userId);
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, slug);

  return { success: true };
}

export async function reorderUserSeries(userId: string, slug: string, input: ReorderUserSeriesInput) {
  const permission = await requireUserSeriesPermission(userId, slug, "EDITOR");

  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, version: true, type: true },
  });

  if (!series || series.type !== "USER") {
    throw new Error("Serie nicht gefunden oder keine User-Serie");
  }

  if (series.version !== input.version) {
    throw new Error("VERSION_CONFLICT: Serie wurde zwischenzeitlich geändert");
  }

  const validation = validateOrder(input.items, 0);
  if (!validation.valid) throw new Error(validation.error);

  // Prüfen: Alle Review-IDs gehören zu dieser Serie
  const reviewIds = input.items.map((i) => i.reviewId);
  const existingItems = await prisma.reviewSeriesItem.findMany({
    where: { seriesId: series.id, reviewId: { in: reviewIds } },
    select: { reviewId: true },
  });

  if (existingItems.length !== reviewIds.length) {
    throw new Error("Nicht alle Reviews gehören zu dieser Serie");
  }

  await prisma.$transaction(async (tx) => {
    // ReviewSeriesItem seriesOrder aktualisieren
    for (const item of input.items) {
      await tx.reviewSeriesItem.update({
        where: { reviewId: item.reviewId },
        data: { seriesOrder: item.seriesOrder },
      });

      // Denormalisiert auf Review
      await tx.review.update({
        where: { id: item.reviewId },
        data: { seriesOrder: item.seriesOrder },
      });
    }

    // Version inkrementieren
    await tx.reviewSeries.update({
      where: { id: series.id },
      data: { version: { increment: 1 } },
    });
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.detail, slug);
  rt(USER_SERIES_CACHE_TAGS.list);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, userId);
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, slug);
  for (const item of input.items) {
    rtWithSlug(USER_SERIES_CACHE_TAGS.review, item.reviewId);
  }

  return { version: series.version + 1 };
}

export async function addUserSeriesItem(userId: string, slug: string, input: AddUserSeriesItemInput) {
  const permission = await requireUserSeriesPermission(userId, slug, "EDITOR");

  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, type: true },
  });

  if (!series || series.type !== "USER") {
    throw new Error("Serie nicht gefunden oder keine User-Serie");
  }

  // Prüfen: Max 50 Teile
  const currentCount = await prisma.reviewSeriesItem.count({ where: { seriesId: series.id } });
  if (currentCount >= 50) {
    throw new Error("Maximale Teileanzahl (50) erreicht");
  }

  // Nächste Order-Position ermitteln
  const lastItem = await prisma.reviewSeriesItem.findFirst({
    where: { seriesId: series.id },
    orderBy: { seriesOrder: "desc" },
    select: { seriesOrder: true },
  });

  const nextOrder = (lastItem?.seriesOrder || 0) + 1;

  // Prüfen: Review nicht schon in einer Serie
  const existing = await prisma.reviewSeriesItem.findUnique({
    where: { reviewId: input.reviewId },
  });

  if (existing) throw new Error("Review gehört bereits zu einer Serie");

  // Prüfen: Review existiert und ist published
  const review = await prisma.review.findUnique({
    where: { id: input.reviewId, status: "published" },
    select: { id: true, score: true },
  });

  if (!review) throw new Error("Review nicht gefunden oder nicht veröffentlicht");

  await prisma.$transaction(async (tx) => {
    await tx.reviewSeriesItem.create({
      data: {
        seriesId: series.id,
        reviewId: input.reviewId,
        seriesOrder: nextOrder,
      },
    });

    await tx.review.update({
      where: { id: input.reviewId },
      data: { seriesId: series.id, seriesOrder: nextOrder },
    });

    // partCount & aggregateScore aktualisieren
    const allItems = await tx.reviewSeriesItem.findMany({
      where: { seriesId: series.id },
      include: { review: { select: { score: true } } },
    });

    const aggregateScore = computeAggregateScore(allItems.map((i) => i.review));

    await tx.reviewSeries.update({
      where: { id: series.id },
      data: {
        partCount: allItems.length,
        aggregateScore,
        version: { increment: 1 },
      },
    });
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.detail, slug);
  rt(USER_SERIES_CACHE_TAGS.list);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, userId);
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, slug);
  rtWithSlug(USER_SERIES_CACHE_TAGS.review, input.reviewId);

  return { success: true, seriesOrder: nextOrder };
}

export async function removeUserSeriesItem(userId: string, slug: string, reviewId: string) {
  const permission = await requireUserSeriesPermission(userId, slug, "EDITOR");

  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, type: true },
  });

  if (!series || series.type !== "USER") {
    throw new Error("Serie nicht gefunden oder keine User-Serie");
  }

  // Prüfen: Item gehört zur Serie
  const item = await prisma.reviewSeriesItem.findUnique({
    where: { reviewId },
    select: { seriesId: true },
  });

  if (!item || item.seriesId !== series.id) {
    throw new Error("Review gehört nicht zu dieser Serie");
  }

  await prisma.$transaction(async (tx) => {
    await tx.reviewSeriesItem.delete({
      where: { reviewId },
    });

    await tx.review.update({
      where: { id: reviewId },
      data: { seriesId: null, seriesOrder: null },
    });

    // partCount & aggregateScore neu berechnen
    const remainingItems = await tx.reviewSeriesItem.findMany({
      where: { seriesId: series.id },
      include: { review: { select: { score: true } } },
    });

    const aggregateScore = computeAggregateScore(remainingItems.map((i) => i.review));

    await tx.reviewSeries.update({
      where: { id: series.id },
      data: {
        partCount: remainingItems.length,
        aggregateScore,
        version: { increment: 1 },
      },
    });
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.detail, slug);
  rt(USER_SERIES_CACHE_TAGS.list);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, userId);
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, slug);
  rtWithSlug(USER_SERIES_CACHE_TAGS.review, reviewId);

  return { success: true };
}

// ============================================
// Follow Operations
// ============================================

export async function getFollowStatus(userId: string, seriesId: string): Promise<FollowStatusResponse> {
  const follow = await prisma.userSeriesFollow.findUnique({
    where: { userId_seriesId: { userId, seriesId } },
  });

  const series = await prisma.reviewSeries.findUnique({
    where: { id: seriesId },
    select: { followersCount: true },
  });

  return {
    isFollowing: !!follow,
    followersCount: series?.followersCount ?? 0,
  };
}

export async function followUserSeries(userId: string, seriesId: string): Promise<FollowToggleResponse> {
  // Prüfen: Serie existiert, ist PUBLIC, type USER
  const series = await prisma.reviewSeries.findUnique({
    where: { id: seriesId, deletedAt: null },
    select: { id: true, type: true, visibility: true },
  });

  if (!series) throw new Error("Serie nicht gefunden");
  if (series.type !== "USER") throw new Error("Nur User-Serien können gefolgt werden");
  if (series.visibility !== "PUBLIC") throw new Error("Private Serien können nicht gefolgt werden");

  // Prüfen: Nicht selbst folgen
  const seriesOwner = await prisma.reviewSeries.findUnique({
    where: { id: seriesId },
    select: { ownerId: true },
  });

  if (seriesOwner?.ownerId === userId) {
    throw new Error("Du kannst deine eigene Serie nicht folgen");
  }

  // Upsert Follow
  const existing = await prisma.userSeriesFollow.findUnique({
    where: { userId_seriesId: { userId, seriesId } },
  });

  if (existing) {
    return { followed: true, followersCount: 0 }; // Already following
  }

  await prisma.$transaction(async (tx) => {
    await tx.userSeriesFollow.create({
      data: { userId, seriesId },
    });

    await tx.reviewSeries.update({
      where: { id: seriesId },
      data: { followersCount: { increment: 1 } },
    });
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.detail, seriesId);
  rt(USER_SERIES_CACHE_TAGS.list);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userFollows, userId);
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, seriesId);

  // Notification für Owner (optional, später)
  // await createNotification({...});

  const updatedSeries = await prisma.reviewSeries.findUnique({
    where: { id: seriesId },
    select: { followersCount: true },
  });

  return { followed: true, followersCount: updatedSeries?.followersCount ?? 1 };
}

export async function unfollowUserSeries(userId: string, seriesId: string): Promise<FollowToggleResponse> {
  const existing = await prisma.userSeriesFollow.findUnique({
    where: { userId_seriesId: { userId, seriesId } },
  });

  if (!existing) {
    return { followed: false, followersCount: 0 };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userSeriesFollow.delete({
      where: { userId_seriesId: { userId, seriesId } },
    });

    await tx.reviewSeries.update({
      where: { id: seriesId },
      data: { followersCount: { decrement: 1 } },
    });
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.detail, seriesId);
  rt(USER_SERIES_CACHE_TAGS.list);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userFollows, userId);
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, seriesId);

  const updatedSeries = await prisma.reviewSeries.findUnique({
    where: { id: seriesId },
    select: { followersCount: true },
  });

  return { followed: false, followersCount: updatedSeries?.followersCount ?? 0 };
}

// ============================================
// Collaborator Operations
// ============================================

export async function getCollaborators(seriesId: string): Promise<CollaboratorsListResponse> {
  const collaborators = await prisma.userSeriesCollaborator.findMany({
    where: { seriesId, acceptedAt: { not: null } },
    include: { user: { select: { id: true, username: true, displayName: true } } },
    orderBy: { role: "desc" }, // OWNER first
  });

  return {
    collaborators: collaborators.map((c) => ({
      userId: c.userId,
      username: c.user.username,
      displayName: c.user.displayName,
      role: c.role,
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
    })),
  };
}

export async function inviteCollaborator(
  ownerId: string,
  seriesId: string,
  input: { userId: string; role: "EDITOR" }
): Promise<CollaboratorResponse> {
  // Prüfen: Owner
  const permission = await requireUserSeriesPermission(ownerId, seriesId, "OWNER");

  // Prüfen: User existiert
  const targetUser = await prisma.twitchUser.findUnique({
    where: { id: input.userId },
    select: { id: true, username: true, displayName: true },
  });

  if (!targetUser) throw new Error("Nutzer nicht gefunden");

  // Prüfen: Nicht sich selbst einladen
  if (targetUser.id === ownerId) throw new Error("Du kannst dich nicht selbst einladen");

  // Prüfen: Max 10 Collaborators
  const count = await prisma.userSeriesCollaborator.count({
    where: { seriesId, acceptedAt: { not: null } },
  });

  if (count >= 10) throw new Error("Maximal 10 Kollaboratoren pro Serie");

  // Prüfen: Noch nicht Collaborator
  const existing = await prisma.userSeriesCollaborator.findUnique({
    where: { userId_seriesId: { userId: input.userId, seriesId } },
  });

  if (existing) throw new Error("Nutzer ist bereits Kollaborator");

  const collaborator = await prisma.userSeriesCollaborator.create({
    data: {
      userId: input.userId,
      seriesId,
      role: input.role,
      invitedAt: new Date(),
      acceptedAt: null, // Wird beim Accept gesetzt
    },
    include: { user: { select: { id: true, username: true, displayName: true } } },
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, seriesId);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, ownerId);

  // Notification für eingeladenen User (später)

  return {
    userId: collaborator.userId,
    username: collaborator.user.username,
    displayName: collaborator.user.displayName,
    role: collaborator.role,
    invitedAt: collaborator.invitedAt,
    acceptedAt: collaborator.acceptedAt,
  };
}

export async function acceptCollaboratorInvite(userId: string, seriesId: string) {
  const collaborator = await prisma.userSeriesCollaborator.findUnique({
    where: { userId_seriesId: { userId, seriesId } },
  });

  if (!collaborator) throw new Error("Keine Einladung gefunden");
  if (collaborator.acceptedAt) throw new Error("Einladung bereits akzeptiert");

  await prisma.userSeriesCollaborator.update({
    where: { userId_seriesId: { userId, seriesId } },
    data: { acceptedAt: new Date() },
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, seriesId);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, userId);

  return { success: true };
}

export async function updateCollaboratorRole(
  ownerId: string,
  seriesId: string,
  targetUserId: string,
  role: "OWNER" | "EDITOR"
) {
  const permission = await requireUserSeriesPermission(ownerId, seriesId, "OWNER");

  if (targetUserId === ownerId) throw new Error("Du kannst deine eigene Rolle nicht ändern");

  const collaborator = await prisma.userSeriesCollaborator.findUnique({
    where: { userId_seriesId: { userId: targetUserId, seriesId } },
  });

  if (!collaborator) throw new Error("Kollaborator nicht gefunden");
  if (!collaborator.acceptedAt) throw new Error("Einladung noch nicht akzeptiert");

  // Wenn OWNER übergeben wird: Owner wechseln
  if (role === "OWNER") {
    await prisma.$transaction(async (tx) => {
      // Alten Owner zu Editor machen
      await tx.userSeriesCollaborator.update({
        where: { userId_seriesId: { userId: ownerId, seriesId } },
        data: { role: "EDITOR" },
      });

      // Neuen Owner setzen
      await tx.userSeriesCollaborator.update({
        where: { userId_seriesId: { userId: targetUserId, seriesId } },
        data: { role: "OWNER" },
      });

      // ReviewSeries ownerId aktualisieren
      await tx.reviewSeries.update({
        where: { id: seriesId },
        data: { ownerId: targetUserId },
      });
    });
  } else {
    await prisma.userSeriesCollaborator.update({
      where: { userId_seriesId: { userId: targetUserId, seriesId } },
      data: { role },
    });
  }

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.detail, seriesId);
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, seriesId);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, ownerId);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, targetUserId);

  return { success: true };
}

export async function removeCollaborator(ownerId: string, seriesId: string, targetUserId: string) {
  const permission = await requireUserSeriesPermission(ownerId, seriesId, "OWNER");

  if (targetUserId === ownerId) throw new Error("Du kannst dich nicht selbst entfernen");

  const collaborator = await prisma.userSeriesCollaborator.findUnique({
    where: { userId_seriesId: { userId: targetUserId, seriesId } },
  });

  if (!collaborator) throw new Error("Kollaborator nicht gefunden");

  await prisma.userSeriesCollaborator.delete({
    where: { userId_seriesId: { userId: targetUserId, seriesId } },
  });

  // Cache invalidieren
  rtWithSlug(USER_SERIES_CACHE_TAGS.userSeriesDetail, seriesId);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, ownerId);
  rtWithUserId(USER_SERIES_CACHE_TAGS.userList, targetUserId);

  return { success: true };
}

// ============================================
// Helper für Review-Detail: User-Serie-Info laden (Cached)
// ============================================

export interface ReviewUserSeriesInfo {
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesOrder: number;
  partCount: number;
  parts: { slug: string; title: string; seriesOrder: number }[];
  type: "ADMIN" | "USER";
  ownerUsername: string | null;
}

export const getReviewUserSeriesInfo = unstable_cache(
  async (reviewId: string): Promise<ReviewUserSeriesInfo | null> => {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { seriesId: true, seriesOrder: true },
    });

    if (!review?.seriesId || !review.seriesOrder) return null;

    const series = await prisma.reviewSeries.findUnique({
      where: { id: review.seriesId, deletedAt: null },
      include: {
        items: {
          orderBy: { seriesOrder: "asc" },
          select: { review: { select: { slug: true, title: true } }, seriesOrder: true },
        },
        owner: { select: { username: true } },
      },
    });

    if (!series) return null;

    return {
      seriesId: series.id,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      seriesOrder: review.seriesOrder,
      partCount: series.partCount,
      parts: series.items.map((item) => ({
        slug: item.review.slug,
        title: item.review.title,
        seriesOrder: item.seriesOrder,
      })),
      type: series.type,
      ownerUsername: series.owner?.username ?? null,
    };
  },
  ["review-user-series-info"],
  { tags: [USER_SERIES_CACHE_TAGS.review], revalidate: 30 }
);

// ============================================
// Notification Helpers
// ============================================

/**
 * Erstellt Notification für Follower, wenn ein neues Item zu einer User-Serie hinzugefügt wird
 * Wird aufgerufen nach addUserSeriesItem
 */
export async function createUserSeriesItemNotification(
  seriesId: string,
  actorId: string,
  reviewIds: string[]
): Promise<void> {
  // Serie und Owner laden
  const series = await prisma.reviewSeries.findUnique({
    where: { id: seriesId },
    select: { id: true, title: true, ownerId: true },
  });

  if (!series) return;

  // Alle Follower der Serie laden (außer dem Actor)
  const follows = await prisma.userSeriesFollow.findMany({
    where: {
      seriesId,
      userId: { not: actorId },
    },
    select: { userId: true },
  });

  if (follows.length === 0) return;

  // Actor-Info laden
  const actor = await prisma.twitchUser.findUnique({
    where: { id: actorId },
    select: { displayName: true, username: true },
  });

  if (!actor) return;

  // Review-Titel für Details laden
  const reviews = await prisma.review.findMany({
    where: { id: { in: reviewIds } },
    select: { id: true, title: true, slug: true },
  });

  const reviewTitles = reviews.map((r) => r.title).join(", ");

  // Notifications für alle Follower erstellen (Batch)
  await prisma.notification.createMany({
    data: follows.map((f) => ({
      userId: f.userId,
      type: "user_series_update" as const,
      title: `Neues Review in "${series.title}"`,
      message: `${actor.displayName} (@${actor.username}) hat "${reviewTitles}" zu "${series.title}" hinzugefügt`,
      data: {
        seriesId,
        seriesTitle: series.title,
        action: "item_added",
        actorId,
        actorDisplayName: actor.displayName,
        actorUsername: actor.username,
        reviewIds,
        reviewCount: reviewIds.length,
      },
    })),
  });
}

/**
 * Erstellt Notification für eingeladenen User, wenn er als Collaborator eingeladen wird
 * Wird aufgerufen nach inviteCollaborator
 */
export async function createUserSeriesInviteNotification(
  seriesId: string,
  invitedUserId: string,
  inviterId: string
): Promise<void> {
  // Serie und Inviter laden
  const [series, inviter] = await Promise.all([
    prisma.reviewSeries.findUnique({
      where: { id: seriesId },
      select: { id: true, title: true, ownerId: true },
    }),
    prisma.twitchUser.findUnique({
      where: { id: inviterId },
      select: { displayName: true, username: true },
    }),
  ]);

  if (!series || !inviter) return;

  // Nicht selbst benachrichtigen
  if (invitedUserId === inviterId) return;

  await prisma.notification.create({
    data: {
      userId: invitedUserId,
      type: "user_series_invite" as const,
      title: `Einladung zur Kollaboration`,
      message: `${inviter.displayName} (@${inviter.username}) hat dich als Kollaborator zu "${series.title}" eingeladen`,
      data: {
        seriesId,
        seriesTitle: series.title,
        inviterId,
        inviterDisplayName: inviter.displayName,
        inviterUsername: inviter.username,
        role: "EDITOR",
      },
    },
  });
}