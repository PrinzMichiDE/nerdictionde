import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { NotificationType, NotificationChannel, NotificationFrequency } from "@prisma/client";
import { checkEnhancedNotificationPrefsEnabled } from "@/lib/notification-preferences-schema";
import { getUserPreferences, updateUserPreferences } from "@/lib/notification-preferences";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * GET /api/user/notification-preferences
 * Returns all preferences for the authenticated user, grouped by type
 */
export async function GET(req: NextRequest) {
  try {
    checkEnhancedNotificationPrefsEnabled();
  } catch {
    return NextResponse.json({ error: "Feature deaktiviert" }, { status: 403 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const preferences = await getUserPreferences(session.userId);

  return NextResponse.json({ preferences });
}

/**
 * PATCH /api/user/notification-preferences
 * Bulk updates preferences for the authenticated user
 * Body: { preferences: Array<{ type, channel, frequency?, enabled }> }
 */
export async function PATCH(req: NextRequest) {
  try {
    checkEnhancedNotificationPrefsEnabled();
  } catch {
    return NextResponse.json({ error: "Feature deaktiviert" }, { status: 403 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Rate limit: 30 requests per minute
  const rl = await rateLimit(req, { key: `notif-prefs:${session.userId}`, limit: 30, window: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray(body.preferences)) {
    return NextResponse.json({ error: "Ungültige Daten: 'preferences' Array erwartet" }, { status: 400 });
  }

  const updates = body.preferences;
  if (updates.length === 0) {
    return NextResponse.json({ error: "Mindestens eine Preference erforderlich" }, { status: 400 });
  }

  // Validate each update
  for (const u of updates) {
    if (!Object.values(NotificationType).includes(u.type)) {
      return NextResponse.json({ error: `Ungültiger NotificationType: ${u.type}` }, { status: 400 });
    }
    if (!Object.values(NotificationChannel).includes(u.channel)) {
      return NextResponse.json({ error: `Ungültiger NotificationChannel: ${u.channel}` }, { status: 400 });
    }
    if (u.frequency !== undefined && !Object.values(NotificationFrequency).includes(u.frequency)) {
      return NextResponse.json({ error: `Ungültige NotificationFrequency: ${u.frequency}` }, { status: 400 });
    }
    if (typeof u.enabled !== "boolean") {
      return NextResponse.json({ error: "Feld 'enabled' muss boolean sein" }, { status: 400 });
    }
  }

  try {
    await updateUserPreferences(session.userId, updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[NotificationPreferences] Update failed:", err);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
  }
}