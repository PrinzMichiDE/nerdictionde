import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockToggleFollow = vi.hoisted(() => vi.fn());
const mockIsFollowing = vi.hoisted(() => vi.fn());
const mockRequireTwitchAuth = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-twitch", () => ({
  requireTwitchAuth: mockRequireTwitchAuth,
}));

vi.mock("@/lib/follow", () => ({
  toggleFollow: mockToggleFollow,
  isFollowing: mockIsFollowing,
}));

import { POST, GET } from "@/app/api/follow/route";

describe("POST /api/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockRequireTwitchAuth.mockResolvedValue(
      new NextResponse(null, { status: 401 })
    );

    const req = new NextRequest("http://localhost/api/follow", {
      method: "POST",
      body: JSON.stringify({
        followingId: "user_2",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("folgt einem Nutzer", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockToggleFollow.mockResolvedValue({
      following: true,
      followerCount: 5,
      followingCount: 3,
    });

    const req = new NextRequest("http://localhost/api/follow", {
      method: "POST",
      body: JSON.stringify({
        followingId: "user_2",
      }),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.following).toBe(true);
    expect(mockToggleFollow).toHaveBeenCalledWith("user_1", "user_2");
  });

  it("entfolgt einem Nutzer", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockToggleFollow.mockResolvedValue({
      following: false,
      followerCount: 4,
      followingCount: 2,
    });

    const req = new NextRequest("http://localhost/api/follow", {
      method: "POST",
      body: JSON.stringify({
        followingId: "user_2",
      }),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.following).toBe(false);
    expect(mockToggleFollow).toHaveBeenCalledWith("user_1", "user_2");
  });

  it("verhindert Selbst-Follow (400)", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/follow", {
      method: "POST",
      body: JSON.stringify({
        followingId: "user_1",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockRequireTwitchAuth.mockResolvedValue(
      new NextResponse(null, { status: 401 })
    );

    const req = new NextRequest("http://localhost/api/follow?followingId=user_2", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("prüft Follow-Status", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });
    mockIsFollowing.mockResolvedValue(true);

    const req = new NextRequest("http://localhost/api/follow?followingId=user_2", {
      method: "GET",
    });

    const res = await GET(req);
    const result = await res.json();

    expect(res.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.following).toBe(true);
    expect(mockIsFollowing).toHaveBeenCalledWith("user_1", "user_2");
  });

  it("gibt 400 ohne followingId", async () => {
    mockRequireTwitchAuth.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/follow", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});