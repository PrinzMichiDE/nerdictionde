import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockRequireTwitchAuth = vi.hoisted(() => vi.fn());
const mockGetMyCollections = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-twitch", () => ({
  requireTwitchAuth: mockRequireTwitchAuth,
}));

vi.mock("@/lib/collections", () => ({
  getMyCollections: mockGetMyCollections,
}));

import { GET } from "@/app/api/me/listen/route";

describe("GET /api/me/listen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gibt eigene Listen zurück (inkl. private)", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockGetMyCollections.mockResolvedValue({
      collections: [
        {
          id: "coll_1",
          slug: "public-1",
          title: "Public List",
          isPublic: true,
          itemCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user_1", username: "user1", displayName: "User 1", profileImageUrl: null },
        },
        {
          id: "coll_2",
          slug: "private-1",
          title: "Private List",
          isPublic: false,
          itemCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user_1", username: "user1", displayName: "User 1", profileImageUrl: null },
        },
      ],
      nextCursor: null,
    });

    const req = new NextRequest("http://localhost/api/me/listen");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.collections).toHaveLength(2);
    expect(data.collections[0].isPublic).toBe(true);
    expect(data.collections[1].isPublic).toBe(false);
    expect(data.nextCursor).toBeNull();
    expect(mockGetMyCollections).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_1", limit: 20 })
    );
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockRequireTwitchAuth.mockResolvedValue(new NextResponse(null, { status: 401 }));

    const req = new NextRequest("http://localhost/api/me/listen");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("unterstützt Cursor-Pagination", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockGetMyCollections.mockResolvedValue({
      collections: [
        { id: "clx1234567890abcdef13", slug: "c", title: "C", isPublic: true, itemCount: 1, createdAt: new Date(), updatedAt: new Date(), owner: { id: "u1", username: "u1", displayName: "U1", profileImageUrl: null } },
        { id: "clx1234567890abcdef12", slug: "b", title: "B", isPublic: true, itemCount: 1, createdAt: new Date(), updatedAt: new Date(), owner: { id: "u1", username: "u1", displayName: "U1", profileImageUrl: null } },
      ],
      nextCursor: "clx1234567890abcdef11",
    });

    const req = new NextRequest("http://localhost/api/me/listen?cursor=clx1234567890abcdef12&limit=2");
    await GET(req);

    expect(mockGetMyCollections).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_1", cursor: "clx1234567890abcdef12", limit: 2 })
    );
  });

  it("gibt 400 bei ungültigen Query-Parametern", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/me/listen?limit=0");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Ungültige Query-Parameter");
  });

  it("gibt 500 bei internem Fehler", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockGetMyCollections.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/me/listen");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Interner Serverfehler");
  });
});