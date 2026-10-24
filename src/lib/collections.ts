import prisma from '@/lib/prisma';
import { ReviewCollection, CollectionItem, Review, TwitchUser } from '@prisma/client';
import { validateReorderArray, generateSlugFromTitle } from '@/lib/schemas/collection-schema';
import type { Prisma } from '@prisma/client';

/**
 * Server-seitige Utilities für Review Collections
 * Enthält: Slug-Generierung (kollisionsfrei), Reorder-Validierung, Count-Sync, Cache-Helper
 */

// ============================================
// Typ-Definitionen
// ============================================

export type CollectionWithOwner = ReviewCollection & {
  owner: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'>;
};

export type CollectionWithItems = ReviewCollection & {
  owner: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'>;
  items: (CollectionItem & {
    review: Pick<Review, 'id' | 'title' | 'slug' | 'category' | 'score' | 'images' | 'releaseDate'>;
  })[];
  nextCursor: number | null;
};

export type CollectionListItem = ReviewCollection & {
  owner: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'>;
};

// ============================================
// Slug-Generierung (kollisionsfrei)
// ============================================

/**
 * Generiert einen eindeutigen Slug aus einem Titel
 * Bei Kollision wird -2, -3, ... angehängt
 */
export async function generateUniqueSlug(baseTitle: string): Promise<string> {
  const baseSlug = generateSlugFromTitle(baseTitle);

  // Prüfe ob Basis-Slug frei ist
  const existing = await prisma.reviewCollection.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existing) {
    return baseSlug;
  }

  // Kollision: suche nächste freie Nummer
  let counter = 2;
  let candidateSlug = `${baseSlug}-${counter}`;

  while (true) {
    const collision = await prisma.reviewCollection.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!collision) {
      return candidateSlug;
    }

    counter++;
    candidateSlug = `${baseSlug}-${counter}`;

    // Sicherheitsnetz: nach 1000 Versuchen abbrechen
    if (counter > 1000) {
      throw new Error('Konnte keinen eindeutigen Slug generieren');
    }
  }
}

// ============================================
// Count-Sync (denormalisierter itemCount)
// ============================================

/**
 * Aktualisiert den denormalisierten itemCount auf der Collection
 * Wird nach Add/Remove/Reorder aufgerufen
 */
export async function syncItemCount(collectionId: string): Promise<number> {
  const count = await prisma.collectionItem.count({
    where: { collectionId },
  });

  await prisma.reviewCollection.update({
    where: { id: collectionId },
    data: { itemCount: count },
  });

  return count;
}

/**
 * Inkrementiert itemCount atomar (für Add)
 */
export async function incrementItemCount(collectionId: string): Promise<number> {
  const updated = await prisma.reviewCollection.update({
    where: { id: collectionId },
    data: { itemCount: { increment: 1 } },
    select: { itemCount: true },
  });
  return updated.itemCount;
}

/**
 * Dekrementiert itemCount atomar (für Remove)
 */
export async function decrementItemCount(collectionId: string): Promise<number> {
  const updated = await prisma.reviewCollection.update({
    where: { id: collectionId },
    data: { itemCount: { decrement: 1 } },
    select: { itemCount: true },
  });
  return updated.itemCount;
}

// ============================================
// Reorder-Logik
// ============================================

/**
 * Führt Reorder atomar in einer Transaktion durch
 * Validiert vorher, dass das Array alle aktuellen IDs enthält
 */
export async function reorderCollectionItems(
  collectionId: string,
  newReviewIds: string[],
  expectedVersion: number
): Promise<{ success: boolean; error?: string; version?: number }> {
  // 1. Aktuelle Items laden (nur reviewId + position)
  const currentItems = await prisma.collectionItem.findMany({
    where: { collectionId },
    select: { reviewId: true, position: true },
    orderBy: { position: 'asc' },
  });

  const currentReviewIds = currentItems.map((i: { reviewId: string }) => i.reviewId);

  // 2. Validierung
  const validation = validateReorderArray(currentReviewIds, newReviewIds);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 3. Optimistisches Locking: Version prüfen
  const collection = await prisma.reviewCollection.findUnique({
    where: { id: collectionId },
    select: { version: true },
  });

  if (!collection) {
    return { success: false, error: 'Liste nicht gefunden' };
  }

  if (collection.version !== expectedVersion) {
    return { success: false, error: 'Liste wurde zwischenzeitlich geändert, bitte neu laden' };
  }

  // 4. Transaktion: Positionen aktualisieren + Version inkrementieren
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Alle Items löschen und neu anlegen (einfacher als viele Updates)
      await tx.collectionItem.deleteMany({ where: { collectionId } });

      await tx.collectionItem.createMany({
        data: newReviewIds.map((reviewId, index) => ({
          collectionId,
          reviewId,
          position: index,
        })),
      });

      // Version inkrementieren für optimistisches Locking
      await tx.reviewCollection.update({
        where: { id: collectionId },
        data: { version: { increment: 1 } },
      });
    });

    return { success: true, version: expectedVersion + 1 };
  } catch (error) {
    console.error('[collections] Reorder failed:', error);
    return { success: false, error: 'Fehler beim Speichern der Reihenfolge' };
  }
}

