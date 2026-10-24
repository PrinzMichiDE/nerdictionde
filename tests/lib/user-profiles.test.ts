import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaTwitchUserFindUnique = vi.hoisted(() => vi.fn());
const mockPrismaUserProfileFindUnique = vi.hoisted(() => vi.fn());
const mockPrismaUserProfileUpsert = vi.hoisted(() => vi.fn());
const mockPrismaUserRatingFindMany = vi.hoisted(() => vi.fn());
const mockPrismaUserRatingCount = vi.hoisted(() => vi.fn());
const mockPrismaBookmarkFindMany = vi.hoisted(() => vi.fn());
const mockPrismaBookmarkCount = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    twitchUser: {
      findUnique: mockPrismaTwitchUserFindUnique,
    },
    userProfile: {
      findUnique: mockPrismaUserProfileFindUnique,
      upsert: mockPrismaUserProfileUpsert,
    },
    userRating: {
      findMany: mockPrismaUserRatingFindMany,
      count: mockPrismaUserRatingCount,
    },
    bookmark: {
      findMany: mockPrismaBookmarkFindMany,
      count: mockPrismaBookmarkCount,
    },
  },
}));

import { getUserProfileUncached, getUserProfileById, updateUserProfile, getProfileRatings, getProfileBookmarks } from "@/lib/user-profiles";

