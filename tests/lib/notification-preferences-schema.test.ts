import { describe, it, expect } from "vitest";
import {
  preferenceUpdateItemSchema,
  preferenceBulkUpdateSchema,
  testNotificationSchema,
  muteCreateSchema,
  muteParamsSchema,
  pushSubscriptionCreateSchema,
  notificationListQuerySchema,
  getDefaultPreferences,
  type PreferenceUpdateItem,
  type PreferenceBulkUpdateInput,
  type TestNotificationInput,
  type MuteCreateInput,
  type PushSubscriptionCreateInput,
} from "@/lib/notification-preferences-schema";
import { NotificationType, NotificationChannel, NotificationFrequency, MuteTargetType } from "@prisma/client";

describe("notification-preferences-schema", () => {
  describe("preferenceUpdateItemSchema", () => {
    it("should validate a valid preference update item", () => {
      const input: PreferenceUpdateItem = {
        type: NotificationType.review_published,
        channel: NotificationChannel.IN_APP,
        frequency: NotificationFrequency.IMMEDIATE,
        enabled: true,
      };

      const result = preferenceUpdateItemSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should apply default frequency IMMEDIATE when not provided", () => {
      const input = {
        type: NotificationType.follow,
        channel: NotificationChannel.EMAIL,
        enabled: false,
      };

      const result = preferenceUpdateItemSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.frequency).toBe(NotificationFrequency.IMMEDIATE);
      }
    });

    it("should apply default enabled true when not provided", () => {
      const input = {
        type: NotificationType.review_comment,
        channel: NotificationChannel.PUSH,
        frequency: NotificationFrequency.DAILY,
      };

      const result = preferenceUpdateItemSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
      }
    });

    it("should reject invalid NotificationType", () => {
      const input = {
        type: "invalid_type",
        channel: NotificationChannel.IN_APP,
      };

      const result = preferenceUpdateItemSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid NotificationChannel", () => {
      const input = {
        type: NotificationType.review_published,
        channel: "INVALID",
      };

      const result = preferenceUpdateItemSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid NotificationFrequency", () => {
      const input = {
        type: NotificationType.review_published,
        channel: NotificationChannel.IN_APP,
        frequency: "MONTHLY",
      };

      const result = preferenceUpdateItemSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const input = {
        channel: NotificationChannel.IN_APP,
      };

      const result = preferenceUpdateItemSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("preferenceBulkUpdateSchema", () => {
    it("should validate a valid bulk update", () => {
      const input: PreferenceBulkUpdateInput = {
        preferences: [
          { type: NotificationType.follow, channel: NotificationChannel.IN_APP, frequency: NotificationFrequency.IMMEDIATE, enabled: true },
          { type: NotificationType.follow, channel: NotificationChannel.EMAIL, frequency: NotificationFrequency.IMMEDIATE, enabled: false },
          { type: NotificationType.review_published, channel: NotificationChannel.IN_APP, frequency: NotificationFrequency.IMMEDIATE, enabled: true },
        ],
      };

      const result = preferenceBulkUpdateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty preferences array", () => {
      const input = { preferences: [] };

      const result = preferenceBulkUpdateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid items in array", () => {
      const input = {
        preferences: [
          { type: NotificationType.follow, channel: NotificationChannel.IN_APP },
          { type: "invalid", channel: NotificationChannel.EMAIL }, // invalid type
        ],
      };

      const result = preferenceBulkUpdateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("testNotificationSchema", () => {
    it("should validate test notification with channel only", () => {
      const input: TestNotificationInput = {
        channel: NotificationChannel.EMAIL,
      };

      const result = testNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate test notification with channel and type", () => {
      const input: TestNotificationInput = {
        channel: NotificationChannel.PUSH,
        type: NotificationType.review_published,
      };

      const result = testNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject missing channel", () => {
      const input = { type: NotificationType.follow };

      const result = testNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid channel", () => {
      const input = { channel: "SMS" };

      const result = testNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("muteCreateSchema", () => {
    it("should validate a valid mute create input", () => {
      const input: MuteCreateInput = {
        targetType: MuteTargetType.REVIEW,
        targetId: "clx1234567890abcdef123456", // valid cuid
      };

      const result = muteCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept all valid MuteTargetTypes", () => {
      const types = [MuteTargetType.REVIEW, MuteTargetType.COLLECTION, MuteTargetType.SERIES, MuteTargetType.USER];

      for (const targetType of types) {
        const input = { targetType, targetId: "clx1234567890abcdef123456" };
        const result = muteCreateSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid targetId (not cuid)", () => {
      const input = {
        targetType: MuteTargetType.REVIEW,
        targetId: "not-a-cuid",
      };

      const result = muteCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing fields", () => {
      const result = muteCreateSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("muteParamsSchema", () => {
    it("should validate valid mute ID param", () => {
      const result = muteParamsSchema.safeParse({ id: "clx1234567890abcdef123456" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid mute ID", () => {
      const result = muteParamsSchema.safeParse({ id: "not-a-cuid" });
      expect(result.success).toBe(false);
    });
  });

  describe("pushSubscriptionCreateSchema", () => {
    it("should validate a valid push subscription", () => {
      const input: PushSubscriptionCreateInput = {
        endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
        p256dh: "BEl62iUYg...",
        auth: "authkey123",
      };

      const result = pushSubscriptionCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid endpoint URL", () => {
      const input = {
        endpoint: "not-a-url",
        p256dh: "key",
        auth: "auth",
      };

      const result = pushSubscriptionCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing p256dh", () => {
      const input = {
        endpoint: "https://example.com/push",
        auth: "auth",
      };

      const result = pushSubscriptionCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing auth", () => {
      const input = {
        endpoint: "https://example.com/push",
        p256dh: "key",
      };

      const result = pushSubscriptionCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("notificationListQuerySchema", () => {
    it("should apply defaults", () => {
      const result = notificationListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.unreadOnly).toBe(false);
        expect(result.data.cursor).toBeUndefined();
      }
    });

    it("should validate custom limit", () => {
      const result = notificationListQuerySchema.safeParse({ limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("should reject limit > 100", () => {
      const result = notificationListQuerySchema.safeParse({ limit: "101" });
      expect(result.success).toBe(false);
    });

    it("should reject limit < 1", () => {
      const result = notificationListQuerySchema.safeParse({ limit: "0" });
      expect(result.success).toBe(false);
    });

    it("should coerce unreadOnly boolean", () => {
      const result = notificationListQuerySchema.safeParse({ unreadOnly: "true" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unreadOnly).toBe(true);
      }
    });
  });

  describe("getDefaultPreferences", () => {
    it("should return defaults for all NotificationTypes", () => {
      const defaults = getDefaultPreferences();

      // Count only string enum values (NotificationType is a string enum)
      const typeKeys = Object.keys(NotificationType).filter((k) => isNaN(Number(k)));
      const expectedTypeCount = typeKeys.length;
      expect(defaults.length).toBe(expectedTypeCount * 3);
    });

    it("should have IN_APP enabled for all types", () => {
      const defaults = getDefaultPreferences();

      for (const type of Object.values(NotificationType)) {
        const inAppPref = defaults.find((p) => p.type === type && p.channel === NotificationChannel.IN_APP);
        expect(inAppPref).toBeDefined();
        expect(inAppPref?.enabled).toBe(true);
        expect(inAppPref?.frequency).toBe(NotificationFrequency.IMMEDIATE);
      }
    });

    it("should have EMAIL disabled by default for all types", () => {
      const defaults = getDefaultPreferences();

      for (const type of Object.values(NotificationType)) {
        const emailPref = defaults.find((p) => p.type === type && p.channel === NotificationChannel.EMAIL);
        expect(emailPref).toBeDefined();
        expect(emailPref?.enabled).toBe(false);
        expect(emailPref?.frequency).toBe(NotificationFrequency.IMMEDIATE);
      }
    });

    it("should have PUSH disabled by default for all types", () => {
      const defaults = getDefaultPreferences();

      for (const type of Object.values(NotificationType)) {
        const pushPref = defaults.find((p) => p.type === type && p.channel === NotificationChannel.PUSH);
        expect(pushPref).toBeDefined();
        expect(pushPref?.enabled).toBe(false);
        expect(pushPref?.frequency).toBe(NotificationFrequency.IMMEDIATE);
      }
    });

    it("should have unique combinations of type × channel", () => {
      const defaults = getDefaultPreferences();
      const keys = defaults.map((p) => `${p.type}:${p.channel}`);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(defaults.length);
    });
  });
});