import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { checkPushNotificationsEnabled, checkEnhancedNotificationPrefsEnabled } from "@/lib/notification-preferences-schema";
import { getUserPushSubscription, savePushSubscription, deletePushSubscription, getVapidPublicKey, isPushConfigured } from "@/lib/push-notifications";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * GET /api/user/push-subscription
 * Returns the current push subscription and VAPID public key for the authenticated user
 */
export async function GET(_req: NextRequest) {
  try {
    checkPushNotificationsEnabled();
    checkEnhancedNotificationPrefsEnabled();
  } catch {
    return NextResponse.json({ error: "Feature deaktiviert" }, { status: 403 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push nicht konfiguriert (VAPID Keys fehlen)" }, { status: 503 });
  }

  const subscription = await getUserPushSubscription(session.userId);

  return NextResponse.json({
    subscribed: !!subscription,
    endpoint: subscription?.endpoint ?? null,
    vapidPublicKey: getVapidPublicKey(),
  });
}

/**
 * POST /api/user/push-subscription
 * Creates or updates a push subscription for the authenticated user
 * Body: { endpoint: string, p256dh: string, auth: string }
 */
export async function POST(req: NextRequest) {
  try {
    checkPushNotificationsEnabled();
    checkEnhancedNotificationPrefsEnabled();
  } catch {
    return NextResponse.json({ error: "Feature deaktiviert" }, { status: 403 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push nicht konfiguriert (VAPID Keys fehlen)" }, { status: 503 });
  }

  // Rate limit: 10 requests per minute (subscription changes are less frequent)
  const rl = await rateLimit(req, { key: `push-sub:${session.userId}`, limit: 10, window: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const { endpoint, p256dh, auth } = body;

  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "Ungültiger Endpoint" }, { status: 400 });
  }

  if (typeof p256dh !== "string" || p256dh.length === 0) {
    return NextResponse.json({ error: "p256dh key erforderlich" }, { status: 400 });
  }

  if (typeof auth !== "string" || auth.length === 0) {
    return NextResponse.json({ error: "auth key erforderlich" }, { status: 400 });
  }

  try {
    await savePushSubscription(session.userId, endpoint, p256dh, auth, req.headers.get("user-agent") ?? undefined);
    return NextResponse.json({ ok: true, subscribed: true });
  } catch (err) {
    console.error("[PushSubscription] Save failed:", err);
    return NextResponse.json({ error: "Subscription speichern fehlgeschlagen" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/push-subscription
 * Removes the push subscription for the authenticated user
 */
export async function DELETE(req: NextRequest) {
  try {
    checkPushNotificationsEnabled();
    checkEnhancedNotificationPrefsEnabled();
  } catch {
    return NextResponse.json({ error: "Feature deaktiviert" }, { status: 403 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push nicht konfiguriert (VAPID Keys fehlen)" }, { status: 503 });
  }

  // Rate limit: 10 requests per minute
  const rl = await rateLimit(req, { key: `push-sub:${session.userId}`, limit: 10, window: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  try {
    const deleted = await deletePushSubscription(session.userId);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("[PushSubscription] Delete failed:", err);
    return NextResponse.json({ error: "Subscription löschen fehlgeschlagen" }, { status: 500 });
  }
}