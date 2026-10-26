import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getCachedReviewReactions, toggleReaction, removeReaction, ensureReviewPublished } from '@/lib/review-reactions';
import { toggleReactionRequestSchema, reactionParamsSchema, reactionQuerySchema } from '@/lib/schemas/reaction-schema';
import { FEATURE_REVIEW_REACTIONS } from '@/lib/feature-flags';

const FEATURE_FLAG = FEATURE_REVIEW_REACTIONS;

async function checkFeatureFlag() {
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

async function validateReviewAccess(reviewId: string): Promise<NextResponse | null> {
  const published = await ensureReviewPublished(reviewId);
  if (!published) {
    return NextResponse.json({ error: 'Review nicht gefunden' }, { status: 404 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { id: reviewId } = await params;
    const paramsValidation = reactionParamsSchema.safeParse({ id: reviewId });
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Ungültige Review-ID' }, { status: 400 });
    }

    const accessCheck = await validateReviewAccess(reviewId);
    if (accessCheck) return accessCheck;

    const userId = await getSessionUserId(request);
    const data = await getCachedReviewReactions(reviewId, userId);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[GET /api/reviews/[id]/reactions] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { id: reviewId } = await params;
    const paramsValidation = reactionParamsSchema.safeParse({ id: reviewId });
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Ungültige Review-ID' }, { status: 400 });
    }

    const accessCheck = await validateReviewAccess(reviewId);
    if (accessCheck) return accessCheck;

    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const body = await request.json();
    const bodyValidation = toggleReactionRequestSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json({ error: 'Ungültiger Reaktionstyp' }, { status: 400 });
    }

    const { type } = bodyValidation.data;
    const data = await toggleReaction(userId, reviewId, type);

    // Invalidate cache
    revalidateTag('review-reactions', '');
    revalidateTag(`review-reactions-${reviewId}`, '');

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reviews/[id]/reactions] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { id: reviewId } = await params;
    const paramsValidation = reactionParamsSchema.safeParse({ id: reviewId });
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Ungültige Review-ID' }, { status: 400 });
    }

    const accessCheck = await validateReviewAccess(reviewId);
    if (accessCheck) return accessCheck;

    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = reactionQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!queryValidation.success || !queryValidation.data.type) {
      return NextResponse.json({ error: 'Reaktionstyp erforderlich' }, { status: 400 });
    }

    const { type } = queryValidation.data;
    const data = await removeReaction(userId, reviewId, type);

    // Invalidate cache
    revalidateTag('review-reactions', '');
    revalidateTag(`review-reactions-${reviewId}`, '');

    return NextResponse.json(data);
  } catch (error) {
    console.error('[DELETE /api/reviews/[id]/reactions] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}