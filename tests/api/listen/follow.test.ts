import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockRequireTwitchAuth = vi.hoisted(() => vi.fn());
const mockToggleFollow = vi.hoisted(() => vi.fn());
const mockGetFollowStatusBySlug = vi.hoisted(() => vi.fn());
const mockIsEnabled = vi.hoisted(() => vi.fn(() => true));
const mockFollowParamsSchema = vi.hoisted(() => ({
  safeParse: vi.fn((data) => ({ success: true, data: { slug: data?.slug } }))
}));
const mockFollowRequestSchema = vi.hoisted(() => ({
  safeParse: vi.fn((data) => ({ success: true, data: {} }))
}));
const mockFollowToggleResponseSchema = vi.hoisted(() => ({
  parse: vi.fn((data) => data)
}));
const mockFollowStatusSchema = vi.hoisted(() => ({
  parse: vi.fn((data) => data)
}));

vi.mock("@/lib/auth-twitch", () => ({
  requireTwitchAuth: mockRequireTwitchAuth,
}));

vi.mock("@/lib/collections-follow", () => ({
  toggleFollow: mockToggleFollow,
  getFollowStatusBySlug: mockGetFollowStatusBySlug,
}));

vi.mock("@/lib/collections-follow-schema", () => ({
  isCollectionsFollowEnabled: mockIsEnabled,
  followParamsSchema: mockFollowParamsSchema,
  followRequestSchema: mockFollowRequestSchema,
  followToggleResponseSchema: mockFollowToggleResponseSchema,
  followStatusSchema: mockFollowStatusSchema,
}));

import { POST as postFollow, DELETE as deleteFollow, GET as getFollow } from "@/app/api/listen/[slug]/follow/route";

describe("POST/DELETE/GET /api/listen/[slug]/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEnabled.mockReturnValue(true);
    mockFollowParamsSchema.safeParse.mockReturnValue({ success: true, data: { slug: 'test' } });
    mockFollowRequestSchema.safeParse.mockReturnValue({ success: true, data: {} });
    mockFollowToggleResponseSchema.parse.mockImplementation((d) => d);
    mockFollowStatusSchema.parse.mockImplementation((d) => d);
  });

  const createRequest = (method: string, slug: string, body?: unknown) => {
    const url = `http://localhost/api/listen/${slug}/follow`;
    const options: RequestInit = { method };
    if (body) {
      options.body = JSON.stringify(body);
      options.headers = { 'Content-Type': 'application/json' };
    }
    return new NextRequest(url, options as any);
  };

  describe("POST /api/listen/[slug]/follow", () => {
    it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
      mockRequireTwitchAuth.mockResolvedValue(new NextResponse(null, { status: 401 }));

      const req = createRequest('POST', 'test-collection');
      const res = await postFollow(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      expect(res.status).toBe(401);
    });

    it("folgt einer Collection erfolgreich", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockToggleFollow.mockResolvedValue({ followed: true, followerCount: 5 });

      const req = createRequest('POST', 'test-collection');
      const res = await postFollow(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.followed).toBe(true);
      expect(data.followerCount).toBe(5);
      expect(mockToggleFollow).toHaveBeenCalledWith('user_1', 'test-collection');
    });

    it("gibt 404 bei nicht existierender Collection", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockToggleFollow.mockRejectedValue(new Error('Liste nicht gefunden'));

      const req = createRequest('POST', 'non-existent');
      const res = await postFollow(req, { params: Promise.resolve({ slug: 'non-existent' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Liste nicht gefunden');
    });

    it("gibt 403 bei nicht öffentlicher Collection", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockToggleFollow.mockRejectedValue(new Error('Liste ist nicht öffentlich'));

      const req = createRequest('POST', 'private-collection');
      const res = await postFollow(req, { params: Promise.resolve({ slug: 'private-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Liste ist nicht öffentlich');
    });

    it("gibt 400 bei eigener Collection", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockToggleFollow.mockRejectedValue(new Error('Eigene Liste kann nicht gefolgt werden'));

      const req = createRequest('POST', 'my-collection');
      const res = await postFollow(req, { params: Promise.resolve({ slug: 'my-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Eigene Liste kann nicht gefolgt werden');
    });

    it("gibt 404 wenn Feature deaktiviert", async () => {
      mockIsEnabled.mockReturnValue(false);
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });

      const req = createRequest('POST', 'test-collection');
      const res = await postFollow(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Feature nicht verfügbar');
    });
  });

  describe("DELETE /api/listen/[slug]/follow", () => {
    it("entfolgt einer Collection erfolgreich", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetFollowStatusBySlug.mockResolvedValue({ followed: true, followerCount: 5 });
      mockToggleFollow.mockResolvedValue({ followed: false, followerCount: 4 });

      const req = createRequest('DELETE', 'test-collection');
      const res = await deleteFollow(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.followed).toBe(false);
      expect(data.followerCount).toBe(4);
      expect(mockToggleFollow).toHaveBeenCalledWith('user_1', 'test-collection');
    });

    it("gibt 400 wenn nicht gefolgt", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetFollowStatusBySlug.mockResolvedValue({ followed: false, followerCount: 5 });

      const req = createRequest('DELETE', 'test-collection');
      const res = await deleteFollow(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Liste wird nicht gefolgt');
    });

    it("gibt 404 bei nicht existierender Collection", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetFollowStatusBySlug.mockResolvedValue(null);

      const req = createRequest('DELETE', 'non-existent');
      const res = await deleteFollow(req, { params: Promise.resolve({ slug: 'non-existent' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Liste nicht gefunden');
    });
  });

  describe("GET /api/listen/[slug]/follow", () => {
    it("gibt Follow-Status für authentifizierten Nutzer zurück", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetFollowStatusBySlug.mockResolvedValue({ followed: true, followerCount: 10 });

      const req = new NextRequest(`http://localhost/api/listen/test-collection/follow`);
      const res = await getFollow(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.followed).toBe(true);
      expect(data.followerCount).toBe(10);
    });

    it("gibt Follow-Status für nicht authentifizierten Nutzer zurück", async () => {
      mockRequireTwitchAuth.mockResolvedValue(new NextResponse(null, { status: 401 }));
      mockGetFollowStatusBySlug.mockResolvedValue({ followed: false, followerCount: 10 });

      const req = new NextRequest(`http://localhost/api/listen/test-collection/follow`);
      const res = await getFollow(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.followed).toBe(false);
      expect(data.followerCount).toBe(10);
    });

    it("gibt 404 bei nicht existierender Collection", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockGetFollowStatusBySlug.mockResolvedValue(null);

      const req = new NextRequest(`http://localhost/api/listen/non-existent/follow`);
      const res = await getFollow(req, { params: Promise.resolve({ slug: 'non-existent' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Liste nicht gefunden');
    });

    it("gibt 404 wenn Feature deaktiviert", async () => {
      mockIsEnabled.mockReturnValue(false);
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });

      const req = new NextRequest(`http://localhost/api/listen/test-collection/follow`);
      const res = await getFollow(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Feature nicht verfügbar');
    });
  });
});