import { unstable_cache } from 'next/cache';
import prisma from './prisma';
import { isCollectionFollowEnabled } from './schemas/collection-follow-schema';

export type FollowCollectionResult = {
  followed: boolean;
  followersCount: number;
};

export type FollowStatusResult = {
  isFollowing: boolean;
  followersCount: number;
};

export type FollowedCollectionItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  owner: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  };
  itemCount: number;
  followersCount: number;
  updatedAt: Date;
  isFollowing: true;
};

export type FollowedCollectionsResult = {
  collections: FollowedCollectionItem[];
  nextCursor: string | null;
};

/**
 * Prüft ob Collection Follow Feature aktiviert ist
 */
function checkFeatureEnabled() {
  if (!isCollectionFollowEnabled()) {
    throw new Error('Collection Follow Feature ist deaktiviert');
  }
}

/**
 * Folgt einer Collection
 * Erstellt Follow-Eintrag, inkrementiert Counter, erstellt Notification für Owner
 */
export async function followCollection(
  userId: string,
  collectionId: string
): Promise<FollowCollectionResult> {
  checkFeatureEnabled();

  // Prüfen ob Collection existiert und öffentlich ist
  const collection = await prisma.reviewCollection.findUnique({
    where: { id: collectionId },
    select: { id: true, ownerId: true, isPublic: true, deletedAt: true },
  });

  if (!collection) {
    throw new Error('Liste nicht gefunden');
  }

  if (!collection.isPublic || collection.deletedAt) {
    throw new Error('Liste nicht verfügbar');
  }

  // Transaktion: Follow erstellen, Counter inkrementieren, Notification für Owner
  await prisma.$transaction(async (tx) => {
    // Upsert Follow (idempotent - falls schon gefolgt, updatedAt aktualisieren)
    await tx.collectionFollow.upsert({
      where: {
        userId_collectionId: {
          userId,
          collectionId,
        },
      },
      create: {
        userId,
        collectionId,
      },
      update: {
        createdAt: new Date(),
      },
    });

    // followersCount atomar inkrementieren
    await tx.reviewCollection.update({
      where: { id: collectionId },
      data: { followersCount: { increment: 1 } },
    });

    // Notification für Owner erstellen (nicht für Self-Follow)
    if (collection.ownerId !== userId) {
      await tx.notification.create({
        data: {
          userId: collection.ownerId,
          type: 'collection_update',
          title: 'Neuer Follower für deine Liste',
          message: `Jemand folgt deiner Liste.`,
          data: {
            collectionId,
            followerId: userId,
            action: 'follow',
          },
        },
      });
    }
  });

  // Aktuellen Counter lesen
  const updatedCollection = await prisma.reviewCollection.findUnique({
    where: { id: collectionId },
    select: { followersCount: true },
  });

  return {
    followed: true,
    followersCount: updatedCollection?.followersCount ?? 1,
  };
}

/**
 * Entfolgt einer Collection
 * Löscht Follow-Eintrag, dekrementiert Counter
 */
export async function unfollowCollection(
  userId: string,
  collectionId: string
): Promise<FollowCollectionResult> {
  checkFeatureEnabled();

  // Prüfen ob Follow existiert
  const existingFollow = await prisma.collectionFollow.findUnique({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
  });

  if (!existingFollow) {
    throw new Error('Nicht gefolgt');
  }

  // Transaktion: Follow löschen, Counter dekrementieren
  await prisma.$transaction(async (tx) => {
    await tx.collectionFollow.delete({
      where: {
        userId_collectionId: {
          userId,
          collectionId,
        },
      },
    });

    await tx.reviewCollection.update({
      where: { id: collectionId },
      data: { followersCount: { decrement: 1 } },
    });
  });

  // Aktuellen Counter lesen
  const updatedCollection = await prisma.reviewCollection.findUnique({
    where: { id: collectionId },
    select: { followersCount: true },
  });

  return {
    followed: false,
    followersCount: updatedCollection?.followersCount ?? 0,
  };
}

/**
 * Toggle Follow Status (follow wenn nicht gefolgt, unfollow wenn gefolgt)
 */
export async function toggleCollectionFollow(
  userId: string,
  collectionId: string
): Promise<FollowCollectionResult> {
  const isFollowing = await isFollowingCollection(userId, collectionId);

  if (isFollowing) {
    return unfollowCollection(userId, collectionId);
  } else {
    return followCollection(userId, collectionId);
  }
}

/**
 * Prüft ob User einer Collection folgt
 */
export async function isFollowingCollection(
  userId: string,
  collectionId: string
): Promise<boolean> {
  if (!isCollectionFollowEnabled()) return false;

  const follow = await prisma.collectionFollow.findUnique({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
    select: { id: true },
  });

  return !!follow;
}

/**
 * Holt Follow-Status und Counter für eine Collection (für SSR)
 * Gecacht für 60 Sekunden
 */
