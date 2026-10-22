import { NextRequest, NextResponse } from "next/server";
import { buildOverlayHtml, type OverlayConfig } from "@/lib/overlay-generator";

export const runtime = "nodejs";

// Returns generated overlay HTML for live preview without saving.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.template) {
    return NextResponse.json({ error: "Ungültig" }, { status: 400 });
  }

  const config: OverlayConfig = {
    template: body.template,
    title: body.title || "",
    subtitle: body.subtitle || "",
    color1: body.color1 || "#3b82f6",
    color2: body.color2 || "#8b5cf6",
    textColor: body.textColor || "#ffffff",
    targetDate: body.targetDate,
    font: body.font,
  };

  const html = buildOverlayHtml(config);
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
