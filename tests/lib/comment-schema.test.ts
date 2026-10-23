import { describe, it, expect } from "vitest";
import { createCommentSchema, getCommentsQuerySchema } from "@/lib/comment-schema";

describe("createCommentSchema", () => {
  it("akzeptiert einen gültigen Kommentar ohne optionale Felder", () => {
    const result = createCommentSchema.safeParse({
      reviewId: "review_1",
      text: "Guter Test!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.author).toBe("Besucher");
      expect(result.data.parentId).toBeUndefined();
    }
  });

  it("akzeptiert parentId für Antworten", () => {
    const result = createCommentSchema.safeParse({
      reviewId: "review_1",
      text: "Antwort",
      parentId: "comment_1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parentId).toBe("comment_1");
    }
  });

  it("lehnt leeren reviewId ab", () => {
    const result = createCommentSchema.safeParse({
      reviewId: "",
      text: "Test",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("reviewId");
    }
  });

  it("lehnt leeren Text ab", () => {
    const result = createCommentSchema.safeParse({
      reviewId: "review_1",
      text: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("text");
    }
  });

  it("lehnt Text über 2000 Zeichen ab", () => {
    const result = createCommentSchema.safeParse({
      reviewId: "review_1",
      text: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("wandelt leeren Autor in Standard-Besucher um", () => {
    const result = createCommentSchema.safeParse({
      reviewId: "review_1",
      text: "Test",
      author: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.author).toBe("Besucher");
    }
  });

  it("wendet Standardautor Besucher an", () => {
    const result = createCommentSchema.safeParse({
      reviewId: "review_1",
      text: "Test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.author).toBe("Besucher");
    }
  });
});

describe("getCommentsQuerySchema", () => {
  it("akzeptiert eine gültige reviewId", () => {
    const result = getCommentsQuerySchema.safeParse({ reviewId: "review_1" });
    expect(result.success).toBe(true);
  });

  it("lehnt fehlende reviewId ab", () => {
    const result = getCommentsQuerySchema.safeParse({ reviewId: "" });
    expect(result.success).toBe(false);
  });
});
