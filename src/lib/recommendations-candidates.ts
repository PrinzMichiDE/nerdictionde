// ============================================
// Server Logic — Candidate Generation
// ============================================

import prisma from '@/lib/prisma';
import type { UserSignals, ReviewSummary } from '@/types/recommendations';

export interface CandidateOptions {
  excludeIds?: Set<string>;
  limit?: number;
}

interface ReviewWithTags {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  category: string;
  score: number;
  images: string[];
  metaDescription: string | null;
  releaseDate: Date | null;
  userRatingAvg: number | null;
  userRatingCount: number | null;
  metadata: Record<string, unknown> | null;
  tags: { tag: { name: string; slug: string } }[];
}

type PrismaReviewWithTags = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  category: string;
  score: number;
  images: string[];
  metaDescription: string | null;
  releaseDate: Date | null;
  userRatingAvg: number | null;
  userRatingCount: number | null;
  metadata: unknown;
  tags: { tag: { name: string; slug: string } }[];
};

function toReviewWithTags(r: PrismaReviewWithTags): ReviewWithTags {
  return {
    ...r,
    metadata: (r.metadata as Record<string, unknown>) || null,
  };
}

/**
 * Content-based candidates: Reviews sharing category, tags, developer, publisher with user's liked content
 */
export async function getContentCandidates(
  signals: UserSignals,
  options: CandidateOptions = {}
): Promise<ReviewWithTags[]> {
  const { excludeIds = new Set(), limit = 50 } = options;

  // Build filter conditions based on user signals
  const likedReviewIds = new Set([
    ...signals.ratedReviews.keys(),
    ...signals.bookmarkedReviews,
    ...signals.readReviewIds,
  ]);

  if (likedReviewIds.size === 0) {
    return [];
  }

  // Get tags, categories, developers, publishers from liked reviews
  const likedReviews = await prisma.review.findMany({
    where: { id: { in: Array.from(likedReviewIds) } },
    select: {
      category: true,
      tags: { select: { tag: { select: { name: true, slug: true } } } },
      metadata: true,
    },
  });

  const categories = new Set<string>();
  const tagSlugs = new Set<string>();
  const developers = new Set<string>();
  const publishers = new Set<string>();

  for (const review of likedReviews) {
    categories.add(review.category);
    for (const t of review.tags) {
      tagSlugs.add(t.tag.slug);
    }
    const meta = review.metadata as Record<string, unknown> | null;
    if (meta?.developer) developers.add(String(meta.developer));
    if (meta?.publisher) publishers.add(String(meta.publisher));
  }

  if (categories.size === 0 && tagSlugs.size === 0 && developers.size === 0 && publishers.size === 0) {
    return [];
  }

  // Build where clause
  const where: any = {
    status: 'published',
    id: { notIn: Array.from(excludeIds) },
    OR: [],
  };

  if (categories.size > 0) {
    where.OR.push({ category: { in: Array.from(categories) } });
  }
  if (tagSlugs.size > 0) {
    where.OR.push({
      tags: { some: { tag: { slug: { in: Array.from(tagSlugs) } } } },
    });
  }
  if (developers.size > 0) {
    where.OR.push({
      metadata: { path: ['developer'], array_contains: Array.from(developers) },
    });
  }
  if (publishers.size > 0) {
    where.OR.push({
      metadata: { path: ['publisher'], array_contains: Array.from(publishers) },
    });
  }

  if (where.OR.length === 0) {
    return [];
  }

  const candidates = await prisma.review.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      title_en: true,
      category: true,
      score: true,
      images: true,
      metaDescription: true,
      releaseDate: true,
      userRatingAvg: true,
      userRatingCount: true,
      metadata: true,
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return candidates.map(toReviewWithTags);
}

/**
 * Collaborative (User-User) candidates: Reviews highly rated by users this user follows
 */
