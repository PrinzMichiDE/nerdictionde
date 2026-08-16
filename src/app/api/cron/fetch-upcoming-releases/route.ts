import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIGDBUpcomingGames } from "@/lib/igdb";
import { generateSlug } from "@/lib/review-generation";

/**
 * Cron Job: Fetches upcoming game releases from IGDB and creates lightweight draft reviews
 * Schedule: Daily at 4 AM UTC (0 4 * * *)
 *
 * This job:
 * - Runs daily but only processes data once per week (on Mondays)
 * - Automatically runs on first start if no upcoming releases exist
 * - Fetches games with release dates in the next 365 days (entire year)
 * - Creates lightweight draft reviews (no AI generation) for games that don't exist yet
 * - Updates release dates for existing games
 *
 * The full review content (AI-generated text, images, SEO, tags, comments) is generated
 * later by the /api/cron/publish-release-reviews job once a game actually releases.
 * This keeps the calendar reliable and fast enough to run within the function limit.
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

    // 4. Process each game - lightweight draft creation (no AI calls)
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
              { slug: generateSlug(game.name) },
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
          continue;
        }

        // Create a new lightweight draft review from IGDB data
        const slug = await createUniqueSlug(generateSlug(game.name));
        const images = game.cover?.url
          ? [game.cover.url.replace("t_thumb", "t_720p")]
          : [];

        const metadata = {
          developers: game.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company.name) || [],
          publishers: game.involved_companies?.filter((c: any) => c.publisher).map((c: any) => c.company.name) || [],
          platforms: game.platforms?.map((p: any) => p.name) || [],
          genres: game.genres?.map((g: any) => g.name) || [],
          gameModes: ((game.game_modes || []) as Array<{ name: string }>).map((m) => m.name) || [],
          perspectives: ((game.player_perspectives || []) as Array<{ name: string }>).map((p) => p.name) || [],
          engines: ((game.game_engines || []) as Array<{ name: string }>).map((e) => e.name) || [],
          releaseDate: game.first_release_date,
          igdbScore: game.rating,
          criticScore: game.aggregated_rating ?? null,
          stores: [],
        };

        const contentDe = buildPlaceholderContent(game.name, releaseDate, metadata.platforms, metadata.genres, "de");
        const contentEn = buildPlaceholderContent(game.name, releaseDate, metadata.platforms, metadata.genres, "en");

        await prisma.review.create({
          data: {
            title: game.name,
            title_en: game.name,
            slug,
            category: "game",
            content: contentDe,
            content_en: contentEn,
            score: Math.round(game.rating || 0),
            pros: [],
            pros_en: [],
            cons: [],
            cons_en: [],
            images,
            status: "draft",
            igdbId: game.id,
            releaseDate,
            metadata,
            createdAt: new Date(),
          },
        });

        created++;
        console.log(`  ✓ Created draft review for: ${game.name} (Release: ${releaseDate?.toLocaleDateString()})`);
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

/**
 * Generates a unique slug, appending a suffix on collisions.
 */
async function createUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let attempts = 0;
  while (await prisma.review.findUnique({ where: { slug } })) {
    attempts++;
    if (attempts > 10) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
      break;
    }
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
  }
  return slug;
}

/**
 * Builds a short factual placeholder text for calendar drafts (no AI required).
 */
function buildPlaceholderContent(
  title: string,
  releaseDate: Date | null,
  platforms: string[],
  genres: string[],
  lang: "de" | "en"
): string {
  const date = releaseDate
    ? releaseDate.toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : lang === "de"
      ? "noch nicht angekündigt"
      : "TBA";

  if (lang === "de") {
    return [
      `**${title}** erscheint am ${date}.`,
      "",
      "Dies ist ein automatisch erstellter Kalendereintrag aus der IGDB-Datenbank.",
      "",
      `- **Plattformen:** ${platforms.join(", ") || "N/A"}`,
      `- **Genres:** ${genres.join(", ") || "N/A"}`,
      "",
      "Unser ausführliches Review erscheint nach dem Release. Dieser Eintrag wird laufend aktualisiert.",
    ].join("\n");
  }

  return [
    `**${title}** is scheduled to release on ${date}.`,
    "",
    "This is an automatically generated calendar entry based on IGDB data.",
    "",
    `- **Platforms:** ${platforms.join(", ") || "N/A"}`,
    `- **Genres:** ${genres.join(", ") || "N/A"}`,
    "",
    "Our in-depth review will be published after the release. This entry is updated continuously.",
  ].join("\n");
}
