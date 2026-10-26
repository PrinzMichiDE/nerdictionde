import { z } from "zod";
import { NotificationType, NotificationChannel, NotificationFrequency, MuteTargetType } from "@prisma/client";

/**
 * Zod-Schemas für Erweiterte Benachrichtigungs-Präferenzen
 * Konsistent mit bestehenden Patterns (User Series, Collections, Reactions, etc.)
 */

// ============================================
// Notification Preference Schemas
// ============================================

/** Einzelnes Preference-Update (Type × Channel × Frequency × Enabled) */
export const preferenceUpdateItemSchema = z.object({
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel),
  frequency: z.nativeEnum(NotificationFrequency).default(NotificationFrequency.IMMEDIATE),
  enabled: z.boolean().default(true),
});

/** Bulk-Update für alle Preferences eines Users */
export const preferenceBulkUpdateSchema = z.object({
  preferences: z.array(preferenceUpdateItemSchema).min(1, "Mindestens eine Preference erforderlich"),
});

/** Test-Notification Request */
export const testNotificationSchema = z.object({
  channel: z.nativeEnum(NotificationChannel),
  type: z.nativeEnum(NotificationType).optional(),
});

/** Response: Alle Preferences gruppiert nach Type */
export const userPreferencesResponseSchema = z.object({
  preferences: z.array(
    z.object({
      type: z.nativeEnum(NotificationType),
      channels: z.array(
        z.object({
          channel: z.nativeEnum(NotificationChannel),
          frequency: z.nativeEnum(NotificationFrequency),
          enabled: z.boolean(),
        })
      ),
    })
  ),
});

/** Default Preferences für neuen User (Factory) */
export function getDefaultPreferences(): z.infer<typeof preferenceUpdateItemSchema>[] {
  const defaults: z.infer<typeof preferenceUpdateItemSchema>[] = [];

  // Alle NotificationTypes durchgehen
  const allTypes = Object.values(NotificationType);

  for (const type of allTypes) {
    // IN_APP: immer aktiv, sofort
    defaults.push({ type, channel: NotificationChannel.IN_APP, frequency: NotificationFrequency.IMMEDIATE, enabled: true });

    // EMAIL: standardmäßig aus, aber bei Aktivierung sofort
    defaults.push({ type, channel: NotificationChannel.EMAIL, frequency: NotificationFrequency.IMMEDIATE, enabled: false });

    // PUSH: standardmäßig aus, bei Aktivierung sofort
    defaults.push({ type, channel: NotificationChannel.PUSH, frequency: NotificationFrequency.IMMEDIATE, enabled: false });
  }

  return defaults;
}

// ============================================
// Notification Mute Schemas
// ============================================

export const muteCreateSchema = z.object({
  targetType: z.nativeEnum(MuteTargetType),
  targetId: z.string().cuid("Ungültige Ziel-ID"),
});

export const muteParamsSchema = z.object({
  id: z.string().cuid("Ungültige Mute-ID"),
});

export const userMutesResponseSchema = z.object({
  mutes: z.array(
    z.object({
      id: z.string(),
      targetType: z.nativeEnum(MuteTargetType),
      targetId: z.string(),
      createdAt: z.date(),
      // Resolved target info (optional, für UI)
      targetTitle: z.string().optional(),
      targetSlug: z.string().optional(),
    })
  ),
});

// ============================================
// Push Subscription Schemas
// ============================================

export const pushSubscriptionCreateSchema = z.object({
  endpoint: z.string().url("Ungültiger Endpoint"),
  p256dh: z.string().min(1, "p256dh key erforderlich"),
  auth: z.string().min(1, "auth key erforderlich"),
});

export const pushSubscriptionResponseSchema = z.object({
  subscribed: z.boolean(),
  endpoint: z.string().optional(),
  vapidPublicKey: z.string().optional(),
});

// ============================================
// Query Schemas
// ============================================

export const notificationListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

// ============================================
// Type Exports
// ============================================

export type PreferenceUpdateItem = z.infer<typeof preferenceUpdateItemSchema>;
export type PreferenceBulkUpdateInput = z.infer<typeof preferenceBulkUpdateSchema>;
export type TestNotificationInput = z.infer<typeof testNotificationSchema>;
export type UserPreferencesResponse = z.infer<typeof userPreferencesResponseSchema>;
export type MuteCreateInput = z.infer<typeof muteCreateSchema>;
export type MuteParams = z.infer<typeof muteParamsSchema>;
export type UserMutesResponse = z.infer<typeof userMutesResponseSchema>;
export type PushSubscriptionCreateInput = z.infer<typeof pushSubscriptionCreateSchema>;
export type PushSubscriptionResponse = z.infer<typeof pushSubscriptionResponseSchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

// ============================================
// Feature Flag Guards
// ============================================

import { isEnhancedNotificationPrefsEnabled, isNotificationMutesEnabled, isPushNotificationsEnabled } from "@/lib/feature-flags";

export function checkEnhancedNotificationPrefsEnabled() {
  if (!isEnhancedNotificationPrefsEnabled()) {
    throw new Error("Erweiterte Benachrichtigungs-Präferenzen sind deaktiviert");
  }
}

export function checkNotificationMutesEnabled() {
  if (!isNotificationMutesEnabled()) {
    throw new Error("Benachrichtigungs-Stummschaltung ist deaktiviert");
  }
}

export function checkPushNotificationsEnabled() {
  if (!isPushNotificationsEnabled()) {
    throw new Error("Push-Benachrichtigungen sind deaktiviert (VAPID Keys fehlen)");
  }
}