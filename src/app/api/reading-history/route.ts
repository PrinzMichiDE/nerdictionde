import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import {
  getReadingHistory,
  clearReadingHistory,
  readingHistoryCacheTag,
} from '@/lib/reading-history';
import { readingHistoryQuerySchema } from '@/lib/reading-history-schema';
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
 * GET /api/reading-history
 * Leseverlauf des aktuellen Users (paginiert, Cursor-basiert)
 */
export async function GET(request: NextRequest) {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = readingHistoryQuerySchema.safeParse({
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Query-Parameter', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cursor, limit } = parsed.data;
    const data = await getReadingHistory(userId, cursor, limit);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[GET /api/reading-history] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

/**
 * DELETE /api/reading-history
 * Gesamten Leseverlauf des aktuellen Users löschen
 */
export async function DELETE(request: NextRequest) {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const deletedCount = await clearReadingHistory(userId);

    // Cache invalidieren
    revalidateTag(readingHistoryCacheTag(userId));

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('[DELETE /api/reading-history] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}