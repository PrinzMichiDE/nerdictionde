/**
 * Cron Job: Backfill SEO, tags, and comments for reviews that are missing them.
 * Schedule: Daily at 8:00 UTC (0 8 * * *)
 *
 * Finds up to 10 reviews per run that have no comments or empty metaDescription,
 * then runs the same enrichment pipeline as POST /api/reviews/[id]/enrich.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { enrichReviewById } from "@/lib/review-enrichment";

const MAX_PER_RUN = 10;

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidates = await prisma.review.findMany({
      where: {
        OR: [
          { metaDescription: null },
          { metaDescription: "" },
          { comments: { none: {} } },
        ],
      },
      select: { id: true },
      orderBy: { updatedAt: "asc" },
      take: MAX_PER_RUN,
    });

    const results: Array<{ id: string; seo?: boolean; tags?: boolean; comments?: boolean; error?: string }> = [];

    for (const { id } of candidates) {
      const result = await enrichReviewById(id);
      results.push({
        id,
        seo: result.seo,
        tags: result.tags,
        comments: result.comments,
        error: result.error,
      });
      await new Promise((r) => setTimeout(r, 500));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Backfill review enrichment error:", error);
    return NextResponse.json(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
