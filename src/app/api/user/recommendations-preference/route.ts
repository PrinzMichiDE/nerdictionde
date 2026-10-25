// ============================================
// API Route — User Recommendations Preference
// ============================================

import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { featureFlags } from '@/lib/feature-flags';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const preferenceSchema = z.object({
  enabled: z.boolean(),
});

export async function GET() {
  if (!featureFlags.recommendations) {
    return errorResponse('Feature not enabled', 404);
  }

  const session = await getServerSession();
  if (!session?.userId) {
    return errorResponse('Nicht authentifiziert', 401);
  }

  const rateLimitResult = await rateLimit(new Request(''), {
    key: `recs:pref:get:${session.userId}`,
    limit: 60,
    window: 60_000,
  });
  if (!rateLimitResult.success) {
    return errorResponse('Zu viele Anfragen', 429, { headers: rateLimitResult.headers });
  }

  try {
    const user = await prisma.twitchUser.findUnique({
      where: { id: session.userId },
      select: { personalizedRecommendationsEnabled: true },
    });

    return successResponse(
      { enabled: user?.personalizedRecommendationsEnabled ?? false },
      rateLimitResult.headers
    );
  } catch (error) {
    console.error('[API/user/recommendations-preference GET] Error:', error);
    return errorResponse('Interner Serverfehler', 500);
  }
}

export async function POST(request: Request) {
  if (!featureFlags.recommendations) {
    return errorResponse('Feature not enabled', 404);
  }

  const session = await getServerSession();
  if (!session?.userId) {
    return errorResponse('Nicht authentifiziert', 401);
  }

  const rateLimitResult = await rateLimit(request, {
    key: `recs:pref:set:${session.userId}`,
    limit: 30,
    window: 60_000,
  });
  if (!rateLimitResult.success) {
    return errorResponse('Zu viele Anfragen', 429, { headers: rateLimitResult.headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Ungültiges JSON', 400);
  }

  const parseResult = preferenceSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse('Ungültige Parameter', 400, {
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { enabled } = parseResult.data;

  try {
    await prisma.twitchUser.update({
      where: { id: session.userId },
      data: { personalizedRecommendationsEnabled: enabled },
    });

    return successResponse({ enabled }, rateLimitResult.headers);
  } catch (error) {
    console.error('[API/user/recommendations-preference POST] Error:', error);
    return errorResponse('Interner Serverfehler', 500);
  }
}