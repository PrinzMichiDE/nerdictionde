import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { NotificationFrequency, NotificationChannel, NotificationType } from "@prisma/client";
import { sendPushToUsers } from "@/lib/push-notifications";
import { featureFlags } from "@/lib/feature-flags";
import { revalidateTag } from "next/cache";

const revalidate = (tag: string) => (revalidateTag as (tag: string) => void)(tag);

interface DigestNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  createdAt: Date;
}

/**
 * Cron Job: Notification Digest
 * Schedule: 
 * - Daily: 08:00 UTC (0 8 * * *)
 * - Weekly: Monday 08:00 UTC (0 8 * * 1)
 * Auth: Vercel Cron Secret via Authorization header
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authorization (Vercel Cron Secret)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("Unauthorized cron job attempt: notification-digest");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Feature flag check
    if (!featureFlags.notificationDigest) {
      return NextResponse.json({ error: "Digest feature disabled" }, { status: 403 });
    }

    // 3. Determine digest type from query param or header
    const { searchParams } = new URL(req.url);
    const digestType = searchParams.get("type") || "daily"; // "daily" | "weekly"

    const targetFrequency = digestType === "weekly" 
      ? NotificationFrequency.WEEKLY 
      : NotificationFrequency.DAILY;

    console.log(`Starting ${digestType} notification digest...`);

    // 4. Get all users who have DAILY or WEEKLY frequency for EMAIL or PUSH
    const usersWithDigestPrefs = await prisma.notificationPreference.findMany({
      where: {
        frequency: targetFrequency,
        enabled: true,
        channel: { in: [NotificationChannel.EMAIL, NotificationChannel.PUSH] },
      },
      select: { userId: true, type: true, channel: true, frequency: true, enabled: true },
      distinct: ["userId"],
    });

    // Group by userId
    const userIds = [...new Set(usersWithDigestPrefs.map((p) => p.userId))];

    if (userIds.length === 0) {
      console.log(`No users with ${digestType} digest preferences`);
      return NextResponse.json({
        success: true,
        message: `No users with ${digestType} digest preferences`,
        sent: 0,
        duration: `${(Date.now() - startTime) / 1000}s`,
      });
    }

    console.log(`Found ${userIds.length} users for ${digestType} digest`);

    // 5. For each user, collect unread notifications since last digest
    const results = {
      emailsSent: 0,
      pushesSent: 0,
      usersProcessed: 0,
      errors: [] as string[],
    };

    // Process in batches to avoid memory issues
    const BATCH_SIZE = 100;
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);

      for (const userId of batch) {
        try {
          // Get user's digest preferences
          const userPrefs = usersWithDigestPrefs.filter((p) => p.userId === userId);
          
          // Determine which types/channels this user wants in digest
          const digestTypes = new Set(
            userPrefs
              .filter((p) => p.frequency === targetFrequency && p.enabled && p.channel !== NotificationChannel.IN_APP)
              .map((p) => p.type)
          );

          if (digestTypes.size === 0) continue;

          // Calculate time window
          const now = new Date();
          const windowStart = new Date(now);
          if (targetFrequency === NotificationFrequency.DAILY) {
            windowStart.setUTCHours(0, 0, 0, 0); // Start of today UTC
          } else {
            // Weekly: start of week (Monday)
            const day = windowStart.getUTCDay(); // 0 = Sunday
            const diff = day === 0 ? -6 : 1 - day; // Monday
            windowStart.setUTCDate(windowStart.getUTCDate() + diff);
            windowStart.setUTCHours(0, 0, 0, 0);
          }

          // Find unread notifications for this user in the time window
          // that match their digest preferences
          const notifications = await prisma.notification.findMany({
            where: {
              userId,
              type: { in: Array.from(digestTypes) },
              readAt: null,
              createdAt: { gte: windowStart, lt: now },
            },
            orderBy: { createdAt: "desc" },
            take: 50, // Limit to prevent huge digests
          });

          if (notifications.length === 0) continue;

          // Group notifications by channel
          const emailPrefs = userPrefs.filter((p) => p.channel === NotificationChannel.EMAIL && p.enabled);
          const pushPrefs = userPrefs.filter((p) => p.channel === NotificationChannel.PUSH && p.enabled);

          // Send Email Digest
          if (emailPrefs.length > 0 && process.env.SMTP_HOST) {
            const userData = await prisma.twitchUser.findUnique({
              where: { id: userId },
              select: { email: true, displayName: true, username: true },
            });

            if (userData?.email) {
              const user = { email: userData.email, displayName: userData.displayName, username: userData.username };
              // Map notifications to expected format (message -> body)
              const mappedNotifications = notifications.map((n) => ({
                type: n.type,
                title: n.title,
                body: n.message,
                url: n.data && typeof n.data === "object" && n.data !== null && "url" in n.data
                  ? String(n.data.url)
                  : "/benachrichtigungen",
                createdAt: n.createdAt,
              }));
              const emailSent = await sendDigestEmail(user, mappedNotifications, digestType as "daily" | "weekly");
              if (emailSent) results.emailsSent++;
            }
          }

          // Send Push Digest
          if (pushPrefs.length > 0) {
            const pushPayload = {
              title: `${digestType === "weekly" ? "Woechentliche" : "Taegliche"} Zusammenfassung`,
              body: `${notifications.length} neue Benachrichtigung${notifications.length !== 1 ? "en" : ""}`,
              url: "/benachrichtigungen",
              data: { digestType, count: notifications.length },
            };
            const sent = await sendPushToUsers([userId], pushPayload);
            results.pushesSent += sent;
          }

          results.usersProcessed++;
        } catch (error) {
          console.error(`Error processing digest for user ${userId}:`, error);
          results.errors.push(`User ${userId}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`${digestType} digest completed in ${duration}s: ${results.emailsSent} emails, ${results.pushesSent} pushes, ${results.usersProcessed} users`);

    return NextResponse.json({
      success: true,
      status: 200,
      message: `${digestType} digest completed`,
      duration: `${duration}s`,
      ...results,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Cron notification-digest error:", error);
    const err = error as Error;
    return NextResponse.json({
      success: false,
      status: 500,
      error: err.message,
    }, { status: 500 });
  }
}

/**
 * Send digest email to user
 */
