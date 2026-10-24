import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { reorderSchema } from '@/lib/schemas/collection-schema';
import { getCollectionBySlug, isCollectionOwnerBySlug, reorderCollectionItems } from '@/lib/collections';
import prisma from '@/lib/prisma';

/**
 * PATCH /api/listen/[slug]/reorder
 * Reihenfolge der Items ändern (nur Owner, optimistisches Locking via Version)
 */
export async function PATCH(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: Promise<any> }
) {
  try {
    const { slug } = await context.params;
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

    // Collection laden für ID und Version
    const collection = await getCollectionBySlug(slug);
    if (!collection) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reviewIds } = parsed.data;

    // Reorder durchführen mit optimistischem Locking
    const result = await reorderCollectionItems(collection.id, reviewIds, collection.version);

    if (!result.success) {
      const status = result.error?.includes('zwischenzeitlich') ? 409 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
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

    return NextResponse.json({
      items,
      version: result.version,
    });
  } catch (error) {
    console.error('[API] PATCH /api/listen/[slug]/reorder error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}