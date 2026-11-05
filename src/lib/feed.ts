/**
 * @file feed.ts
 *
 * DEPRECATED: This file has been split into modular files under
 * src/lib/feed/. This barrel file re-exports everything for backward
 * compatibility.
 *
 * To migrate, replace:
 *   import { getFeed } from "@/lib/feed";
 * with the same import — it already resolves to the new modular index.
 */

export { getFeed, invalidateFeedCache } from "./feed/index";
export type {
  FeedItem,
  FeedResult,
  FeedItemType,
  FeedItemUser,
  FeedItemReview,
  RatingFeedItem,
  BookmarkFeedItem,
  CollectionItemFeedItem,
  UserSeriesItemFeedItem,
} from "./feed/types";
