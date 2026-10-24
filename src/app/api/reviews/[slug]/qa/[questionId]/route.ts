import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { isCommunityQAEnabled } from '@/lib/qa-schema';
import { qaReviewParamsSchema, qaQuestionIdParamsSchema, updateQuestionSchema, qaQuestionListItemSchema } from '@/lib/qa-schema';
import { getReviewIdBySlug, getQAById, updateQuestion, deleteQuestion } from '@/lib/qa';

/**
 * API Route: Einzelne Frage zu einem Review
 * GET    /api/reviews/[slug]/qa/[questionId]   - Frage mit Antworten abrufen
 * PATCH  /api/reviews/[slug]/qa/[questionId]   - Frage aktualisieren (Owner)
 * DELETE /api/reviews/[slug]/qa/[questionId]   - Frage löschen (Owner)
 */
function checkFeatureFlag() {
  if (!isCommunityQAEnabled()) {
    return NextResponse.json({ error: 'Feature nicht verfügbar' }, { status: 404 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Params validieren
  const { slug, questionId } = await params;
  const paramsResult = qaQuestionIdParamsSchema.safeParse({ slug, questionId });
  if (!paramsResult.success) {
    return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 });
  }

  // Review ID aus Slug holen (nur für Validierung)
  const reviewId = await getReviewIdBySlug(slug);
  if (!reviewId) {
    return NextResponse.json({ error: 'Review nicht gefunden' }, { status: 404 });
  }

  // Optional: User Session für User-Vote
  const auth = await requireTwitchAuth(request);
  const userId = auth instanceof NextResponse ? undefined : auth.userId;

  try {
    const question = await getQAById(questionId, userId);
    if (!question) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    // Prüfen ob Frage zum Review gehört
    if (question.reviewId !== reviewId) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Params validieren
  const { slug, questionId } = await params;
  const paramsResult = qaQuestionIdParamsSchema.safeParse({ slug, questionId });
  if (!paramsResult.success) {
    return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 });
  }

  // Review ID aus Slug holen (nur für Validierung)
  const reviewId = await getReviewIdBySlug(slug);
  if (!reviewId) {
    return NextResponse.json({ error: 'Review nicht gefunden' }, { status: 404 });
  }

  // Body validieren
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  const bodyResult = updateQuestionSchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: 'Ungültige Daten', details: bodyResult.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const question = await updateQuestion(questionId, auth.userId, bodyResult.data);
    if (!question) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    // Prüfen ob Frage zum Review gehört
    if (question.reviewId !== reviewId) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, question });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    const status = message.includes('nicht gefunden') ? 404 :
                   message.includes('Nicht autorisiert') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Params validieren
  const { slug, questionId } = await params;
  const paramsResult = qaQuestionIdParamsSchema.safeParse({ slug, questionId });
  if (!paramsResult.success) {
    return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 });
  }

  // Review ID aus Slug holen (nur für Validierung)
  const reviewId = await getReviewIdBySlug(slug);
  if (!reviewId) {
    return NextResponse.json({ error: 'Review nicht gefunden' }, { status: 404 });
  }

  try {
    // Erst prüfen ob Frage existiert und zum Review gehört
    const question = await getQAById(questionId);
    if (!question || question.reviewId !== reviewId) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    await deleteQuestion(questionId, auth.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    const status = message.includes('nicht gefunden') ? 404 :
                   message.includes('Nicht autorisiert') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}