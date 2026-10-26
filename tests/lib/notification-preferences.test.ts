import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationType, NotificationChannel, NotificationFrequency } from "@prisma/client";

// Mock Prisma - following the pattern from category-subscriptions.test.ts
const mockPrisma = {
  notificationPreference: {
    findMany: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(async (arg: Array<Promise<unknown>> | ((tx: unknown) => Promise<unknown>)) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    // Callback style transaction
    const tx = {
      notificationPreference: {
        upsert: vi.fn(),
        create: vi.fn(),
      },
    };
    return arg(tx);
  }),
};

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/notification-mutes", () => ({
  isMutedTarget: vi.fn(),
}));

// Import after mocking
const { getUserPreferences, getUserPreferencesFlat, shouldNotifyUser, shouldIncludeInDigest, updateUserPreferences, ensureDefaultPreferences, getNotificationTypeLabel, getChannelLabel, getFrequencyLabel } = await import("@/lib/notification-preferences");

describe("notification-preferences", () => {
  const mockUserId = "clx1234567890abcdef123456";
  const mockPrefs = [
    { type: NotificationType.follow, channel: NotificationChannel.IN_APP, frequency: NotificationFrequency.IMMEDIATE, enabled: true },
    { type: NotificationType.follow, channel: NotificationChannel.EMAIL, frequency: NotificationFrequency.DAILY, enabled: true },
    { type: NotificationType.review_published, channel: NotificationChannel.IN_APP, frequency: NotificationFrequency.IMMEDIATE, enabled: true },
    { type: NotificationType.review_published, channel: NotificationChannel.PUSH, frequency: NotificationFrequency.IMMEDIATE, enabled: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserPreferences", () => {
    it("should group preferences by type", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue(mockPrefs);

      const result = await getUserPreferences(mockUserId);

      expect(result).toHaveLength(2);
      const followGroup = result.find((g) => g.type === NotificationType.follow);
      expect(followGroup?.channels).toHaveLength(2);
      const publishedGroup = result.find((g) => g.type === NotificationType.review_published);
      expect(publishedGroup?.channels).toHaveLength(2);
    });

    it("should return empty array when no prefs exist", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([]);

      const result = await getUserPreferences(mockUserId);
      expect(result).toEqual([]);
    });
  });

  describe("getUserPreferencesFlat", () => {
    it("should return flat array of preferences", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue(mockPrefs);

      const result = await getUserPreferencesFlat(mockUserId);
      expect(result).toEqual(mockPrefs);
    });
  });

  describe("shouldNotifyUser", () => {
    it("should return true for enabled IN_APP with IMMEDIATE", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue(mockPrefs);
      const { isMutedTarget } = await import("@/lib/notification-mutes");
      (isMutedTarget as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await shouldNotifyUser(mockUserId, NotificationType.follow, NotificationChannel.IN_APP);
      expect(result).toBe(true);
    });

    it("should return false for disabled preference", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue(mockPrefs);
      const { isMutedTarget } = await import("@/lib/notification-mutes");
      (isMutedTarget as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await shouldNotifyUser(mockUserId, NotificationType.review_published, NotificationChannel.PUSH);
      expect(result).toBe(false);
    });

    it("should return false for non-IMMEDIATE frequency on non-IN_APP channel", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([
        { type: NotificationType.follow, channel: NotificationChannel.EMAIL, frequency: NotificationFrequency.DAILY, enabled: true },
      ]);
      const { isMutedTarget } = await import("@/lib/notification-mutes");
      (isMutedTarget as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await shouldNotifyUser(mockUserId, NotificationType.follow, NotificationChannel.EMAIL);
      expect(result).toBe(false);
    });

    it("should return true for IMMEDIATE frequency on EMAIL channel", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([
        { type: NotificationType.follow, channel: NotificationChannel.EMAIL, frequency: NotificationFrequency.IMMEDIATE, enabled: true },
      ]);
      const { isMutedTarget } = await import("@/lib/notification-mutes");
      (isMutedTarget as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await shouldNotifyUser(mockUserId, NotificationType.follow, NotificationChannel.EMAIL);
      expect(result).toBe(true);
    });

    it("should return false when preference not found", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([]);
      const { isMutedTarget } = await import("@/lib/notification-mutes");
      (isMutedTarget as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await shouldNotifyUser(mockUserId, NotificationType.mention, NotificationChannel.IN_APP);
      expect(result).toBe(false);
    });

    it("should return false when target is muted", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue(mockPrefs);
      const { isMutedTarget } = await import("@/lib/notification-mutes");
      (isMutedTarget as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await shouldNotifyUser(mockUserId, NotificationType.follow, NotificationChannel.IN_APP, {
        targetType: "USER",
        targetId: "clx1234567890abcdef123457",
      });
      expect(result).toBe(false);
    });
  });

  describe("shouldIncludeInDigest", () => {
    it("should return DAILY for DAILY frequency", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([
        { type: NotificationType.follow, channel: NotificationChannel.EMAIL, frequency: NotificationFrequency.DAILY, enabled: true },
      ]);

      const result = await shouldIncludeInDigest(mockUserId, NotificationType.follow, NotificationChannel.EMAIL);
      expect(result).toBe(NotificationFrequency.DAILY);
    });

    it("should return WEEKLY for WEEKLY frequency", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([
        { type: NotificationType.follow, channel: NotificationChannel.EMAIL, frequency: NotificationFrequency.WEEKLY, enabled: true },
      ]);

      const result = await shouldIncludeInDigest(mockUserId, NotificationType.follow, NotificationChannel.EMAIL);
      expect(result).toBe(NotificationFrequency.WEEKLY);
    });

    it("should return null for IMMEDIATE frequency", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue(mockPrefs);

      const result = await shouldIncludeInDigest(mockUserId, NotificationType.follow, NotificationChannel.IN_APP);
      expect(result).toBeNull();
    });

    it("should return null for disabled preference", async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([
        { type: NotificationType.follow, channel: NotificationChannel.PUSH, frequency: NotificationFrequency.DAILY, enabled: false },
      ]);

      const result = await shouldIncludeInDigest(mockUserId, NotificationType.follow, NotificationChannel.PUSH);
      expect(result).toBeNull();
    });
  });

  describe("updateUserPreferences", () => {
    it("should call upsert for each update", async () => {
      mockPrisma.notificationPreference.upsert.mockResolvedValue({});

      await updateUserPreferences(mockUserId, [
        { type: NotificationType.follow, channel: NotificationChannel.IN_APP, enabled: true },
        { type: NotificationType.follow, channel: NotificationChannel.EMAIL, enabled: false },
      ]);

      expect(mockPrisma.notificationPreference.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe("ensureDefaultPreferences", () => {
    it("should create defaults when none exist", async () => {
      mockPrisma.notificationPreference.count.mockResolvedValue(0);
      mockPrisma.notificationPreference.create.mockResolvedValue({});

      await ensureDefaultPreferences(mockUserId);

      expect(mockPrisma.notificationPreference.create).toHaveBeenCalledTimes(36);
    });

    it("should not create when prefs already exist", async () => {
      mockPrisma.notificationPreference.count.mockResolvedValue(5);

      await ensureDefaultPreferences(mockUserId);

      expect(mockPrisma.notificationPreference.create).not.toHaveBeenCalled();
    });
  });

  describe("Label Functions", () => {
    it("should return correct labels for NotificationTypes", () => {
      expect(getNotificationTypeLabel(NotificationType.follow)).toBe("Neue Follower");
      expect(getNotificationTypeLabel(NotificationType.review_published)).toBe("Neue Reviews veröffentlichen");
      expect(getNotificationTypeLabel(NotificationType.mention)).toBe("Erwähnungen");
    });

    it("should return correct labels for Channels", () => {
      expect(getChannelLabel(NotificationChannel.IN_APP)).toBe("In-App");
      expect(getChannelLabel(NotificationChannel.EMAIL)).toBe("E-Mail");
      expect(getChannelLabel(NotificationChannel.PUSH)).toBe("Push");
    });

    it("should return correct labels for Frequencies", () => {
      expect(getFrequencyLabel(NotificationFrequency.IMMEDIATE)).toBe("Sofort");
      expect(getFrequencyLabel(NotificationFrequency.DAILY)).toBe("Täglich (08:00)");
      expect(getFrequencyLabel(NotificationFrequency.WEEKLY)).toBe("Wöchentlich (Mo 08:00)");
    });
  });
});