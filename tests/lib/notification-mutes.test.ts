import { describe, it, expect, vi, beforeEach } from "vitest";
import { MuteTargetType } from "@prisma/client";

// Mock Prisma
const mockPrisma = {
  notificationMute: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  review: { findMany: vi.fn() },
  reviewCollection: { findMany: vi.fn() },
  reviewSeries: { findMany: vi.fn() },
  twitchUser: { findMany: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));

// Import after mocking
const { getUserMutes, isMutedTarget, muteTarget, unmuteTarget, resolveMuteTargets, getMuteTargetTypeLabel, getMuteTargetTypeIcon } = await import("@/lib/notification-mutes");

describe("notification-mutes", () => {
  const mockUserId = "clx1234567890abcdef123456";
  const mockMutes = [
    { id: "mute1", userId: mockUserId, targetType: MuteTargetType.REVIEW, targetId: "review1", createdAt: new Date("2026-01-01") },
    { id: "mute2", userId: mockUserId, targetType: MuteTargetType.COLLECTION, targetId: "col1", createdAt: new Date("2026-01-02") },
    { id: "mute3", userId: mockUserId, targetType: MuteTargetType.USER, targetId: "user1", createdAt: new Date("2026-01-03") },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserMutes", () => {
    it("should return all mutes for user", async () => {
      mockPrisma.notificationMute.findMany.mockResolvedValue(mockMutes);

      const result = await getUserMutes(mockUserId);
      expect(result).toEqual(mockMutes);
    });
  });

  describe("isMutedTarget", () => {
    it("should return true when mute exists", async () => {
      mockPrisma.notificationMute.findUnique.mockResolvedValue({ id: "mute1" });

      const result = await isMutedTarget(mockUserId, MuteTargetType.REVIEW, "review1");
      expect(result).toBe(true);
    });

    it("should return false when mute does not exist", async () => {
      mockPrisma.notificationMute.findUnique.mockResolvedValue(null);

      const result = await isMutedTarget(mockUserId, MuteTargetType.REVIEW, "review1");
      expect(result).toBe(false);
    });
  });

  describe("muteTarget", () => {
    it("should create new mute when not exists", async () => {
      mockPrisma.notificationMute.findUnique.mockResolvedValue(null);
      mockPrisma.notificationMute.create.mockResolvedValue({ id: "new-mute", userId: mockUserId, targetType: MuteTargetType.REVIEW, targetId: "review1" });

      const result = await muteTarget(mockUserId, MuteTargetType.REVIEW, "review1");
      expect(result).toEqual({ muted: true, muteId: "new-mute" });
      expect(mockPrisma.notificationMute.create).toHaveBeenCalledWith({
        data: { userId: mockUserId, targetType: MuteTargetType.REVIEW, targetId: "review1" },
      });
    });

    it("should return existing mute when already exists", async () => {
      mockPrisma.notificationMute.findUnique.mockResolvedValue({ id: "existing-mute" });

      const result = await muteTarget(mockUserId, MuteTargetType.REVIEW, "review1");
      expect(result).toEqual({ muted: true, muteId: "existing-mute" });
      expect(mockPrisma.notificationMute.create).not.toHaveBeenCalled();
    });
  });

  describe("unmuteTarget", () => {
    it("should delete mute when user owns it", async () => {
      mockPrisma.notificationMute.findUnique.mockResolvedValue({ id: "mute1", userId: mockUserId });
      mockPrisma.notificationMute.delete.mockResolvedValue({});

      const result = await unmuteTarget(mockUserId, "mute1");
      expect(result).toEqual({ unmuted: true });
      expect(mockPrisma.notificationMute.delete).toHaveBeenCalledWith({ where: { id: "mute1" } });
    });

    it("should return false when mute belongs to different user", async () => {
      mockPrisma.notificationMute.findUnique.mockResolvedValue({ id: "mute1", userId: "other-user" });

      const result = await unmuteTarget(mockUserId, "mute1");
      expect(result).toEqual({ unmuted: false });
      expect(mockPrisma.notificationMute.delete).not.toHaveBeenCalled();
    });

    it("should return false when mute not found", async () => {
      mockPrisma.notificationMute.findUnique.mockResolvedValue(null);

      const result = await unmuteTarget(mockUserId, "nonexistent");
      expect(result).toEqual({ unmuted: false });
    });
  });

  describe("resolveMuteTargets", () => {
    it("should resolve targets with title, slug, url", async () => {
      mockPrisma.review.findMany.mockResolvedValue([{ id: "review1", title: "Test Review", slug: "test-review" }]);
      mockPrisma.reviewCollection.findMany.mockResolvedValue([{ id: "col1", title: "My Collection", slug: "my-collection" }]);
      mockPrisma.twitchUser.findMany.mockResolvedValue([{ id: "user1", displayName: "TestUser", username: "testuser" }]);

      const mutes = [
        { id: "mute1", targetType: MuteTargetType.REVIEW, targetId: "review1", createdAt: new Date() },
        { id: "mute2", targetType: MuteTargetType.COLLECTION, targetId: "col1", createdAt: new Date() },
        { id: "mute3", targetType: MuteTargetType.USER, targetId: "user1", createdAt: new Date() },
      ];

      const result = await resolveMuteTargets(mutes);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        targetTitle: "Test Review",
        targetSlug: "test-review",
        targetUrl: "/reviews/test-review",
      });
      expect(result[1]).toMatchObject({
        targetTitle: "My Collection",
        targetSlug: "my-collection",
        targetUrl: "/listen/my-collection",
      });
      expect(result[2]).toMatchObject({
        targetTitle: "TestUser",
        targetSlug: "testuser",
        targetUrl: "/u/testuser",
      });
    });

    it("should handle missing targets gracefully", async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);

      const mutes = [{ id: "mute1", targetType: MuteTargetType.REVIEW, targetId: "missing", createdAt: new Date() }];

      const result = await resolveMuteTargets(mutes);
      expect(result[0]).toMatchObject({
        targetTitle: "Unbekannt",
        targetSlug: "",
        targetUrl: "",
      });
    });
  });

  describe("Label & Icon Functions", () => {
    it("should return correct labels for target types", () => {
      expect(getMuteTargetTypeLabel(MuteTargetType.REVIEW)).toBe("Review");
      expect(getMuteTargetTypeLabel(MuteTargetType.COLLECTION)).toBe("Liste");
      expect(getMuteTargetTypeLabel(MuteTargetType.SERIES)).toBe("Serie");
      expect(getMuteTargetTypeLabel(MuteTargetType.USER)).toBe("Nutzer");
    });

    it("should return correct icons for target types", () => {
      expect(getMuteTargetTypeIcon(MuteTargetType.REVIEW)).toBe("📝");
      expect(getMuteTargetTypeIcon(MuteTargetType.COLLECTION)).toBe("📋");
      expect(getMuteTargetTypeIcon(MuteTargetType.SERIES)).toBe("📚");
      expect(getMuteTargetTypeIcon(MuteTargetType.USER)).toBe("👤");
    });
  });
});