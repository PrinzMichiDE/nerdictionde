import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getReviewIdBySlug, getQAById, updateQuestion, deleteQuestion } from '@/lib/qa';
import { qaQuestionIdParamsSchema, updateQuestionSchema, qaQuestionDetailSchema } from '@/lib/qa-schema';
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
 * GET /api/reviews/[slug]/qa/[questionId]
 * Einzelne Frage mit Antworten laden
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
): Promise<NextResponse> {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { slug, questionId } = await params;

    // Review ID aus Slug ermitteln (Validierung)
    const accessCheck = await validateReviewAccess(slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
    const reviewId = accessCheck.reviewId;

    // Question ID validieren
    const idCheck = await validateQuestionId(questionId);
    if (idCheck) return idCheck;

    // Session User für userVote (optional)
    const userId = await getSessionUserId(request);

    // Frage laden (gecacht)
    const question = await getQAById(questionId, userId || undefined);

    if (!question) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    // Prüfen ob Frage zum Review gehört
    if (question.reviewId !== reviewId) {
      return NextResponse.json({ error: 'Frage gehört nicht zu diesem Review' }, { status: 404 });
    }

    // Response validieren
    const response = qaQuestionDetailSchema.parse(question);

    return NextResponse.json({ question: response }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[QA API] GET detail error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

/**
 * PATCH /api/reviews/[slug]/qa/[questionId]
 * Frage bearbeiten (nur Owner)
 */
export async function PATCH(
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
    const parsed = updateQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Frage aktualisieren (Owner-Check in updateQuestion)
    const updatedQuestion = await updateQuestion(questionId, userId, parsed.data);

    if (!updatedQuestion) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    // Cache invalidieren
    (revalidateTag as (tag: string) => void)(`review:${reviewId}:qa`);
    (revalidateTag as (tag: string) => void)(`qa:question:${questionId}`);

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    console.error('[QA API] PATCH error:', error);

    if (error instanceof Error) {
      if (error.message.includes('nicht autorisiert')) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
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

/**
 * DELETE /api/reviews/[slug]/qa/[questionId]
 * Frage löschen (Soft-Delete, nur Owner)
 */
export async function DELETE(
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

    // Frage löschen (Owner-Check in deleteQuestion)
    await deleteQuestion(questionId, userId);

    // Cache invalidieren
    (revalidateTag as (tag: string) => void)(`review:${reviewId}:qa`);
    (revalidateTag as (tag: string) => void)(`qa:question:${questionId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[QA API] DELETE error:', error);

    if (error instanceof Error) {
      if (error.message.includes('nicht autorisiert')) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
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