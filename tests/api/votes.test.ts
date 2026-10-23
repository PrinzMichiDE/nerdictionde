import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockVoteFindUnique = vi.hoisted(() => vi.fn());
const mockVoteDelete = vi.hoisted(() => vi.fn());
const mockVoteUpdate = vi.hoisted(() => vi.fn());
const mockVoteCreate = vi.hoisted(() => vi.fn());
const mockVoteAggregate = vi.hoisted(() => vi.fn());
const mockCommentUpdate = vi.hoisted(() => vi.fn());
const mockForumCommentUpdate = vi.hoisted(() => vi.fn());

const mockRequireTwitchAuth = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-twitch", () => ({
  requireTwitchAuth: mockRequireTwitchAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    vote: {
      findUnique: mockVoteFindUnique,
      delete: mockVoteDelete,
      update: mockVoteUpdate,
      create: mockVoteCreate,
      aggregate: mockVoteAggregate,
    },
    comment: {
      update: mockCommentUpdate,
    },
    forumComment: {
      update: mockForumCommentUpdate,
    },
  },
}));

import { POST } from "@/app/api/votes/route";

describe("POST /api/votes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockRequireTwitchAuth.mockResolvedValue(
      new NextResponse(null, { status: 401 })
    );

    const req = new NextRequest("http://localhost/api/votes", {
      method: "POST",
      body: JSON.stringify({
        targetType: "comment",
        targetId: "comment_1",
        value: "1",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("erstellt einen Upvote auf einen Kommentar und aktualisiert Comment.score", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockVoteFindUnique.mockResolvedValue(null);
    mockVoteCreate.mockResolvedValue({
      id: "vote_1",
      userId: "user_1",
      targetType: "comment",
      targetId: "comment_1",
      value: 1,
    });
    mockVoteAggregate.mockResolvedValue({ _sum: { value: 3 } });
    mockCommentUpdate.mockResolvedValue({ id: "comment_1", score: 3 });

    const req = new NextRequest("http://localhost/api/votes", {
      method: "POST",
      body: JSON.stringify({
        targetType: "comment",
        targetId: "comment_1",
        value: "1",
      }),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.score).toBe(3);
    expect(mockVoteCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        targetType: "comment",
        targetId: "comment_1",
        value: 1,
      },
    });
    expect(mockCommentUpdate).toHaveBeenCalledWith({
      where: { id: "comment_1" },
      data: { score: 3 },
    });
  });

  it("aktualisiert Comment.score bei Stimmänderung (hoch -> runter)", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockVoteFindUnique.mockResolvedValue({
      id: "vote_1",
      userId: "user_1",
      targetType: "comment",
      targetId: "comment_1",
      value: 1,
    });
    mockVoteUpdate.mockResolvedValue({
      id: "vote_1",
      value: -1,
    });
    mockVoteAggregate.mockResolvedValue({ _sum: { value: -2 } });
    mockCommentUpdate.mockResolvedValue({ id: "comment_1", score: -2 });

    const req = new NextRequest("http://localhost/api/votes", {
      method: "POST",
      body: JSON.stringify({
        targetType: "comment",
        targetId: "comment_1",
        value: "-1",
      }),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(200);
    expect(result.data.score).toBe(-2);
    expect(mockVoteUpdate).toHaveBeenCalledWith({
      where: { id: "vote_1" },
      data: { value: -1 },
    });
    expect(mockCommentUpdate).toHaveBeenCalledWith({
      where: { id: "comment_1" },
      data: { score: -2 },
    });
  });

  it("entfernt eine Stimme bei gleichem Wert (Toggle)", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockVoteFindUnique.mockResolvedValue({
      id: "vote_1",
      userId: "user_1",
      targetType: "comment",
      targetId: "comment_1",
      value: 1,
    });
    mockVoteDelete.mockResolvedValue({ id: "vote_1" });
    mockVoteAggregate.mockResolvedValue({ _sum: { value: 0 } });
    mockCommentUpdate.mockResolvedValue({ id: "comment_1", score: 0 });

    const req = new NextRequest("http://localhost/api/votes", {
      method: "POST",
      body: JSON.stringify({
        targetType: "comment",
        targetId: "comment_1",
        value: "1",
      }),
    });

    const res = await POST(req);
    await res.json();

    expect(res.status).toBe(200);
    expect(mockVoteDelete).toHaveBeenCalledWith({ where: { id: "vote_1" } });
    expect(mockCommentUpdate).toHaveBeenCalledWith({
      where: { id: "comment_1" },
      data: { score: 0 },
    });
  });

  it("lehnt ungültiges targetId ab (400)", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/votes", {
      method: "POST",
      body: JSON.stringify({
        targetType: "comment",
        targetId: "",
        value: "1",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
