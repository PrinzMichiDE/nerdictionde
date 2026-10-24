import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { ReviewPdfDocument } from "@/components/reviews/ReviewPdfLayout";
import type { DocumentProps } from "@react-pdf/renderer";

interface MockReview {
  id: string;
  slug: string;
  title: string;
  title_en: string;
  category: string;
  content: string;
  content_en: string;
  score: number;
  pros: string[];
  pros_en: string[];
  cons: string[];
  cons_en: string[];
  images: string[];
  tags: { tag: { name: string } }[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  releaseDate: Date;
  specs: {
    minimum: Record<string, string>;
    recommended: Record<string, string>;
  };
  youtubeVideos: string[];
  igdbId: null;
  tmdbId: null;
  steamAppId: null;
  epicId: null;
  gogId: null;
  amazonAsin: null;
  affiliateLink: null;
  hardwareId: null;
  metadata: null;
  metaDescription: null;
  metaKeywords: null;
  userRatingCount: number;
  userRatingAvg: number;
  seriesId: string | null;
  seriesOrder: number | null;
}

const createMockReview = (overrides: Partial<MockReview> = {}): MockReview => ({
  id: "review-1",
  slug: "test-game",
  title: "Test Game",
  title_en: "Test Game EN",
  category: "game",
  content: "# Introduction\n\nThis is a test review.\n\n## Gameplay\n\nThe gameplay is great.",
  content_en: "# Introduction\n\nThis is a test review in English.\n\n## Gameplay\n\nThe gameplay is great.",
  score: 85,
  pros: ["Great graphics", "Good gameplay"],
  pros_en: ["Great graphics", "Good gameplay"],
  cons: ["Short campaign"],
  cons_en: ["Short campaign"],
  images: [],
  tags: [{ tag: { name: "Action" } }, { tag: { name: "RPG" } }],
  status: "published",
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-20"),
  releaseDate: new Date("2023-12-01"),
  specs: {
    minimum: { os: "Windows 10", cpu: "i5-8400", ram: "8 GB", gpu: "GTX 1060", storage: "50 GB" },
    recommended: { os: "Windows 11", cpu: "i7-10700", ram: "16 GB", gpu: "RTX 3070", storage: "50 GB" },
  },
  youtubeVideos: [],
  igdbId: null,
  tmdbId: null,
  steamAppId: null,
  epicId: null,
  gogId: null,
  amazonAsin: null,
  affiliateLink: null,
  hardwareId: null,
  metadata: null,
  metaDescription: null,
  metaKeywords: null,
  userRatingCount: 0,
  userRatingAvg: 0,
  seriesId: null,
  seriesOrder: null,
  ...overrides,
});

function createPdfElement(review: ReturnType<typeof createMockReview>, isEn: boolean): React.ReactElement<DocumentProps> {
  return React.createElement(ReviewPdfDocument, {
    review,
    isEn,
    siteUrl: "https://nerdiction.de",
  }) as React.ReactElement<DocumentProps>;
}

describe("ReviewPdfDocument", () => {
  it("renders without throwing", async () => {
    const mockReview = createMockReview();
    const doc = createPdfElement(mockReview, false);

    const buffer = await renderToBuffer(doc);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("renders English version without throwing", async () => {
    const mockReview = createMockReview();
    const doc = createPdfElement(mockReview, true);

    const buffer = await renderToBuffer(doc);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("generates valid PDF header", async () => {
    const mockReview = createMockReview();
    const doc = createPdfElement(mockReview, false);

    const buffer = await renderToBuffer(doc);
    // PDF files start with %PDF
    const header = buffer.subarray(0, 4).toString();
    expect(header).toBe("%PDF");
  });

  it("renders hardware specs for game reviews", async () => {
    const mockReview = createMockReview({ category: "game" });
    const doc = createPdfElement(mockReview, false);

    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("does not render hardware specs for non-game reviews", async () => {
    const mockReview = createMockReview({ category: "movie" });
    const doc = createPdfElement(mockReview, false);

    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
  });
});