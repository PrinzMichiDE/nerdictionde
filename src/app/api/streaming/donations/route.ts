import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";

// List recent donations (for the tracker preview) and add test donations.
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const userId = req.nextUrl.searchParams.get("userId") || session.userId;
  const donations = await prisma.streamDonation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ donations, userId });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const donorName = (body?.donorName as string)?.trim() || "Anonym";
  const amount = Number(body?.amount);
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Gültiger Betrag nötig" }, { status: 400 });
  }

  const donation = await prisma.streamDonation.create({
    data: {
      userId: session.userId,
      amount,
      currency: body?.currency || "EUR",
      donorName,
      message: body?.message || null,
      isAnonymous: Boolean(body?.isAnonymous),
    },
  });
  return NextResponse.json({ ok: true, donation });
}
