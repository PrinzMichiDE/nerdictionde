import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIGDBUpcomingGames } from "@/lib/igdb";
import { processGame } from "@/lib/review-generation";

/**
 * Cron Job: Fetches upcoming game releases from IGDB and creates draft reviews
 * Schedule: Daily at 4 AM UTC (0 4 * * *)
 * 
 * This job:
 * - Runs daily but only processes data once per week (on Mondays)
 * - Automatically runs on first start if no upcoming releases exist
 * - Fetches games with release dates in the next 365 days (entire year)
 * - Creates draft reviews for games that don't exist yet
 * - Updates release dates for existing games
 * 
 * Query Parameters:
 * - force=true: Force execution even if it's not Monday
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Check for authorization (Vercel Cron Secret)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("⚠️ Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check if we should run this week (only on Mondays, unless forced or first run)
    const searchParams = req.nextUrl.searchParams;
    const force = searchParams.get("force") === "true";
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const futureDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Check if we have any upcoming releases (first run detection)
    const existingReleasesCount = await prisma.review.count({
      where: {
        category: "game",
        releaseDate: {
          gte: today,
          lte: futureDate,
        },
      },
    });
    
    const isFirstRun = existingReleasesCount === 0;
    
    // Only process on Mondays (dayOfWeek === 1), unless forced or first run
    if (dayOfWeek !== 1 && !force && !isFirstRun) {
      console.log(`⏭️ Skipping: Today is ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}. Only runs on Mondays. Use ?force=true to override.`);
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Only runs on Mondays. Today is ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}. Use ?force=true to override.`,
        timestamp: new Date().toISOString(),
      });
    }

    if (force) {
      console.log("🔧 Force mode enabled - running despite day of week");
    }
    
    if (isFirstRun) {
      console.log("🚀 First run detected - no upcoming releases found. Running initial fetch...");
    }

    console.log("🎮 Starting weekly upcoming releases fetch...");

    // 3. Fetch upcoming games from IGDB (next 365 days - entire year)
    console.log(`📅 Fetching upcoming games with release dates in the next 365 days...`);

    // Fetch in batches to get more games (IGDB limit is 500 per request)
    const futureGames: any[] = [];
    let offset = 0;
    const batchSize = 500;
    const maxGames = 2000; // Get up to 2000 games for the year

    while (futureGames.length < maxGames) {
      const batch = await getIGDBUpcomingGames(365, batchSize, offset);
      
      if (batch.length === 0) {
        break; // No more games
      }

      futureGames.push(...batch);
      offset += batch.length;

      // If we got fewer than requested, we've reached the end
      if (batch.length < batchSize) {
        break;
      }

      // Small delay between batches to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`✅ Found ${futureGames.length} upcoming games`);

    // 4. Process each game
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const game of futureGames) {
      try {
        // Check if review already exists
        const existingReview = await prisma.review.findFirst({
          where: {
            OR: [
              { igdbId: game.id },
              { slug: game.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") },
            ],
            category: "game",
          },
        });

        const releaseDate = game.first_release_date
          ? new Date(game.first_release_date * 1000)
          : null;

        if (existingReview) {
          // Update release date if it's missing or different
          if (releaseDate && (!existingReview.releaseDate || existingReview.releaseDate.getTime() !== releaseDate.getTime())) {
            await prisma.review.update({
              where: { id: existingReview.id },
              data: { releaseDate },
            });
            updated++;
            console.log(`  ✓ Updated release date for: ${game.name}`);
          } else {
            skipped++;
          }
        } else {
          // Create new draft review
          const result = await processGame(game, {
            status: "draft", // Always draft for future releases
            skipExisting: true,
          });

          if (result.success && result.reviewId) {
            // Update release date
            await prisma.review.update({
              where: { id: result.reviewId },
              data: { releaseDate },
            });
            created++;
            console.log(`  ✓ Created draft review for: ${game.name} (Release: ${releaseDate?.toLocaleDateString()})`);
          } else {
            errors++;
            console.warn(`  ✗ Failed to create review for: ${game.name} - ${result.error}`);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        errors++;
        console.error(`  ✗ Error processing ${game.name}:`, error.message);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const result = {
      success: true,
      message: `Upcoming releases fetch completed. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`,
      stats: {
        totalFound: futureGames.length,
        created,
        updated,
        skipped,
        errors,
      },
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Upcoming releases fetch completed in ${duration}s`);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error("❌ Error in upcoming releases fetch:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
