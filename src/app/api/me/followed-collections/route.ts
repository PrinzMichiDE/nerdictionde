import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getFollowedCollections } from '@/lib/collection-follow';
import { isCollectionFollowEnabled } from '@/lib/schemas/collection-follow-schema';

/**
 * GET /api/me/followed-collections
 * Gefolgte Collections des aktuellen Users (paginiert, cursor-basiert)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isCollectionFollowEnabled()) {
      return NextResponse.json(
        { error: 'Feature nicht verfügbar' },
        { status: 404 }
      );
    }

    const auth = await requireTwitchAuth(request);
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getFollowedCollections(auth.userId, cursor, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] GET /api/me/followed-collections error:', error);

    if (error instanceof Error && error.message === 'Feature nicht verfügbar') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}