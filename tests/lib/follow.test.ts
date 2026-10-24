import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaFollowUpsert = vi.hoisted(() => vi.fn());
const mockPrismaFollowDelete = vi.hoisted(() => vi.fn());
const mockPrismaFollowFindUnique = vi.hoisted(() => vi.fn());
const mockPrismaFollowCount = vi.hoisted(() => vi.fn());
const mockPrismaFollowFindMany = vi.hoisted(() => vi.fn());
const mockPrismaNotificationCreate = vi.hoisted(() => vi.fn());
const mockPrismaTwitchUserFindUnique = vi.hoisted(() => vi.fn());
const mockPrismaUserProfileUpdate = vi.hoisted(() => vi.fn());
const mockPrismaTransaction = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    follow: {
      upsert: mockPrismaFollowUpsert,
      delete: mockPrismaFollowDelete,
      findUnique: mockPrismaFollowFindUnique,
      count: mockPrismaFollowCount,
      findMany: mockPrismaFollowFindMany,
    },
    notification: {
      create: mockPrismaNotificationCreate,
    },
    twitchUser: {
      findUnique: mockPrismaTwitchUserFindUnique,
    },
    userProfile: {
      update: mockPrismaUserProfileUpdate,
    },
    $transaction: mockPrismaTransaction,
  },
}));

import { followUser, unfollowUser, isFollowing, getFollowerCount, getFollowingCount, getFollowers, getFollowing } from "@/lib/follow";

describe("lib/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("followUser", () => {
    it("wirft Fehler bei Selbst-Follow", async () => {
      await expect(followUser("user_1", "user_1")).rejects.toThrow("Cannot follow yourself");
    });

    it("wirft Fehler wenn Zielnutzer nicht existiert", async () => {
      mockPrismaTwitchUserFindUnique.mockResolvedValue(null);

      await expect(followUser("user_1", "user_2")).rejects.toThrow("User not found");
    });

    it("erstellt Follow und Notification in Transaktion", async () => {
      mockPrismaTwitchUserFindUnique.mockResolvedValue({
        id: "user_2",
        username: "testuser",
        displayName: "Test User",
      });
      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          follow: { upsert: mockPrismaFollowUpsert },
          notification: { create: mockPrismaNotificationCreate },
          userProfile: { update: mockPrismaUserProfileUpdate },
        };
        mockPrismaFollowUpsert.mockResolvedValue({
          id: "follow_1",
          followerId: "user_1",
          followingId: "user_2",
        });
        mockPrismaNotificationCreate.mockResolvedValue({ id: "notif_1" });
        mockPrismaUserProfileUpdate.mockResolvedValue({});
        return callback(mockTx);
      });
      mockPrismaFollowCount.mockResolvedValueOnce(5).mockResolvedValueOnce(3);

      const result = await followUser("user_1", "user_2");

      expect(result.following).toBe(true);
      expect(result.followerCount).toBe(5);
      expect(result.followingCount).toBe(3);
      expect(mockPrismaTransaction).toHaveBeenCalled();
      expect(mockPrismaFollowUpsert).toHaveBeenCalled();
      expect(mockPrismaNotificationCreate).toHaveBeenCalled();
      expect(mockPrismaUserProfileUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe("unfollowUser", () => {
    it("wirft Fehler bei Selbst-Unfollow", async () => {
      await expect(unfollowUser("user_1", "user_1")).rejects.toThrow("Cannot unfollow yourself");
    });

    it("wirft Fehler wenn Follow nicht existiert", async () => {
      mockPrismaFollowFindUnique.mockResolvedValue(null);

      await expect(unfollowUser("user_1", "user_2")).rejects.toThrow("Not following this user");
    });

    it("löscht Follow und aktualisiert Counts", async () => {
      mockPrismaFollowFindUnique.mockResolvedValue({
        id: "follow_1",
        followerId: "user_1",
        followingId: "user_2",
      });
      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          follow: { delete: mockPrismaFollowDelete },
          userProfile: { update: mockPrismaUserProfileUpdate },
        };
        mockPrismaFollowDelete.mockResolvedValue({});
        mockPrismaUserProfileUpdate.mockResolvedValue({});
        return callback(mockTx);
      });
      mockPrismaFollowCount.mockResolvedValueOnce(4).mockResolvedValueOnce(2);

      const result = await unfollowUser("user_1", "user_2");

      expect(result.following).toBe(false);
      expect(result.followerCount).toBe(4);
      expect(result.followingCount).toBe(2);
      expect(mockPrismaFollowDelete).toHaveBeenCalled();
      expect(mockPrismaUserProfileUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe("isFollowing", () => {
    it("gibt false bei Selbst-Check", async () => {
      const result = await isFollowing("user_1", "user_1");
      expect(result).toBe(false);
    });

    it("gibt true wenn Follow existiert", async () => {
      mockPrismaFollowFindUnique.mockResolvedValue({ id: "follow_1" });

      const result = await isFollowing("user_1", "user_2");
      expect(result).toBe(true);
    });

    it("gibt false wenn Follow nicht existiert", async () => {
      mockPrismaFollowFindUnique.mockResolvedValue(null);

      const result = await isFollowing("user_1", "user_2");
      expect(result).toBe(false);
    });
  });

  describe("getFollowerCount", () => {
    it("gibt Anzahl Follower zurück", async () => {
      mockPrismaFollowCount.mockResolvedValue(42);

      const result = await getFollowerCount("user_1");
      expect(result).toBe(42);
    });
  });

  describe("getFollowingCount", () => {
    it("gibt Anzahl Following zurück", async () => {
      mockPrismaFollowCount.mockResolvedValue(15);

      const result = await getFollowingCount("user_1");
      expect(result).toBe(15);
    });
  });

  describe("getFollowers", () => {
    it("gibt paginierte Follower-Liste zurück", async () => {
      mockPrismaFollowFindMany.mockResolvedValue([
        {
          id: "follow_1",
          follower: {
            id: "follower_1",
            username: "follower1",
            displayName: "Follower One",
            profileImageUrl: null,
            userProfile: { followerCount: 10, followingCount: 5 },
          },
        },
        {
          id: "follow_2",
          follower: {
            id: "follower_2",
            username: "follower2",
            displayName: "Follower Two",
            profileImageUrl: null,
            userProfile: { followerCount: 5, followingCount: 3 },
          },
        },
      ]);

      const result = await getFollowers("user_1", undefined, 20);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(mockPrismaFollowFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { followingId: "user_1" },
          take: 21,
        })
      );
    });
  });

  describe("getFollowing", () => {
    it("gibt paginierte Following-Liste zurück", async () => {
      mockPrismaFollowFindMany.mockResolvedValue([
        {
          id: "follow_1",
          following: {
            id: "following_1",
            username: "following1",
            displayName: "Following One",
            profileImageUrl: null,
            userProfile: { followerCount: 10, followingCount: 5 },
          },
        },
      ]);

      const result = await getFollowing("user_1", undefined, 20);

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
      expect(mockPrismaFollowFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { followerId: "user_1" },
          take: 21,
        })
      );
    });
  });
});