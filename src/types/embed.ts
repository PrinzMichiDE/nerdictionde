// ============================================
// Embed Types
// ============================================

export type EmbedType = 'review' | 'collection' | 'series';
export type EmbedTheme = 'auto' | 'light' | 'dark';

export interface EmbedWidgetProps {
  type: EmbedType;
  slug: string;
  theme?: EmbedTheme;
  consent?: boolean;
  compact?: boolean;
}

export interface EmbedAuthor {
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface EmbedReviewData {
  type: 'review';
  slug: string;
  title: string;
  excerpt: string;
  score: number;
  scoreLabel: string;
  category: string;
  categoryLabel: string;
  coverImage: string | null;
  coverAlt: string;
  author?: EmbedAuthor;
  publishedAt: string;
  url: string;
  pros: string[];
  cons: string[];
  specs: Record<string, string | string[]>;
}

export interface EmbedCollectionData {
  type: 'collection';
  slug: string;
  title: string;
  description: string;
  itemCount: number;
  owner: EmbedAuthor;
  coverImage: string | null;
  createdAt: string;
  url: string;
  items: Array<{
    position: number;
    review: {
      slug: string;
      title: string;
      score: number;
      coverImage: string | null;
    };
  }>;
}

export interface EmbedSeriesData {
  type: 'series';
  slug: string;
  title: string;
  description: string;
  partCount: number;
  owner: EmbedAuthor;
  coverImage: string | null;
  createdAt: string;
  url: string;
  parts: Array<{
    order: number;
    review: {
      slug: string;
      title: string;
      score: number;
    };
  }>;
}

export type EmbedData = EmbedReviewData | EmbedCollectionData | EmbedSeriesData;

export interface EmbedApiResponse<T = EmbedData> {
  data: T;
  cachedAt: string;
}