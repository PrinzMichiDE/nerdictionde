import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { MuteTargetType } from "@prisma/client";
import { revalidateTag } from "next/cache";

const revalidate = (tag: string) => (revalidateTag as (tag: string) => void)(tag);

/**
 * Server Core Logic für Benachrichtigungs-Stummschaltung (Notification Mutes)
 */

// ============================================
// Cache Tags (static - cache key varies by arguments)
// ============================================

const MUTES_TAG = "notif-mutes";
const MUTE_CHECK_TAG = "notif-mute-check";

// ============================================
// Mute Operations
// ============================================

/**
 * Holt alle Mutes eines Users (gecacht 60s)
 */
export const getUserMutes = unstable_cache(
  async (userId: string) => {
    return prisma.notificationMute.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
  ["user-mutes"],
  { tags: [MUTES_TAG], revalidate: 60 }
);

/**
 * Prüft ob ein bestimmtes Ziel für einen User gemutet ist
 * Gecacht für schnelle Checks
 */
export const isMutedTarget = unstable_cache(
  async (userId: string, targetType: MuteTargetType, targetId: string): Promise<boolean> => {
    const mute = await prisma.notificationMute.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId,
        },
      },
      select: { id: true },
    });
    return !!mute;
  },
  ["mute-check"],
  { tags: [MUTE_CHECK_TAG], revalidate: 60 }
);

/**
 * Stummschaltet ein Ziel für einen User (Upsert - idempotent)
 */
export async function muteTarget(
  userId: string,
  targetType: MuteTargetType,
  targetId: string
): Promise<{ muted: boolean; muteId: string }> {
  const existing = await prisma.notificationMute.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType,
        targetId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return { muted: true, muteId: existing.id };
  }

  const mute = await prisma.notificationMute.create({
    data: {
      userId,
      targetType,
      targetId,
    },
  });

  revalidate(MUTES_TAG);
  revalidate(MUTE_CHECK_TAG);
  return { muted: true, muteId: mute.id };
}

/**
 * Hebt Stummschaltung auf
 */
export async function unmuteTarget(userId: string, muteId: string): Promise<{ unmuted: boolean }> {
  const mute = await prisma.notificationMute.findUnique({
    where: { id: muteId },
    select: { userId: true },
  });

  if (!mute || mute.userId !== userId) {
    return { unmuted: false };
  }

  await prisma.notificationMute.delete({
    where: { id: muteId },
  });

  revalidate(MUTES_TAG);
  revalidate(MUTE_CHECK_TAG);
  return { unmuted: true };
}

/**
 * Invalidiere Mutes Cache (nach Mutationen)
 */
export function invalidateMutesCache(userId: string): void {
  revalidate(MUTES_TAG);
  revalidate(MUTE_CHECK_TAG);
}

// ============================================
// Target Resolution (für UI Anzeige)
// ============================================

export interface ResolvedMuteTarget {
  id: string;
  targetType: MuteTargetType;
  targetId: string;
  createdAt: Date;
  targetTitle: string;
  targetSlug: string;
  targetUrl: string;
}

/**
 * Löst Mute-Targets zu UI-freundlichen Objekten auf
 * (Batch-Loading für Performance)
 */
export async function resolveMuteTargets(
  mutes: Array<{ id: string; targetType: MuteTargetType; targetId: string; createdAt: Date }>
): Promise<ResolvedMuteTarget[]> {
  // Gruppiere nach TargetType für Batch-Queries
  const byType = new Map<MuteTargetType, string[]>();
  for (const mute of mutes) {
    if (!byType.has(mute.targetType)) {
      byType.set(mute.targetType, []);
    }
    byType.get(mute.targetType)!.push(mute.targetId);
  }

  // Batch-Load für jeden Type
  const resolvedMap = new Map<string, { title: string; slug: string; url: string }>();

  for (const [targetType, targetIds] of byType.entries()) {
    if (targetType === MuteTargetType.USER) {
      const users = await prisma.twitchUser.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, displayName: true, username: true },
      });

      for (const u of users) {
        resolvedMap.set(u.id, {
          title: u.displayName,
          slug: u.username,
          url: `/u/${u.username}`,
        });
      }
    } else {
      let results: Array<{ id: string; title: string; slug: string }> = [];

      switch (targetType) {
        case MuteTargetType.REVIEW:
          results = await prisma.review.findMany({
            where: { id: { in: targetIds } },
            select: { id: true, title: true, slug: true },
          });
          break;
        case MuteTargetType.COLLECTION:
          results = await prisma.reviewCollection.findMany({
            where: { id: { in: targetIds } },
            select: { id: true, title: true, slug: true },
          });
          break;
        case MuteTargetType.SERIES:
          results = await prisma.reviewSeries.findMany({
            where: { id: { in: targetIds } },
            select: { id: true, title: true, slug: true },
          });
          break;
      }

      for (const r of results) {
        let url = "";
        if (targetType === MuteTargetType.REVIEW) url = `/reviews/${r.slug}`;
        else if (targetType === MuteTargetType.COLLECTION) url = `/listen/${r.slug}`;
        else if (targetType === MuteTargetType.SERIES) url = `/serien/${r.slug}`;

        resolvedMap.set(r.id, {
          title: r.title,
          slug: r.slug,
          url,
        });
      }
    }
  }

  // Merge mit Original Mutes
  return mutes.map((mute) => {
    const resolved = resolvedMap.get(mute.targetId);
    return {
      id: mute.id,
      targetType: mute.targetType,
      targetId: mute.targetId,
      createdAt: mute.createdAt,
      targetTitle: resolved?.title || "Unbekannt",
      targetSlug: resolved?.slug || "",
      targetUrl: resolved?.url || "",
    };
  });
}

// ============================================
// Target Type Labels (für UI)
// ============================================

export function getMuteTargetTypeLabel(targetType: MuteTargetType): string {
  const labels: Record<MuteTargetType, string> = {
    REVIEW: "Review",
    COLLECTION: "Liste",
    SERIES: "Serie",
    USER: "Nutzer",
  };
  return labels[targetType];
}

export function getMuteTargetTypeIcon(targetType: MuteTargetType): string {
  const icons: Record<MuteTargetType, string> = {
    REVIEW: "📝",
    COLLECTION: "📋",
    SERIES: "📚",
    USER: "👤",
  };
  return icons[targetType];
}