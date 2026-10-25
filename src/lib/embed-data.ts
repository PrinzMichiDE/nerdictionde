// ============================================
// Embed Server Logic
// ============================================

import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { isReviewEmbedEnabled } from '@/lib/feature-flags';
import type { EmbedReviewData, EmbedCollectionData, EmbedSeriesData, EmbedData } from '@/types/embed';

const EMBED_CACHE_TTL = 300; // 5 minutes
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nerdiction.de';

// Helper to generate excerpt from markdown content
function generateExcerpt(content: string, maxLength = 200): string {
  // Strip markdown syntax for excerpt
  const plain = content
    .replace(/[#*_`\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return plain.length > maxLength ? plain.substring(0, maxLength).trimEnd() + '…' : plain;
}

// Helper to get score label from numeric score (0-100)
function getScoreLabel(score: number): string {
  if (score >= 90) return 'Meisterwerk';
  if (score >= 80) return 'Sehr gut';
  if (score >= 70) return 'Gut';
  if (score >= 60) return 'Okay';
  if (score >= 50) return 'Mittel';
  return 'Schwach';
}

// Helper to get category label
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    game: 'Games',
    hardware: 'Hardware',
    movie: 'Movies',
    series: 'Series',
    amazon: 'Hardware',
  };
  return labels[category] ?? category;
}

// ============================================
// Review Embed Data
// ============================================

const getCachedReviewEmbedData = unstable_cache(
  async (slug: string): Promise<EmbedReviewData | null> => {
    const review = await prisma.review.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        content: true,
        score: true,
        category: true,
        status: true,
        images: true,
        pros: true,
        cons: true,
        specs: true,
        metadata: true,
        createdAt: true,
      },
    });

    if (!review || review.status !== 'published') return null;

    const coverImage = review.images?.[0] ?? null;

    // Build specs from specs + metadata
    const specs: Record<string, string | string[]> = { ...(review.specs as Record<string, string | string[]> ?? {}) };
    const meta = review.metadata as Record<string, unknown> | null;
    if (meta?.developer) specs.Developer = String(meta.developer);
    if (meta?.publisher) specs.Publisher = String(meta.publisher);
    if (meta?.genres && Array.isArray(meta.genres)) specs.Genres = meta.genres.map(String);
    if (meta?.platforms && Array.isArray(meta.platforms)) specs.Platforms = meta.platforms.map(String);
    if (meta?.releaseDate) specs.Release = String(meta.releaseDate);

    return {
      type: 'review',
      slug: review.slug,
      title: review.title,
      excerpt: generateExcerpt(review.content),
      score: review.score / 10, // Convert 0-100 to 0-10
      scoreLabel: getScoreLabel(review.score),
      category: review.category,
      categoryLabel: getCategoryLabel(review.category),
      coverImage,
      coverAlt: review.title,
      author: undefined, // Reviews don't have author relation in schema
      publishedAt: review.createdAt.toISOString(),
      url: `${SITE_URL}/reviews/${review.slug}`,
      pros: review.pros ?? [],
      cons: review.cons ?? [],
      specs,
    };
  },
  ['embed-review'],
  { revalidate: EMBED_CACHE_TTL, tags: ['embed-review'] }
);

export async function getEmbedReviewData(slug: string): Promise<EmbedReviewData | null> {
  if (!isReviewEmbedEnabled()) return null;
  return getCachedReviewEmbedData(slug);
}

// ============================================
// Collection Embed Data
// ============================================

const getCachedCollectionEmbedData = unstable_cache(
  async (slug: string): Promise<EmbedCollectionData | null> => {
    const collection = await prisma.reviewCollection.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        description: true,
        deletedAt: true,
        isPublic: true,
        ownerId: true,
        owner: { select: { username: true, displayName: true, profileImageUrl: true } },
        createdAt: true,
        items: {
          where: { review: { status: 'published' } },
          orderBy: { position: 'asc' },
          take: 50,
          select: {
            position: true,
            review: {
              select: {
                slug: true,
                title: true,
                score: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!collection || collection.deletedAt || !collection.isPublic) return null;

    const coverImage = collection.items[0]?.review.images?.[0] ?? null;

    return {
      type: 'collection',
      slug: collection.slug,
      title: collection.title,
      description: collection.description ?? '',
      itemCount: collection.items.length,
      owner: {
        username: collection.owner.username,
        displayName: collection.owner.displayName,
        avatar: collection.owner.profileImageUrl,
      },
      coverImage,
      createdAt: collection.createdAt.toISOString(),
      url: `${SITE_URL}/listen/${collection.slug}`,
      items: collection.items.map((item: { position: number; review: { slug: string; title: string; score: number; images: string[] } }) => ({
        position: item.position,
        review: {
          slug: item.review.slug,
          title: item.review.title,
          score: item.review.score / 10,
          coverImage: item.review.images?.[0] ?? null,
        },
      })),
    };
  },
  ['embed-collection'],
  { revalidate: EMBED_CACHE_TTL, tags: ['embed-collection'] }
);

export async function getEmbedCollectionData(slug: string): Promise<EmbedCollectionData | null> {
  if (!isReviewEmbedEnabled()) return null;
  return getCachedCollectionEmbedData(slug);
}

// ============================================
// Series Embed Data
// ============================================

const getCachedSeriesEmbedData = unstable_cache(
  async (slug: string): Promise<EmbedSeriesData | null> => {
    const series = await prisma.reviewSeries.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        description: true,
        visibility: true,
        deletedAt: true,
        coverImage: true,
        createdAt: true,
        owner: { select: { username: true, displayName: true, profileImageUrl: true } },
        items: {
          orderBy: { seriesOrder: 'asc' },
          select: {
            seriesOrder: true,
            review: {
              select: {
                slug: true,
                title: true,
                score: true,
              },
            },
          },
        },
      },
    });

    if (!series || series.deletedAt || series.visibility !== 'PUBLIC') return null;

    return {
      type: 'series',
      slug: series.slug,
      title: series.title,
      description: series.description ?? '',
      partCount: series.items.length,
      owner: series.owner
        ? {
            username: series.owner.username,
            displayName: series.owner.displayName,
            avatar: series.owner.profileImageUrl,
          }
        : { username: '', displayName: 'Nerdiction', avatar: null },
      coverImage: series.coverImage,
      createdAt: series.createdAt.toISOString(),
      url: `${SITE_URL}/serien/${series.slug}`,
      parts: series.items.map((item: { seriesOrder: number; review: { slug: string; title: string; score: number } }) => ({
        order: item.seriesOrder,
        review: {
          slug: item.review.slug,
          title: item.review.title,
          score: item.review.score / 10,
        },
      })),
    };
  },
  ['embed-series'],
  { revalidate: EMBED_CACHE_TTL, tags: ['embed-series'] }
);

export async function getEmbedSeriesData(slug: string): Promise<EmbedSeriesData | null> {
  if (!isReviewEmbedEnabled()) return null;
  return getCachedSeriesEmbedData(slug);
}

// ============================================
// Unified Function
// ============================================

export async function getEmbedData(type: 'review' | 'collection' | 'series', slug: string): Promise<EmbedData | null> {
  switch (type) {
    case 'review':
      return getEmbedReviewData(slug);
    case 'collection':
      return getEmbedCollectionData(slug);
    case 'series':
      return getEmbedSeriesData(slug);
  }
}