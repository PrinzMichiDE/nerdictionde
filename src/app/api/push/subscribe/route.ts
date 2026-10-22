import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { getVapidPublicKey } from "@/lib/webpush";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const pubKey = getVapidPublicKey();
  const existing = await prisma.pushSubscription.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });

  return NextResponse.json({
    publicKey: pubKey,
    configured: Boolean(pubKey),
    subscribed: Boolean(existing),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { endpoint, p256dh, auth } = body ?? {};
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Ungültige Subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.userId, p256dh, auth },
    create: { userId: session.userId, endpoint, p256dh, auth },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const endpoint = new URL(req.url).searchParams.get("endpoint");
  if (endpoint) {
    await prisma.pushSubscription
      .deleteMany({ where: { userId: session.userId, endpoint } })
      .catch(() => {});
  } else {
    await prisma.pushSubscription
      .deleteMany({ where: { userId: session.userId } })
      .catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
