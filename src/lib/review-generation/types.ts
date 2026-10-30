/**
 * review-generation — Shared types
 *
 * Single source of truth for all types used across the review generation
 * pipeline. No `any`, strict TypeScript, explicit interfaces.
 */

import type { Prisma } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/library";

export type ReviewCategory = "game" | "movie" | "series" | "hardware";

export interface ReviewLanguageContent {
  title: string;
  content: string;
  pros: string[];
  cons: string[];
}

export interface GeneratedReviewContent {
  de: ReviewLanguageContent;
  en: ReviewLanguageContent;
  score: number;
  specs?: Record<string, unknown>;
}

export interface ReviewSection {
  de: string;
  en: string;
  description: string;
}

export interface StructuredReviewPromptOptions {
  category: ReviewCategory;
  itemName: string;
  contextLines: string[];
  sections: ReviewSection[];
  wordTarget: number;
  imageCount: number;
  isRetry: boolean;
  includeSpecs?: boolean;
  referenceRating?: string;
  scoreBand?: { min: number; max: number; target: number };
}

export interface ScoreBand {
  min: number;
  max: number;
  target: number;
}

export interface ProcessResult {
  success: boolean;
  reviewId?: string;
  error?: string;
  newScore?: number;
}

export interface ProcessOptions {
  status: "draft" | "published";
  skipExisting: boolean;
}

export interface SlugCandidate {
  base: string;
  suffix?: string;
}

export interface ImageUploadResult {
  success: boolean;
  url: string;
  originalUrl?: string;
}

export interface ReviewMetadataInput {
  [key: string]: unknown;
}

export interface StoreIds {
  steamAppId?: string;
  epicId?: string;
  gogId?: string;
  stores?: Array<{
    category: number;
    name: string;
    id: string;
    url: string;
  }>;
}

export interface SteamGameInfo {
  metacriticScore?: number;
  reviewSummary?: {
    percentPositive: number;
    total: number;
    description: string;
  };
  priceFormatted?: string;
  pcRequirements?: {
    minimum?: {
      os?: string;
      cpu?: string;
      ram?: string;
      gpu?: string;
      dx?: string;
      storage?: string;
      raw?: string;
    };
    recommended?: {
      os?: string;
      cpu?: string;
      ram?: string;
      gpu?: string;
      dx?: string;
      storage?: string;
      raw?: string;
    };
  };
  recommendations?: number;
}

export interface IGDBGameInvolvedCompany {
  developer: boolean;
  publisher: boolean;
  company: { name: string };
}

export interface IGDBGamePlatform {
  name: string;
}

export interface IGDBGameGenre {
  name: string;
}

export interface IGDBGame {
  id: number;
  name: string;
  cover?: { url: string } | null | undefined;
  screenshots?: Array<{ url: string }>;
  involved_companies?: IGDBGameInvolvedCompany[];
  platforms?: IGDBGamePlatform[];
  genres?: IGDBGameGenre[];
  game_modes?: Array<{ name: string }>;
  player_perspectives?: Array<{ name: string }>;
  game_engines?: Array<{ name: string }>;
  first_release_date?: number | null;
  category?: number | null;
  status?: number | null;
  rating?: number | null;
  aggregated_rating?: number | null;
  total_rating?: number | null;
  storyline?: string | null;
  themes?: Array<{ name: string }>;
  keywords?: Array<{ name: string }>;
  similar_games?: Array<{ name: string }>;
  franchise?: { name?: string } | null;
  collections?: Array<{ name: string }>;
  age_ratings?: Array<{ category?: number; rating?: number }>;
  language_supports?: Array<{ language: { name: string } }>;
  time_to_beat?: {
    hastly?: number;
    normally?: number;
    completely?: number;
  } | null;
  game_modes_raw?: unknown;
  summary?: string | null;
  videos?: Array<{ video_id?: string }>;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  overview?: string;
  poster_path?: string | null;
  images?: { backdrops: Array<{ file_path: string }> };
  videos?: { results?: Array<{ site?: string; key?: string }> };
  genres?: Array<{ name: string }>;
  production_companies?: Array<{ name: string }>;
  production_countries?: Array<{ name: string }>;
  spoken_languages?: Array<{ name: string }>;
  external_ids?: { imdb_id?: string | null };
  credits?: {
    cast: Array<{ name: string; character?: string }>;
    crew: Array<{ name: string; job: string }>;
  };
}

export interface TMDBSeries {
  id: number;
  name: string;
  original_name?: string;
  first_air_date?: string;
  last_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  overview?: string;
  poster_path?: string | null;
  images?: { backdrops: Array<{ file_path: string }> };
  videos?: { results?: Array<{ site?: string; key?: string }> };
  genres?: Array<{ name: string }>;
  production_companies?: Array<{ name: string }>;
  production_countries?: Array<{ name: string }>;
  spoken_languages?: Array<{ name: string }>;
  external_ids?: { imdb_id?: string | null };
  credits?: {
    cast: Array<{ name: string; character?: string }>;
    crew: Array<{ name: string; job: string }>;
  };
  created_by?: Array<{ name: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
}

export interface HardwareData {
  id?: string | number;
  name?: string;
  manufacturer?: string | null;
  model?: string | null;
  type?: string;
  releaseDate?: Date | string | null;
  msrp?: number | null;
  specs?: Prisma.JsonValue;
  images?: string[];
  image?: string;
}

export interface TavilySearchResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    score?: number;
  }>;
  [key: string]: unknown;
}

export interface PrismaReviewCreateInput {
  title: string;
  title_en: string;
  slug: string;
  category: ReviewCategory;
  content: string;
  content_en: string;
  score: number;
  pros: string[];
  pros_en: string[];
  cons: string[];
  cons_en: string[];
  images: string[];
  youtubeVideos: string[];
  status: "draft" | "published";
  igdbId?: number | null;
  tmdbId?: number | null;
  hardwareId?: string | null;
  steamAppId?: string | null;
  epicId?: string | null;
  gogId?: string | null;
  specs?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;
  metadata: ReviewMetadataInput;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  releaseDate?: Date | null;
  createdAt?: Date;
  templateId?: string | null;
  templateData?: unknown;
  templateVersion?: number | null;
}

export interface GenerationSideEffects {
  comments: boolean;
  qa: boolean;
  tags: boolean;
}
