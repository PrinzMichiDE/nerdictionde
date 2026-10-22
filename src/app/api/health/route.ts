import { NextResponse } from "next/server";

/**
 * Liveness endpoint used by the Docker HEALTHCHECK and by the container
 * smoke test in the GitHub Actions pipeline. It intentionally does not touch
 * the database, so an image can be validated without a running Postgres.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
