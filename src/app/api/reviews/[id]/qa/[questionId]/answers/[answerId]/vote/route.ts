import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getReviewIdBySlug, toggleVote } from '@/lib/qa';
import { qaQuestionIdParamsSchema, qaAnswerIdParamsSchema, voteSchema, voteResponseSchema } from '@/lib/qa-schema';
import { isCommunityQAEnabled } from '@/lib/qa-schema';

async function checkFeatureFlag(): Promise<NextResponse | null> {
  if (!isCommunityQAEnabled()) {
    return NextResponse.json({ error: 'Feature nicht verfügbar' }, { status: 404 });
  }
  return null;
}

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return null;
  return auth.userId;
}

async function validateReviewAccess(slug: string): Promise<{ reviewId: string } | NextResponse> {
  const reviewId = await getReviewIdBySlug(slug);
  if (!reviewId) {
    return NextResponse.json({ error: 'Review nicht gefunden' }, { status: 404 });
  }
  return { reviewId };
}

async function validateQuestionId(questionId: string): Promise<NextResponse | null> {
  const parsed = qaQuestionIdParamsSchema.safeParse({ questionId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Question ID' }, { status: 400 });
  }
  return null;
}

async function validateAnswerId(answerId: string): Promise<NextResponse | null> {
  const parsed = qaAnswerIdParamsSchema.safeParse({ answerId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Answer ID' }, { status: 400 });
  }
  return null;
}

/**
 * POST /api/reviews/[id]/qa/[questionId]/answers/[answerId]/vote
 * Vote auf Antwort (+1, -1, 0 zum Entfernen)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string; answerId: string }> }
): Promise<NextResponse> {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    // Shared [id] segment: these routes are addressed by review slug.
    const { id: slug, questionId, answerId } = await params;

    // Authentifizierung erforderlich
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Review ID aus Slug ermitteln (Validierung)
    const accessCheck = await validateReviewAccess(slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
    const reviewId = accessCheck.reviewId;

    // IDs validieren
    const qCheck = await validateQuestionId(questionId);
    if (qCheck) return qCheck;
    const aCheck = await validateAnswerId(answerId);
    if (aCheck) return aCheck;

    // Request Body parsen und validieren
    const body = await request.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { value } = parsed.data;

    // Vote togglen (Self-Vote Prevention in toggleVote)
    const result = await toggleVote(userId, value, undefined, answerId);

    // Cache invalidieren
    (revalidateTag as (tag: string) => void)(`review:${reviewId}:qa`);
    (revalidateTag as (tag: string) => void)(`qa:question:${questionId}`);

    // Response validieren
    const response = voteResponseSchema.parse({
      success: true,
      score: result.score,
      userVote: result.userVote,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[QA API] POST answer vote error:', error);

    if (error instanceof Error) {
      if (error.message.includes('nicht autorisiert') || error.message.includes('Eigene Inhalte')) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
      }
      if (error.message.includes('nicht gefunden')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('deaktiviert')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('erforderlich')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}