import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulk } from "@/lib/igdb";
import { processGame } from "@/lib/review-generation";
import prisma from "@/lib/prisma";

// To avoid timeouts, we process games one by one or in small batches
// Vercel's hobby plan has a 10s timeout, Pro has 300s.
// Since AI generation takes time, we should be careful.

export async function GET(req: NextRequest) {
  try {
    // 1. Check for authorization (Vercel Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch latest games from IGDB
    // We fetch a larger pool to filter out existing ones
    const games = await getIGDBGamesBulk({
      sortBy: "release_date",
      order: "desc",
      limit: 20,
    });

    if (!games || games.length === 0) {
      return NextResponse.json({ message: "No games found from IGDB" });
    }

    // 3. Filter out games that already have reviews
    const existingIgdbIds = await prisma.review.findMany({
      where: {
        igdbId: {
          in: games.map((g: any) => g.id),
        },
      },
      select: {
        igdbId: true,
      },
    });

    const existingIdsSet = new Set(existingIgdbIds.map((r) => r.igdbId));
    const newGames = games.filter((g: any) => !existingIdsSet.has(g.id));

    if (newGames.length === 0) {
      return NextResponse.json({ message: "No new games to review today" });
    }

    // 4. Take top 5 newest games
    const gamesToReview = newGames.slice(0, 5);

    const results = {
      attempted: gamesToReview.length,
      successful: 0,
      failed: 0,
      reviews: [] as any[],
    };

    // 5. Process games
    // Note: We do this sequentially to avoid hitting OpenAI rate limits 
    // and to stay within execution time limits if possible.
    for (const game of gamesToReview) {
      const result = await processGame(game, {
        status: "published",
        skipExisting: true,
      });

      if (result.success) {
        results.successful++;
        results.reviews.push({ id: result.reviewId, name: game.name });
      } else {
        results.failed++;
        console.error(`Failed to auto-generate review for ${game.name}:`, result.error);
      }
    }

    return NextResponse.json({
      message: `Auto-review process completed. ${results.successful} reviews created.`,
      results,
    });
  } catch (error: any) {
    console.error("Cron auto-review error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

