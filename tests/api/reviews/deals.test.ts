import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFindMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    deal: {
      findMany: mockFindMany,
    },
  },
}));

import { GET } from "@/app/api/reviews/[id]/deals/route";

describe("GET /api/reviews/[id]/deals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gibt aktive Deals fur eine Review-ID zuruck, sortiert nach createdAt desc", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "deal_1",
        title: "Angebot A",
        price: 29.99,
        originalPrice: 39.99,
        discount: 25,
        currency: "EUR",
        url: "https://example.com/a",
        source: "mydealz",
        reviewId: "review_1",
        status: "active",
        createdAt: new Date(),
      },
    ]);

    const params = Promise.resolve({ id: "review_1" });
    const req = new NextRequest("http://localhost/api/reviews/review_1/deals");

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].title).toBe("Angebot A");
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { reviewId: "review_1", status: "active" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  });

  it("gibt ein leeres Array zuruck, wenn keine Deals vorhanden sind", async () => {
    mockFindMany.mockResolvedValue([]);

    const params = Promise.resolve({ id: "review_empty" });
    const req = new NextRequest(
      "http://localhost/api/reviews/review_empty/deals"
    );

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });
});
