import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getMyCollections } from '@/lib/collections';
import { listCollectionsQuerySchema } from '@/lib/schemas/collection-schema';

/**
 * GET /api/me/listen
 * Eigene Listen (public + private) mit Pagination
 * Nur für angemeldete Nutzer
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireTwitchAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const parsed = listCollectionsQuerySchema.safeParse({
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Query-Parameter', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { collections, nextCursor } = await getMyCollections({
      userId: auth.userId,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });

    return NextResponse.json({
      collections,
      nextCursor,
    });
  } catch (error) {
    console.error('[API] GET /api/me/listen error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}