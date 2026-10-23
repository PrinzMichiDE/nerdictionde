import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFindMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    priceHistory: {
      findMany: mockFindMany,
    },
  },
}));

import { GET } from "@/app/api/reviews/[id]/price-history/route";

describe("GET /api/reviews/[id]/price-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gibt Preisverlauf fur eine Review-ID zuruck, sortiert nach recordedAt asc", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "ph_1",
        reviewId: "review_1",
        price: 49.99,
        currency: "EUR",
        source: "test-shop",
        recordedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ]);

    const params = Promise.resolve({ id: "review_1" });
    const req = new NextRequest(
      "http://localhost/api/reviews/review_1/price-history"
    );

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].price).toBe(49.99);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { reviewId: "review_1" },
      orderBy: { recordedAt: "asc" },
      take: 30,
    });
  });

  it("gibt ein leeres Array zuruck, wenn kein Preisverlauf vorhanden ist", async () => {
    mockFindMany.mockResolvedValue([]);

    const params = Promise.resolve({ id: "review_empty" });
    const req = new NextRequest(
      "http://localhost/api/reviews/review_empty/price-history"
    );

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });
});
