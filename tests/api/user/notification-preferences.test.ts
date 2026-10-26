import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.hoisted(() => vi.fn());
const mockGetUserPreferences = vi.hoisted(() => vi.fn());
const mockUpdateUserPreferences = vi.hoisted(() => vi.fn());
const mockShouldNotifyUser = vi.hoisted(() => vi.fn());
const mockCreateNotification = vi.hoisted(() => vi.fn());
const mockSendPushToUser = vi.hoisted(() => vi.fn());
const mockPrismaTwitchUserFindUnique = vi.hoisted(() => vi.fn());
const mockCheckEnhancedNotificationPrefsEnabled = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/notification-preferences", () => ({
  getUserPreferences: mockGetUserPreferences,
  updateUserPreferences: mockUpdateUserPreferences,
  shouldNotifyUser: mockShouldNotifyUser,
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: mockCreateNotification,
}));

vi.mock("@/lib/push-notifications", () => ({
  sendPushToUser: mockSendPushToUser,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    twitchUser: {
      findUnique: mockPrismaTwitchUserFindUnique,
    },
  },
}));

vi.mock("@/lib/notification-preferences-schema", () => ({
  checkEnhancedNotificationPrefsEnabled: mockCheckEnhancedNotificationPrefsEnabled,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
}));

import { GET, PATCH } from "@/app/api/user/notification-preferences/route";
import { POST as POST_TEST } from "@/app/api/user/notification-preferences/test/route";

describe("GET /api/user/notification-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {
      throw new Error("Erweiterte Benachrichtigungs-Präferenzen sind deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("gibt Preferences des Users zurück", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockGetUserPreferences.mockResolvedValue([
      {
        type: "follow",
        channels: [
          { channel: "IN_APP", frequency: "IMMEDIATE", enabled: true },
          { channel: "EMAIL", frequency: "IMMEDIATE", enabled: false },
          { channel: "PUSH", frequency: "IMMEDIATE", enabled: false },
        ],
      },
      {
        type: "review_comment",
        channels: [
          { channel: "IN_APP", frequency: "IMMEDIATE", enabled: true },
          { channel: "EMAIL", frequency: "DAILY", enabled: true },
          { channel: "PUSH", frequency: "WEEKLY", enabled: false },
        ],
      },
    ]);

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.preferences).toHaveLength(2);
    expect(body.preferences[0].type).toBe("follow");
    expect(body.preferences[0].channels).toHaveLength(3);
    expect(mockGetUserPreferences).toHaveBeenCalledWith("user_1");
  });
});

describe("PATCH /api/user/notification-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "follow", channel: "IN_APP", enabled: true },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {
      throw new Error("Erweiterte Benachrichtigungs-Präferenzen sind deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "follow", channel: "IN_APP", enabled: true },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("lehnt leeres preferences Array ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({ preferences: [] }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Mindestens eine Preference erforderlich");
  });

  it("lehnt ungültiges type Feld ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "invalid_type", channel: "IN_APP", enabled: true },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Ungültiger NotificationType");
  });

  it("lehnt ungültiges channel Feld ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "follow", channel: "INVALID_CHANNEL", enabled: true },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Ungültiger NotificationChannel");
  });

  it("lehnt ungültiges frequency Feld ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "follow", channel: "IN_APP", frequency: "INVALID_FREQUENCY", enabled: true },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Ungültige NotificationFrequency");
  });

  it("lehnt fehlendes enabled Feld ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "follow", channel: "IN_APP" },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Feld 'enabled' muss boolean sein");
  });

  it("aktualisiert Preferences erfolgreich", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockUpdateUserPreferences.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "follow", channel: "IN_APP", frequency: "IMMEDIATE", enabled: true },
          { type: "follow", channel: "EMAIL", frequency: "DAILY", enabled: true },
          { type: "review_comment", channel: "IN_APP", enabled: false },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockUpdateUserPreferences).toHaveBeenCalledWith("user_1", [
      { type: "follow", channel: "IN_APP", frequency: "IMMEDIATE", enabled: true },
      { type: "follow", channel: "EMAIL", frequency: "DAILY", enabled: true },
      { type: "review_comment", channel: "IN_APP", enabled: false },
    ]);
  });

  it("gibt 429 bei Rate-Limit-Überschreitung", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockRateLimit.mockResolvedValue({ success: false });

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "follow", channel: "IN_APP", enabled: true },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Zu viele Anfragen");
  });

  it("gibt 500 bei Update-Fehler", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockUpdateUserPreferences.mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost/api/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          { type: "follow", channel: "IN_APP", enabled: true },
        ],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Speichern fehlgeschlagen");
  });
});

