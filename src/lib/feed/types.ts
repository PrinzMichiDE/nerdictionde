/**
 * feed — Types
 *
 * Shared types for the activity feed. Strict TypeScript, no `any`.
 */

import type { User } from "@prisma/client";

export type FeedItemType = "rating" | "bookmark" | "collection_item" | "user_series_item";

export interface FeedItemUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
}

export interface FeedItemReview {
  id: string;
  title: string;
  slug: string;
  category: string;
  score: number;
  images: string[];
}

export interface BaseFeedItem {
  type: FeedItemType;
  id: string;
  createdAt: Date;
  user: FeedItemUser;
  review: FeedItemReview;
}

export interface RatingFeedItem extends BaseFeedItem {
  type: "rating";
  rating: { score: number; text: string | null };
}

export interface BookmarkFeedItem extends BaseFeedItem {
  type: "bookmark";
}

export interface CollectionItemFeedItem extends BaseFeedItem {
  type: "collection_item";
  collection: {
    id: string;
    slug: string;
    title: string;
  };
}

export interface UserSeriesItemFeedItem extends BaseFeedItem {
  type: "user_series_item";
  series: {
    id: string;
    slug: string;
    title: string;
  };
}

export type FeedItem = RatingFeedItem | BookmarkFeedItem | CollectionItemFeedItem | UserSeriesItemFeedItem;

export interface FeedResult {
  items: FeedItem[];
  nextCursor: string | null;
  total?: number;
}

export interface FeedSourceResult {
  items: FeedItem[];
  earliestCursor: Date | null;
}
