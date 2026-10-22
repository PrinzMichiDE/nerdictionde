import webpush from "web-push";
import prisma from "@/lib/prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@nerdiction.de";

let configured = false;

function ensureConfig() {
  if (configured) return;
  if (PUBLIC_KEY && PRIVATE_KEY) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  }
}

export function isPushConfigured() {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return PUBLIC_KEY ?? null;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  ensureConfig();
  if (!configured) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    // 404/410 means the subscription is no longer valid
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) return false;
    return false;
  }
}

// Notify all subscribers that opted into `channel` about new content.
// `channel` maps to NotificationPreference fields (games/movies/series/hardware/deals/forum).
export async function notifySubscribers(
  channel: "games" | "movies" | "series" | "hardware" | "deals" | "forum",
  payload: PushPayload
): Promise<number> {
  ensureConfig();
  if (!configured) return 0;

  const subs = await prisma.pushSubscription.findMany({
    where: {
      user: { notificationPrefs: { [channel]: true } },
    },
    select: { endpoint: true, p256dh: true, auth: true },
  });

  let sent = 0;
  for (const sub of subs) {
    const ok = await sendPush(sub, payload);
    if (ok) sent++;
  }
  return sent;
}
