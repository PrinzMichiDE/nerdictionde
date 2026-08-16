import prisma from "@/lib/prisma";
import { getIGDBUpcomingGames } from "@/lib/igdb";
import { generateSlug } from "@/lib/review-generation";

export interface UpcomingReleasesResult {
  success: boolean;
  message: string;
  stats: {
    totalFound: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  duration: string;
  timestamp: string;
  error?: string;
}

/**
 * Fetches upcoming game releases from IGDB (next 365 days) and keeps the
 * release calendar in sync by creating lightweight draft reviews (no AI calls).
 *
 * The full review content (AI-generated text, images, SEO, tags, comments) is
 * generated later by /api/cron/publish-release-reviews once a game releases.
 */
export async function syncUpcomingReleases(): Promise<UpcomingReleasesResult> {
  const startTime = Date.now();

  try {
    console.log("🎮 Starting upcoming releases sync...");

    // 1. Fetch upcoming games from IGDB (next 365 days - entire year)
    console.log("📅 Fetching upcoming games with release dates in the next 365 days...");

    const futureGames: any[] = [];
    let offset = 0;
    const batchSize = 500;
    const maxGames = 2000;

    while (futureGames.length < maxGames) {
      const batch = await getIGDBUpcomingGames(365, batchSize, offset);

      if (batch.length === 0) {
        break;
      }

      futureGames.push(...batch);
      offset += batch.length;

      if (batch.length < batchSize) {
        break;
      }

      // Small delay between batches to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`✅ Found ${futureGames.length} upcoming games`);

    // 2. Process each game - lightweight draft creation (no AI calls)
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const game of futureGames) {
      try {
        const existingReview = await prisma.review.findFirst({
          where: {
            OR: [{ igdbId: game.id }, { slug: generateSlug(game.name) }],
            category: "game",
          },
        });

        const releaseDate = game.first_release_date
          ? new Date(game.first_release_date * 1000)
          : null;

        if (existingReview) {
          // Update release date if it's missing or different
          if (
            releaseDate &&
            (!existingReview.releaseDate ||
              existingReview.releaseDate.getTime() !== releaseDate.getTime())
          ) {
            await prisma.review.update({
              where: { id: existingReview.id },
              data: { releaseDate },
            });
            updated++;
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
          developers:
            game.involved_companies
              ?.filter((c: any) => c.developer)
              .map((c: any) => c.company.name) || [],
          publishers:
            game.involved_companies
              ?.filter((c: any) => c.publisher)
              .map((c: any) => c.company.name) || [],
          platforms: game.platforms?.map((p: any) => p.name) || [],
          genres: game.genres?.map((g: any) => g.name) || [],
          gameModes:
            ((game.game_modes || []) as Array<{ name: string }>).map((m) => m.name) || [],
          perspectives:
            ((game.player_perspectives || []) as Array<{ name: string }>).map(
              (p) => p.name
            ) || [],
          engines:
            ((game.game_engines || []) as Array<{ name: string }>).map((e) => e.name) || [],
          releaseDate: game.first_release_date,
          igdbScore: game.rating,
          criticScore: game.aggregated_rating ?? null,
          stores: [],
        };

        const contentDe = buildPlaceholderContent(
          game.name,
          releaseDate,
          metadata.platforms,
          metadata.genres,
          "de"
        );
        const contentEn = buildPlaceholderContent(
          game.name,
          releaseDate,
          metadata.platforms,
          metadata.genres,
          "en"
        );

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
        console.log(
          `  ✓ Created draft review for: ${game.name} (Release: ${releaseDate?.toLocaleDateString()})`
        );
      } catch (error: any) {
        errors++;
        console.error(`  ✗ Error processing ${game.name}:`, error.message);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      success: true,
      message: `Upcoming releases sync completed. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`,
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
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error("❌ Error in upcoming releases sync:", error);

    return {
      success: false,
      error: error.message || "Unknown error",
      message: "Upcoming releases sync failed.",
      stats: { totalFound: 0, created: 0, updated: 0, skipped: 0, errors: 1 },
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    };
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
