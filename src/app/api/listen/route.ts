import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getPublicCollections } from '@/lib/collections';
import { createCollectionSchema, listCollectionsQuerySchema } from '@/lib/schemas/collection-schema';
import { generateUniqueSlug } from '@/lib/collections';
import prisma from '@/lib/prisma';

/**
 * GET /api/listen
 * Öffentliche Listen mit Filter, Sortierung und Pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listCollectionsQuerySchema.safeParse({
      q: searchParams.get('q') || undefined,
      sort: searchParams.get('sort') || 'updated',
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Query-Parameter', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { collections, nextCursor } = await getPublicCollections(parsed.data);

    return NextResponse.json({
      collections,
      nextCursor,
    });
  } catch (error) {
    console.error('[API] GET /api/listen error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/listen
 * Neue Liste erstellen (nur angemeldete Nutzer)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireTwitchAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = createCollectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, isPublic = true, reviewIds = [] } = parsed.data;

    // Validierung: Reviews existieren und sind published
    if (reviewIds.length > 0) {
      const reviews = await prisma.review.findMany({
        where: { id: { in: reviewIds }, status: 'published' },
        select: { id: true },
      });

      if (reviews.length !== reviewIds.length) {
        return NextResponse.json(
          { error: 'Eine oder mehrere Reviews nicht gefunden oder nicht veröffentlicht' },
          { status: 400 }
        );
      }
    }

    // Eindeutigen Slug generieren
    const slug = await generateUniqueSlug(title);

    // Collection erstellen
    const collection = await prisma.reviewCollection.create({
      data: {
        slug,
        title,
        description,
        isPublic,
        ownerId: auth.userId,
        itemCount: reviewIds.length,
        items: reviewIds.length > 0
          ? {
              create: reviewIds.map((reviewId, index) => ({
                reviewId,
                position: index,
              })),
            }
          : undefined,
      },
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

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/listen error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}