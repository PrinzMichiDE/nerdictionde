import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { NotificationType, NotificationChannel, NotificationFrequency, MuteTargetType } from "@prisma/client";
import { revalidateTag } from "next/cache";

export const revalidate = (tag: string) => (revalidateTag as (tag: string) => void)(tag);
import { getDefaultPreferences } from "@/lib/notification-preferences-schema";
import { isMutedTarget } from "@/lib/notification-mutes";

/**
 * Server Core Logic für Erweiterte Benachrichtigungs-Präferenzen
 */

// ============================================
// Cache Tags (static - cache key varies by userId argument)
// ============================================

const PREFS_TAG = "notif-prefs";
const PREFS_FLAT_TAG = "notif-prefs-flat";

// ============================================
// User Preferences
// ============================================

/**
 * Holt alle Preferences eines Users (gruppiert nach Type)
 * Gecacht für 60 Sekunden
 */
export const getUserPreferences = unstable_cache(
  async (userId: string) => {
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { channel: "asc" }],
    });

    // Gruppiere nach Type für Response
    const grouped = new Map<NotificationType, Array<{ channel: NotificationChannel; frequency: NotificationFrequency; enabled: boolean }>>();

    for (const pref of prefs) {
      if (!grouped.has(pref.type)) {
        grouped.set(pref.type, []);
      }
      grouped.get(pref.type)!.push({
        channel: pref.channel,
        frequency: pref.frequency,
        enabled: pref.enabled,
      });
    }

    return Array.from(grouped.entries()).map(([type, channels]) => ({
      type,
      channels,
    }));
  },
  ["user-preferences"],
  { tags: [PREFS_TAG], revalidate: 60 }
);

/**
 * Holt Preferences als flache Liste (für interne Checks)
 * Gecacht für 60 Sekunden
 */
export const getUserPreferencesFlat = unstable_cache(
  async (userId: string) => {
    return prisma.notificationPreference.findMany({
      where: { userId },
      select: { type: true, channel: true, frequency: true, enabled: true },
    });
  },
  ["user-preferences-flat"],
  { tags: [PREFS_FLAT_TAG], revalidate: 60 }
);

/**
 * Prüft ob ein User für einen bestimmten Type+Channel benachrichtigt werden soll
 * Berücksichtigt: Preference enabled, Frequency (für Digest), Mutes
 */
export async function shouldNotifyUser(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel,
  options?: { targetType?: string; targetId?: string }
): Promise<boolean> {
  // 1. Mute Check (falls targetType/targetId angegeben)
  if (options?.targetType && options?.targetId) {
    const isMuted = await isMutedTarget(
      userId,
      options.targetType as MuteTargetType,
      options.targetId
    );
    if (isMuted) return false;
  }

  // 2. Preference Check
  const prefs = await getUserPreferencesFlat(userId);
  const pref = prefs.find((p) => p.type === type && p.channel === channel);

  if (!pref || !pref.enabled) return false;

  // 3. Frequency Check: Nur IMMEDIATE wird direkt zugestellt
  // DAILY/WEEKLY werden in Digest gesammelt
  if (channel !== NotificationChannel.IN_APP && pref.frequency !== NotificationFrequency.IMMEDIATE) {
    return false;
  }

  return true;
}

/**
 * Prüft ob eine Notification in den Digest aufgenommen werden soll
 */
export async function shouldIncludeInDigest(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<NotificationFrequency | null> {
  const prefs = await getUserPreferencesFlat(userId);
  const pref = prefs.find((p) => p.type === type && p.channel === channel);

  if (!pref || !pref.enabled) return null;
  if (pref.frequency === NotificationFrequency.IMMEDIATE) return null;

  return pref.frequency;
}

/**
 * Bulk-Upsert Preferences für einen User
 * Invalidiert Cache nach Update
 */
export async function updateUserPreferences(
  userId: string,
  updates: Array<{
    type: NotificationType;
    channel: NotificationChannel;
    frequency?: NotificationFrequency;
    enabled: boolean;
  }>
): Promise<void> {
  await prisma.$transaction(
    updates.map((u) =>
      prisma.notificationPreference.upsert({
        where: {
          userId_type_channel: {
            userId,
            type: u.type,
            channel: u.channel,
          },
        },
        update: {
          frequency: u.frequency ?? NotificationFrequency.IMMEDIATE,
          enabled: u.enabled,
        },
        create: {
          userId,
          type: u.type,
          channel: u.channel,
          frequency: u.frequency ?? NotificationFrequency.IMMEDIATE,
          enabled: u.enabled,
        },
      })
    )
  );

  // Cache invalidieren
  revalidate(PREFS_TAG);
  revalidate(PREFS_FLAT_TAG);
}

/**
 * Initialisiert Default-Preferences für einen neuen User
 * Wird bei Registrierung oder on-demand aufgerufen
 */
export async function ensureDefaultPreferences(userId: string): Promise<void> {
  const existing = await prisma.notificationPreference.count({
    where: { userId },
  });

  if (existing > 0) return; // Already initialized

  const defaults = getDefaultPreferences();

  await prisma.$transaction(
    defaults.map((d) =>
      prisma.notificationPreference.create({
        data: {
          userId,
          type: d.type,
          channel: d.channel,
          frequency: d.frequency,
          enabled: d.enabled,
        },
      })
    )
  );

  revalidate(PREFS_TAG);
  revalidate(PREFS_FLAT_TAG);
}

/**
 * Invalidiere Preferences Cache (nach Mutationen)
 */
export function invalidatePreferencesCache(userId: string): void {
  revalidate(PREFS_TAG);
  revalidate(PREFS_FLAT_TAG);
}

// ============================================
// Notification Type Labels (für UI)
// ============================================

export function getNotificationTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    follow: "Neue Follower",
    collection_update: "Listen-Updates",
    category_new_review: "Neue Reviews in abonnierten Kategorien",
    qa_new_question: "Neue Fragen zu meinen Reviews",
    qa_answer_added: "Antworten auf meine Fragen",
    qa_answer_accepted: "Meine Antwort wurde als Lösung markiert",
    user_series_update: "Updates zu gefolgten Serien",
    user_series_invite: "Einladungen zur Serien-Kollaboration",
    review_comment: "Kommentare zu meinen Reviews",
    review_reaction: "Reaktionen auf meine Reviews",
    review_published: "Neue Reviews veröffentlichen",
    mention: "Erwähnungen",
  };
  return labels[type] || type;
}

export function getChannelLabel(channel: NotificationChannel): string {
  const labels: Record<NotificationChannel, string> = {
    IN_APP: "In-App",
    EMAIL: "E-Mail",
    PUSH: "Push",
  };
  return labels[channel];
}

export function getFrequencyLabel(frequency: NotificationFrequency): string {
  const labels: Record<NotificationFrequency, string> = {
    IMMEDIATE: "Sofort",
    DAILY: "Täglich (08:00)",
    WEEKLY: "Wöchentlich (Mo 08:00)",
  };
  return labels[frequency];
}