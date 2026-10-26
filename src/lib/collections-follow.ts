import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { isCollectionsFollowEnabled } from '@/lib/collections-follow-schema';
import type { FollowStatus, FollowedCollection, Follower, FollowersResponse } from '@/lib/collections-follow-schema';

/**
 * Server Logic für Collections Follow Feature
 * Patterns: unstable_cache mit Tag-Invaliderung, Prisma Transaktionen für Counts
 * Wiederverwendet: review-reactions.ts, collections.ts, reading-history.ts Patterns
 */

// ============================================
// Cache Tags
// ============================================

const CACHE_TAGS = {
  collectionFollow: (slug: string) => `collection-follow:${slug}`,
  userFollowedCollections: (userId: string) => `user-followed-collections:${userId}`,
  collectionFollowers: (collectionId: string) => `collection-followers:${collectionId}`,
  collectionFollowerIds: (collectionId: string) => `collection-follower-ids:${collectionId}`,
} as const;

// ============================================
// Helper: Collection by Slug finden
// ============================================

async function getCollectionBySlug(slug: string) {
  return prisma.reviewCollection.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      isPublic: true,
      ownerId: true,
      deletedAt: true,
      followersCount: true,
    },
  });
}

// ============================================
// Follow Status (Cached, 30s)
// ============================================

export const getFollowStatus = unstable_cache(
  async (userId: string, collectionId: string): Promise<FollowStatus> => {
    const follow = await prisma.collectionFollow.findUnique({
      where: {
        userId_collectionId: { userId, collectionId },
      },
      select: { id: true },
    });

    const collection = await prisma.reviewCollection.findUnique({
      where: { id: collectionId },
      select: { followersCount: true },
    });

    return {
      followed: !!follow,
      followerCount: collection?.followersCount ?? 0,
    };
  },
  ['collection-follow-status'],
  { tags: ['collection-follow-status'], revalidate: 30 }
);

// Wrapper mit Slug für API
export async function getFollowStatusBySlug(userId: string, slug: string): Promise<FollowStatus | null> {
  const collection = await getCollectionBySlug(slug);
  if (!collection) return null;

  return getFollowStatus(userId, collection.id);
}

// ============================================
// Follow Toggle (Mutation)
// ============================================

export async function toggleFollow(userId: string, slug: string): Promise<{ followed: boolean; followerCount: number }> {
  if (!isCollectionsFollowEnabled()) {
    throw new Error('Feature nicht aktiviert');
  }

  const collection = await getCollectionBySlug(slug);
  if (!collection) {
    throw new Error('Liste nicht gefunden');
  }

  // Validierungen
  if (!collection.isPublic) {
    throw new Error('Liste ist nicht öffentlich');
  }
  if (collection.deletedAt) {
    throw new Error('Liste wurde gelöscht');
  }
  if (collection.ownerId === userId) {
    throw new Error('Eigene Liste kann nicht gefolgt werden');
  }

  // Prüfen ob bereits gefolgt
  const existingFollow = await prisma.collectionFollow.findUnique({
    where: { userId_collectionId: { userId, collectionId: collection.id } },
  });

  let followed: boolean;
  let newFollowerCount: number;

  if (existingFollow) {
    // UNFOLLOW
    await prisma.$transaction([
      prisma.collectionFollow.delete({
        where: { id: existingFollow.id },
      }),
      prisma.reviewCollection.update({
        where: { id: collection.id },
        data: { followersCount: { decrement: 1 } },
      }),
    ]);
    followed = false;
    newFollowerCount = Math.max(0, collection.followersCount - 1);
  } else {
    // FOLLOW
    await prisma.$transaction([
      prisma.collectionFollow.create({
        data: { userId, collectionId: collection.id },
      }),
      prisma.reviewCollection.update({
        where: { id: collection.id },
        data: { followersCount: { increment: 1 } },
      }),
    ]);
    followed = true;
    newFollowerCount = collection.followersCount + 1;
  }

  // Cache Invaliderung
  await invalidateFollowCaches(collection.slug, collection.id, userId);

  return { followed, followerCount: newFollowerCount };
}

// ============================================
// Gefolgte Listen des Users (Cached, 60s)
// ============================================

