import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getCollectionBySlug, isCollectionOwnerBySlug, removeItemFromCollection } from '@/lib/collections';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/listen/[slug]/items/[reviewId]
 * Review aus Liste entfernen (nur Owner)
 */
export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: Promise<any> }
) {
  try {
    const { slug, reviewId } = await context.params;
    const auth = await requireTwitchAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Owner-Check
    const isOwner = await isCollectionOwnerBySlug(slug, auth.userId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      );
    }

    // Collection laden für ID
    const collection = await getCollectionBySlug(slug);
    if (!collection) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    // Item entfernen
    const result = await removeItemFromCollection(collection.id, reviewId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Aktualisierte Items zurückgeben
    const items = await prisma.collectionItem.findMany({
      where: { collectionId: collection.id },
      orderBy: { position: 'asc' },
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
    });

    return NextResponse.json({ items, itemCount: collection.itemCount - 1 });
  } catch (error) {
    console.error('[API] DELETE /api/listen/[slug]/items/[reviewId] error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}