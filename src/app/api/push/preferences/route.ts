import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { NotificationType, NotificationChannel } from "@prisma/client";

export const runtime = "nodejs";

// Mapping from old category channels to new NotificationTypes
const CHANNEL_TO_TYPE: Record<string, NotificationType> = {
  games: "review_published",
  movies: "review_published",
  series: "review_published",
  hardware: "review_published",
  deals: "review_published", // Could be a separate type for deals
  forum: "review_published", // Could be a separate type for forum
};

const CHANNELS = ["games", "movies", "series", "hardware", "deals", "forum"] as const;
type Channel = (typeof CHANNELS)[number];

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Get all preferences for this user for IN_APP channel (legacy mapping)
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      userId: session.userId,
      channel: NotificationChannel.IN_APP,
    },
  });

  // Map to old format
  const result: Record<string, boolean> = {};
  for (const c of CHANNELS) {
    const type = CHANNEL_TO_TYPE[c];
    const pref = prefs.find((p) => p.type === type);
    result[c] = pref?.enabled ?? true;
  }
  // categoryNewReviewEmail maps to EMAIL channel for category_new_review
  const emailPref = prefs.find((p) => p.type === "category_new_review" && p.channel === NotificationChannel.EMAIL);
  result.categoryNewReviewEmail = emailPref?.enabled ?? false;

  return NextResponse.json({ preferences: result });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const updates: Array<{ type: NotificationType; channel: NotificationChannel; enabled: boolean }> = [];

  for (const c of CHANNELS) {
    if (typeof body[c] === "boolean") {
      const type = CHANNEL_TO_TYPE[c];
      updates.push({ type, channel: NotificationChannel.IN_APP, enabled: body[c] });
    }
  }
  // Include categoryNewReviewEmail
  if (typeof body.categoryNewReviewEmail === "boolean") {
    updates.push({
      type: "category_new_review",
      channel: NotificationChannel.EMAIL,
      enabled: body.categoryNewReviewEmail,
    });
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Keine Felder" }, { status: 400 });
  }

  // Bulk upsert preferences
  await prisma.$transaction(
    updates.map((u) =>
      prisma.notificationPreference.upsert({
        where: {
          userId_type_channel: {
            userId: session.userId,
            type: u.type,
            channel: u.channel,
          },
        },
        update: { enabled: u.enabled },
        create: { userId: session.userId, type: u.type, channel: u.channel, enabled: u.enabled },
      })
    )
  );

  return NextResponse.json({ ok: true });
}