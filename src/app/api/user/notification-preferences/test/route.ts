import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { NotificationChannel, NotificationType } from "@prisma/client";
import { checkEnhancedNotificationPrefsEnabled } from "@/lib/notification-preferences-schema";
import { rateLimit } from "@/lib/rate-limit";
import { shouldNotifyUser } from "@/lib/notification-preferences";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/push-notifications";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/user/notification-preferences/test
 * Sends a test notification to the authenticated user
 * Body: { channel: NotificationChannel, type?: NotificationType }
 * Response: { sent: boolean, channel: string, type?: string, reason?: string }
 */
export async function POST(req: NextRequest) {
  try {
    checkEnhancedNotificationPrefsEnabled();
  } catch {
    return NextResponse.json({ error: "Feature deaktiviert" }, { status: 403 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Rate limit: 5 requests per minute
  const rl = await rateLimit(req, { key: `notif-test:${session.userId}`, limit: 5, window: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Zu viele Test-Anfragen" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const { channel, type } = body;

  // Validate channel
  if (!channel || !Object.values(NotificationChannel).includes(channel as NotificationChannel)) {
    return NextResponse.json({ error: "Ungültiger Channel" }, { status: 400 });
  }
  const validChannel = channel as NotificationChannel;

  // Validate type
  if (type && !Object.values(NotificationType).includes(type as NotificationType)) {
    return NextResponse.json({ error: `Ungültiger NotificationType: ${type}` }, { status: 400 });
  }

  // Use a default type if not specified
  const notificationType = (type as NotificationType) || "review_published";

  // Human-readable channel names for messages
  const channelLabels: Record<NotificationChannel, string> = {
    IN_APP: "In-App",
    EMAIL: "E-Mail",
    PUSH: "Push",
  };

  const channelLabel = channelLabels[validChannel] || validChannel;

  try {
    // Check if user should be notified for this channel/type
    const shouldNotify = await shouldNotifyUser(session.userId, notificationType, validChannel);

    if (!shouldNotify) {
      return NextResponse.json({
        sent: false,
        reason: "Preference disabled or muted",
      });
    }

    // Send notification based on channel
    switch (validChannel) {
      case NotificationChannel.IN_APP: {
        await createNotification({
          userId: session.userId,
          type: notificationType,
          title: "Test-Benachrichtigung",
          message: `Dies ist eine Test-Benachrichtigung für ${channelLabel}.`,
          data: { test: true },
        });
        return NextResponse.json({
          sent: true,
          channel: "IN_APP",
          type: notificationType,
        });
      }

      case NotificationChannel.EMAIL: {
        // For test, just check if user has email
        const user = await prisma.twitchUser.findUnique({
          where: { id: session.userId },
          select: { email: true },
        });

        if (!user?.email) {
          return NextResponse.json({
            sent: false,
            reason: "No email configured",
          });
        }

        // In a real implementation, this would send an email
        // For now, we just log and return success
        console.log(`[Test] Would send email to ${user.email} for ${notificationType}`);
        return NextResponse.json({
          sent: true,
          channel: "EMAIL",
          type: notificationType,
        });
      }

      case NotificationChannel.PUSH: {
        const pushPayload = {
          title: "Test-Benachrichtigung",
          body: `Dies ist eine Test-Benachrichtigung für ${channelLabel}.`,
          url: "/einstellungen/benachrichtigungen",
        };
        const sent = await sendPushToUser(session.userId, pushPayload);
        return NextResponse.json({
          sent: sent > 0,
          channel: "PUSH",
          type: notificationType,
        });
      }

      default:
        return NextResponse.json({ error: "Ungültiger Channel" }, { status: 400 });
    }
  } catch (err) {
    console.error("[NotificationPreferences] Test failed:", err);
    return NextResponse.json({ error: "Test fehlgeschlagen" }, { status: 500 });
  }
}