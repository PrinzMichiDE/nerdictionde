import { NextResponse, NextRequest } from 'next/server';
import { getTemplates } from '@/lib/review-templates';
import { featureFlags } from '@/lib/feature-flags';
import { rateLimit } from '@/lib/rate-limit';
import { templateListResponseSchema } from '@/lib/review-templates-schema';

export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    if (!featureFlags.reviewTemplates) {
      return NextResponse.json(
        { success: false, error: 'Feature nicht verfügbar' },
        { status: 404 }
      );
    }

    // Rate limiting
    const rl = await rateLimit(request, { key: 'templates-reviews', limit: 60, window: 60000 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen' },
        { status: 429, headers: rl.headers }
      );
    }

    const templates = await getTemplates();

    const response = templateListResponseSchema.parse({ templates });

    return NextResponse.json(
      { success: true, ...response },
      { headers: rl.headers }
    );
  } catch (error) {
    console.error('[Templates API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}