async function sendDigestEmail(
  user: { email: string; displayName: string; username: string },
  notifications: Array<{ type: NotificationType; title: string; body: string; url?: string; createdAt: Date }>,
  digestType: "daily" | "weekly"
): Promise<boolean> {
  try {
    // Import nodemailer dynamically (only if email is configured)
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Group notifications by type
    const grouped = new Map<NotificationType, typeof notifications>();
    for (const n of notifications) {
      if (!grouped.has(n.type)) grouped.set(n.type, []);
      grouped.get(n.type)!.push(n);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";
    const unsubscribeUrl = `${siteUrl}/einstellungen/benachrichtigungen`;

    // Build HTML email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${digestType === "weekly" ? "Woechentliche" : "Taegliche"} Zusammenfassung - Nerdiction</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fafafa; border-radius: 12px; padding: 24px;">
            <header style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">${digestType === "weekly" ? "Woechentliche" : "Taegliche"} Zusammenfassung</h1>
              <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Hallo ${user.displayName || user.username},</p>
            </header>

            <p style="margin-bottom: 24px; color: #444;">
              Hier ist deine ${digestType === "weekly" ? "woechentliche" : "taegliche"} Uebersicht neuer Benachrichtigungen auf Nerdiction.
            </p>

            ${Array.from(grouped.entries()).map(([type, items]) => `
              <section style="margin-bottom: 20px;">
                <h2 style="font-size: 16px; color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
                  ${getNotificationTypeLabel(type)} (${items.length})
                </h2>
                <ul style="margin: 0; padding: 0; list-style: none;">
                  ${items.slice(0, 5).map((item) => `
                    <li style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                      <a href="${siteUrl}${item.url || "/benachrichtigungen"}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${escapeHtml(item.title)}</a>
                      <p style="margin: 4px 0 0; font-size: 13px; color: #666;">${escapeHtml(item.body.slice(0, 100))}${item.body.length > 100 ? "..." : ""}</p>
                    </li>
                  `).join("")}
                  ${items.length > 5 ? `<li style="padding: 8px 0; color: #888; font-size: 13px;">... und ${items.length - 5} weitere</li>` : ""}
                </ul>
              </section>
            `).join("")}

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

            <footer style="text-align: center; font-size: 12px; color: #999;">
              <p>Du erhaelst diese E-Mail, weil du in deinen <a href="${unsubscribeUrl}" style="color: #2563eb;">Benachrichtigungseinstellungen</a> ${digestType === "weekly" ? "woechentliche" : "taegliche"} Digests aktiviert hast.</p>
              <p>Nerdiction &middot; <a href="${siteUrl}" style="color: #2563eb;">nerdiction.de</a></p>
            </footer>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Nerdiction" <noreply@nerdiction.de>`,
      to: user.email,
      subject: `${digestType === "weekly" ? "Woechentliche" : "Taegliche"} Zusammenfassung - ${notifications.length} neue Benachrichtigung${notifications.length !== 1 ? "en" : ""}`,
      html,
    });

    return true;
  } catch (error) {
    console.error("Failed to send digest email:", error);
    return false;
  }
}

function getNotificationTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    follow: "Neue Follower",
    collection_update: "Listen-Updates",
    category_new_review: "Neue Reviews in abonnierten Kategorien",
    qa_new_question: "Neue Fragen zu meinen Reviews",
    qa_answer_added: "Antworten auf meine Fragen",
    qa_answer_accepted: "Meine Antwort wurde als Loesung markiert",
    user_series_update: "Updates zu gefolgten Serien",
    user_series_invite: "Einladungen zur Serien-Kollaboration",
    review_comment: "Kommentare zu meinen Reviews",
    review_reaction: "Reaktionen auf meine Reviews",
    review_published: "Neue Reviews veroeffentlichen",
    mention: "Erwaehnungen",
  };
  return labels[type] || type;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/'/g, "&#039;");
}