import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulk } from "@/lib/igdb";
import { getTMDBMoviesBulk, getTMDBSeriesBulk } from "@/lib/tmdb";
import { processGame, processMovie, processSeries } from "@/lib/review-generation";
import prisma from "@/lib/prisma";

// To avoid timeouts, we process items one by one or in small batches
// Vercel's hobby plan has a 10s timeout, Pro has 300s.
// Since AI generation takes time, we should be careful.

export async function GET(req: NextRequest) {
  try {
    // 1. Check for authorization (Vercel Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const overallResults = {
      games: { attempted: 0, successful: 0, failed: 0, reviews: [] as any[] },
      movies: { attempted: 0, successful: 0, failed: 0, reviews: [] as any[] },
      series: { attempted: 0, successful: 0, failed: 0, reviews: [] as any[] },
    };

    // 2. Process Games
    try {
      const games = await getIGDBGamesBulk({
        sortBy: "release_date",
        order: "desc",
        limit: 20,
      });

      if (games && games.length > 0) {
        // Filter out games that already have reviews
        const existingIgdbIds = await prisma.review.findMany({
          where: {
            igdbId: {
              in: games.map((g: any) => g.id),
            },
            category: "game",
          },
          select: {
            igdbId: true,
          },
        });

        const existingIdsSet = new Set(existingIgdbIds.map((r) => r.igdbId));
        const newGames = games.filter((g: any) => !existingIdsSet.has(g.id));

        if (newGames.length > 0) {
          // Take top 2 newest games (reduced to make room for movies/series)
          const gamesToReview = newGames.slice(0, 2);
          overallResults.games.attempted = gamesToReview.length;

          for (const game of gamesToReview) {
            const result = await processGame(game, {
              status: "published",
              skipExisting: true,
            });

            if (result.success) {
              overallResults.games.successful++;
              overallResults.games.reviews.push({ id: result.reviewId, name: game.name });
            } else {
              overallResults.games.failed++;
              console.error(`Failed to auto-generate review for game ${game.name}:`, result.error);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error processing games:", error);
      overallResults.games.failed = overallResults.games.attempted;
    }

    // 3. Process Movies
    try {
      const movies = await getTMDBMoviesBulk({
        sortBy: "release_date",
        order: "desc",
        limit: 20,
      });

      if (movies && movies.length > 0) {
        // Filter out movies that already have reviews
        const existingTmdbIds = await prisma.review.findMany({
          where: {
            tmdbId: {
              in: movies.map((m: any) => m.id),
            },
            category: "movie",
          },
          select: {
            tmdbId: true,
          },
        });

        const existingIdsSet = new Set(existingTmdbIds.map((r) => r.tmdbId));
        const newMovies = movies.filter((m: any) => !existingIdsSet.has(m.id));

        if (newMovies.length > 0) {
          // Take top 2 newest movies
          const moviesToReview = newMovies.slice(0, 2);
          overallResults.movies.attempted = moviesToReview.length;

          for (const movie of moviesToReview) {
            const result = await processMovie(movie, {
              status: "published",
              skipExisting: true,
            });

            if (result.success) {
              overallResults.movies.successful++;
              overallResults.movies.reviews.push({ id: result.reviewId, name: movie.title });
            } else {
              overallResults.movies.failed++;
              console.error(`Failed to auto-generate review for movie ${movie.title}:`, result.error);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error processing movies:", error);
      overallResults.movies.failed = overallResults.movies.attempted;
    }

    // 4. Process Series
    try {
      const series = await getTMDBSeriesBulk({
        sortBy: "release_date",
        order: "desc",
        limit: 20,
      });

      if (series && series.length > 0) {
        // Filter out series that already have reviews
        const existingTmdbIds = await prisma.review.findMany({
          where: {
            tmdbId: {
              in: series.map((s: any) => s.id),
            },
            category: "series",
          },
          select: {
            tmdbId: true,
          },
        });

        const existingIdsSet = new Set(existingTmdbIds.map((r) => r.tmdbId));
        const newSeries = series.filter((s: any) => !existingIdsSet.has(s.id));

        if (newSeries.length > 0) {
          // Take top 1 newest series (to keep total around 5 reviews per day)
          const seriesToReview = newSeries.slice(0, 1);
          overallResults.series.attempted = seriesToReview.length;

          for (const serie of seriesToReview) {
            const result = await processSeries(serie, {
              status: "published",
              skipExisting: true,
            });

            if (result.success) {
              overallResults.series.successful++;
              overallResults.series.reviews.push({ id: result.reviewId, name: serie.name });
            } else {
              overallResults.series.failed++;
              console.error(`Failed to auto-generate review for series ${serie.name}:`, result.error);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error processing series:", error);
      overallResults.series.failed = overallResults.series.attempted;
    }

    const totalSuccessful = 
      overallResults.games.successful + 
      overallResults.movies.successful + 
      overallResults.series.successful;

    return NextResponse.json({
      message: `Auto-review process completed. ${totalSuccessful} reviews created (${overallResults.games.successful} games, ${overallResults.movies.successful} movies, ${overallResults.series.successful} series).`,
      results: overallResults,
    });
  } catch (error: any) {
    console.error("Cron auto-review error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

