import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const commands = await prisma.chatCommand.findMany({
    where: { userId: session.userId },
    orderBy: { command: "asc" },
  });
  return NextResponse.json({ commands });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const command = (body?.command as string)?.trim();
  const response = (body?.response as string)?.trim();
  if (!command || !response) {
    return NextResponse.json({ error: "Befehl & Antwort nötig" }, { status: 400 });
  }
  const normalized = command.startsWith("!") ? command : `!${command}`;

  await prisma.chatCommand.upsert({
    where: { userId_command: { userId: session.userId, command: normalized } },
    update: {
      response,
      cooldown: Number(body?.cooldown) || 0,
      userLevel: body?.userLevel || "everyone",
      enabled: body?.enabled ?? true,
    },
    create: {
      userId: session.userId,
      command: normalized,
      response,
      cooldown: Number(body?.cooldown) || 0,
      userLevel: body?.userLevel || "everyone",
      enabled: body?.enabled ?? true,
    },
  });

  return NextResponse.json({ ok: true });
}
