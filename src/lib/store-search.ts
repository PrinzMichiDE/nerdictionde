/**
 * review-generation — Store search (stub)
 *
 * Resolves store IDs (Steam, Epic, GOG) for a game. Stub returns an empty
 * object so the game processor degrades gracefully when no store data is
 * available.
 */

import type { StoreIds } from "@/lib/review-generation/types";

export async function findStoreIds(
  name: string,
  igdbId: number
): Promise<StoreIds> {
  return {};
}
