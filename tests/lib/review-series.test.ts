import { describe, it, expect } from "vitest";
import {
  slugify,
  generateUniqueSlug,
  computeAggregateScore,
  validateOrder,
} from "@/lib/review-series";
import { createSeriesSchema, updateSeriesSchema, reorderSeriesSchema, addSeriesItemSchema } from "@/lib/review-series-schema";

describe("review-series: slugify", () => {
  it("should convert title to valid slug", () => {
    expect(slugify("The Witcher 3: Wild Hunt")).toBe("the-witcher-3-wild-hunt");
    expect(slugify("  Hello World  ")).toBe("hello-world");
    expect(slugify("Sonderzeichen!@#$%^&*()")).toBe("sonderzeichen");
    expect(slugify("multiple   spaces")).toBe("multiple-spaces");
    expect(slugify("UPPERCASE")).toBe("uppercase");
  });
});

describe("review-series: generateUniqueSlug", () => {
  it("should generate unique slug when base exists", async () => {
    const slug = await generateUniqueSlug("test-series");
    expect(slug).toMatch(/^test-series(-\d+)?$/);
  });
});

describe("review-series: computeAggregateScore", () => {
  it("should return null for empty array", () => {
    expect(computeAggregateScore([])).toBeNull();
  });

  it("should calculate average correctly", () => {
    const parts = [{ score: 80 }, { score: 90 }, { score: 70 }];
    expect(computeAggregateScore(parts)).toBe(80); // (80+90+70)/3 = 80
  });

  it("should round correctly", () => {
    const parts = [{ score: 85 }, { score: 86 }];
    expect(computeAggregateScore(parts)).toBe(86); // 85.5 rounded
  });
});

describe("review-series: validateOrder", () => {
  it("should pass for valid sequential order", () => {
    const items = [
      { reviewId: "1", seriesOrder: 1 },
      { reviewId: "2", seriesOrder: 2 },
      { reviewId: "3", seriesOrder: 3 },
    ];
    expect(validateOrder(items, 3)).toEqual({ valid: true });
  });

  it("should fail for non-sequential order", () => {
    const items = [
      { reviewId: "1", seriesOrder: 1 },
      { reviewId: "2", seriesOrder: 3 }, // missing 2
    ];
    expect(validateOrder(items, 2).valid).toBe(false);
  });

  it("should fail for duplicate reviewIds", () => {
    const items = [
      { reviewId: "1", seriesOrder: 1 },
      { reviewId: "1", seriesOrder: 2 },
    ];
    expect(validateOrder(items, 2).valid).toBe(false);
  });

  it("should pass for empty array", () => {
    expect(validateOrder([], 0)).toEqual({ valid: true });
  });
});

describe("review-series-schema: createSeriesSchema", () => {
  it("should validate valid input", () => {
    const result = createSeriesSchema.safeParse({
      title: "Test Serie",
      description: "Eine Beschreibung",
      coverImage: "https://example.com/cover.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("should require title", () => {
    const result = createSeriesSchema.safeParse({
      description: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject title too long", () => {
    const result = createSeriesSchema.safeParse({
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid coverImage URL", () => {
    const result = createSeriesSchema.safeParse({
      title: "Test",
      coverImage: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("review-series-schema: updateSeriesSchema", () => {
  it("should validate partial update", () => {
    const result = updateSeriesSchema.safeParse({
      title: "Neuer Titel",
    });
    expect(result.success).toBe(true);
  });

  it("should validate items array", () => {
    const result = updateSeriesSchema.safeParse({
      items: [
        { reviewId: "clx123abc456def789", seriesOrder: 1 },
        { reviewId: "clx456def789abc123", seriesOrder: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid reviewId in items", () => {
    const result = updateSeriesSchema.safeParse({
      items: [{ reviewId: "invalid", seriesOrder: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("review-series-schema: reorderSeriesSchema", () => {
  it("should validate reorder input", () => {
    const result = reorderSeriesSchema.safeParse({
      items: [
        { reviewId: "clx123abc456def789", seriesOrder: 1 },
        { reviewId: "clx456def789abc123", seriesOrder: 2 },
      ],
      version: 1,
    });
    expect(result.success).toBe(true);
  });

  it("should require version", () => {
    const result = reorderSeriesSchema.safeParse({
      items: [{ reviewId: "abc123def456", seriesOrder: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("review-series-schema: addSeriesItemSchema", () => {
  it("should validate reviewId", () => {
    const result = addSeriesItemSchema.safeParse({
      reviewId: "clx123abc456def789",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid reviewId", () => {
    const result = addSeriesItemSchema.safeParse({
      reviewId: "invalid",
    });
    expect(result.success).toBe(false);
  });
});