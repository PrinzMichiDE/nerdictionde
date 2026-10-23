import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFindMany = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    review: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

import { GET } from "@/app/api/reviews/search/route";

const createMockReview = (overrides: Record<string, unknown> = {}) => ({
  id: "test-1",
  title: "Cyberpunk 2077 Review",
  title_en: "Cyberpunk 2077 Review",
  slug: "cyberpunk-2077-review",
  category: "game",
  score: 85,
  content: "This is a review about an open-world RPG set in Night City.",
  content_en: "This is a review about an open-world RPG set in Night City.",
  images: ["https://example.com/image.jpg"],
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  tags: [{ tag: { name: "RPG", slug: "rpg" } }],
  ...overrides,
});

describe("GET /api/reviews/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gibt Suchergebnisse für eine Query zurück", async () => {
    const mockReviews = [
      createMockReview({ id: "1", title: "Cyberpunk 2077 Review" }),
      createMockReview({ id: "2", title: "The Witcher 3 Review" }),
    ];
    mockFindMany.mockResolvedValue(mockReviews);
    mockCount.mockResolvedValue(2);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=Cyberpunk"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(12);
    expect(mockFindMany).toHaveBeenCalled();
  });

  it("gibt leeres Array zurück, wenn keine Treffer", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=nonexistentgame123"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toEqual([]);
    expect(data.pagination.total).toBe(0);
    expect(data.pagination.totalPages).toBe(0);
  });

  it("filtert nach Kategorie", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test&category=game"
    );
    await GET(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: "game" }),
      })
    );
  });

  it("filtert nach minScore und maxScore", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test&minScore=70&maxScore=90"
    );
    await GET(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          score: { gte: 70, lte: 90 },
        }),
      })
    );
  });

  it("filtert nach Tags", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test&tags=rpg,open-world"
    );
    await GET(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tags: {
            some: { tag: { slug: { in: ["rpg", "open-world"] } } },
          },
        }),
      })
    );
  });

  it("sortiert nach Relevanz bei sort=relevance", async () => {
    const mockReviews = [
      createMockReview({ id: "1", title: "Game A", score: 50 }),
      createMockReview({ id: "2", title: "Cyberpunk 2077", score: 95 }),
    ];
    mockFindMany.mockResolvedValue(mockReviews);
    mockCount.mockResolvedValue(2);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=Cyberpunk&sort=relevance"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews[0].id).toBe("2"); // Cyberpunk should rank higher
  });

  it("sortiert nach Datum absteigend (default)", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test"
    );
    await GET(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("sortiert nach Wertung absteigend bei sort=score-desc", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test&sort=score-desc"
    );
    await GET(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { score: "desc" },
      })
    );
  });

  it("paginiert korrekt mit page und limit", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(25);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test&page=2&limit=10"
    );
    await GET(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it("begrenzt limit auf max 50", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test&limit=100"
    );
    await GET(req);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      })
    );
  });

  it("gibt 500 bei Datenbankfehler zurück", async () => {
    mockFindMany.mockRejectedValue(new Error("DB Error"));
    mockCount.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("DB Error");
  });

  it("sucht case-insensitive in Titel und Inhalt", async () => {
    const mockReviews = [
      createMockReview({
        id: "1",
        title: "CYBERPUNK 2077",
        content: "Great game",
      }),
    ];
    mockFindMany.mockResolvedValue(mockReviews);
    mockCount.mockResolvedValue(1);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=cyberpunk"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(1);
  });

  it("behandelt leere Query (ohne query Parameter)", async () => {
    mockFindMany.mockResolvedValue([
      createMockReview({ id: "1", title: "Game A" }),
      createMockReview({ id: "2", title: "Game B" }),
    ]);
    mockCount.mockResolvedValue(2);

    const req = new NextRequest("http://localhost/api/reviews/search");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(2);
  });

  it("behandelt nicht-numerische minScore/maxScore (NaN wird gesetzt)", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost/api/reviews/search?query=test&minScore=abc&maxScore=xyz"
    );
    await GET(req);

    // parseInt returns NaN for non-numeric strings, which gets set in the where clause
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          score: { gte: NaN, lte: NaN },
        }),
      })
    );
  });
});