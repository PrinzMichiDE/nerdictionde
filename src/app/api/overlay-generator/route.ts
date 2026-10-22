import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { buildOverlayHtml, type OverlayConfig } from "@/lib/overlay-generator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Ungültig" }, { status: 400 });

  const {
    name,
    template,
    title,
    subtitle,
    color1,
    color2,
    textColor,
    targetDate,
    font,
  } = body;

  if (!name || !template) {
    return NextResponse.json({ error: "Name & Vorlage fehlen" }, { status: 400 });
  }

  const config: OverlayConfig = {
    template,
    title: title || "",
    subtitle: subtitle || "",
    color1: color1 || "#3b82f6",
    color2: color2 || "#8b5cf6",
    textColor: textColor || "#ffffff",
    targetDate,
    font,
  };

  const html = buildOverlayHtml(config);

  const overlay = await prisma.streamOverlay.create({
    data: {
      userId: session.userId,
      name,
      config: { ...config, html },
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, id: overlay.id });
}
