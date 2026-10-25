import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { checkNotificationMutesEnabled, checkEnhancedNotificationPrefsEnabled } from "@/lib/notification-preferences-schema";
import { unmuteTarget } from "@/lib/notification-mutes";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * DELETE /api/user/notification-mutes/[id]
 * Removes a mute by ID for the authenticated user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Mute ID erforderlich" }, { status: 400 });
  }

  try {
    const result = await unmuteTarget(session.userId, id);
    if (!result.unmuted) {
      return NextResponse.json({ error: "Mute nicht gefunden oder keine Berechtigung" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, unmuted: true });
  } catch (err) {
    console.error("[NotificationMutes] Delete failed:", err);
    return NextResponse.json({ error: "Entstummen fehlgeschlagen" }, { status: 500 });
  }
}