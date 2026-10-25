// ============================================
// Embed Collection API Route
// ============================================

import { NextRequest } from 'next/server';
import { embedParamsSchema, embedApiResponseSchema, embedCollectionDataSchema, checkReviewEmbedEnabled } from '@/lib/embed-schema';
import { getEmbedCollectionData } from '@/lib/embed-data';
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
  const parsed = embedParamsSchema.safeParse({ type: 'collection', slug });
  if (!parsed.success) {
    return errorResponse('Invalid slug', 400);
  }

  const data = await getEmbedCollectionData(slug);
  if (!data) {
    return errorResponse('Collection not found', 404);
  }

  const responseSchema = embedApiResponseSchema(embedCollectionDataSchema);
  const response = responseSchema.parse({ data, cachedAt: new Date().toISOString() });
  return successResponse(response);
}