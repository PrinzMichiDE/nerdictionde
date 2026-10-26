import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockRequireTwitchAuth = vi.hoisted(() => vi.fn());
const mockGetPublicCollections = vi.hoisted(() => vi.fn());
const mockCreateCollection = vi.hoisted(() => vi.fn());
const mockGenerateUniqueSlug = vi.hoisted(() => vi.fn());
const mockPrismaReviewFindMany = vi.hoisted(() => vi.fn());
const mockPrismaReviewCollectionCreate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-twitch", () => ({
  requireTwitchAuth: mockRequireTwitchAuth,
}));

vi.mock("@/lib/collections", () => ({
  getPublicCollections: mockGetPublicCollections,
  generateUniqueSlug: mockGenerateUniqueSlug,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    review: { findMany: mockPrismaReviewFindMany },
    reviewCollection: { create: mockPrismaReviewCollectionCreate },
  },
}));

import { GET as getListen, POST as postListen } from "@/app/api/listen/route";

describe("GET /api/listen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gibt öffentliche Listen zurück", async () => {
    mockGetPublicCollections.mockResolvedValue({
      collections: [
        {
          id: "coll_1",
          slug: "test-1",
          title: "Test 1",
          description: null,
          isPublic: true,
          itemCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "u1", username: "user1", displayName: "User 1", profileImageUrl: null },
        },
      ],
      nextCursor: null,
    });

    const req = new NextRequest("http://localhost/api/listen");
    const res = await getListen(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.collections).toHaveLength(1);
    expect(data.nextCursor).toBeNull();
  });

  it("verarbeitet Query-Parameter", async () => {
    mockGetPublicCollections.mockResolvedValue({ collections: [], nextCursor: null });

    const req = new NextRequest("http://localhost/api/listen?q=RPG&sort=itemCount&limit=10&cursor=clx1234567890abcdef12");
    await getListen(req);

    expect(mockGetPublicCollections).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "RPG",
        sort: "itemCount",
        limit: 10,
        cursor: "clx1234567890abcdef12",
      })
    );
  });

  it("gibt 400 bei ungültigen Query-Parametern", async () => {
    const req = new NextRequest("http://localhost/api/listen?sort=invalid");
    const res = await getListen(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Ungültige Query-Parameter");
  });

  it("gibt 500 bei internem Fehler", async () => {
    mockGetPublicCollections.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/listen");
    const res = await getListen(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Interner Serverfehler");
  });
});

describe("POST /api/listen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockRequireTwitchAuth.mockResolvedValue(new NextResponse(null, { status: 401 }));

    const req = new NextRequest("http://localhost/api/listen", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
    });

    const res = await postListen(req);
    expect(res.status).toBe(401);
  });

  it("erstellt Liste mit Validierung", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockGenerateUniqueSlug.mockResolvedValue("test-liste");
    mockPrismaReviewFindMany.mockResolvedValue([
      { id: "clx1234567890abcdef12" },
      { id: "clx1234567890abcdef13" },
    ]);
    mockPrismaReviewCollectionCreate.mockResolvedValue({
      id: "coll_1",
      slug: "test-liste",
      title: "Test Liste",
      description: "Desc",
      isPublic: true,
      itemCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: "user_1", username: "user1", displayName: "User 1", profileImageUrl: null },
    });

    const req = new NextRequest("http://localhost/api/listen", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Liste",
        description: "Desc",
        isPublic: true,
        reviewIds: ["clx1234567890abcdef12", "clx1234567890abcdef13"],
      }),
    });

    const res = await postListen(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.title).toBe("Test Liste");
    expect(data.itemCount).toBe(2);
    expect(mockGenerateUniqueSlug).toHaveBeenCalledWith("Test Liste");
    expect(mockPrismaReviewFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["clx1234567890abcdef12", "clx1234567890abcdef13"] }, status: "published" },
      select: { id: true },
    });
  });

  it("erstellt Liste ohne initiale Reviews", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockGenerateUniqueSlug.mockResolvedValue("empty-list");
    mockPrismaReviewCollectionCreate.mockResolvedValue({
      id: "coll_1",
      slug: "empty-list",
      title: "Empty List",
      description: null,
      isPublic: true,
      itemCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: "user_1", username: "user1", displayName: "User 1", profileImageUrl: null },
    });

    const req = new NextRequest("http://localhost/api/listen", {
      method: "POST",
      body: JSON.stringify({ title: "Empty List" }),
    });

    const res = await postListen(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.itemCount).toBe(0);
  });

  it("lehnt ungültige Eingabe ab (400)", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/listen", {
      method: "POST",
      body: JSON.stringify({ title: "Ab" }), // too short
    });

    const res = await postListen(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Validierungsfehler");
  });

  it("lehnt nicht-veröffentlichte Reviews ab (400)", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockGenerateUniqueSlug.mockResolvedValue("test");
    mockPrismaReviewFindMany.mockResolvedValue([{ id: "clx1234567890abcdef12" }]); // only 1 of 2 found

    const req = new NextRequest("http://localhost/api/listen", {
      method: "POST",
      body: JSON.stringify({
        title: "Test",
        reviewIds: ["clx1234567890abcdef12", "clx1234567890abcdef13"],
      }),
    });

    const res = await postListen(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("nicht veröffentlicht");
  });

  it("gibt 500 bei internem Fehler", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockGenerateUniqueSlug.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/listen", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
    });

    const res = await postListen(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Interner Serverfehler");
  });
});