describe("lib/user-profiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserProfileUncached", () => {
    it("gibt null zurück wenn Nutzer nicht existiert", async () => {
      mockPrismaTwitchUserFindUnique.mockResolvedValue(null);

      const result = await getUserProfileUncached("nonexistent");
      expect(result).toBeNull();
    });

    it("gibt null zurück wenn Profil privat ist", async () => {
      mockPrismaTwitchUserFindUnique.mockResolvedValue({
        id: "user_1",
        username: "testuser",
        displayName: "Test User",
        profileImageUrl: null,
        createdAt: new Date(),
        userProfile: {
          bio: "Test bio",
          isPublic: false,
          showRatings: true,
          showBookmarks: true,
          followerCount: 10,
          followingCount: 5,
        },
      });

      const result = await getUserProfileUncached("testuser");
      expect(result).toBeNull();
    });

    it("gibt öffentliches Profil zurück", async () => {
      mockPrismaTwitchUserFindUnique.mockResolvedValue({
        id: "user_1",
        username: "testuser",
        displayName: "Test User",
        profileImageUrl: "https://example.com/avatar.png",
        createdAt: new Date("2024-01-01"),
        userProfile: {
          bio: "Test bio",
          isPublic: true,
          showRatings: true,
          showBookmarks: true,
          followerCount: 10,
          followingCount: 5,
        },
      });

      const result = await getUserProfileUncached("testuser");

      expect(result).not.toBeNull();
      expect(result?.user.username).toBe("testuser");
      expect(result?.user.displayName).toBe("Test User");
      expect(result?.user.userProfile?.bio).toBe("Test bio");
      expect(result?.user.userProfile?.followerCount).toBe(10);
    });
  });

  describe("getUserProfileById", () => {
    it("gibt Profil für eigenen Nutzer zurück", async () => {
      mockPrismaTwitchUserFindUnique.mockResolvedValue({
        id: "user_1",
        username: "testuser",
        displayName: "Test User",
        profileImageUrl: null,
        createdAt: new Date(),
        userProfile: {
          bio: "Test bio",
          isPublic: true,
          showRatings: true,
          showBookmarks: false,
          followerCount: 10,
          followingCount: 5,
        },
      });

      const result = await getUserProfileById("user_1");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("user_1");
    });
  });

  describe("updateUserProfile", () => {
    it("aktualisiert Profil-Einstellungen", async () => {
      mockPrismaUserProfileUpsert.mockResolvedValue({
        userId: "user_1",
        bio: "Neue Bio",
        isPublic: false,
        showRatings: true,
        showBookmarks: true,
      });
      mockPrismaTwitchUserFindUnique.mockResolvedValue({ username: "testuser" });

      const result = await updateUserProfile("user_1", {
        bio: "Neue Bio",
        isPublic: false,
        showRatings: true,
        showBookmarks: true,
      });

      expect(result.result.bio).toBe("Neue Bio");
      expect(result.result.isPublic).toBe(false);
      expect(result.username).toBe("testuser");
      expect(mockPrismaUserProfileUpsert).toHaveBeenCalledWith({
        where: { userId: "user_1" },
        update: {
          bio: "Neue Bio",
          isPublic: false,
          showRatings: true,
          showBookmarks: true,
        },
        create: expect.objectContaining({
          userId: "user_1",
          bio: "Neue Bio",
        }),
      });
    });

    it("erlaubt partielle Updates", async () => {
      mockPrismaUserProfileUpsert.mockResolvedValue({
        userId: "user_1",
        bio: "Alt Bio",
        isPublic: true,
        showRatings: false,
        showBookmarks: true,
      });
      mockPrismaTwitchUserFindUnique.mockResolvedValue({ username: "testuser" });

      const result = await updateUserProfile("user_1", { showRatings: false });

      expect(result.result.showRatings).toBe(false);
      expect(mockPrismaUserProfileUpsert).toHaveBeenCalledWith({
        where: { userId: "user_1" },
        update: { showRatings: false },
        create: expect.any(Object),
      });
    });
  });

  describe("getProfileRatings", () => {
    it("gibt paginierte Bewertungen zurück", async () => {
      mockPrismaUserRatingFindMany.mockResolvedValue([
        {
          id: "rating_1",
          score: 8,
          text: "Great game!",
          review: {
            id: "review_1",
            title: "Cyberpunk 2077",
            slug: "cyberpunk-2077",
            category: "game",
            score: 85,
            images: ["https://example.com/img.jpg"],
          },
        },
      ]);
      mockPrismaUserRatingCount.mockResolvedValue(25);

      const result = await getProfileRatings("user_1", undefined, 12);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].score).toBe(8);
      expect(result.items[0].review.title).toBe("Cyberpunk 2077");
      expect(result.totalCount).toBe(25);
      expect(result.nextCursor).toBeNull();
    });

    it("unterstützt Cursor-Pagination", async () => {
      mockPrismaUserRatingFindMany.mockResolvedValue([]);
      mockPrismaUserRatingCount.mockResolvedValue(0);

      const result = await getProfileRatings("user_1", "rating_1", 12);

      expect(result.items).toHaveLength(0);
      expect(mockPrismaUserRatingFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user_1",
            id: { lt: "rating_1" },
          }),
          take: 13,
        })
      );
    });
  });

  describe("getProfileBookmarks", () => {
    it("gibt paginierte Bookmarks zurück", async () => {
      mockPrismaBookmarkFindMany.mockResolvedValue([
        {
          id: "bookmark_1",
          review: {
            id: "review_1",
            title: "The Witcher 3",
            slug: "witcher-3",
            category: "game",
            score: 95,
            images: ["https://example.com/witcher.jpg"],
          },
        },
      ]);
      mockPrismaBookmarkCount.mockResolvedValue(10);

      const result = await getProfileBookmarks("user_1", undefined, 12);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].review.title).toBe("The Witcher 3");
      expect(result.totalCount).toBe(10);
      expect(result.nextCursor).toBeNull();
    });

    it("unterstützt Cursor-Pagination", async () => {
      mockPrismaBookmarkFindMany.mockResolvedValue([]);
      mockPrismaBookmarkCount.mockResolvedValue(0);

      const result = await getProfileBookmarks("user_1", "bookmark_1", 12);

      expect(result.items).toHaveLength(0);
      expect(mockPrismaBookmarkFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user_1",
            id: { lt: "bookmark_1" },
          }),
          take: 13,
        })
      );
    });
  });
});