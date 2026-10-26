import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockReviewFindUnique = vi.hoisted(() => vi.fn());
const mockCommentFindUnique = vi.hoisted(() => vi.fn());
const mockCommentCreate = vi.hoisted(() => vi.fn());
const mockCommentFindMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    review: { findUnique: mockReviewFindUnique },
    comment: {
      findUnique: mockCommentFindUnique,
      create: mockCommentCreate,
      findMany: mockCommentFindMany,
    },
  },
}));

import { POST, GET } from "@/app/api/comments/route";

describe("POST /api/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("erstellt einen top-level Kommentar (parentId null)", async () => {
    mockReviewFindUnique.mockResolvedValue({ id: "review_1" });
    mockCommentCreate.mockResolvedValue({
      id: "comment_1",
      reviewId: "review_1",
      text: "Guter Test!",
      author: "Besucher",
      parentId: null,
      createdAt: new Date(),
    });

    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ reviewId: "review_1", text: "Guter Test!" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.parentId).toBeNull();
    expect(mockCommentCreate).toHaveBeenCalledWith({
      data: {
        reviewId: "review_1",
        text: "Guter Test!",
        author: "Besucher",
        parentId: undefined,
      },
      include: { parent: true },
    });
  });

  it("erstellt eine Antwort mit parentId", async () => {
    mockReviewFindUnique.mockResolvedValue({ id: "review_1" });
    mockCommentFindUnique.mockResolvedValue({
      id: "comment_parent",
      parentId: null,
      reviewId: "review_1",
    });
    mockCommentCreate.mockResolvedValue({
      id: "comment_reply",
      reviewId: "review_1",
      text: "Antwort",
      author: "Besucher",
      parentId: "comment_parent",
      createdAt: new Date(),
    });

    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({
        reviewId: "review_1",
        text: "Antwort",
        parentId: "comment_parent",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.parentId).toBe("comment_parent");
    expect(mockCommentFindUnique).toHaveBeenCalledWith({
      where: { id: "comment_parent" },
      select: { id: true, parentId: true, reviewId: true },
    });
  });

  it("lehnt einen nicht existierenden parentId ab (400)", async () => {
    mockReviewFindUnique.mockResolvedValue({ id: "review_1" });
    mockCommentFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({
        reviewId: "review_1",
        text: "Antwort",
        parentId: "nicht-existent",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Parent-Kommentar");
  });

  it("lehnt eine Antwort auf eine Antwort ab (max. 2 Ebenen, 400)", async () => {
    mockReviewFindUnique.mockResolvedValue({ id: "review_1" });
    mockCommentFindUnique.mockResolvedValue({
      id: "comment_parent",
      parentId: "comment_grandparent",
      reviewId: "review_1",
    });

    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({
        reviewId: "review_1",
        text: "Antwort auf Antwort",
        parentId: "comment_parent",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("max. 2 Ebenen");
  });

  it("lehnt leeren Kommentartext ab (400)", async () => {
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ reviewId: "review_1", text: "" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("lehnt eine Antwort auf einen Kommentar aus einem anderen Review ab (400)", async () => {
    mockReviewFindUnique.mockResolvedValue({ id: "review_1" });
    mockCommentFindUnique.mockResolvedValue({
      id: "comment_parent",
      parentId: null,
      reviewId: "anderer_review",
    });

    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({
        reviewId: "review_1",
        text: "Antwort",
        parentId: "comment_parent",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("gehört nicht zu diesem Review");
  });

  it("lehnt nicht existierenden Review ab (404)", async () => {
    mockReviewFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ reviewId: "nicht-existent", text: "Test" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(404);
  });
});

describe("GET /api/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gibt Kommentare inklusive parentId zuruck", async () => {
    mockCommentFindMany.mockResolvedValue([
      {
        id: "comment_1",
        reviewId: "review_1",
        text: "Top-Level",
        author: "Besucher",
        parentId: null,
        createdAt: new Date(),
      },
      {
        id: "comment_2",
        reviewId: "review_1",
        text: "Antwort",
        author: "Besucher",
        parentId: "comment_1",
        createdAt: new Date(),
      },
    ]);

    const req = new NextRequest(
      "http://localhost/api/comments?reviewId=review_1",
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.comments).toHaveLength(2);
    expect(data.comments[0].parentId).toBeNull();
    expect(data.comments[1].parentId).toBe("comment_1");
    expect(mockCommentFindMany).toHaveBeenCalledWith({
      where: { reviewId: "review_1" },
      orderBy: { createdAt: "desc" },
    });
  });
});
