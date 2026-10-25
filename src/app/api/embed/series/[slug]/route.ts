// ============================================
// Embed Series API Route
// ============================================

import { NextRequest } from 'next/server';
import { embedParamsSchema, embedApiResponseSchema, embedSeriesDataSchema, checkReviewEmbedEnabled } from '@/lib/embed-schema';
import { getEmbedSeriesData } from '@/lib/embed-data';
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
  const parsed = embedParamsSchema.safeParse({ type: 'series', slug });
  if (!parsed.success) {
    return errorResponse('Invalid slug', 400);
  }

  const data = await getEmbedSeriesData(slug);
  if (!data) {
    return errorResponse('Series not found', 404);
  }

  const responseSchema = embedApiResponseSchema(embedSeriesDataSchema);
  const response = responseSchema.parse({ data, cachedAt: new Date().toISOString() });
  return successResponse(response);
}