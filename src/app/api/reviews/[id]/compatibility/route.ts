/**
 * API Route: Review Hardware Compatibility Check
 * GET /api/reviews/[slug]/compatibility
 * 
 * Returns compatibility status and FPS estimates for the current user's hardware profile
 * against the review's minimum requirements and benchmarks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { checkCompatibility, estimateFps } from '@/lib/hardware-compatibility';
import { compatibilityApiResponseSchema } from '@/lib/hardware-compatibility-schema';
import { unstable_cache } from 'next/cache';
import { FEATURE_HARDWARE_COMPATIBILITY } from '@/lib/feature-flags';

// Cached fetch function for review data + user hardware profile
const fetchCompatibilityData = unstable_cache(
  async (reviewSlug: string, userId: string | null) => {
    // Fetch review with specs and metadata
    const review = await prisma.review.findUnique({
      where: { slug: reviewSlug },
      select: {
        id: true,
        slug: true,
        category: true,
        specs: true,
        metadata: true,
      },
    });

    if (!review) return { review: null, userProfile: null, enabled: false };

    // If no user or feature disabled, return early
    if (!userId || !FEATURE_HARDWARE_COMPATIBILITY) {
      return { review, userProfile: null, enabled: FEATURE_HARDWARE_COMPATIBILITY };
    }

    // Fetch user hardware profile
    const user = await prisma.twitchUser.findUnique({
      where: { id: userId },
      select: {
        hardwareProfile: true,
        hardwareProfileEnabled: true,
      },
    });

    return { review, userProfile: user?.hardwareProfile, enabled: user?.hardwareProfileEnabled ?? false };
  },
  ['compatibility'],
  {
    revalidate: 300, // 5 minutes
    tags: ['compatibility'],
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession();
    const userId = session?.userId ?? null;

    // Fetch cached data
    const { review, userProfile, enabled } = await fetchCompatibilityData(slug, userId);

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review nicht gefunden' },
        { status: 404 }
      );
    }

    // Feature flag check
    if (!FEATURE_HARDWARE_COMPATIBILITY) {
      const response = compatibilityApiResponseSchema.parse({
        success: true,
        data: {
          status: 'NOT_HARDWARE_REVIEW' as const,
          badgeLabel: 'Feature deaktiviert',
          badgeDetails: 'Hardware-Kompatibilitäts-Check ist aktuell nicht verfügbar',
          fpsEstimates: [],
        },
        error: undefined,
      });
      return NextResponse.json(response);
    }

    // Not a hardware review
    const isHardwareReview = review.category === 'hardware';
    if (!isHardwareReview) {
      const response = compatibilityApiResponseSchema.parse({
        success: true,
        data: {
          status: 'NOT_HARDWARE_REVIEW' as const,
          badgeLabel: 'Kein Hardware-Review',
          badgeDetails: 'Kompatibilitäts-Check nur für Hardware-Reviews verfügbar',
          fpsEstimates: [],
        },
      });
      return NextResponse.json(response);
    }

    // No user profile or not enabled
    if (!userProfile || !enabled) {
      const response = compatibilityApiResponseSchema.parse({
        success: true,
        data: {
          status: 'PROFILE_INCOMPLETE' as const,
          badgeLabel: 'Profil unvollständig',
          badgeDetails: 'Vervollständige dein Hardware-Profil in den Einstellungen für Kompatibilitäts-Checks',
          fpsEstimates: [],
        },
      });
      return NextResponse.json(response);
    }

    // Run compatibility check
    const hwProfile = userProfile as { cpu: string; gpu: string; ram: string; monitor?: string; psu?: string; resolution?: string; refreshRate?: number };
    const result = checkCompatibility(hwProfile, review);
    
    // Estimate FPS if GPU review
    const fpsEstimates = estimateFps(hwProfile, review);
    result.fpsEstimates = fpsEstimates;

    const response = compatibilityApiResponseSchema.parse({
      success: true,
      data: result,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Compatibility API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}