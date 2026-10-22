import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Returns the generated overlay HTML for a saved StreamOverlay (OBS embed).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const overlay = await prisma.streamOverlay.findUnique({ where: { id } });
  if (!overlay) return new NextResponse("Not found", { status: 404 });

  const config = (overlay.config as { html?: string }) ?? {};
  const html = config.html ?? "";

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "ALLOWALL",
      "Cache-Control": "no-store",
    },
  });
}
