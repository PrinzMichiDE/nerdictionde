import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getReviewIdBySlug, updateAnswer, deleteAnswer } from '@/lib/qa';
import { qaQuestionIdParamsSchema, qaAnswerIdParamsSchema, updateAnswerSchema, qaAnswerSchema } from '@/lib/qa-schema';
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
 * PATCH /api/reviews/[slug]/qa/[questionId]/answers/[answerId]
 * Antwort bearbeiten (nur Owner)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string; answerId: string }> }
): Promise<NextResponse> {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { slug, questionId, answerId } = await params;

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
    const parsed = updateAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Antwort aktualisieren (Owner-Check in updateAnswer)
    const updatedAnswer = await updateAnswer(answerId, userId, parsed.data.body);

    if (!updatedAnswer) {
      return NextResponse.json({ error: 'Antwort nicht gefunden' }, { status: 404 });
    }

    // Cache invalidieren
    (revalidateTag as (tag: string) => void)(`review:${reviewId}:qa`);
    (revalidateTag as (tag: string) => void)(`qa:question:${questionId}`);

    // Response validieren
    const response = qaAnswerSchema.parse({
      ...updatedAnswer,
      userVote: null,
    });

    return NextResponse.json({ answer: response });
  } catch (error) {
    console.error('[QA API] PATCH answer error:', error);

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
 * DELETE /api/reviews/[slug]/qa/[questionId]/answers/[answerId]
 * Antwort löschen (Soft-Delete, nur Owner)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string; answerId: string }> }
): Promise<NextResponse> {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { slug, questionId, answerId } = await params;

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

    // Antwort löschen (Owner-Check in deleteAnswer)
    await deleteAnswer(answerId, userId);

    // Cache invalidieren
    (revalidateTag as (tag: string) => void)(`review:${reviewId}:qa`);
    (revalidateTag as (tag: string) => void)(`qa:question:${questionId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[QA API] DELETE answer error:', error);

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