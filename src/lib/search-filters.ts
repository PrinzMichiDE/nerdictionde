import type { Prisma } from "@prisma/client";

export interface SearchFiltersInput {
  query?: string;
  category?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
  sort?: "relevance" | "date-desc" | "date-asc" | "score-desc" | "score-asc";
  limit?: number;
  page?: number;
  // NEU: Erweiterte Filter
  releaseDateFrom?: Date;
  releaseDateTo?: Date;
  minPrice?: number;
  maxPrice?: number;
  platforms?: string[];
  hasVideo?: boolean;
  hasDeal?: boolean;
  developer?: string;
  publisher?: string;
}

export interface PriceInfo {
  currentPrice: number | null;
  hasDeal: boolean;
  dealPrice: number | null;
  currency: string;
}

export function parseSearchParams(searchParams: URLSearchParams): SearchFiltersInput {
  const getNumber = (key: string): number | undefined => {
    const v = searchParams.get(key);
    return v ? Number(v) : undefined;
  };

  const getDate = (key: string): Date | undefined => {
    const v = searchParams.get(key);
    return v ? new Date(v) : undefined;
  };

  const getArray = (key: string): string[] | undefined => {
    const v = searchParams.get(key);
    return v ? v.split(",").filter(Boolean) : undefined;
  };

  const getBoolean = (key: string): boolean | undefined => {
    const v = searchParams.get(key);
    return v ? v === "true" || v === "1" : undefined;
  };

  return {
    query: searchParams.get("query")?.trim() || undefined,
    category: searchParams.get("category") || undefined,
    minScore: getNumber("minScore"),
    maxScore: getNumber("maxScore"),
    tags: getArray("tags"),
    sort: (searchParams.get("sort") as SearchFiltersInput["sort"]) || "relevance",
    limit: getNumber("limit") ?? 12,
    page: getNumber("page") ?? 1,
    // NEU
    releaseDateFrom: getDate("releaseDateFrom"),
    releaseDateTo: getDate("releaseDateTo"),
    minPrice: getNumber("minPrice"),
    maxPrice: getNumber("maxPrice"),
    platforms: getArray("platforms"),
    hasVideo: getBoolean("hasVideo"),
    hasDeal: getBoolean("hasDeal"),
    developer: searchParams.get("developer")?.trim() || undefined,
    publisher: searchParams.get("publisher")?.trim() || undefined,
  };
}

export function buildSearchWhereClause(input: SearchFiltersInput): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = { status: "published" };

  // Kategorie
  if (input.category && input.category !== "all") {
    where.category = input.category;
  }

  // Score Range
  if (input.minScore !== undefined || input.maxScore !== undefined) {
    where.score = {};
    if (input.minScore !== undefined) (where.score as { gte: number }).gte = input.minScore;
    if (input.maxScore !== undefined) (where.score as { lte: number }).lte = input.maxScore;
  }

  // Tags
  if (input.tags && input.tags.length > 0) {
    where.tags = {
      some: { tag: { slug: { in: input.tags } } },
    };
  }

  // NEU: Release-Datum Range
  if (input.releaseDateFrom !== undefined || input.releaseDateTo !== undefined) {
    where.releaseDate = {};
    if (input.releaseDateFrom !== undefined) {
      (where.releaseDate as { gte: Date }).gte = input.releaseDateFrom;
    }
    if (input.releaseDateTo !== undefined) {
      (where.releaseDate as { lte: Date }).lte = input.releaseDateTo;
    }
  }

  // NEU: Hat Video
  if (input.hasVideo === true) {
    where.youtubeVideos = { isEmpty: false };
  }

  // NEU: Hat aktiven Deal
  if (input.hasDeal === true) {
    where.deals = {
      some: {
        status: "active",
        expiresAt: { gt: new Date() },
      },
    };
  }

  // NEU: Developer / Publisher (ILIKE auf JSON metadata)
  if (input.developer) {
    where.metadata = {
      path: "developer",
      string_contains: input.developer,
      mode: "insensitive",
    } as Prisma.JsonFilter;
  }
  if (input.publisher) {
    // Wenn schon developer gesetzt, mergen wir publisher dazu
    if (where.metadata) {
      where.metadata = {
        ...(where.metadata as object),
        path: "publisher",
        string_contains: input.publisher,
        mode: "insensitive",
      } as Prisma.JsonFilter;
    } else {
      where.metadata = {
        path: "publisher",
        string_contains: input.publisher,
        mode: "insensitive",
      } as Prisma.JsonFilter;
    }
  }

  // Query (Titel, Inhalt) – wird separat in der API gehandhabt für Relevanz-Sort
  // Hier nur für non-relevance Sorts

  return where;
}

export function buildPlatformWhereClause(platforms: string[]): Prisma.ReviewWhereInput {
  if (!platforms.length) return {};

  const hardwareTypes = mapPlatformsToHardwareTypes(platforms);

  const orConditions: Prisma.ReviewWhereInput[] = [
    {
      metadata: {
        path: "platforms",
        array_contains: platforms,
      } as Prisma.JsonFilter,
    },
  ];

  if (hardwareTypes.length > 0) {
    orConditions.push({ hardware: { type: { in: hardwareTypes } } });
  }

  return { OR: orConditions };
}

// Plattform-Normalisierung & Mapping (dupliziert aus platform-utils für API-Unabhängigkeit)
const PLATFORM_ALIASES: Record<string, string> = {
  pc: "PC",
  windows: "PC",
  steam: "PC",
  epic: "PC",
  gog: "PC",
  "playstation 5": "PS5",
  ps5: "PS5",
  "ps 5": "PS5",
  "playstation 4": "PS4",
  ps4: "PS4",
  "ps 4": "PS4",
  "xbox series x": "Xbox Series",
  "xbox series s": "Xbox Series",
  "xbox series": "Xbox Series",
  "xbox series x/s": "Xbox Series",
  "xbox one": "Xbox One",
  "xbox 1": "Xbox One",
  "nintendo switch": "Switch",
  switch: "Switch",
};

export function normalizePlatform(input: string): string | null {
  const key = input.toLowerCase().trim();
  return PLATFORM_ALIASES[key] ?? null;
}

export function mapPlatformsToHardwareTypes(platforms: string[]): string[] {
  const mapping: Record<string, string[]> = {
    PC: ["gpu", "cpu", "motherboard", "ram", "storage", "psu", "case", "cooler", "monitor", "keyboard", "mouse", "headset", "controller"],
    PS5: ["console"],
    PS4: ["console"],
    "Xbox Series": ["console"],
    "Xbox One": ["console"],
    Switch: ["console"],
  };
  return platforms.flatMap((p) => mapping[p] ?? []);
}