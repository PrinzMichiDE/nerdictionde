import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { trackReadingAtomic, readingHistoryCacheTag } from '@/lib/reading-history';
import { trackReadingBodySchema } from '@/lib/reading-history-schema';
import { FEATURE_READING_HISTORY } from '@/lib/feature-flags';

const FEATURE_FLAG = FEATURE_READING_HISTORY;

async function checkFeatureFlag(): Promise<NextResponse | null> {
  if (!FEATURE_FLAG) {
    return NextResponse.json({ error: 'Feature nicht aktiviert' }, { status: 404 });
  }
  return null;
}

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return null;
  return auth.userId;
}

/**
 * POST /api/reading-history/track
 * Lesefortschritt tracken (vom Client aufgerufen, debounced)
 * Body: { reviewId, progress, scrollDepth, dwellTime }
 */
export async function POST(request: NextRequest) {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const body = await request.json();
    const bodyValidation = trackReadingBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: bodyValidation.error.flatten() },
        { status: 400 }
      );
    }

    const entry = await trackReadingAtomic(userId, bodyValidation.data);

    // Cache invalidieren
    (revalidateTag as (tag: string) => void)(readingHistoryCacheTag(userId));

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        userId: entry.userId,
        reviewId: entry.reviewId,
        progress: entry.progress,
        scrollDepth: entry.scrollDepth,
        dwellTime: entry.dwellTime,
        lastReadAt: entry.lastReadAt.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reading-history/track] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}