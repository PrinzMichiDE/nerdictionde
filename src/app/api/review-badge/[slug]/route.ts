import { NextResponse } from "next/server";
import { getVerdict, getScoreColor } from "@/lib/review-category";

function getScoreColorHex(score: number): string {
  // Map CSS variable colors to hex for standalone SVG (no CSS context on external sites)
  const colorMap: Record<string, string> = {
    "var(--chart-3)": "#15803d", // green (90+)
    "var(--chart-2)": "#0ea5e9", // blue (75+)
    "var(--chart-4)": "#f59e0b", // amber (50+)
    "var(--chart-1)": "#ef4444", // red (25+)
    "var(--destructive)": "#dc2626", // red (<25)
  };
  return colorMap[getScoreColor(score)] ?? "#ef4444";
}

export async function GET(
  _request: Request
) {

  // We don't fetch the review here to keep this edge-compatible and fast.
  // The score is passed via query parameter; fall back to a generic badge if missing.
  const url = new URL(_request.url);
  const scoreParam = url.searchParams.get("score");
  const score = scoreParam ? Math.max(0, Math.min(100, parseInt(scoreParam, 10))) : 0;
  const verdict = getVerdict(score);
  const color = getScoreColorHex(score);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 60" role="img" aria-label="Getestet von Nerdiction: ${verdict} (${score}/100)">
  <defs>
    <linearGradient id="badgeBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="1" stop-color="#f8fafc" stop-opacity="1" />
    </linearGradient>
    <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.12" />
    </filter>
  </defs>

  <rect width="260" height="60" rx="8" fill="url(#badgeBg)" stroke="#e2e8f0" filter="url(#badgeShadow)" />

  {/* Nerdiction brand mark */}
  <circle cx="22" cy="30" r="14" fill="#1e3a8a" />
  <text x="22" y="34" font-family="Georgia, 'Times New Roman', serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">N</text>

  {/* Label */}
  <text x="52" y="22" font-family="Public Sans, Arial, sans-serif" font-size="10" font-weight="600" fill="#334155" letter-spacing="0.4">GETESTET VON</text>
  <text x="52" y="36" font-family="Libre Bodoni, Georgia, serif" font-size="13" font-weight="600" fill="#0f172a">Nerdiction</text>

  {/* Score chip */}
  <rect x="198" y="14" width="50" height="32" rx="6" fill="${color}" />
  <text x="223" y="34" font-family="Public Sans, Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${score}</text>
  <text x="223" y="47" font-family="Public Sans, Arial, sans-serif" font-size="7" font-weight="600" fill="rgba(255,255,255,0.8)" text-anchor="middle" dominant-baseline="middle">/100</text>
</svg>
`.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
