import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulk } from "@/lib/igdb";
import { getTMDBMoviesBulk, getTMDBSeriesBulk } from "@/lib/tmdb";
import { processGame, processMovie, processSeries, processAmazonProduct } from "@/lib/review-generation";
import { processHardware } from "@/app/api/reviews/bulk-create-hardware/route";
import prisma from "@/lib/prisma";

/**
 * Cron Job: Generates one review from each category every 30 minutes
 * Categories: game, hardware, amazon, movie, series
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Check for authorization (Vercel Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      game: { success: false, reviewId: null as string | null, error: null as string | null },
      hardware: { success: false, reviewId: null as string | null, error: null as string | null },
      amazon: { success: false, reviewId: null as string | null, error: null as string | null },
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

        const existingIdsSet = new Set(existingIgdbIds.map((r: { igdbId: number | null }) => r.igdbId));
        const newGames = games.filter((g: any) => !existingIdsSet.has(g.id));

        if (newGames.length > 0) {
          // Take the first available game
          const game = newGames[0];
          const result = await processGame(game, {
            status: "published",
            skipExisting: true,
          });

          if (result.success && result.reviewId) {
            results.game.success = true;
            results.game.reviewId = result.reviewId;
            console.log(`✅ Game review created: ${game.name}`);
          } else {
            results.game.error = result.error || "Unknown error";
            console.error(`❌ Failed to create game review: ${result.error}`);
          }
        } else {
          results.game.error = "No new games available";
          console.log("⚠️  No new games available for review");
        }
      } else {
        results.game.error = "No games found";
      }
    } catch (error: any) {
      results.game.error = error.message;
      console.error("Error generating game review:", error);
    }

    // 3. Generate Hardware Review
    try {
      console.log("💻 Generating hardware review...");
      
      // Get a list of popular hardware items to choose from
      const popularHardware = [
        "NVIDIA RTX 4090",
        "AMD Ryzen 9 7950X",
        "Intel Core i9-14900K",
        "ASUS ROG Strix RTX 4080",
        "Samsung Odyssey G9",
        "Logitech MX Master 3S",
        "Corsair K70 RGB TKL",
        "SteelSeries Arctis Nova Pro",
        "PlayStation 5",
        "Xbox Series X",
      ];

      // Check which hardware items already have reviews
      const existingHardwareReviews = await prisma.review.findMany({
        where: {
          category: "hardware",
        },
        include: {
          hardware: true,
        },
      });

      const existingHardwareNames = new Set(
        existingHardwareReviews
          .map((r: { hardware: { name: string } | null }) => r.hardware?.name)
          .filter(Boolean)
      );

      // Find first hardware item without a review
      const hardwareToReview = popularHardware.find(
        (name) => !existingHardwareNames.has(name)
      );

      if (hardwareToReview) {
        const result = await processHardware(hardwareToReview, {
          status: "published",
          skipExisting: true,
          generateImages: true,
        });

        if (result.success && result.reviewId) {
          results.hardware.success = true;
          results.hardware.reviewId = result.reviewId;
          console.log(`✅ Hardware review created: ${hardwareToReview}`);
        } else {
          results.hardware.error = result.error || "Unknown error";
          console.error(`❌ Failed to create hardware review: ${result.error}`);
        }
      } else {
        // Try to get a random hardware item from database
        const randomHardware = await prisma.hardware.findFirst({
          where: {
            reviews: {
              none: {},
            },
          },
        });

        if (randomHardware) {
          const result = await processHardware(randomHardware.name, {
            status: "published",
            skipExisting: true,
            generateImages: true,
          });

          if (result.success && result.reviewId) {
            results.hardware.success = true;
            results.hardware.reviewId = result.reviewId;
            console.log(`✅ Hardware review created: ${randomHardware.name}`);
          } else {
            results.hardware.error = result.error || "Unknown error";
          }
        } else {
          results.hardware.error = "No hardware available for review";
          console.log("⚠️  No hardware available for review");
        }
      }
    } catch (error: any) {
      results.hardware.error = error.message;
      console.error("Error generating hardware review:", error);
    }

    // 4. Generate Amazon Review
    try {
      console.log("🛒 Generating Amazon review...");
      
      // Popular Amazon products to review
      const popularAmazonProducts = [
        { name: "Echo Dot (5. Generation)", asin: "B09B8V1LZ3" },
        { name: "Fire TV Stick 4K", asin: "B08C1W5N87" },
        { name: "Kindle Paperwhite", asin: "B08KTZ8249" },
        { name: "Ring Video Doorbell", asin: "B08N5NQ869" },
        { name: "Blink Outdoor Camera", asin: "B08FM85V85" },
      ];

      // Check which products already have reviews
      const existingAmazonReviews = await prisma.review.findMany({
        where: {
          category: "amazon",
        },
        select: {
          amazonAsin: true,
        },
      });

      const existingAsins = new Set(
        existingAmazonReviews.map((r: { amazonAsin: string | null }) => r.amazonAsin).filter(Boolean)
      );

      // Find first product without a review
      const productToReview = popularAmazonProducts.find(
        (p) => !existingAsins.has(p.asin)
      );

      if (productToReview) {
        const result = await processAmazonProduct(
          {
            name: productToReview.name,
            asin: productToReview.asin,
          },
          {
            status: "published",
            skipExisting: true,
            generateImages: true,
          }
        );

        if (result.success && result.reviewId) {
          results.amazon.success = true;
          results.amazon.reviewId = result.reviewId;
          console.log(`✅ Amazon review created: ${productToReview.name}`);
        } else {
          results.amazon.error = result.error || "Unknown error";
          console.error(`❌ Failed to create Amazon review: ${result.error}`);
        }
      } else {
        results.amazon.error = "No Amazon products available for review";
        console.log("⚠️  No Amazon products available for review");
      }
    } catch (error: any) {
      results.amazon.error = error.message;
      console.error("Error generating Amazon review:", error);
    }

    // 5. Generate Movie Review
    try {
      console.log("🎬 Generating movie review...");
      const movies = await getTMDBMoviesBulk({
        sortBy: "release_date",
        order: "desc",
        limit: 50,
      });

      if (movies && movies.length > 0) {
        // Filter out movies that already have reviews
        let existingTmdbIds: any[] = [];
        try {
          existingTmdbIds = await prisma.review.findMany({
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
        } catch (error: any) {
          // If column doesn't exist, processMovie will handle it
          if (!error.message?.includes("does not exist")) {
            throw error;
          }
        }

        const existingIdsSet = new Set(existingTmdbIds.map((r) => r.tmdbId).filter(Boolean));
        const newMovies = movies.filter((m: any) => !existingIdsSet.has(m.id));

        if (newMovies.length > 0) {
          // Take the first available movie
          const movie = newMovies[0];
          const result = await processMovie(movie, {
            status: "published",
            skipExisting: true,
          });

          if (result.success && result.reviewId) {
            results.movie.success = true;
            results.movie.reviewId = result.reviewId;
            console.log(`✅ Movie review created: ${movie.title}`);
          } else {
            results.movie.error = result.error || "Unknown error";
            console.error(`❌ Failed to create movie review: ${result.error}`);
          }
        } else {
          results.movie.error = "No new movies available";
          console.log("⚠️  No new movies available for review");
        }
      } else {
        results.movie.error = "No movies found";
      }
    } catch (error: any) {
      results.movie.error = error.message;
      console.error("Error generating movie review:", error);
    }

    // 6. Generate Series Review
    try {
      console.log("📺 Generating series review...");
      const series = await getTMDBSeriesBulk({
        sortBy: "release_date",
        order: "desc",
        limit: 50,
      });

      if (series && series.length > 0) {
        // Filter out series that already have reviews
        let existingTmdbIds: any[] = [];
        try {
          existingTmdbIds = await prisma.review.findMany({
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
        } catch (error: any) {
          // If column doesn't exist, processSeries will handle it
          if (!error.message?.includes("does not exist")) {
            throw error;
          }
        }

        const existingIdsSet = new Set(existingTmdbIds.map((r) => r.tmdbId).filter(Boolean));
        const newSeries = series.filter((s: any) => !existingIdsSet.has(s.id));

        if (newSeries.length > 0) {
          // Take the first available series
          const serie = newSeries[0];
          const result = await processSeries(serie, {
            status: "published",
            skipExisting: true,
          });

          if (result.success && result.reviewId) {
            results.series.success = true;
            results.series.reviewId = result.reviewId;
            console.log(`✅ Series review created: ${serie.name}`);
          } else {
            results.series.error = result.error || "Unknown error";
            console.error(`❌ Failed to create series review: ${result.error}`);
          }
        } else {
          results.series.error = "No new series available";
          console.log("⚠️  No new series available for review");
        }
      } else {
        results.series.error = "No series found";
      }
    } catch (error: any) {
      results.series.error = error.message;
      console.error("Error generating series review:", error);
    }

    const totalSuccessful = Object.values(results).filter((r) => r.success).length;

    return NextResponse.json({
      message: `Category review generation completed. ${totalSuccessful}/5 categories successful.`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron category review generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