export async function getCollaborativeCandidates(
  signals: UserSignals,
  options: CandidateOptions = {}
): Promise<ReviewWithTags[]> {
  const { excludeIds = new Set(), limit = 50 } = options;

  if (signals.followedUserIds.size === 0) {
    return [];
  }

  // Get high-rated reviews (score >= 8) from followed users
  const followedRatings = await prisma.userRating.findMany({
    where: {
      userId: { in: Array.from(signals.followedUserIds) },
      score: { gte: 8 },
      review: {
        status: 'published',
        id: { notIn: Array.from(excludeIds) },
      },
    },
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
          metaDescription: true,
          releaseDate: true,
          userRatingAvg: true,
          userRatingCount: true,
          metadata: true,
          tags: { select: { tag: { select: { name: true, slug: true } } } },
        },
      },
    },
    take: limit,
    orderBy: { score: 'desc' },
  });

  // Deduplicate by review ID
  const seen = new Set<string>();
  const unique: ReviewWithTags[] = [];
  for (const fr of followedRatings) {
    if (fr.review && !seen.has(fr.review.id)) {
      seen.add(fr.review.id);
      unique.push(toReviewWithTags(fr.review as PrismaReviewWithTags));
    }
  }

  return unique;
}

/**
 * Trending candidates: Popular reviews recently (views * rating)
 */
export async function getTrendingCandidates(
  options: CandidateOptions = {}
): Promise<ReviewWithTags[]> {
  const { excludeIds = new Set(), limit = 20 } = options;

  const candidates = await prisma.review.findMany({
    where: {
      status: 'published',
      id: { notIn: Array.from(excludeIds) },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    },
    select: {
      id: true,
      slug: true,
      title: true,
      title_en: true,
      category: true,
      score: true,
      images: true,
      metaDescription: true,
      releaseDate: true,
      userRatingAvg: true,
      userRatingCount: true,
      metadata: true,
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
    take: limit * 2, // Get more for diversity
    orderBy: [
      { userRatingAvg: 'desc' },
      { userRatingCount: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return candidates.map(toReviewWithTags);
}

/**
 * Merge and deduplicate candidates from multiple sources
 */
export function mergeCandidates(
  ...sources: ReviewWithTags[][]
): ReviewWithTags[] {
  const seen = new Set<string>();
  const merged: ReviewWithTags[] = [];

  for (const source of sources) {
    for (const candidate of source) {
      if (!seen.has(candidate.id)) {
        seen.add(candidate.id);
        merged.push(candidate);
      }
    }
  }

  return merged;
}

/**
 * Get review signals for content-based recommendations on detail page
 */
export async function getReviewSignals(reviewId: string): Promise<{
  category: string;
  tagSlugs: string[];
  developer?: string;
  publisher?: string;
}> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      category: true,
      tags: { select: { tag: { select: { slug: true } } } },
      metadata: true,
    },
  });

  if (!review) {
    return { category: '', tagSlugs: [] };
  }

  const meta = review.metadata as Record<string, unknown> | null;
  return {
    category: review.category,
    tagSlugs: review.tags.map((t) => t.tag.slug),
    developer: meta?.developer ? String(meta.developer) : undefined,
    publisher: meta?.publisher ? String(meta.publisher) : undefined,
  };
}

/**
 * Content-based candidates for a specific review (detail page)
 */
export async function getContentCandidatesForReview(
  reviewSignals: { category: string; tagSlugs: string[]; developer?: string; publisher?: string },
  options: CandidateOptions = {}
): Promise<ReviewWithTags[]> {
  const { excludeIds = new Set(), limit = 50 } = options;

  const where: any = {
    status: 'published',
    id: { notIn: Array.from(excludeIds) },
    OR: [],
  };

  // Same category
  where.OR.push({ category: reviewSignals.category });

  // Shared tags
  if (reviewSignals.tagSlugs.length > 0) {
    where.OR.push({
      tags: { some: { tag: { slug: { in: reviewSignals.tagSlugs } } } },
    });
  }

  // Same developer
  if (reviewSignals.developer) {
    where.OR.push({
      metadata: { path: ['developer'], equals: reviewSignals.developer },
    });
  }

  // Same publisher
  if (reviewSignals.publisher) {
    where.OR.push({
      metadata: { path: ['publisher'], equals: reviewSignals.publisher },
    });
  }

  const candidates = await prisma.review.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      title_en: true,
      category: true,
      score: true,
      images: true,
      metaDescription: true,
      releaseDate: true,
      userRatingAvg: true,
      userRatingCount: true,
      metadata: true,
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
    take: limit,
    orderBy: { score: 'desc' },
  });

  return candidates.map(toReviewWithTags);
}