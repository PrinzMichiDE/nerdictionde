import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.hoisted(() => vi.fn());
const mockGetUserMutes = vi.hoisted(() => vi.fn());
const mockMuteTarget = vi.hoisted(() => vi.fn());
const mockUnmuteTarget = vi.hoisted(() => vi.fn());
const mockResolveMuteTargets = vi.hoisted(() => vi.fn());
const mockCheckNotificationMutesEnabled = vi.hoisted(() => vi.fn());
const mockCheckEnhancedNotificationPrefsEnabled = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/notification-mutes", () => ({
  getUserMutes: mockGetUserMutes,
  muteTarget: mockMuteTarget,
  unmuteTarget: mockUnmuteTarget,
  resolveMuteTargets: mockResolveMuteTargets,
}));

vi.mock("@/lib/notification-preferences-schema", () => ({
  checkNotificationMutesEnabled: mockCheckNotificationMutesEnabled,
  checkEnhancedNotificationPrefsEnabled: mockCheckEnhancedNotificationPrefsEnabled,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
}));

import { GET, POST } from "@/app/api/user/notification-mutes/route";
import { DELETE as DELETE_MUTE } from "@/app/api/user/notification-mutes/[id]/route";

describe("GET /api/user/notification-mutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckNotificationMutesEnabled.mockImplementation(() => {});
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckNotificationMutesEnabled.mockImplementation(() => {
      throw new Error("Benachrichtigungs-Stummschaltung ist deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("gibt Mutes des Users mit resolved Targets zurück", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockGetUserMutes.mockResolvedValue([
      { id: "mute_1", targetType: "REVIEW", targetId: "review_1", createdAt: new Date() },
      { id: "mute_2", targetType: "USER", targetId: "user_2", createdAt: new Date() },
    ]);
    mockResolveMuteTargets.mockResolvedValue([
      { id: "mute_1", targetType: "REVIEW", targetId: "review_1", createdAt: new Date(), targetTitle: "Test Review", targetSlug: "test-review", targetUrl: "/reviews/test-review" },
      { id: "mute_2", targetType: "USER", targetId: "user_2", createdAt: new Date(), targetTitle: "Test User", targetSlug: "testuser", targetUrl: "/u/testuser" },
    ]);

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mutes).toHaveLength(2);
    expect(body.mutes[0].targetTitle).toBe("Test Review");
    expect(body.mutes[1].targetTitle).toBe("Test User");
    expect(mockGetUserMutes).toHaveBeenCalledWith("user_1");
    expect(mockResolveMuteTargets).toHaveBeenCalled();
  });
});

describe("POST /api/user/notification-mutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckNotificationMutesEnabled.mockImplementation(() => {});
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "POST",
      body: JSON.stringify({ targetType: "REVIEW", targetId: "review_1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckNotificationMutesEnabled.mockImplementation(() => {
      throw new Error("Benachrichtigungs-Stummschaltung ist deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "POST",
      body: JSON.stringify({ targetType: "REVIEW", targetId: "review_1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("lehnt ungültiges targetType ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "POST",
      body: JSON.stringify({ targetType: "INVALID", targetId: "review_1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Ungültiger MuteTargetType");
  });

  it("lehnt fehlendes targetId ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "POST",
      body: JSON.stringify({ targetType: "REVIEW" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("targetId ist erforderlich");
  });

  it("erstellt Mute erfolgreich", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockMuteTarget.mockResolvedValue({ muted: true, muteId: "mute_1" });

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "POST",
      body: JSON.stringify({ targetType: "REVIEW", targetId: "review_1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.muteId).toBe("mute_1");
    expect(body.muted).toBe(true);
    expect(mockMuteTarget).toHaveBeenCalledWith("user_1", "REVIEW", "review_1");
  });

  it("gibt 429 bei Rate-Limit-Überschreitung", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockRateLimit.mockResolvedValue({ success: false });

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "POST",
      body: JSON.stringify({ targetType: "REVIEW", targetId: "review_1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Zu viele Anfragen");
  });

  it("gibt 500 bei Fehler", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockMuteTarget.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/user/notification-mutes", {
      method: "POST",
      body: JSON.stringify({ targetType: "REVIEW", targetId: "review_1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Stummschaltung fehlgeschlagen");
  });
});

describe("DELETE /api/user/notification-mutes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckNotificationMutesEnabled.mockImplementation(() => {});
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/notification-mutes/mute_1", {
      method: "DELETE",
    });

    const res = await DELETE_MUTE(req, { params: Promise.resolve({ id: "mute_1" }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckNotificationMutesEnabled.mockImplementation(() => {
      throw new Error("Benachrichtigungs-Stummschaltung ist deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/notification-mutes/mute_1", {
      method: "DELETE",
    });

    const res = await DELETE_MUTE(req, { params: Promise.resolve({ id: "mute_1" }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("lehnt fehlende ID ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-mutes/", {
      method: "DELETE",
    });

    const res = await DELETE_MUTE(req, { params: Promise.resolve({ id: "" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Mute ID erforderlich");
  });

  it("entfernt Mute erfolgreich", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockUnmuteTarget.mockResolvedValue({ unmuted: true });

    const req = new NextRequest("http://localhost/api/user/notification-mutes/mute_1", {
      method: "DELETE",
    });

    const res = await DELETE_MUTE(req, { params: Promise.resolve({ id: "mute_1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.unmuted).toBe(true);
    expect(mockUnmuteTarget).toHaveBeenCalledWith("user_1", "mute_1");
  });

  it("gibt 404 wenn Mute nicht gefunden oder keine Berechtigung", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockUnmuteTarget.mockResolvedValue({ unmuted: false });

    const req = new NextRequest("http://localhost/api/user/notification-mutes/mute_1", {
      method: "DELETE",
    });

    const res = await DELETE_MUTE(req, { params: Promise.resolve({ id: "mute_1" }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Mute nicht gefunden oder keine Berechtigung");
  });

  it("gibt 429 bei Rate-Limit-Überschreitung", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockRateLimit.mockResolvedValue({ success: false });

    const req = new NextRequest("http://localhost/api/user/notification-mutes/mute_1", {
      method: "DELETE",
    });

    const res = await DELETE_MUTE(req, { params: Promise.resolve({ id: "mute_1" }) });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Zu viele Anfragen");
  });

  it("gibt 500 bei Fehler", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockUnmuteTarget.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/user/notification-mutes/mute_1", {
      method: "DELETE",
    });

    const res = await DELETE_MUTE(req, { params: Promise.resolve({ id: "mute_1" }) });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Entstummen fehlgeschlagen");
  });
});