import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import prisma from '@/lib/prisma';
import { isCollectionsFollowEnabled } from '@/lib/collections-follow-schema';
import { createCollectionUpdateNotification } from '@/lib/collection-follow';

/**
 * API Route: Items zu einer Collection hinzufügen/entfernen
 * POST   /api/listen/[slug]/items  - Review(s) zur Liste hinzufügen
 * DELETE /api/listen/[slug]/items  - Review(s) aus Liste entfernen
 */

function checkFeatureFlag() {
  if (!isCollectionsFollowEnabled()) {
    return NextResponse.json({ error: 'Feature nicht verfügbar' }, { status: 404 });
  }
  return null;
}

const addItemSchema = z.object({
  reviewId: z.string().min(1),
});

const addItemsSchema = z.object({
  reviewIds: z.array(z.string().min(1)).min(1).max(20),
});

import { z } from 'zod';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Params
  const { slug } = await params;
  const collection = await prisma.reviewCollection.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, itemCount: true, isPublic: true, deletedAt: true },
  });

  if (!collection) {
    return NextResponse.json({ error: 'Liste nicht gefunden' }, { status: 404 });
  }
  if (collection.ownerId !== auth.userId) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }
  if (collection.deletedAt) {
    return NextResponse.json({ error: 'Liste wurde gelöscht' }, { status: 404 });
  }

  // Body validieren
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  // Single reviewId or multiple reviewIds
  const singleResult = addItemSchema.safeParse(body);
  const multiResult = addItemsSchema.safeParse(body);

  let reviewIds: string[];
  if (singleResult.success) {
    reviewIds = [singleResult.data.reviewId];
  } else if (multiResult.success) {
    reviewIds = multiResult.data.reviewIds;
  } else {
    return NextResponse.json({ error: 'reviewId oder reviewIds erforderlich' }, { status: 400 });
  }

  // Prüfen: Reviews existieren, published, nicht schon in Liste
  const existingItems = await prisma.collectionItem.findMany({
    where: { collectionId: collection.id, reviewId: { in: reviewIds } },
    select: { reviewId: true },
  });
  const existingReviewIds = new Set(existingItems.map((i) => i.reviewId));

  const reviews = await prisma.review.findMany({
    where: { id: { in: reviewIds }, status: 'published' },
    select: { id: true },
  });
  const validReviewIds = reviews.map((r) => r.id).filter((id) => !existingReviewIds.has(id));

  if (validReviewIds.length === 0) {
    return NextResponse.json({ error: 'Keine gültigen Reviews zum Hinzufügen' }, { status: 400 });
  }

  // Max 100 Items pro Liste
  if (collection.itemCount + validReviewIds.length > 100) {
    return NextResponse.json({ error: 'Liste hat Maximum von 100 Items erreicht' }, { status: 400 });
  }

  // Items hinzufügen
  const newItems = await prisma.$transaction(async (tx) => {
    const items = await tx.collectionItem.createMany({
      data: validReviewIds.map((reviewId, index) => ({
        collectionId: collection.id,
        reviewId,
        position: collection.itemCount + index,
      })),
      skipDuplicates: true,
    });

    // Counter aktualisieren
    await tx.reviewCollection.update({
      where: { id: collection.id },
      data: { itemCount: { increment: items.count } },
    });

    return items;
  });

  // Notification für Follower erstellen (async, nicht blockierend)
  if (validReviewIds.length > 0) {
    // Fire-and-forget: Notification erstellen
    createCollectionUpdateNotification(
      collection.id,
      'item_added',
      auth.userId,
      auth.userId, // displayName wäre besser, aber userId reicht für jetzt
      { reviewIds: validReviewIds, count: validReviewIds.length }
    ).catch((err) => console.error('[Notification] Failed to create collection update notification:', err));
  }

  return NextResponse.json({
    success: true,
    addedCount: newItems.count,
    totalCount: collection.itemCount + newItems.count,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Params
  const { slug } = await params;
  const collection = await prisma.reviewCollection.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, itemCount: true, deletedAt: true },
  });

  if (!collection) {
    return NextResponse.json({ error: 'Liste nicht gefunden' }, { status: 404 });
  }
  if (collection.ownerId !== auth.userId) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }
  if (collection.deletedAt) {
    return NextResponse.json({ error: 'Liste wurde gelöscht' }, { status: 404 });
  }

  // Body validieren
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  const multiResult = addItemsSchema.safeParse(body);
  if (!multiResult.success) {
    return NextResponse.json({ error: 'reviewIds erforderlich' }, { status: 400 });
  }

  const reviewIds = multiResult.data.reviewIds;

  // Items entfernen
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.collectionItem.deleteMany({
      where: { collectionId: collection.id, reviewId: { in: reviewIds } },
    });

    if (deleted.count > 0) {
      await tx.reviewCollection.update({
        where: { id: collection.id },
        data: { itemCount: { decrement: deleted.count } },
      });
    }

    return deleted;
  });

  return NextResponse.json({
    success: true,
    removedCount: result.count,
    totalCount: collection.itemCount - result.count,
  });
}