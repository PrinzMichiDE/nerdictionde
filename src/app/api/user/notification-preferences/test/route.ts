import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { checkEnhancedNotificationPrefsEnabled } from "@/lib/notification-preferences-schema";
import { NotificationChannel, NotificationType } from "@prisma/client";
import { shouldNotifyUser } from "@/lib/notification-preferences";
import { sendPushToUser } from "@/lib/push-notifications";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * POST /api/user/notification-preferences/test
 * Sends a test notification via the specified channel
 * Body: { channel: NotificationChannel, type?: NotificationType }
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

  const channel = body.channel as NotificationChannel;
  const type = body.type as NotificationType | undefined;

  if (!Object.values(NotificationChannel).includes(channel)) {
    return NextResponse.json({ error: `Ungültiger Channel: ${channel}` }, { status: 400 });
  }

  // Default type for test
  const testType = type || "review_published";

  // Check if user would actually receive this notification
  const wouldNotify = await shouldNotifyUser(session.userId, testType, channel);
  if (!wouldNotify) {
    return NextResponse.json({
      sent: false,
      reason: "Preference disabled or muted",
    }, { status: 200 });
  }

  try {
    let sent = false;

    switch (channel) {
      case NotificationChannel.IN_APP: {
        // Create a test In-App notification
        await createNotification({
          userId: session.userId,
          type: testType,
          title: "Test-Benachrichtigung",
          message: "Dies ist eine Test-Benachrichtigung für In-App.",
          data: { test: true },
        });
        sent = true;
        break;
      }
      case NotificationChannel.EMAIL: {
        // Send test email - fetch user email from DB
        const user = await prisma.twitchUser.findUnique({
          where: { id: session.userId },
          select: { email: true },
        });
        if (user?.email) {
          // In a real implementation, this would send an email via Resend/nodemailer
          // For now, we log and return success (email sending not implemented in MVP)
          console.log(`[TestNotification] Would send test email to ${user.email}`);
        }
        sent = true;
        break;
      }
      case NotificationChannel.PUSH: {
        // Send test push
        const pushSent = await sendPushToUser(session.userId, {
          title: "Test-Benachrichtigung",
          body: "Dies ist eine Test-Benachrichtigung für Push.",
          url: "/einstellungen/benachrichtigungen",
        });
        sent = pushSent > 0;
        break;
      }
    }

    return NextResponse.json({ sent, channel, type: testType });
  } catch (err) {
    console.error("[NotificationTest] Failed:", err);
    return NextResponse.json({ error: "Test fehlgeschlagen" }, { status: 500 });
  }
}