import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { isCommunityQAEnabled } from '@/lib/qa-schema';
import { qaReviewParamsSchema, qaQuestionIdParamsSchema, acceptAnswerSchema, acceptAnswerResponseSchema } from '@/lib/qa-schema';
import { getReviewIdBySlug, getQAById, acceptAnswer } from '@/lib/qa';

/**
 * API Route: Antwort als akzeptiert markieren
 * POST   /api/reviews/[slug]/qa/[questionId]/accept   - Antwort als Lösung akzeptieren (nur Fragesteller)
 */
function checkFeatureFlag() {
  if (!isCommunityQAEnabled()) {
    return NextResponse.json({ error: 'Feature nicht verfügbar' }, { status: 404 });
  }
  return null;
}

export async function POST(
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

  const bodyResult = acceptAnswerSchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: 'Ungültige Daten', details: bodyResult.error.flatten() },
      { status: 400 }
    );
  }

  try {
    // Prüfen ob Frage existiert und zum Review gehört
    const question = await getQAById(questionId);
    if (!question || question.reviewId !== reviewId) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    // Prüfen ob Antwort zur Frage gehört
    const answer = question.answers.find(a => a.id === bodyResult.data.answerId);
    if (!answer) {
      return NextResponse.json({ error: 'Antwort nicht gefunden' }, { status: 404 });
    }

    const result = await acceptAnswer(questionId, bodyResult.data.answerId, auth.userId);

    const response = acceptAnswerResponseSchema.parse(result);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    const status = message.includes('nicht gefunden') ? 404 :
                   message.includes('Nur der Fragesteller') ? 403 :
                   message.includes('Nicht autorisiert') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}