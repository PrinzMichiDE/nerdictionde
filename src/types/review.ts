export type ReviewCategory = "game" | "movie" | "series" | "hardware";
export type ReviewStatus = "draft" | "published";

export interface GameSpecs {
  minimum?: Record<string, string | undefined>;
  recommended?: Record<string, string | undefined>;
}

export interface GameMetadata {
  platforms?: string[];
  genres?: string[];
  developers?: string[];
  publishers?: string[];
  gameModes?: string[];
  playerPerspectives?: string[];
  themes?: string[];
  keywords?: string[];
  ageRatings?: string[];
  cover?: string;
  screenshots?: string[];
  videos?: string[];
  websites?: string[];
  similarGames?: string[];
  aggregatedRating?: number;
  ratingCount?: number;
  firstReleaseDate?: Date | string;
  [key: string]: unknown;
}

export interface MovieSeriesMetadata {
  genres?: string[];
  directors?: string[];
  cast?: string[];
  writers?: string[];
  producers?: string[];
  productionCompanies?: string[];
  originCountry?: string[];
  spokenLanguages?: string[];
  status?: string;
  type?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  episodeRunTime?: number[];
  firstAirDate?: Date | string;
  lastAirDate?: Date | string;
  networks?: string[];
  cover?: string;
  backdrop?: string;
  posters?: string[];
  videos?: string[];
  keywords?: string[];
  [key: string]: unknown;
}

export interface HardwareMetadata {
  brand?: string;
  model?: string;
  category?: string;
  releaseDate?: Date | string;
  price?: number;
  currency?: string;
  specs?: Record<string, string | number | boolean | undefined>;
  images?: string[];
  [key: string]: unknown;
}

export type ReviewMetadata = GameMetadata | MovieSeriesMetadata | HardwareMetadata | Record<string, unknown>;

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
  tmdbId?: number | null;
  steamAppId?: string | null;
  epicId?: string | null;
  gogId?: string | null;
  specs?: GameSpecs | null;
  metadata?: ReviewMetadata | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  releaseDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  bookmarkCount?: number;
}
