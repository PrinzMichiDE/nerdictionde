// ============================================
// API Route — Home Recommendations (GET)
// ============================================

import { getServerSession } from '@/lib/session';
import { getRecommendations } from '@/lib/recommendations';
import { recommendationsQuerySchema } from '@/lib/recommendation-schema';
import { featureFlags } from '@/lib/feature-flags';
import { successResponse, errorResponse } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  // Feature flag check
  if (!featureFlags.recommendations) {
    return errorResponse('Feature not enabled', 404);
  }

  // Authentication
  const session = await getServerSession();
  if (!session?.userId) {
    return errorResponse('Nicht authentifiziert', 401);
  }

  // Rate limiting
  const rateLimitResult = await rateLimit(request, {
    key: `recs:home:${session.userId}`,
    limit: 60,
    window: 60_000, // 1 minute
  });
  if (!rateLimitResult.success) {
    return errorResponse('Zu viele Anfragen', 429, { headers: rateLimitResult.headers });
  }

  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const queryResult = recommendationsQuerySchema.safeParse(Object.fromEntries(searchParams));
  
  if (!queryResult.success) {
    return errorResponse('Ungültige Parameter', 400, {
      errors: queryResult.error.flatten().fieldErrors,
    });
  }

  const { limit, cursor } = queryResult.data;

  try {
    const result = await getRecommendations(session.userId, { limit, cursor });
    return successResponse(result, rateLimitResult.headers);
  } catch (error) {
    console.error('[API/recommendations] Error:', error);
    return errorResponse('Interner Serverfehler', 500);
  }
}