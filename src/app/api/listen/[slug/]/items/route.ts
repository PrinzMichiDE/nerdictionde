import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { addItemSchema } from '@/lib/schemas/collection-schema';
import { getCollectionBySlug, isCollectionOwnerBySlug, canAddItem, validateReviewForCollection, insertItemAtPosition } from '@/lib/collections';
import prisma from '@/lib/prisma';

/**
 * POST /api/listen/[slug]/items
 * Review zur Liste hinzufügen (nur Owner, max 100 Items, nur published Reviews)
 */
export async function POST(
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

    // Collection laden für ID
    const collection = await getCollectionBySlug(slug);
    if (!collection) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    // Max Items Check
    const canAdd = await canAddItem(collection.id);
    if (!canAdd.allowed) {
      return NextResponse.json(
        { error: canAdd.error },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reviewId, position } = parsed.data;

    // Review validieren (existiert, published)
    const reviewValid = await validateReviewForCollection(reviewId);
    if (!reviewValid.valid) {
      return NextResponse.json(
        { error: reviewValid.error },
        { status: 400 }
      );
    }

    // Position bestimmen: falls nicht angegeben, ans Ende
    const insertPosition = position ?? collection.itemCount;

    // Item einfügen
    const result = await insertItemAtPosition(collection.id, reviewId, insertPosition);

    if (!result.success) {
      const status = result.error?.includes('bereits') ? 409 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    // Aktualisierte Items zurückgeben (für optimistische UI)
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

    return NextResponse.json({ items, itemCount: collection.itemCount + 1 });
  } catch (error) {
    console.error('[API] POST /api/listen/[slug]/items error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}