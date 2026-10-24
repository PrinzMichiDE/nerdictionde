import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { isCommunityQAEnabled } from '@/lib/qa-schema';
import { qaReviewParamsSchema, createQuestionSchema, updateQuestionSchema, qaListQuerySchema, qaQuestionIdParamsSchema, qaListResponseSchema, qaQuestionListItemSchema } from '@/lib/qa-schema';
import { getReviewIdBySlug, getQAList, createQuestion, updateQuestion, deleteQuestion, getQAById } from '@/lib/qa';

/**
 * API Route: Fragen zu einem Review
 * GET    /api/reviews/[slug]/qa           - Liste Fragen (paginiert, sortiert)
 * POST   /api/reviews/[slug]/qa           - Neue Frage erstellen
 */
function checkFeatureFlag() {
  if (!isCommunityQAEnabled()) {
    return NextResponse.json({ error: 'Feature nicht verfügbar' }, { status: 404 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Params validieren
  const { slug } = await params;
  const paramsResult = qaReviewParamsSchema.safeParse({ slug });
  if (!paramsResult.success) {
    return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 });
  }

  // Review ID aus Slug holen
  const reviewId = await getReviewIdBySlug(slug);
  if (!reviewId) {
    return NextResponse.json({ error: 'Review nicht gefunden' }, { status: 404 });
  }

  // Query Parameter validieren
  const { searchParams } = new URL(request.url);
  const parsed = qaListQuerySchema.safeParse({
    cursor: searchParams.get('cursor') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    sort: searchParams.get('sort') || undefined,
    status: searchParams.get('status') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Query-Parameter', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Optional: User Session für User-Vote
  const auth = await requireTwitchAuth(request);
  const userId = auth instanceof NextResponse ? undefined : auth.userId;

  try {
    const result = await getQAList(
      reviewId,
      parsed.data.cursor,
      parsed.data.limit,
      parsed.data.sort,
      parsed.data.status,
      userId
    );

    const response = qaListResponseSchema.parse(result);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Params validieren
  const { slug } = await params;
  const paramsResult = qaReviewParamsSchema.safeParse({ slug });
  if (!paramsResult.success) {
    return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 });
  }

  // Review ID aus Slug holen
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

  const bodyResult = createQuestionSchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: 'Ungültige Daten', details: bodyResult.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const question = await createQuestion(reviewId, auth.userId, bodyResult.data.title, bodyResult.data.body);

    const response = qaQuestionListItemSchema.parse({
      ...question,
      userVote: null,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    const status = message.includes('nicht gefunden') ? 404 :
                   message.includes('nicht veröffentlicht') ? 403 :
                   message.includes('Feature nicht aktiviert') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}