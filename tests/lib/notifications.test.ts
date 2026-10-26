import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaNotificationFindMany = vi.hoisted(() => vi.fn());
const mockPrismaNotificationCount = vi.hoisted(() => vi.fn());
const mockPrismaNotificationUpdateMany = vi.hoisted(() => vi.fn());
const mockPrismaNotificationCreate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    notification: {
      findMany: mockPrismaNotificationFindMany,
      count: mockPrismaNotificationCount,
      updateMany: mockPrismaNotificationUpdateMany,
      create: mockPrismaNotificationCreate,
    },
  },
}));

import { getNotifications, markNotificationsAsRead, markAllNotificationsAsRead, createFollowNotification, getUnreadNotificationCount } from "@/lib/notifications";

describe("lib/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("gibt paginierte Benachrichtigungen zurück", async () => {
      mockPrismaNotificationFindMany.mockResolvedValue([
        {
          id: "notif_1",
          type: "follow",
          title: "Neuer Follower",
          message: "Test User (@testuser) folgt dir jetzt.",
          data: { followerId: "user_1", followerUsername: "testuser", followerDisplayName: "Test User" },
          readAt: null,
          createdAt: new Date(),
        },
        {
          id: "notif_2",
          type: "follow",
          title: "Neuer Follower",
          message: "Another User (@another) folgt dir jetzt.",
          data: { followerId: "user_2", followerUsername: "another", followerDisplayName: "Another User" },
          readAt: new Date(),
          createdAt: new Date(Date.now() - 3600000),
        },
      ]);
      mockPrismaNotificationCount.mockResolvedValue(5);

      const result = await getNotifications("user_1", { limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.unreadCount).toBe(5);
      expect(result.nextCursor).toBeNull();
    });

    it("filtert nur ungelesene Benachrichtigungen", async () => {
      mockPrismaNotificationFindMany.mockResolvedValue([
        {
          id: "notif_1",
          type: "follow",
          title: "Neuer Follower",
          message: "Test User (@testuser) folgt dir jetzt.",
          data: { followerId: "user_1", followerUsername: "testuser", followerDisplayName: "Test User" },
          readAt: null,
          createdAt: new Date(),
        },
      ]);
      mockPrismaNotificationCount.mockResolvedValue(1);

      const result = await getNotifications("user_1", { unreadOnly: true, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
      expect(mockPrismaNotificationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user_1",
            readAt: null,
          }),
        })
      );
    });

    it("unterstützt Cursor-Pagination", async () => {
      mockPrismaNotificationFindMany.mockResolvedValue([]);
      mockPrismaNotificationCount.mockResolvedValue(0);

      const result = await getNotifications("user_1", { cursor: "notif_1", limit: 10 });

      expect(result.items).toHaveLength(0);
      expect(mockPrismaNotificationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { lt: "notif_1" },
          }),
          take: 11,
        })
      );
    });
  });

  describe("markNotificationsAsRead", () => {
    it("markiert Benachrichtigungen als gelesen", async () => {
      mockPrismaNotificationUpdateMany.mockResolvedValue({ count: 3 });

      const result = await markNotificationsAsRead("user_1", ["notif_1", "notif_2", "notif_3"]);

      expect(result).toBe(3);
      expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["notif_1", "notif_2", "notif_3"] },
          userId: "user_1",
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe("markAllNotificationsAsRead", () => {
    it("markiert alle ungelesenen Benachrichtigungen als gelesen", async () => {
      mockPrismaNotificationUpdateMany.mockResolvedValue({ count: 10 });

      const result = await markAllNotificationsAsRead("user_1");

      expect(result).toBe(10);
      expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith({
        where: {
          userId: "user_1",
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe("createFollowNotification", () => {
    it("erstellt Follow-Notification", async () => {
      mockPrismaNotificationCreate.mockResolvedValue({
        id: "notif_1",
        type: "follow",
        title: "Neuer Follower",
        message: "Test User (@testuser) folgt dir jetzt.",
      });

      const result = await createFollowNotification(
        "followed_user_id",
        "follower_id",
        "testuser",
        "Test User"
      );

      expect(result.id).toBe("notif_1");
      expect(mockPrismaNotificationCreate).toHaveBeenCalledWith({
        data: {
          userId: "followed_user_id",
          type: "follow",
          title: "Neuer Follower",
          message: "Test User (@testuser) folgt dir jetzt.",
          data: {
            followerId: "follower_id",
            followerUsername: "testuser",
            followerDisplayName: "Test User",
          },
        },
      });
    });
  });

  describe("getUnreadNotificationCount", () => {
    it("gibt Anzahl ungelesener Benachrichtigungen zurück", async () => {
      mockPrismaNotificationCount.mockResolvedValue(7);

      const result = await getUnreadNotificationCount("user_1");
      expect(result).toBe(7);
    });
  });
});