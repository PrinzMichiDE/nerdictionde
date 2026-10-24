import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import {
  deleteReadingHistoryEntry,
  readingHistoryCacheTag,
} from '@/lib/reading-history';
import { readingHistoryParamsSchema } from '@/lib/reading-history-schema';
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
 * DELETE /api/reading-history/[reviewId]
 * Einzelnen Eintrag aus dem Leseverlauf löschen
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { reviewId } = await params;
    const paramsValidation = readingHistoryParamsSchema.safeParse({ reviewId });
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Ungültige Review-ID' }, { status: 400 });
    }

    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const deleted = await deleteReadingHistoryEntry(userId, reviewId);
    if (!deleted) {
      return NextResponse.json({ error: 'Eintrag nicht gefunden' }, { status: 404 });
    }

    // Cache invalidieren
    revalidateTag(readingHistoryCacheTag(userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/reading-history/[reviewId]] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}