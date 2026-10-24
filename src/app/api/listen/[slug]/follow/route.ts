import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getCollectionBySlug } from '@/lib/collections';
import {
  followCollection,
  unfollowCollection,
  getFollowStatus,
  toggleCollectionFollow,
} from '@/lib/collection-follow';
import { isCollectionFollowEnabled } from '@/lib/schemas/collection-follow-schema';

/**
 * POST /api/listen/[slug]/follow
 * Collection folgen (authentifizierte Nutzer)
 */
export async function POST(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: Promise<any> }
) {
  try {
    if (!isCollectionFollowEnabled()) {
      return NextResponse.json(
        { error: 'Feature nicht verfügbar' },
        { status: 404 }
      );
    }

    const auth = await requireTwitchAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { slug } = await context.params;

    // Collection by Slug laden
    const collection = await getCollectionBySlug(slug);
    if (!collection) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen: Collection muss öffentlich und nicht gelöscht sein
    if (!collection.isPublic || collection.deletedAt) {
      return NextResponse.json(
        { error: 'Liste nicht verfügbar' },
        { status: 403 }
      );
    }

    const result = await followCollection(auth.userId, collection.id);

    // Cache invalidation wäre hier ideal (revalidateTag)
    // Für jetzt: Cache läuft nach 60s ab

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/listen/[slug]/follow error:', error);

    if (error instanceof Error) {
      if (error.message === 'Liste nicht gefunden') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Liste nicht verfügbar') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === 'Feature nicht verfügbar') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listen/[slug]/follow
 * Collection entfolgen (authentifizierte Nutzer)
 */
export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: Promise<any> }
) {
  try {
    if (!isCollectionFollowEnabled()) {
      return NextResponse.json(
        { error: 'Feature nicht verfügbar' },
        { status: 404 }
      );
    }

    const auth = await requireTwitchAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { slug } = await context.params;

    // Collection by Slug laden
    const collection = await getCollectionBySlug(slug);
    if (!collection) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    const result = await unfollowCollection(auth.userId, collection.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] DELETE /api/listen/[slug]/follow error:', error);

    if (error instanceof Error) {
      if (error.message === 'Liste nicht gefunden') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Nicht gefolgt') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Feature nicht verfügbar') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/listen/[slug]/follow-status
 * Follow-Status und Counter für SSR (optional authentifiziert)
 */
export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: Promise<any> }
) {
  try {
    if (!isCollectionFollowEnabled()) {
      return NextResponse.json(
        { error: 'Feature nicht verfügbar' },
        { status: 404 }
      );
    }

    const { slug } = await context.params;
    const auth = await requireTwitchAuth(request);
    const userId = auth instanceof NextResponse ? undefined : auth.userId;

    // Collection by Slug laden
    const collection = await getCollectionBySlug(slug);
    if (!collection) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    const result = await getFollowStatus(userId, collection.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] GET /api/listen/[slug]/follow-status error:', error);

    if (error instanceof Error && error.message === 'Feature nicht verfügbar') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}