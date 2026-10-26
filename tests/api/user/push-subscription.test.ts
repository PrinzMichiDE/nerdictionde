import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.hoisted(() => vi.fn());
const mockGetUserPushSubscription = vi.hoisted(() => vi.fn());
const mockSavePushSubscription = vi.hoisted(() => vi.fn());
const mockDeletePushSubscription = vi.hoisted(() => vi.fn());
const mockIsPushConfigured = vi.hoisted(() => vi.fn());
const mockGetVapidPublicKey = vi.hoisted(() => vi.fn());
const mockCheckPushNotificationsEnabled = vi.hoisted(() => vi.fn());
const mockCheckEnhancedNotificationPrefsEnabled = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/push-notifications", () => ({
  getUserPushSubscription: mockGetUserPushSubscription,
  savePushSubscription: mockSavePushSubscription,
  deletePushSubscription: mockDeletePushSubscription,
  isPushConfigured: mockIsPushConfigured,
  getVapidPublicKey: mockGetVapidPublicKey,
}));

vi.mock("@/lib/notification-preferences-schema", () => ({
  checkPushNotificationsEnabled: mockCheckPushNotificationsEnabled,
  checkEnhancedNotificationPrefsEnabled: mockCheckEnhancedNotificationPrefsEnabled,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
}));

import { GET, POST, DELETE } from "@/app/api/user/push-subscription/route";

describe("GET /api/user/push-subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckPushNotificationsEnabled.mockImplementation(() => {});
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
    mockIsPushConfigured.mockReturnValue(true);
    mockGetVapidPublicKey.mockReturnValue("vapid_public_key");
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckPushNotificationsEnabled.mockImplementation(() => {
      throw new Error("Push-Benachrichtigungen sind deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("gibt 503 wenn Push nicht konfiguriert (VAPID Keys fehlen)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockIsPushConfigured.mockReturnValue(false);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("Push nicht konfiguriert (VAPID Keys fehlen)");
  });

  it("gibt Subscription-Status zurück (nicht abonniert)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockGetUserPushSubscription.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscribed).toBe(false);
    expect(body.endpoint).toBeNull();
    expect(body.vapidPublicKey).toBe("vapid_public_key");
  });

  it("gibt Subscription-Status zurück (abonniert)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockGetUserPushSubscription.mockResolvedValue({
      id: "sub_1",
      userId: "user_1",
      endpoint: "https://push.example.com/endpoint",
      p256dh: "p256dh_key",
      auth: "auth_key",
      userAgent: "Mozilla/5.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscribed).toBe(true);
    expect(body.endpoint).toBe("https://push.example.com/endpoint");
    expect(body.vapidPublicKey).toBe("vapid_public_key");
  });
});

describe("POST /api/user/push-subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckPushNotificationsEnabled.mockImplementation(() => {});
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
    mockIsPushConfigured.mockReturnValue(true);
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://push.example.com/endpoint", p256dh: "p256dh", auth: "auth" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckPushNotificationsEnabled.mockImplementation(() => {
      throw new Error("Push-Benachrichtigungen sind deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://push.example.com/endpoint", p256dh: "p256dh", auth: "auth" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("gibt 503 wenn Push nicht konfiguriert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockIsPushConfigured.mockReturnValue(false);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://push.example.com/endpoint", p256dh: "p256dh", auth: "auth" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("Push nicht konfiguriert (VAPID Keys fehlen)");
  });

  it("lehnt ungültigen Endpoint ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "http://invalid.com", p256dh: "p256dh", auth: "auth" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Ungültiger Endpoint");
  });

  it("lehnt fehlendes p256dh ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://push.example.com/endpoint", auth: "auth" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("p256dh key erforderlich");
  });

  it("lehnt fehlendes auth ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://push.example.com/endpoint", p256dh: "p256dh" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("auth key erforderlich");
  });

  it("speichert Subscription erfolgreich", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockSavePushSubscription.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://push.example.com/endpoint", p256dh: "p256dh", auth: "auth" }),
      headers: { "user-agent": "Test Agent" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.subscribed).toBe(true);
    expect(mockSavePushSubscription).toHaveBeenCalledWith(
      "user_1",
      "https://push.example.com/endpoint",
      "p256dh",
      "auth",
      "Test Agent"
    );
  });

  it("gibt 429 bei Rate-Limit-Überschreitung", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockRateLimit.mockResolvedValue({ success: false });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://push.example.com/endpoint", p256dh: "p256dh", auth: "auth" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Zu viele Anfragen");
  });

  it("gibt 500 bei Fehler", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockSavePushSubscription.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://push.example.com/endpoint", p256dh: "p256dh", auth: "auth" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Subscription speichern fehlgeschlagen");
  });
});

describe("DELETE /api/user/push-subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckPushNotificationsEnabled.mockImplementation(() => {});
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
    mockIsPushConfigured.mockReturnValue(true);
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckPushNotificationsEnabled.mockImplementation(() => {
      throw new Error("Push-Benachrichtigungen sind deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("gibt 503 wenn Push nicht konfiguriert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockIsPushConfigured.mockReturnValue(false);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("Push nicht konfiguriert (VAPID Keys fehlen)");
  });

  it("löscht Subscription erfolgreich", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockDeletePushSubscription.mockResolvedValue(true);

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(true);
    expect(mockDeletePushSubscription).toHaveBeenCalledWith("user_1");
  });

  it("gibt 429 bei Rate-Limit-Überschreitung", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockRateLimit.mockResolvedValue({ success: false });

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Zu viele Anfragen");
  });

  it("gibt 500 bei Fehler", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockDeletePushSubscription.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/user/push-subscription", {
      method: "DELETE",
    });

    const res = await DELETE(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Subscription löschen fehlgeschlagen");
  });
});