/**
 * Fügt ein Review an einer Position ein (schiebt bestehende nach hinten)
 */
export async function insertItemAtPosition(
  collectionId: string,
  reviewId: string,
  position: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Items ab Position nach hinten schieben
      await tx.collectionItem.updateMany({
        where: {
          collectionId,
          position: { gte: position },
        },
        data: { position: { increment: 1 } },
      });

      // Neues Item einfügen
      await tx.collectionItem.create({
        data: { collectionId, reviewId, position },
      });

      // itemCount inkrementieren
      await tx.reviewCollection.update({
        where: { id: collectionId },
        data: { itemCount: { increment: 1 } },
      });
    });

    return { success: true };
  } catch (error) {
    // Prisma P2002 = Unique Constraint Violation (duplicate reviewId)
    if (error instanceof Error && error.message.includes('P2002')) {
      return { success: false, error: 'Review ist bereits in der Liste' };
    }
    console.error('[collections] Insert item failed:', error);
    return { success: false, error: 'Fehler beim Hinzufügen' };
  }
}

/**
 * Entfernt ein Review aus der Liste (schiebt nachfolgende nach vorne)
 */
export async function removeItemFromCollection(
  collectionId: string,
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const item = await prisma.collectionItem.findUnique({
      where: { collectionId_reviewId: { collectionId, reviewId } },
      select: { position: true },
    });

    if (!item) {
      return { success: false, error: 'Review nicht in Liste gefunden' };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Item löschen
      await tx.collectionItem.delete({
        where: { collectionId_reviewId: { collectionId, reviewId } },
      });

      // Nachfolgende Items nach vorne schieben
      await tx.collectionItem.updateMany({
        where: {
          collectionId,
          position: { gt: item.position },
        },
        data: { position: { decrement: 1 } },
      });

      // itemCount dekrementieren
      await tx.reviewCollection.update({
        where: { id: collectionId },
        data: { itemCount: { decrement: 1 } },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('[collections] Remove item failed:', error);
    return { success: false, error: 'Fehler beim Entfernen' };
  }
}

// ============================================
// Abfragen mit Cache
// ============================================

/**
 * Holt öffentliche Listen für /api/listen (gecacht 60s)
 */
export const getPublicCollections = async (params: {
  q?: string;
  sort?: 'updated' | 'created' | 'itemCount' | 'popular' | 'popularity';
  cursor?: string;
  limit?: number;
}): Promise<{ collections: CollectionListItem[]; nextCursor: string | null }> => {
  const { q, sort = 'updated', cursor, limit = 20 } = params;

  const where: Record<string, unknown> = {
    isPublic: true,
    deletedAt: null,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (cursor) {
    where.id = { lt: cursor }; // cursor-basierte Pagination (ID-basiert)
  }

  const orderBy = (() => {
    switch (sort) {
      case 'created': return { createdAt: 'desc' as const };
      case 'itemCount': return { itemCount: 'desc' as const };
      case 'popular': return { followersCount: 'desc' as const };
      case 'popularity': return { itemCount: 'desc' as const }; // später: viewCount
      default: return { updatedAt: 'desc' as const };
    }
  })();

  const collections = await prisma.reviewCollection.findMany({
    where,
    orderBy,
    take: limit + 1, // +1 für hasMore-Check
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      isPublic: true,
      itemCount: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: { id: true, username: true, displayName: true, profileImageUrl: true },
      },
    },
  });

  const hasMore = collections.length > limit;
  const items = hasMore ? collections.slice(0, -1) : collections;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { collections: items as CollectionListItem[], nextCursor };
};

/**
 * Holt eine Collection mit Items für /api/listen/[slug] (gecacht 30s)
 */
export const getCollectionWithItems = async (params: {
  slug: string;
  userId?: string; // für Private-Check
  cursor?: number; // position cursor
  limit?: number;
}): Promise<CollectionWithItems | null> => {
  const { slug, userId, cursor = 0, limit = 12 } = params;

  const collection = await prisma.reviewCollection.findUnique({
    where: { slug },
    include: {
      owner: {
        select: { id: true, username: true, displayName: true, profileImageUrl: true },
      },
      items: {
        where: { position: { gte: cursor } },
        orderBy: { position: 'asc' },
        take: limit + 1,
        include: {
          review: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              score: true,
              images: true,
              releaseDate: true,
            },
          },
        },
      },
    },
  });

  if (!collection) return null;

  // Private Liste: nur Owner darf sehen
  if (!collection.isPublic && collection.ownerId !== userId) {
    return null;
  }

  // Gelöschte Listen: nur Owner darf sehen (für Restore)
  if (collection.deletedAt && collection.ownerId !== userId) {
    return null;
  }

  const hasMore = collection.items.length > limit;
  const items = hasMore ? collection.items.slice(0, -1) : collection.items;
  const nextCursor = hasMore ? items[items.length - 1].position : null;

  return {
    ...collection,
    items,
    nextCursor,
  } as CollectionWithItems & { nextCursor: number | null };
};

