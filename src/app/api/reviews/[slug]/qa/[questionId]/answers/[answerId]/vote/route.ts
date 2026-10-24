import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { isCommunityQAEnabled } from '@/lib/qa-schema';
import { qaReviewParamsSchema, qaQuestionIdParamsSchema, qaAnswerIdParamsSchema, voteSchema, voteResponseSchema } from '@/lib/qa-schema';
import { getReviewIdBySlug, getQAById, toggleVote } from '@/lib/qa';

/**
 * API Route: Vote auf Antwort
 * POST   /api/reviews/[slug]/qa/[questionId]/answers/[answerId]/vote   - Vote setzen/entfernen (+1/-1/0)
 */
function checkFeatureFlag() {
  if (!isCommunityQAEnabled()) {
    return NextResponse.json({ error: 'Feature nicht verfügbar' }, { status: 404 });
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string; answerId: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Params validieren
  const { slug, questionId, answerId } = await params;
  const paramsResult = qaAnswerIdParamsSchema.safeParse({ slug, questionId, answerId });
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

  const bodyResult = voteSchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: 'Ungültige Daten', details: bodyResult.error.flatten() },
      { status: 400 }
    );
  }

  try {
    // Prüfen ob Frage und Antwort existieren und zum Review gehören
    const question = await getQAById(questionId);
    if (!question || question.reviewId !== reviewId) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 });
    }

    const answer = question.answers.find(a => a.id === answerId);
    if (!answer) {
      return NextResponse.json({ error: 'Antwort nicht gefunden' }, { status: 404 });
    }

    const result = await toggleVote(auth.userId, bodyResult.data.value, undefined, answerId);

    const response = voteResponseSchema.parse(result);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    const status = message.includes('nicht gefunden') ? 404 :
                   message.includes('Eigene Inhalte') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}