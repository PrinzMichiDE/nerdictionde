// ============================================
// API Route — Dismiss Recommendation (POST)
// ============================================

import { getServerSession } from '@/lib/session';
import { dismissRecommendation } from '@/lib/recommendations';
import { dismissRecommendationSchema } from '@/lib/recommendation-schema';
import { featureFlags } from '@/lib/feature-flags';
import { successResponse, errorResponse } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
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
    key: `recs:dismiss:${session.userId}`,
    limit: 30,
    window: 60_000, // 1 minute
  });
  if (!rateLimitResult.success) {
    return errorResponse('Zu viele Anfragen', 429, { headers: rateLimitResult.headers });
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Ungültiges JSON', 400);
  }

  const parseResult = dismissRecommendationSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse('Ungültige Parameter', 400, {
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { reviewId, reason } = parseResult.data;

  try {
    await dismissRecommendation(session.userId, reviewId, reason);
    return successResponse({ success: true }, rateLimitResult.headers);
  } catch (error) {
    console.error('[API/recommendations/dismiss] Error:', error);
    return errorResponse('Interner Serverfehler', 500);
  }
}