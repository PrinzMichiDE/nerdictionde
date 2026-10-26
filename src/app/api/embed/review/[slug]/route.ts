// ============================================
// Embed Review API Route
// ============================================

import { NextRequest } from 'next/server';
import { embedParamsSchema, embedApiResponseSchema, embedReviewDataSchema, checkReviewEmbedEnabled } from '@/lib/embed-schema';
import { getEmbedReviewData } from '@/lib/embed-data';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    checkReviewEmbedEnabled();
  } catch {
    return errorResponse('Feature disabled', 404);
  }

  const { slug } = await params;
  const parsed = embedParamsSchema.safeParse({ type: 'review', slug });
  if (!parsed.success) {
    return errorResponse('Invalid slug', 400);
  }

  const data = await getEmbedReviewData(slug);
  if (!data) {
    return errorResponse('Review not found', 404);
  }

  const responseSchema = embedApiResponseSchema(embedReviewDataSchema);
  const response = responseSchema.parse({ data, cachedAt: new Date().toISOString() });
  return successResponse(response);
}