import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulk } from "@/lib/igdb";
import { getTMDBMoviesBulk, getTMDBSeriesBulk } from "@/lib/tmdb";
import { processGame, processMovie, processSeries } from "@/lib/review-generation";
import prisma from "@/lib/prisma";

/**
 * Cron Job: Generates reviews from all categories daily
 * Categories: game, movie, series
 * Schedule: Daily at midnight (0 0 * * *)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Check for authorization (Vercel Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("⚠️ Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      game: { success: false, reviewId: null as string | null, error: null as string | null },
      movie: { success: false, reviewId: null as string | null, error: null as string | null },
      series: { success: false, reviewId: null as string | null, error: null as string | null },
    };

    // 2. Generate Game Review
    try {
      console.log("🎮 Generating game review...");
      const games = await getIGDBGamesBulk({
        sortBy: "release_date",
        order: "desc",
        limit: 50,
      });

      if (games && games.length > 0) {
        const existingIgdbIds = await prisma.review.findMany({
          where: { igdbId: { in: games.map((g: any) => g.id) }, category: "game" },
          select: { igdbId: true },
        });

        const existingIdsSet = new Set(existingIgdbIds.map((r: { igdbId: number | null }) => r.igdbId));
        const newGames = games.filter((g: any) => !existingIdsSet.has(g.id));

        if (newGames.length > 0) {
          const game = newGames[0];
          const result = await processGame(game, { status: "published", skipExisting: true });

          if (result.success && result.reviewId) {
            results.game.success = true;
            results.game.reviewId = result.reviewId;
            console.log(`✅ Game review created: ${game.name}`);
          } else {
            results.game.error = result.error || "Unknown error";
          }
        } else {
          results.game.error = "No new games available";
        }
      } else {
        results.game.error = "No games found";
      }
    } catch (error: any) {
      results.game.error = error.message;
      console.error("Error generating game review:", error);
    }

    // Delay between categories to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Generate Movie Review
    try {
      console.log("🎬 Generating movie review...");
      const movies = await getTMDBMoviesBulk({ sortBy: "release_date", order: "desc", limit: 50 });

      if (movies && movies.length > 0) {
        const existingTmdbIds = await prisma.review.findMany({
          where: { tmdbId: { in: movies.map((m: any) => m.id) }, category: "movie" },
          select: { tmdbId: true },
        });

        const existingIdsSet = new Set(existingTmdbIds.map((r: any) => r.tmdbId).filter(Boolean));
        const newMovies = movies.filter((m: any) => !existingIdsSet.has(m.id));

        if (newMovies.length > 0) {
          const movie = newMovies[0];
          const result = await processMovie(movie, { status: "published", skipExisting: true });

          if (result.success && result.reviewId) {
            results.movie.success = true;
            results.movie.reviewId = result.reviewId;
            console.log(`✅ Movie review created: ${movie.title}`);
          } else {
            results.movie.error = result.error || "Unknown error";
          }
        } else {
          results.movie.error = "No new movies available";
        }
      } else {
        results.movie.error = "No movies found";
      }
    } catch (error: any) {
      results.movie.error = error.message;
      console.error("Error generating movie review:", error);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Generate Series Review
    try {
      console.log("📺 Generating series review...");
      const series = await getTMDBSeriesBulk({ sortBy: "release_date", order: "desc", limit: 50 });

      if (series && series.length > 0) {
        const existingTmdbIds = await prisma.review.findMany({
          where: { tmdbId: { in: series.map((s: any) => s.id) }, category: "series" },
          select: { tmdbId: true },
        });

        const existingIdsSet = new Set(existingTmdbIds.map((r: any) => r.tmdbId).filter(Boolean));
        const newSeries = series.filter((s: any) => !existingIdsSet.has(s.id));

        if (newSeries.length > 0) {
          const serie = newSeries[0];
          const result = await processSeries(serie, { status: "published", skipExisting: true });

          if (result.success && result.reviewId) {
            results.series.success = true;
            results.series.reviewId = result.reviewId;
            console.log(`✅ Series review created: ${serie.name}`);
          } else {
            results.series.error = result.error || "Unknown error";
          }
        } else {
          results.series.error = "No new series available";
        }
      } else {
        results.series.error = "No series found";
      }
    } catch (error: any) {
      results.series.error = error.message;
      console.error("Error generating series review:", error);
    }

    const totalSuccessful = Object.values(results).filter((r) => r.success).length;
    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      success: true,
      status: 200,
      message: `Cron completed. ${totalSuccessful}/3 categories successful.`,
      duration: `${duration}s`,
      results,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cron category review generation error:", error);
    return NextResponse.json({
      success: false,
      status: 500,
      error: error.message,
    }, { status: 500 });
  }
}
