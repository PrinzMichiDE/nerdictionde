export type ReviewCategory = "game" | "hardware" | "amazon";
export type ReviewStatus = "draft" | "published";

export interface Review {
  id: string;
  title: string;
  title_en?: string | null;
  slug: string;
  category: ReviewCategory;
  content: string;
  content_en?: string | null;
  score: number;
  pros: string[];
  pros_en: string[];
  cons: string[];
  cons_en: string[];
  images: string[];
  youtubeVideos: string[];
  status: ReviewStatus;
  igdbId?: number | null;
  steamAppId?: string | null;
  amazonAsin?: string | null;
  affiliateLink?: string | null;
  hardwareId?: string | null;
  specs?: any | null;
  metadata?: any | null; // Added metadata field
  createdAt: Date;
  updatedAt: Date;
}
