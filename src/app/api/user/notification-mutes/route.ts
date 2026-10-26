import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { MuteTargetType } from "@prisma/client";
import { checkNotificationMutesEnabled, checkEnhancedNotificationPrefsEnabled } from "@/lib/notification-preferences-schema";
import { getUserMutes, muteTarget, resolveMuteTargets } from "@/lib/notification-mutes";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * GET /api/user/notification-mutes
 * Returns all mutes for the authenticated user with resolved target info
 */
export async function GET(_req: NextRequest) {
  try {
    checkNotificationMutesEnabled();
    checkEnhancedNotificationPrefsEnabled();
  } catch {
    return NextResponse.json({ error: "Feature deaktiviert" }, { status: 403 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const mutes = await getUserMutes(session.userId);
  const resolved = await resolveMuteTargets(mutes);

  return NextResponse.json({ mutes: resolved });
}

/**
 * POST /api/user/notification-mutes
 * Creates a new mute for the authenticated user
 * Body: { targetType: "REVIEW" | "COLLECTION" | "SERIES" | "USER", targetId: string }
 */
export async function POST(req: NextRequest) {
  try {
    checkNotificationMutesEnabled();
    checkEnhancedNotificationPrefsEnabled();
  } catch {
    return NextResponse.json({ error: "Feature deaktiviert" }, { status: 403 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Rate limit: 30 requests per minute
  const rl = await rateLimit(req, { key: `notif-mutes:${session.userId}`, limit: 30, window: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const { targetType, targetId } = body;

  if (!Object.values(MuteTargetType).includes(targetType)) {
    return NextResponse.json({ error: `Ungültiger MuteTargetType: ${targetType}` }, { status: 400 });
  }

  if (typeof targetId !== "string" || targetId.length === 0) {
    return NextResponse.json({ error: "targetId ist erforderlich" }, { status: 400 });
  }

  try {
    const result = await muteTarget(session.userId, targetType, targetId);
    return NextResponse.json({ ok: true, muteId: result.muteId, muted: result.muted });
  } catch (err) {
    console.error("[NotificationMutes] Create failed:", err);
    return NextResponse.json({ error: "Stummschaltung fehlgeschlagen" }, { status: 500 });
  }
}