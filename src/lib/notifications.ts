import prisma from "./prisma";
import type { InputJsonValue } from "@prisma/client/runtime/library";

export type NotificationWithUser = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationClient = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResult = {
  items: NotificationWithUser[];
  nextCursor: string | null;
  unreadCount: number;
};

/**
 * Get notifications for a user (paginated, cursor-based)
 */
export async function getNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<NotificationsResult> {
  const { unreadOnly = false, cursor, limit = 20 } = options;

  const where: Record<string, unknown> = { userId };
  if (unreadOnly) {
    where.readAt = null;
  }
  if (cursor) {
    where.id = { lt: cursor };
  }

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop();
    nextCursor = nextItem!.id;
  }

  return {
    items: items as NotificationWithUser[],
    nextCursor,
    unreadCount,
  };
}

/**
 * Mark specific notifications as read
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[]
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return result.count;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return result.count;
}

/**
 * Create a follow notification
 */
export async function createFollowNotification(
  followedUserId: string,
  followerId: string,
  followerUsername: string,
  followerDisplayName: string
) {
  return prisma.notification.create({
    data: {
      userId: followedUserId,
      type: "follow",
      title: "Neuer Follower",
      message: `${followerDisplayName} (@${followerUsername}) folgt dir jetzt.`,
      data: {
        followerId,
        followerUsername,
        followerDisplayName,
      },
    },
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/**
 * Create a generic notification
 */
export async function createNotification(data: {
  userId: string;
  type: import('@prisma/client').NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  uniqueKey?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: (data.data as InputJsonValue) ?? null,
      uniqueKey: data.uniqueKey,
    },
  });
}