export const getFollowedCollections = unstable_cache(
  async (userId: string, cursor?: string, limit = 20): Promise<{ collections: FollowedCollection[]; nextCursor: string | null }> => {
    const follows = await prisma.collectionFollow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { userId_collectionId: { userId, collectionId: cursor } } : undefined,
      select: {
        collectionId: true,
        createdAt: true,
        collection: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            itemCount: true,
            followersCount: true,
            owner: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (follows.length > limit) {
      const nextItem = follows.pop()!;
      nextCursor = nextItem.collectionId;
    }

    const collections: FollowedCollection[] = follows.map((f: typeof follows[0]) => ({
      id: f.collection.id,
      slug: f.collection.slug,
      title: f.collection.title,
      description: f.collection.description,
      coverImage: null,
      owner: {
        id: f.collection.owner.id,
        username: f.collection.owner.username,
        displayName: f.collection.owner.displayName,
        profileImageUrl: f.collection.owner.profileImageUrl,
      },
      itemCount: f.collection.itemCount,
      followerCount: f.collection.followersCount,
      followedAt: f.createdAt,
    }));

    return { collections, nextCursor };
  },
  ['user-followed-collections'],
  { tags: ['user-followed-collections'], revalidate: 60 }
);

// ============================================
// Follower einer Liste (Cached, 60s) - nur für Owner
// ============================================

export const getFollowers = unstable_cache(
  async (collectionId: string, cursor?: string, limit = 20): Promise<FollowersResponse> => {
    const follows = await prisma.collectionFollow.findMany({
      where: { collectionId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { userId_collectionId: { userId: cursor, collectionId } } : undefined,
      select: {
        userId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (follows.length > limit) {
      const nextItem = follows.pop()!;
      nextCursor = nextItem.userId;
    }

    const totalCount = await prisma.collectionFollow.count({ where: { collectionId } });

    const followers: Follower[] = follows.map((f: typeof follows[0]) => ({
      id: f.user.id,
      username: f.user.username,
      displayName: f.user.displayName,
      profileImageUrl: f.user.profileImageUrl,
      followedAt: f.createdAt,
    }));

    return { followers, nextCursor, totalCount };
  },
  ['collection-followers'],
  { tags: ['collection-followers'], revalidate: 60 }
);

// ============================================
// Follower IDs für Notifications (Cached, 60s)
// ============================================

export const getFollowerIds = unstable_cache(
  async (collectionId: string): Promise<string[]> => {
    const follows = await prisma.collectionFollow.findMany({
      where: { collectionId },
      select: { userId: true },
    });
    return follows.map((f: { userId: string }) => f.userId);
  },
  ['collection-follower-ids'],
  { tags: ['collection-follower-ids'], revalidate: 60 }
);

// ============================================
// Follower IDs für Feed Query (Cached, 60s)
// ============================================

export const getFollowedCollectionIds = unstable_cache(
  async (userId: string): Promise<string[]> => {
    const follows = await prisma.collectionFollow.findMany({
      where: { userId },
      select: { collectionId: true },
    });
    return follows.map((f: { collectionId: string }) => f.collectionId);
  },
  ['user-followed-collection-ids'],
  { tags: ['user-followed-collection-ids'], revalidate: 60 }
);

// ============================================
// Cache Invaliderung
// ============================================

async function invalidateFollowCaches(slug: string, collectionId: string, userId: string) {
  const { revalidateTag } = await import('next/cache');

  revalidateTag(CACHE_TAGS.collectionFollow(slug), '');
  revalidateTag(CACHE_TAGS.userFollowedCollections(userId), '');
  revalidateTag(CACHE_TAGS.collectionFollowers(collectionId), '');
  revalidateTag(CACHE_TAGS.collectionFollowerIds(collectionId), '');
  // userFollowedCollectionIds wird über userFollowedCollections abgedeckt (gleicher User)
}

// ============================================
// Utility: Prüfen ob User Liste folgt (für Feed/Notifications)
// ============================================

export async function userFollowsCollection(userId: string, collectionId: string): Promise<boolean> {
  const follow = await prisma.collectionFollow.findUnique({
    where: { userId_collectionId: { userId, collectionId } },
    select: { id: true },
  });
  return !!follow;
}