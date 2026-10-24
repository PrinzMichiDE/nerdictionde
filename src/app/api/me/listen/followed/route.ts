import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { isCollectionsFollowEnabled } from '@/lib/collections-follow-schema';
import { followedCollectionsQuerySchema, followedCollectionsResponseSchema } from '@/lib/collections-follow-schema';
import { getFollowedCollections } from '@/lib/collections-follow';

/**
 * API Route: Gefolgte Listen des aktuellen Users
 * GET /api/me/listen/followed
 */

export async function GET(request: NextRequest) {
  const featureCheck = isCollectionsFollowEnabled();
  if (!featureCheck) {
    return NextResponse.json({ error: 'Feature nicht verfügbar' }, { status: 404 });
  }

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Query Parameter validieren
  const { searchParams } = new URL(request.url);
  const parsed = followedCollectionsQuerySchema.safeParse({
    cursor: searchParams.get('cursor') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Query-Parameter', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await getFollowedCollections(auth.userId, parsed.data.cursor, parsed.data.limit);

    const response = followedCollectionsResponseSchema.parse(result);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] GET /api/me/listen/followed error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}