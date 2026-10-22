import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Returns a transparent donation-tracker overlay HTML for OBS, listing the
// latest donations for a user. Polls itself every 8s for live updates.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const donations = await prisma.streamDonation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const rows = donations
    .map((d) => {
      const name = d.isAnonymous ? "Anonym" : d.donorName;
      const msg = d.message ? ` – „${d.message.replace(/[<>&"]/g, "")}“` : "";
      return `<div class="row"><b>${name}</b> spendete <span class="amt">${d.amount.toFixed(
        2
      )} ${d.currency}</span>${msg}</div>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Donation Tracker</title>
<style>
html,body{margin:0;height:100%;background:transparent;overflow:hidden;font-family:system-ui,sans-serif;}
.wrap{position:fixed;left:24px;bottom:24px;width:360px;max-width:90vw;display:flex;flex-direction:column;gap:8px;}
.row{background:rgba(59,130,246,.18);border-left:3px solid #3b82f6;padding:8px 12px;border-radius:8px;color:#fff;font-size:14px;backdrop-filter:blur(6px);animation:in .4s ease;}
.amt{color:#60a5fa;font-weight:700;}
.title{color:#fff;font-weight:800;font-size:13px;letter-spacing:.15em;text-transform:uppercase;margin-bottom:2px;opacity:.85;}
@keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
</style></head><body><div class="wrap"><div class="title">Spenden</div>${rows}</div>
<script>setTimeout(()=>location.reload(),8000);</script></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "ALLOWALL",
      "Cache-Control": "no-store",
    },
  });
}
