import { describe, it, expect } from "vitest";
import { scoreRelevance, type ReviewWithTags } from "@/lib/search-relevance";

const createMockReview = (overrides: Partial<ReviewWithTags> = {}): ReviewWithTags => ({
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

describe("scoreRelevance", () => {
  it("should return reviews unchanged when query is empty", () => {
    const reviews = [createMockReview()];
    const result = scoreRelevance(reviews, "");
    expect(result).toEqual(reviews);
  });

  it("should return reviews unchanged when query is only whitespace", () => {
    const reviews = [createMockReview()];
    const result = scoreRelevance(reviews, "   ");
    expect(result).toEqual(reviews);
  });

  it("should score title exact match highest", () => {
    const review1 = createMockReview({ title: "Cyberpunk 2077", title_en: "Cyberpunk 2077", content: "Review of Cyberpunk 2077 game.", content_en: "Review of Cyberpunk 2077 game.", id: "1", score: 50 });
    const review2 = createMockReview({ title: "The Witcher 3", title_en: "The Witcher 3", content: "Review of The Witcher 3 game.", content_en: "Review of The Witcher 3 game.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "Cyberpunk");
    expect(result[0].id).toBe("1");
  });

  it("should score title starts-with match high", () => {
    const review1 = createMockReview({ title: "Cyberpunk 2077 Phantom Liberty", title_en: "Cyberpunk 2077 Phantom Liberty", content: "DLC review.", content_en: "DLC review.", id: "1", score: 50 });
    const review2 = createMockReview({ title: "The Witcher 3", title_en: "The Witcher 3", content: "Review.", content_en: "Review.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "Cyberpunk");
    expect(result[0].id).toBe("1");
  });

  it("should score title contains match medium", () => {
    const review1 = createMockReview({ title: "Review: Cyberpunk 2077", title_en: "Review: Cyberpunk 2077", content: "Review.", content_en: "Review.", id: "1", score: 50 });
    const review2 = createMockReview({ title: "The Witcher 3", title_en: "The Witcher 3", content: "Review.", content_en: "Review.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "Cyberpunk");
    expect(result[0].id).toBe("1");
  });

  it("should score tag exact match high", () => {
    const review1 = createMockReview({ title: "Game A", title_en: "Game A", content: "Review.", content_en: "Review.", id: "1", tags: [{ tag: { name: "RPG", slug: "rpg" } }], score: 50 });
    const review2 = createMockReview({ title: "Cyberpunk 2077", title_en: "Cyberpunk 2077", content: "Review.", content_en: "Review.", id: "2", tags: [{ tag: { name: "Action", slug: "action" } }], score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "RPG");
    expect(result[0].id).toBe("1");
  });

  it("should score content match lower than title match", () => {
    const review1 = createMockReview({ title: "Game A", title_en: "Game A", content: "This game features Cyberpunk themes and aesthetics.", content_en: "This game features Cyberpunk themes and aesthetics.", id: "1", score: 50 });
    const review2 = createMockReview({ title: "Cyberpunk 2077", title_en: "Cyberpunk 2077", content: "Some other content.", content_en: "Some other content.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "Cyberpunk");
    expect(result[0].id).toBe("2");
  });

  it("should use editorial score as tiebreaker", () => {
    const review1 = createMockReview({ title: "Cyberpunk 2077", title_en: "Cyberpunk 2077", content: "Review.", content_en: "Review.", id: "1", score: 90 });
    const review2 = createMockReview({ title: "Cyberpunk 2077", title_en: "Cyberpunk 2077", content: "Review.", content_en: "Review.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "Cyberpunk");
    expect(result[0].id).toBe("2");
  });

  it("should handle multiple search terms", () => {
    const review1 = createMockReview({ title: "Cyberpunk 2077", title_en: "Cyberpunk 2077", content: "RPG game with great story.", content_en: "RPG game with great story.", id: "1", score: 80 });
    const review2 = createMockReview({ title: "Witcher 3", title_en: "Witcher 3", content: "RPG fantasy adventure.", content_en: "RPG fantasy adventure.", id: "2", score: 90 });
    const review3 = createMockReview({ title: "Elden Ring", title_en: "Elden Ring", content: "Action RPG with open world.", content_en: "Action RPG with open world.", id: "3", score: 95 });
    const reviews = [review1, review2, review3];

    const result = scoreRelevance(reviews, "Cyberpunk RPG");
    expect(result[0].id).toBe("1");
  });

  it("should ignore single character terms", () => {
    const review1 = createMockReview({ title: "A Game", title_en: "A Game", content: "Review.", content_en: "Review.", id: "1", score: 50 });
    const review2 = createMockReview({ title: "Cyberpunk 2077", title_en: "Cyberpunk 2077", content: "Review.", content_en: "Review.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "a");
    // Single char terms are filtered out, so original order is preserved
    expect(result[0].id).toBe("1");
  });

  it("should handle case insensitivity", () => {
    const review1 = createMockReview({ title: "CYBERPUNK 2077", title_en: "CYBERPUNK 2077", content: "Review.", content_en: "Review.", id: "1", score: 50 });
    const review2 = createMockReview({ title: "The Witcher 3", title_en: "The Witcher 3", content: "Review.", content_en: "Review.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "cyberpunk");
    expect(result[0].id).toBe("1");
  });

  it("should handle English title", () => {
    const review1 = createMockReview({ title: "German Title", title_en: "Cyberpunk 2077", content: "Deutscher Text.", content_en: "Cyberpunk review.", id: "1", score: 50 });
    const review2 = createMockReview({ title: "The Witcher 3", title_en: "The Witcher 3", content: "Review.", content_en: "Review.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "Cyberpunk");
    expect(result[0].id).toBe("1");
  });

  it("should handle English content", () => {
    const review1 = createMockReview({ title: "Game A", title_en: "Game A", content: "Deutscher Text.", content_en: "Cyberpunk themes here.", id: "1", score: 50 });
    const review2 = createMockReview({ title: "Cyberpunk 2077", title_en: "Cyberpunk 2077", content: "Other content.", content_en: "Other content.", id: "2", score: 95 });
    const reviews = [review1, review2];

    const result = scoreRelevance(reviews, "Cyberpunk");
    expect(result[0].id).toBe("2");
  });
});