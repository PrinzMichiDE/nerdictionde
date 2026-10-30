/**
 * review-generation — Steam API client (stub)
 *
 * Fetches Steam app details and review summaries. Stub returns null so the
 * game processor degrades gracefully when Steam data is unavailable.
 */

import type { SteamGameInfo } from "@/lib/review-generation/types";

interface ReviewSummary {
  percentPositive: number;
  total: number;
  description: string;
}

export async function getSteamAppDetails(
  appId: string
): Promise<SteamGameInfo | null> {
  return null;
}

export async function getSteamReviewSummary(
  appId: string
): Promise<ReviewSummary | null> {
  return null;
}

/**
 * Extracts the Steam App ID from a store URL.
 * Returns null when the URL does not contain a valid app/bundle ID.
 */
export function parseSteamUrl(url: string): string | null {
  const match = url.match(/store\.steampowered\.com\/(?:app|bundle)\/(\d+)/);
  return match ? match[1] : null;
}

export type { SteamGameInfo };