describe("POST /api/user/notification-preferences/test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {});
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "IN_APP" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Nicht authentifiziert");
  });

  it("gibt 403 wenn Feature deaktiviert", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockCheckEnhancedNotificationPrefsEnabled.mockImplementation(() => {
      throw new Error("Erweiterte Benachrichtigungs-Präferenzen sind deaktiviert");
    });

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "IN_APP" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Feature deaktiviert");
  });

  it("lehnt ungültigen channel ab (400)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "INVALID_CHANNEL" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Ungültiger Channel");
  });

  it("sendet keine Test-Notification wenn shouldNotifyUser false zurückgibt", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockShouldNotifyUser.mockResolvedValue(false);

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "IN_APP", type: "follow" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(false);
    expect(body.reason).toBe("Preference disabled or muted");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("sendet In-App Test-Notification", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockShouldNotifyUser.mockResolvedValue(true);
    mockCreateNotification.mockResolvedValue({ id: "notif_1" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "IN_APP", type: "follow" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(true);
    expect(body.channel).toBe("IN_APP");
    expect(body.type).toBe("follow");
    expect(mockCreateNotification).toHaveBeenCalledWith({
      userId: "user_1",
      type: "follow",
      title: "Test-Benachrichtigung",
      message: "Dies ist eine Test-Benachrichtigung für In-App.",
      data: { test: true },
    });
  });

  it("sendet E-Mail Test-Notification (logged)", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockShouldNotifyUser.mockResolvedValue(true);
    mockPrismaTwitchUserFindUnique.mockResolvedValue({ email: "test@example.com" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "EMAIL", type: "follow" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(true);
    expect(body.channel).toBe("EMAIL");
    expect(mockPrismaTwitchUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user_1" },
      select: { email: true },
    });
  });

  it("sendet Push Test-Notification", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockShouldNotifyUser.mockResolvedValue(true);
    mockSendPushToUser.mockResolvedValue(1);

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "PUSH", type: "follow" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(true);
    expect(body.channel).toBe("PUSH");
    expect(mockSendPushToUser).toHaveBeenCalledWith("user_1", {
      title: "Test-Benachrichtigung",
      body: "Dies ist eine Test-Benachrichtigung für Push.",
      url: "/einstellungen/benachrichtigungen",
    });
  });

  it("gibt 429 bei Rate-Limit-Überschreitung", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockRateLimit.mockResolvedValue({ success: false });

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "IN_APP" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Zu viele Test-Anfragen");
  });

  it("verwendet Default-Type review_published wenn kein type angegeben", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockShouldNotifyUser.mockResolvedValue(true);
    mockCreateNotification.mockResolvedValue({ id: "notif_1" });

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "IN_APP" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("review_published");
  });

  it("gibt 500 bei Fehler im Switch-Statement", async () => {
    mockGetServerSession.mockResolvedValue({ userId: "user_1" });
    mockShouldNotifyUser.mockResolvedValue(true);
    mockCreateNotification.mockRejectedValue(new Error("Create failed"));

    const req = new NextRequest("http://localhost/api/user/notification-preferences/test", {
      method: "POST",
      body: JSON.stringify({ channel: "IN_APP" }),
    });

    const res = await POST_TEST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Test fehlgeschlagen");
  });
});