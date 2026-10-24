import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockRequireTwitchAuth = vi.hoisted(() => vi.fn());
const mockGetFollowedCollections = vi.hoisted(() => vi.fn());
const mockIsEnabled = vi.hoisted(() => vi.fn(() => true));
const mockFollowedCollectionsQuerySchema = vi.hoisted(() => ({
  safeParse: vi.fn((data) => ({
    success: true,
    data: { cursor: data?.cursor, limit: data?.limit ?? 20 }
  }))
}));

vi.mock("@/lib/auth-twitch", () => ({
  requireTwitchAuth: mockRequireTwitchAuth,
}));

vi.mock("@/lib/collections-follow", () => ({
  getFollowedCollections: mockGetFollowedCollections,
}));

vi.mock("@/lib/collections-follow-schema", () => ({
  isCollectionsFollowEnabled: mockIsEnabled,
  followedCollectionsQuerySchema: mockFollowedCollectionsQuerySchema,
}));

import { GET } from "@/app/api/me/listen/followed/route";

describe("GET /api/me/listen/followed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEnabled.mockReturnValue(true);
    mockFollowedCollectionsQuerySchema.safeParse.mockImplementation((data) => ({
      success: true,
      data: { cursor: data?.cursor, limit: data?.limit ?? 20 }
    }));
  });

  it("gibt gefolgte Listen zurück", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
    mockGetFollowedCollections.mockResolvedValue({
      collections: [
        {
          id: 'coll_1',
          slug: 'best-games',
          title: 'Best Games 2024',
          description: 'Top games',
          coverImage: null,
          owner: { id: 'owner_1', username: 'curator1', displayName: 'Curator One', profileImageUrl: null },
          itemCount: 10,
          followerCount: 50,
          followedAt: new Date('2024-01-15'),
        },
        {
          id: 'coll_2',
          slug: 'hidden-gems',
          title: 'Hidden Gems',
          description: 'Underrated games',
          coverImage: null,
          owner: { id: 'owner_2', username: 'curator2', displayName: 'Curator Two', profileImageUrl: null },
          itemCount: 5,
          followerCount: 20,
          followedAt: new Date('2024-01-10'),
        },
      ],
      nextCursor: null,
    });

    const req = new NextRequest("http://localhost/api/me/listen/followed");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.collections).toHaveLength(2);
    expect(data.collections[0].title).toBe('Best Games 2024');
    expect(data.collections[0].owner.username).toBe('curator1');
    expect(data.nextCursor).toBeNull();
    expect(mockGetFollowedCollections).toHaveBeenCalledWith('user_1', undefined, 20);
  });

  it("unterstützt Cursor-Pagination", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
    mockGetFollowedCollections.mockResolvedValue({
      collections: [
        { id: 'coll_3', slug: 'c', title: 'C', description: null, coverImage: null, owner: { id: 'o', username: 'u', displayName: 'U', profileImageUrl: null }, itemCount: 1, followerCount: 1, followedAt: new Date() },
        { id: 'coll_2', slug: 'b', title: 'B', description: null, coverImage: null, owner: { id: 'o', username: 'u', displayName: 'U', profileImageUrl: null }, itemCount: 1, followerCount: 1, followedAt: new Date() },
      ],
      nextCursor: 'coll_1',
    });

    const req = new NextRequest("http://localhost/api/me/listen/followed?cursor=coll_2&limit=2");
    await GET(req);

    expect(mockGetFollowedCollections).toHaveBeenCalledWith('user_1', 'coll_2', 2);
  });

  it("validiert limit Parameter (max 50)", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
    mockFollowedCollectionsQuerySchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ formErrors: [], fieldErrors: { limit: ['Too large'] } }) }
    });

    const req = new NextRequest("http://localhost/api/me/listen/followed?limit=100");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Ungültige Query-Parameter');
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockRequireTwitchAuth.mockResolvedValue(new NextResponse(null, { status: 401 }));

    const req = new NextRequest("http://localhost/api/me/listen/followed");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("gibt 404 wenn Feature deaktiviert", async () => {
    mockIsEnabled.mockReturnValue(false);
    mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest("http://localhost/api/me/listen/followed");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Feature nicht verfügbar');
  });

  it("gibt 500 bei internem Fehler", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
    mockGetFollowedCollections.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest("http://localhost/api/me/listen/followed");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Interner Serverfehler');
  });
});