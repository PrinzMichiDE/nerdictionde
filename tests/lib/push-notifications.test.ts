import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock web-push
const mockWebpush = {
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
  generateVAPIDKeys: vi.fn(() => ({ publicKey: "test-public", privateKey: "test-private" })),
};

vi.mock("web-push", () => ({
  default: mockWebpush,
}));

// Mock Prisma
const mockPrisma = {
  pushSubscription: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));

// Import after mocking
const { isPushConfigured, getVapidPublicKey, generateVapidKeys, getUserPushSubscription, savePushSubscription, deletePushSubscription, sendPushNotification, sendPushToUser, sendPushToUsers, cleanupInvalidSubscriptions } = await import("@/lib/push-notifications");

describe("push-notifications", () => {
  const mockUserId = "clx1234567890abcdef123456";
  const mockSubscription = {
    id: "sub1",
    userId: mockUserId,
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    p256dh: "BEl62iUYg...",
    auth: "authkey123",
    userAgent: "Mozilla/5.0...",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-public-key";
    process.env.VAPID_PRIVATE_KEY = "test-private-key";
    process.env.VAPID_SUBJECT = "mailto:admin@nerdiction.de";
  });

  describe("Configuration", () => {
    it("should return true when VAPID keys are configured", () => {
      expect(isPushConfigured()).toBe(true);
    });

    it("should return false when VAPID keys are missing", () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      expect(isPushConfigured()).toBe(false);
    });

    it("should return public key when configured", () => {
      expect(getVapidPublicKey()).toBe("test-public-key");
    });

    it("should return null when public key not configured", () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      expect(getVapidPublicKey()).toBeNull();
    });

    it("should generate VAPID keys", () => {
      const keys = generateVapidKeys();
      expect(keys).toHaveProperty("publicKey");
      expect(keys).toHaveProperty("privateKey");
    });
  });

  describe("getUserPushSubscription", () => {
    it("should return subscription when exists", async () => {
      mockPrisma.pushSubscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await getUserPushSubscription(mockUserId);
      expect(result).toEqual(mockSubscription);
    });

    it("should return null when no subscription", async () => {
      mockPrisma.pushSubscription.findFirst.mockResolvedValue(null);

      const result = await getUserPushSubscription(mockUserId);
      expect(result).toBeNull();
    });
  });

  describe("savePushSubscription", () => {
    it("should upsert subscription", async () => {
      mockPrisma.pushSubscription.upsert.mockResolvedValue(mockSubscription);

      await savePushSubscription(mockUserId, "https://example.com/push", "p256dh", "auth", "UserAgent");

      expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: "https://example.com/push" },
        update: expect.objectContaining({
          userId: mockUserId,
          p256dh: "p256dh",
          auth: "auth",
          userAgent: "UserAgent",
        }),
        create: expect.objectContaining({
          userId: mockUserId,
          endpoint: "https://example.com/push",
          p256dh: "p256dh",
          auth: "auth",
          userAgent: "UserAgent",
        }),
      });
    });
  });

  describe("deletePushSubscription", () => {
    it("should delete subscription and return true", async () => {
      mockPrisma.pushSubscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrisma.pushSubscription.delete.mockResolvedValue({});

      const result = await deletePushSubscription(mockUserId);
      expect(result).toBe(true);
      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({ where: { id: "sub1" } });
    });

    it("should return false when no subscription exists", async () => {
      mockPrisma.pushSubscription.findFirst.mockResolvedValue(null);

      const result = await deletePushSubscription(mockUserId);
      expect(result).toBe(false);
    });
  });

  describe("sendPushNotification", () => {
    it("should return false when not configured", async () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      const result = await sendPushNotification(
        { endpoint: "https://example.com", p256dh: "key", auth: "auth" },
        { title: "Test", body: "Body" }
      );
      expect(result).toBe(false);
    });

    it("should return true on successful send", async () => {
      mockWebpush.sendNotification.mockResolvedValue(undefined);

      const result = await sendPushNotification(
        { endpoint: "https://example.com", p256dh: "key", auth: "auth" },
        { title: "Test", body: "Body" }
      );
      expect(result).toBe(true);
      expect(mockWebpush.sendNotification).toHaveBeenCalled();
    });

    it("should return false on 404/410 (invalid subscription)", async () => {
      mockWebpush.sendNotification.mockRejectedValue({ statusCode: 410 });

      const result = await sendPushNotification(
        { endpoint: "https://example.com", p256dh: "key", auth: "auth" },
        { title: "Test", body: "Body" }
      );
      expect(result).toBe(false);
    });

    it("should return false on other errors", async () => {
      mockWebpush.sendNotification.mockRejectedValue(new Error("Network error"));

      const result = await sendPushNotification(
        { endpoint: "https://example.com", p256dh: "key", auth: "auth" },
        { title: "Test", body: "Body" }
      );
      expect(result).toBe(false);
    });
  });

  describe("sendPushToUser", () => {
    it("should send to all user subscriptions", async () => {
      mockPrisma.pushSubscription.findMany.mockResolvedValue([
        { endpoint: "https://example.com/1", p256dh: "key1", auth: "auth1" },
        { endpoint: "https://example.com/2", p256dh: "key2", auth: "auth2" },
      ]);
      mockWebpush.sendNotification.mockResolvedValue(undefined);

      const result = await sendPushToUser(mockUserId, { title: "Test", body: "Body" });
      expect(result).toBe(2);
      expect(mockWebpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it("should return 0 when no subscriptions", async () => {
      mockPrisma.pushSubscription.findMany.mockResolvedValue([]);

      const result = await sendPushToUser(mockUserId, { title: "Test", body: "Body" });
      expect(result).toBe(0);
    });

    it("should return 0 when not configured", async () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      const result = await sendPushToUser(mockUserId, { title: "Test", body: "Body" });
      expect(result).toBe(0);
    });
  });

  describe("sendPushToUsers", () => {
    it("should deduplicate by userId and send to each", async () => {
      mockPrisma.pushSubscription.findMany.mockResolvedValue([
        { endpoint: "https://example.com/1", p256dh: "key1", auth: "auth1", userId: "user1" },
        { endpoint: "https://example.com/2", p256dh: "key2", auth: "auth2", userId: "user1" },
        { endpoint: "https://example.com/3", p256dh: "key3", auth: "auth3", userId: "user2" },
      ]);
      mockWebpush.sendNotification.mockResolvedValue(undefined);

      const result = await sendPushToUsers(["user1", "user2"], { title: "Test", body: "Body" });
      expect(result).toBe(2);
    });

    it("should return 0 for empty userIds", async () => {
      const result = await sendPushToUsers([], { title: "Test", body: "Body" });
      expect(result).toBe(0);
    });
  });

  describe("cleanupInvalidSubscriptions", () => {
    it("should delete old subscriptions", async () => {
      mockPrisma.pushSubscription.deleteMany.mockResolvedValue({ count: 5 });

      const result = await cleanupInvalidSubscriptions(["user1", "user2"]);
      expect(result).toBe(5);
      expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: { in: ["user1", "user2"] },
          updatedAt: { lt: expect.any(Date) },
        },
      });
    });

    it("should return 0 for empty userIds", async () => {
      const result = await cleanupInvalidSubscriptions([]);
      expect(result).toBe(0);
    });
  });
});