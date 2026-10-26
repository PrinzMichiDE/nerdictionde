import type { JsonValue as PrismaJsonValue } from "@prisma/client/runtime/library";

type JsonValue = PrismaJsonValue;

export interface ReviewShape {
  id: string;
  title: string;
  slug: string;
  category: string;
  score: number;
  pros: string[];
  cons: string[];
  images: string[];
  releaseDate: Date | null;
  specs: JsonValue | null;
  metadata: JsonValue | null;
  priceHistory: PriceHistoryItem[];
  deals: DealItem[];
  youtubeVideos: string[];
}

export interface PriceHistoryItem {
  id: string;
  price: number;
  currency: string;
  source: string;
  url: string | null;
  recordedAt: Date;
}

export interface DealItem {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  currency: string;
  url: string;
  imageUrl: string | null;
  source: string;
  status: string;
  expiresAt: Date | null;
}

export interface SpecRow {
  label: string;
  value: string;
}

export interface PricePoint {
  date: Date;
  price: number;
  source: string;
  currency: string;
}

export interface YouTubeVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
}