import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Returns the raw, self-contained HTML of a game overlay so OBS can load it
// directly as a browser source. Framing is allowed via next.config headers.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const overlay = await prisma.gameOverlay.findUnique({ where: { slug } });
  if (!overlay) {
    return new NextResponse("Overlay not found", { status: 404 });
  }

  // Track a view/download
  await prisma.gameOverlay
    .update({
      where: { slug },
      data: { downloads: { increment: 1 } },
    })
    .catch(() => {});

  return new NextResponse(overlay.htmlCode, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "ALLOWALL",
      "Cache-Control": "public, max-age=300",
    },
  });
}
