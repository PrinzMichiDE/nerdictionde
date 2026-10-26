import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getReviewIdBySlug, getQAList, createQuestion } from '@/lib/qa';
import { qaListQuerySchema, createQuestionSchema, qaListResponseSchema } from '@/lib/qa-schema';
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

/**
 * GET /api/reviews/[slug]/qa
 * Liste Fragen für ein Review (paginiert, sortiert)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Query Parameter validieren
    const queryResult = qaListQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { cursor, limit, sort, status } = queryResult.data;

    // Review ID aus Slug ermitteln
    const accessCheck = await validateReviewAccess(slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
    const reviewId = accessCheck.reviewId;

    // Session User für userVote (optional)
    const userId = await getSessionUserId(request);

    // Fragen laden (gecacht)
    const result = await getQAList(reviewId, cursor, limit, sort, status, userId || undefined);

    // Response validieren
    const response = qaListResponseSchema.parse({
      questions: result.questions,
      nextCursor: result.nextCursor,
      totalCount: result.totalCount,
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[QA API] GET error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

/**
 * POST /api/reviews/[slug]/qa
 * Neue Frage erstellen
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const featureCheck = await checkFeatureFlag();
  if (featureCheck) return featureCheck;

  try {
    const { slug } = await params;

    // Authentifizierung erforderlich
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Review ID aus Slug ermitteln
    const accessCheck = await validateReviewAccess(slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
    const reviewId = accessCheck.reviewId;

    // Request Body parsen und validieren
    const body = await request.json();
    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, body: questionBody } = parsed.data;

    // Frage erstellen
    const question = await createQuestion(reviewId, userId, title, questionBody);

    // Cache invalidieren
    (revalidateTag as (tag: string) => void)(`review:${reviewId}:qa`);

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('[QA API] POST error:', error);

    if (error instanceof Error) {
      if (error.message.includes('nicht autorisiert')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
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