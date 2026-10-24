import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getCollectionWithItems, getCollectionBySlug, isCollectionOwnerBySlug } from '@/lib/collections';
import { updateCollectionSchema, getCollectionQuerySchema } from '@/lib/schemas/collection-schema';
import prisma from '@/lib/prisma';

/**
 * GET /api/listen/[slug]
 * Listen-Detail mit Items (Pagination)
 * Öffentliche Listen: jeder
 * Private Listen: nur Owner
 */
export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: Promise<any> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const auth = await requireTwitchAuth(request);
    const userId = auth instanceof NextResponse ? undefined : auth.userId;

    const parsed = getCollectionQuerySchema.safeParse({
      cursor: searchParams.get('cursor') ? parseInt(searchParams.get('cursor')!) : 0,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Query-Parameter', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const collection = await getCollectionWithItems({
      slug,
      userId,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    const { items, nextCursor, ...collectionData } = collection;

    return NextResponse.json({
      ...collectionData,
      items,
      nextCursor,
    });
  } catch (error) {
    console.error('[API] GET /api/listen/[slug] error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/listen/[slug]
 * Metadaten aktualisieren (nur Owner)
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

    const body = await request.json();
    const parsed = updateCollectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, isPublic } = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const collection = await prisma.reviewCollection.update({
      where: { slug },
      data: updateData,
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

    return NextResponse.json(collection);
  } catch (error) {
    console.error('[API] PATCH /api/listen/[slug] error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listen/[slug]
 * Liste löschen (Soft Delete, nur Owner)
 */
export async function DELETE(
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

    // Soft Delete
    await prisma.reviewCollection.update({
      where: { slug },
      data: { deletedAt: new Date() },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API] DELETE /api/listen/[slug] error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}