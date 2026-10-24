import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";

const CHANNELS = ["games", "movies", "series", "hardware", "deals", "forum"] as const;
type Channel = (typeof CHANNELS)[number];

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.userId },
  });

  const result: Record<string, boolean> = {};
  for (const c of CHANNELS) result[c] = prefs?.[c as Channel] ?? true;
  // Include categoryNewReviewEmail (default false)
  result.categoryNewReviewEmail = prefs?.categoryNewReviewEmail ?? false;

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

  const data: Record<string, boolean> = {};
  for (const c of CHANNELS) {
    if (typeof body[c] === "boolean") data[c] = body[c];
  }
  // Include categoryNewReviewEmail
  if (typeof body.categoryNewReviewEmail === "boolean") {
    data.categoryNewReviewEmail = body.categoryNewReviewEmail;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Keine Felder" }, { status: 400 });
  }

  await prisma.notificationPreference.upsert({
    where: { userId: session.userId },
    update: data,
    create: { userId: session.userId, ...data },
  });

  return NextResponse.json({ ok: true });
}