export const getFollowStatus = unstable_cache(
  async (userId: string | undefined, collectionId: string): Promise<FollowStatusResult> => {
    if (!isCollectionFollowEnabled()) {
      const collection = await prisma.reviewCollection.findUnique({
        where: { id: collectionId },
        select: { followersCount: true },
      });
      return {
        isFollowing: false,
        followersCount: collection?.followersCount ?? 0,
      };
    }

    if (!userId) {
      const collection = await prisma.reviewCollection.findUnique({
        where: { id: collectionId },
        select: { followersCount: true },
      });
      return {
        isFollowing: false,
        followersCount: collection?.followersCount ?? 0,
      };
    }

    const [follow, collection] = await Promise.all([
      prisma.collectionFollow.findUnique({
        where: {
          userId_collectionId: {
            userId,
            collectionId,
          },
        },
        select: { id: true },
      }),
      prisma.reviewCollection.findUnique({
        where: { id: collectionId },
        select: { followersCount: true },
      }),
    ]);

    return {
      isFollowing: !!follow,
      followersCount: collection?.followersCount ?? 0,
    };
  },
  ['collection-follow-status'],
  { tags: ['collection-follow-status'], revalidate: 60 }
);

/**
 * Holt die gefolgten Collections eines Users (paginiert, cursor-basiert)
 * Gecacht für 60 Sekunden
 */
export const getFollowedCollections = unstable_cache(
  async (
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<FollowedCollectionsResult> => {
    checkFeatureEnabled();

    const follows = await prisma.collectionFollow.findMany({
      where: {
        userId,
        ...(cursor ? { id: { lt: cursor } } : {}),
        collection: {
          isPublic: true,
          deletedAt: null,
        },
      },
      include: {
        collection: {
          include: {
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
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    // All follows should have valid collections due to the where clause above
    const validFollows = follows.filter((f) => f.collection !== null);

    const hasMore = validFollows.length > limit;
    const items = hasMore ? validFollows.slice(0, limit) : validFollows;
    const nextCursor = hasMore ? validFollows[limit].id : null;

    const collections: FollowedCollectionItem[] = items.map((f) => ({
      id: f.collection!.id,
      slug: f.collection!.slug,
      title: f.collection!.title,
      description: f.collection!.description,
      coverImage: null, // ReviewCollection hat kein coverImage Feld
      owner: f.collection!.owner,
      itemCount: f.collection!.itemCount,
      followersCount: f.collection!.followersCount,
      updatedAt: f.collection!.updatedAt,
      isFollowing: true,
    }));

    return { collections, nextCursor };
  },
  ['followed-collections'],
  { tags: ['followed-collections'], revalidate: 60 }
);

/**
 * Cache-Invaliderung nach Follow/Unfollow
 */
export function invalidateCollectionFollowCache(_userId: string, _collectionId: string) {
  // Note: Next.js unstable_cache doesn't have direct invalidation
  // Would need to use revalidateTag if using Next.js 15+ cache tags
  // For now, cache expires after 60 seconds
}

/**
 * Erstellt Collection-Update Notification (für Owner bei Änderungen an der Collection)
 * Wird aufgerufen bei: Item hinzugefügt, Item entfernt, Reorder, Titel/Beschreibung geändert
 */
export async function createCollectionUpdateNotification(
  collectionId: string,
  action: 'item_added' | 'item_removed' | 'reordered' | 'updated',
  actorId: string,
  actorDisplayName: string,
  details?: Record<string, unknown>
) {
  checkFeatureEnabled();

  // Collection und Follower laden
  const collection = await prisma.reviewCollection.findUnique({
    where: { id: collectionId },
    select: { id: true, title: true, ownerId: true },
  });

  if (!collection) return;

  // Alle Follower der Collection laden (außer dem Actor)
  const follows = await prisma.collectionFollow.findMany({
    where: {
      collectionId,
      userId: { not: actorId },
    },
    select: { userId: true },
  });

  if (follows.length === 0) return;

  // Action-spezifische Nachrichten
  const messages: Record<string, string> = {
    item_added: `Neues Review in "${collection.title}" hinzugefügt`,
    item_removed: `Review aus "${collection.title}" entfernt`,
    reordered: `Reihenfolge in "${collection.title}" geändert`,
    updated: `"${collection.title}" wurde aktualisiert`,
  };

  // Notifications für alle Follower erstellen (Batch)
  await prisma.notification.createMany({
    data: follows.map((f) => ({
      userId: f.userId,
      type: 'collection_update' as const,
      title: 'Liste aktualisiert',
      message: messages[action] || `"${collection.title}" wurde aktualisiert`,
      data: {
        collectionId,
        collectionSlug: collection.title, // title als fallback für slug
        action,
        actorId,
        actorDisplayName,
        ...details,
      },
    })),
  });
}