// ============================================
// API Route — Review Detail Recommendations (GET)
// ============================================

import { getServerSession } from '@/lib/session';
import { getReviewRecommendations } from '@/lib/recommendations';
import { reviewRecommendationsQuerySchema } from '@/lib/recommendation-schema';
import { featureFlags } from '@/lib/feature-flags';
import { successResponse, errorResponse } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Feature flag check
  if (!featureFlags.recommendations) {
    return errorResponse('Feature not enabled', 404);
  }

  // Rate limiting (more lenient for detail page)
  const rateLimitResult = await rateLimit(request, {
    key: `recs:detail:${(await params).slug}`,
    limit: 100,
    window: 60_000, // 1 minute
  });
  if (!rateLimitResult.success) {
    return errorResponse('Zu viele Anfragen', 429, { headers: rateLimitResult.headers });
  }

  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const queryResult = reviewRecommendationsQuerySchema.safeParse(Object.fromEntries(searchParams));
  
  if (!queryResult.success) {
    return errorResponse('Ungültige Parameter', 400, {
      errors: queryResult.error.flatten().fieldErrors,
    });
  }

  const { limit } = queryResult.data;
  const { slug } = await params;

  // Get user ID if authenticated (optional for detail page)
  let userId: string | undefined;
  const session = await getServerSession();
  if (session?.userId) {
    userId = session.userId;
  }

  try {
    const result = await getReviewRecommendations(slug, userId, { limit });
    return successResponse(result, rateLimitResult.headers);
  } catch (error) {
    console.error('[API/reviews/[slug]/recommendations] Error:', error);
    return errorResponse('Interner Serverfehler', 500);
  }
}