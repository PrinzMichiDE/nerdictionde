import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { regenerateZeroScoreReview } from "@/lib/review-generation";

const MAX_PER_RUN = 5;

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const candidates = await prisma.review.findMany({
      where: {
        score: 0,
        createdAt: { lt: thirtyDaysAgo },
        releaseDate: { not: null, lte: oneDayAgo },
        status: "published",
      },
      select: { id: true, title: true, category: true, releaseDate: true },
      orderBy: { createdAt: "asc" },
      take: MAX_PER_RUN,
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No zero-score reviews older than 30 days found.",
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const results: Array<{
      id: string;
      title: string;
      category: string;
      success: boolean;
      newScore?: number;
      error?: string;
    }> = [];

    for (const candidate of candidates) {
      console.log(`🔄 Regenerating: ${candidate.title} (${candidate.category})`);

      try {
        const result = await regenerateZeroScoreReview(candidate.id);
        results.push({
          id: candidate.id,
          title: candidate.title,
          category: candidate.category,
          success: result.success,
          newScore: result.newScore,
          error: result.error,
        });

        if (result.success) {
          console.log(`✅ ${candidate.title} → new score: ${result.newScore}`);
        } else {
          console.error(`❌ ${candidate.title}: ${result.error}`);
        }
      } catch (error: any) {
        results.push({
          id: candidate.id,
          title: candidate.title,
          category: candidate.category,
          success: false,
          error: error.message,
        });
        console.error(`❌ ${candidate.title}: ${error.message}`);
      }

      // Delay between items to respect API rate limits
      if (candidates.indexOf(candidate) < candidates.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    const successful = results.filter((r) => r.success).length;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      message: `${successful}/${results.length} zero-score reviews regenerated.`,
      results,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Regenerate zero-score reviews cron error:", error);
    return NextResponse.json(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