/**
 * Holt eigene Listen für /api/me/listen
 */
export const getMyCollections = async (params: {
  userId: string;
  cursor?: string;
  limit?: number;
}): Promise<{ collections: CollectionListItem[]; nextCursor: string | null }> => {
  const { userId, cursor, limit = 20 } = params;

  const where: Record<string, unknown> = { ownerId: userId };
  if (cursor) {
    where.id = { lt: cursor };
  }

  const collections = await prisma.reviewCollection.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      isPublic: true,
      itemCount: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: { id: true, username: true, displayName: true, profileImageUrl: true },
      },
    },
  });

  const hasMore = collections.length > limit;
  const items = hasMore ? collections.slice(0, -1) : collections;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { collections: items as CollectionListItem[], nextCursor };
};

/**
 * Prüft ob User Owner der Collection ist
 */
export async function isCollectionOwner(collectionId: string, userId: string): Promise<boolean> {
  const collection = await prisma.reviewCollection.findUnique({
    where: { id: collectionId },
    select: { ownerId: true },
  });
  return collection?.ownerId === userId;
}

/**
 * Prüft ob User Owner der Collection ist (by Slug)
 */
export async function isCollectionOwnerBySlug(slug: string, userId: string): Promise<boolean> {
  const collection = await prisma.reviewCollection.findUnique({
    where: { slug },
    select: { ownerId: true },
  });
  return collection?.ownerId === userId;
}

/**
 * Holt Collection by ID (für Owner-Checks in Mutations)
 */
export async function getCollectionById(collectionId: string): Promise<ReviewCollection | null> {
  return prisma.reviewCollection.findUnique({
    where: { id: collectionId },
  });
}

/**
 * Holt Collection by Slug (für Owner-Checks)
 */
export async function getCollectionBySlug(slug: string): Promise<ReviewCollection | null> {
  return prisma.reviewCollection.findUnique({
    where: { slug },
  });
}

// ============================================
// Validierung: Review existiert und ist published
// ============================================

/**
 * Prüft ob Review existiert und published ist
 */
export async function validateReviewForCollection(reviewId: string): Promise<{ valid: boolean; error?: string }> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, status: true },
  });

  if (!review) {
    return { valid: false, error: 'Review nicht gefunden' };
  }

  if (review.status !== 'published') {
    return { valid: false, error: 'Nur veröffentlichte Reviews können hinzugefügt werden' };
  }

  return { valid: true };
}

// ============================================
// Max Items Check
// ============================================

const MAX_ITEMS_PER_COLLECTION = 100;

/**
 * Prüft ob Collection noch Items aufnehmen kann
 */
export async function canAddItem(collectionId: string): Promise<{ allowed: boolean; error?: string }> {
  const collection = await prisma.reviewCollection.findUnique({
    where: { id: collectionId },
    select: { itemCount: true },
  });

  if (!collection) {
    return { allowed: false, error: 'Liste nicht gefunden' };
  }

  if (collection.itemCount >= MAX_ITEMS_PER_COLLECTION) {
    return { allowed: false, error: `Maximal ${MAX_ITEMS_PER_COLLECTION} Reviews pro Liste erlaubt` };
  }

  return { allowed: true };
}