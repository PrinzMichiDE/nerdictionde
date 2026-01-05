import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulk } from "@/lib/igdb";
import { getTMDBMoviesBulk, getTMDBSeriesBulk } from "@/lib/tmdb";
import { processGame, processMovie, processSeries, processAmazonProduct } from "@/lib/review-generation";
import { processHardware } from "@/app/api/reviews/bulk-create-hardware/route";
import prisma from "@/lib/prisma";

/**
 * Cron Job: Generates reviews from all categories daily
 * Categories: game, hardware, amazon, movie, series, product
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
      hardware: { success: false, reviewId: null as string | null, error: null as string | null },
      amazon: { success: false, reviewId: null as string | null, error: null as string | null },
      product: { success: false, reviewId: null as string | null, error: null as string | null },
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

    // 3. Generate Hardware Review
    try {
      console.log("💻 Generating hardware review...");
      const popularHardware = [
        "NVIDIA RTX 4090", "AMD Ryzen 9 7950X", "Intel Core i9-14900K", "Samsung Odyssey G9",
        "Logitech MX Master 3S", "PlayStation 5 Pro", "Xbox Series X", "AMD Ryzen 7 7800X3D",
        "NVIDIA RTX 4070 Ti Super", "Apple MacBook Pro M3 Max", "Steam Deck OLED", "Asus ROG Ally X"
      ];

      const existingHardwareReviews = await prisma.review.findMany({
        where: { category: "hardware" },
        include: { hardware: true },
      });

      const existingHardwareNames = new Set(
        existingHardwareReviews.map((r: any) => r.hardware?.name).filter(Boolean)
      );

      const hardwareToReview = popularHardware
        .filter((name) => !existingHardwareNames.has(name))
        .slice(0, 1); // Just 1 for daily cron to keep it stable

      if (hardwareToReview.length > 0) {
        const hardwareName = hardwareToReview[0];
        const result = await processHardware(hardwareName, {
          status: "published",
          skipExisting: true,
          generateImages: true,
        });

        if (result.success && result.reviewId) {
          results.hardware.success = true;
          results.hardware.reviewId = result.reviewId;
          console.log(`✅ Hardware review created: ${hardwareName}`);
        } else {
          results.hardware.error = result.error || "Unknown error";
        }
      } else {
        results.hardware.error = "No new hardware available";
      }
    } catch (error: any) {
      results.hardware.error = error.message;
      console.error("Error generating hardware review:", error);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Generate Product & Amazon Reviews
    const categories: ("amazon" | "product")[] = ["amazon", "product"];
    for (const cat of categories) {
      try {
        console.log(`🛒 Generating ${cat} review...`);
        
        const popularProducts = [
          // Smart Home
          { name: "Echo Dot (5. Generation)", asin: "B09B8V1LZ3" },
          { name: "Ring Video Doorbell", asin: "B08N5NQ869" },
          { name: "Echo Show 8", asin: "B09B8V1LZ4" },
          { name: "Philips Hue Bridge", asin: "B016151IPI" },
          // Tech Accessories
          { name: "Anker USB-C Ladekabel", asin: "B08C1W5N87" },
          { name: "SanDisk Extreme Portable SSD 1TB", asin: "B08GTYFC37" },
          // Electronics
          { name: "Sony WH-1000XM5", asin: "B09XS7JWHH" },
          { name: "Kindle Paperwhite", asin: "B08KTZ8249" },
          { name: "Fire TV Stick 4K", asin: "B08C1W5N87" },
          { name: "Logitech C920 HD Pro Webcam", asin: "B006JH8T3S" },
          // Gaming
          { name: "DualSense Wireless-Controller", asin: "B08H99BPJN" },
          { name: "SteelSeries Arctis Nova 7", asin: "B09ZWCYQSX" }
        ];

        const existingReviews = await prisma.review.findMany({
          where: { category: cat },
          select: { amazonAsin: true, title: true },
        });

        const existingAsins = new Set(existingReviews.map((r: any) => r.amazonAsin).filter(Boolean));
        const existingTitles = new Set(existingReviews.map((r: any) => r.title.toLowerCase()));

        const productsToReview = popularProducts
          .filter((p) => !existingAsins.has(p.asin) && !existingTitles.has(p.name.toLowerCase()))
          .slice(0, 1);

        if (productsToReview.length > 0) {
          const product = productsToReview[0];
          const result = await processAmazonProduct(
            { name: product.name, asin: product.asin },
            { status: "published", skipExisting: true, generateImages: true }
          );

          if (result.success && result.reviewId) {
            results[cat].success = true;
            results[cat].reviewId = result.reviewId;
            console.log(`✅ ${cat} review created: ${product.name}`);
          } else {
            results[cat].error = result.error || "Unknown error";
          }
        } else {
          results[cat].error = `No new ${cat} products available`;
        }
      } catch (error: any) {
        results[cat].error = error.message;
        console.error(`Error generating ${cat} review:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 5. Generate Movie Review
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

    // 6. Generate Series Review
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
      message: `Cron completed. ${totalSuccessful}/6 categories successful.`,
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
