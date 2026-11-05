/**
 * feed — Merger
 *
 * Merges feed items from multiple sources, deduplicates by review ID,
 * sorts globally by createdAt descending, and applies limit + cursor.
 * All operations are O(N log N) or O(N) — no nested loops.
 */

import type { FeedItem, FeedResult, FeedSourceResult } from "./types";

/**
 * Merges multiple feed source results into a single sorted, deduplicated feed.
 *
 * @param sources - Arrays of feed items from each source, each already sorted
 *                  by createdAt descending within its source.
 * @param limit - Maximum number of items to return.
 * @returns Merged FeedResult with nextCursor.
 */
export function mergeFeedSources(
  sources: FeedSourceResult[],
  limit: number
): FeedResult {
  // Flatten all items into a single array
  const allItems: FeedItem[] = [];
  for (const source of sources) {
    allItems.push(...source.items);
  }

  // Deduplicate by review ID — keep first occurrence (highest priority source)
  const seenReviewIds = new Set<string>();
  const dedupedItems: FeedItem[] = [];
  for (const item of allItems) {
    if (!seenReviewIds.has(item.review.id)) {
      seenReviewIds.add(item.review.id);
      dedupedItems.push(item);
    }
  }

  // Sort globally by createdAt descending
  dedupedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Apply limit
  const limitedItems = dedupedItems.slice(0, limit);

  // Determine next cursor from the last item
  const nextCursor =
    limitedItems.length === limit && limitedItems.length > 0
      ? limitedItems[limitedItems.length - 1].createdAt.toISOString()
      : null;

  return {
    items: limitedItems,
    nextCursor,
  };
}
