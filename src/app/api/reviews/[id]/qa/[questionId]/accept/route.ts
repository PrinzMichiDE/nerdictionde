import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getReviewIdBySlug, acceptAnswer } from '@/lib/qa';
import { qaQuestionIdParamsSchema, acceptAnswerSchema, acceptAnswerResponseSchema } from '@/lib/qa-schema';
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

/**
 * POST /api/reviews/[slug]/qa/[questionId]/accept
 * Antwort als akzeptiert markieren (nur Fragesteller)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
): Promise<NextResponse> {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { slug, questionId } = await params;

    // Authentifizierung erforderlich
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Review ID aus Slug ermitteln (Validierung)
    const accessCheck = await validateReviewAccess(slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
    const reviewId = accessCheck.reviewId;

    // Question ID validieren
    const idCheck = await validateQuestionId(questionId);
    if (idCheck) return idCheck;

    // Request Body parsen und validieren
    const body = await request.json();
    const parsed = acceptAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { answerId } = parsed.data;

    // Antwort akzeptieren (Owner-Check in acceptAnswer)
    const result = await acceptAnswer(questionId, answerId, userId);

    // Cache invalidieren
    (revalidateTag as (tag: string) => void)(`review:${reviewId}:qa`);
    (revalidateTag as (tag: string) => void)(`qa:question:${questionId}`);

    // Response validieren
    const response = acceptAnswerResponseSchema.parse({
      success: true,
      acceptedAnswerId: result.acceptedAnswerId,
      status: result.status,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[QA API] POST accept error:', error);

    if (error instanceof Error) {
      if (error.message.includes('nicht autorisiert') || error.message.includes('Nur der Fragesteller')) {
        return NextResponse.json({ error: 'Nur der Fragesteller kann eine Antwort akzeptieren' }, { status: 403 });
      }
      if (error.message.includes('nicht gefunden')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('deaktiviert')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}