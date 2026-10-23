import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockReviewFindUnique = vi.hoisted(() => vi.fn());
const mockRenderReviewPdfToBuffer = vi.hoisted(() => vi.fn());
const mockSanitizeFilename = vi.hoisted(() => vi.fn((slug: string) => slug));
const mockGetSiteUrl = vi.hoisted(() => vi.fn(() => "https://nerdiction.de"));

vi.mock("@/lib/prisma", () => ({
  default: {
    review: {
      findUnique: mockReviewFindUnique,
    },
  },
}));

vi.mock("@/components/reviews/ReviewPdfLayout", () => ({
  renderReviewPdfToBuffer: mockRenderReviewPdfToBuffer,
  sanitizeFilename: mockSanitizeFilename,
}));

vi.mock("@/lib/seo", () => ({
  getSiteUrl: mockGetSiteUrl,
}));

import { GET } from "@/app/api/reviews/[slug]/pdf/route";

// Mock NextRequest
function createMockRequest(url: string): NextRequest {
  return new NextRequest(url, {
    method: "GET",
    headers: { Accept: "application/pdf" },
  });
}

describe("GET /api/reviews/[slug]/pdf", () => {
  const mockReview = {
    id: "review-1",
    slug: "test-game",
    title: "Test Game",
    title_en: "Test Game EN",
    category: "game",
    content: "# Test Content\n\nThis is a test review.",
    content_en: "# Test Content EN\n\nThis is a test review in English.",
    score: 85,
    pros: ["Great graphics", "Good gameplay"],
    pros_en: ["Great graphics", "Good gameplay"],
    cons: ["Short campaign"],
    cons_en: ["Short campaign"],
    images: ["https://example.com/image1.jpg"],
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for non-existent review", async () => {
    mockReviewFindUnique.mockResolvedValue(null);

    const request = createMockRequest("https://nerdiction.de/api/reviews/non-existent/pdf");
    const response = await GET(request, { params: Promise.resolve({ slug: "non-existent" }) });

    expect(response.status).toBe(404);
  });

  it("returns 404 for draft review", async () => {
    mockReviewFindUnique.mockResolvedValue({ ...mockReview, status: "draft" });

    const request = createMockRequest("https://nerdiction.de/api/reviews/test-game/pdf");
    const response = await GET(request, { params: Promise.resolve({ slug: "test-game" }) });

    expect(response.status).toBe(404);
  });

  it("returns PDF for published review (German)", async () => {
    mockReviewFindUnique.mockResolvedValue(mockReview);
    mockRenderReviewPdfToBuffer.mockResolvedValue(Buffer.from("fake-pdf-content"));

    const request = createMockRequest("https://nerdiction.de/api/reviews/test-game/pdf");
    const response = await GET(request, { params: Promise.resolve({ slug: "test-game" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("test-game-review.pdf");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600, stale-while-revalidate=86400");
  });

  it("returns PDF for published review (English)", async () => {
    mockReviewFindUnique.mockResolvedValue(mockReview);
    mockRenderReviewPdfToBuffer.mockResolvedValue(Buffer.from("fake-pdf-content"));

    const request = createMockRequest("https://nerdiction.de/api/reviews/test-game/pdf?lang=en");
    const response = await GET(request, { params: Promise.resolve({ slug: "test-game" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("test-game-review.pdf");
  });

  it("calls renderReviewPdfToBuffer with correct parameters", async () => {
    mockReviewFindUnique.mockResolvedValue(mockReview);
    mockRenderReviewPdfToBuffer.mockResolvedValue(Buffer.from("fake-pdf-content"));

    const request = createMockRequest("https://nerdiction.de/api/reviews/test-game/pdf?lang=en");
    await GET(request, { params: Promise.resolve({ slug: "test-game" }) });

    expect(mockRenderReviewPdfToBuffer).toHaveBeenCalledWith(mockReview, true, "https://nerdiction.de");
  });

  it("returns 500 on PDF generation error", async () => {
    mockReviewFindUnique.mockResolvedValue(mockReview);
    mockRenderReviewPdfToBuffer.mockRejectedValue(new Error("PDF generation failed"));

    const request = createMockRequest("https://nerdiction.de/api/reviews/test-game/pdf");
    const response = await GET(request, { params: Promise.resolve({ slug: "test-game" }) });

    expect(response.status).toBe(500);
  });
});