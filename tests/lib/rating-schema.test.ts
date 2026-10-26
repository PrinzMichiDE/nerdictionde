import { describe, it, expect } from "vitest";
import {
  createRatingSchema,
  createVoteSchema,
  createBookmarkSchema,
} from "@/lib/rating-schema";

describe("createRatingSchema", () => {
  it("akzeptiert eine gültige Bewertung", () => {
    const result = createRatingSchema.safeParse({
      reviewId: "review_1",
      score: 8,
      text: "Gutes Spiel",
    });
    expect(result.success).toBe(true);
  });

  it("lehnt Punktzahl unter 0 ab", () => {
    const result = createRatingSchema.safeParse({
      reviewId: "review_1",
      score: -1,
    });
    expect(result.success).toBe(false);
  });

  it("lehnt Punktzahl über 10 ab", () => {
    const result = createRatingSchema.safeParse({
      reviewId: "review_1",
      score: 11,
    });
    expect(result.success).toBe(false);
  });

  it("lehnt Nicht-Integer-Punktzahl ab", () => {
    const result = createRatingSchema.safeParse({
      reviewId: "review_1",
      score: 8.5,
    });
    expect(result.success).toBe(false);
  });

  it("akzeptiert Text bis 1000 Zeichen", () => {
    const result = createRatingSchema.safeParse({
      reviewId: "review_1",
      score: 8,
      text: "a".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it("lehnt Text über 1000 Zeichen ab", () => {
    const result = createRatingSchema.safeParse({
      reviewId: "review_1",
      score: 8,
      text: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("akzeptiert Bewertung ohne Text", () => {
    const result = createRatingSchema.safeParse({
      reviewId: "review_1",
      score: 7,
    });
    expect(result.success).toBe(true);
  });
});

describe("createVoteSchema", () => {
  it("akzeptiert einen Upvote auf einen Thread", () => {
    const result = createVoteSchema.safeParse({
      targetType: "thread",
      targetId: "thread_1",
      value: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(1);
    }
  });

  it("akzeptiert einen Downvote auf einen Kommentar", () => {
    const result = createVoteSchema.safeParse({
      targetType: "comment",
      targetId: "comment_1",
      value: "-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(-1);
    }
  });

  it("lehnt ungültigen value ab", () => {
    const result = createVoteSchema.safeParse({
      targetType: "thread",
      targetId: "thread_1",
      value: "0",
    });
    expect(result.success).toBe(false);
  });
});

describe("createBookmarkSchema", () => {
  it("akzeptiert eine gültige reviewId", () => {
    const result = createBookmarkSchema.safeParse({
      reviewId: "review_1",
    });
    expect(result.success).toBe(true);
  });

  it("lehnt leere reviewId ab", () => {
    const result = createBookmarkSchema.safeParse({
      reviewId: "",
    });
    expect(result.success).toBe(false);
  });
});
