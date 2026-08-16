import { NextRequest, NextResponse } from "next/server";
import { searchIGDB, getIGDBGameBySteamId, getIGDBGameById, parseIGDBId } from "@/lib/igdb";
import { parseSteamUrl } from "@/lib/steam";
import { uploadImage } from "@/lib/blob";
import { calculatePublicationDate } from "@/lib/date-utils";
import { requireAdminAuth } from "@/lib/auth";
import { generateReviewContent } from "@/lib/review-generation";
import { extractYouTubeVideoIdsFromIGDB } from "@/lib/youtube-extraction";

export async function POST(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { input } = await req.json();

    if (!input) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    let data: any = null;

    // Search logic
    const igdbId = parseIGDBId(input);
    if (igdbId) {
      data = await getIGDBGameById(igdbId);
    } else {
      // Check for Steam URL
      const steamId = parseSteamUrl(input);
      if (steamId) {
        data = await getIGDBGameBySteamId(steamId);
      } else {
        // Fallback to IGDB search by name
        const results = await searchIGDB(input);
        if (results && results.length > 0) {
          data = results[0];
        }
      }
    }

    if (!data) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Generate content using centralized helpers (with built-in repair and retries)
    let gameStoreIds: {
      steamAppId?: string;
      epicId?: string;
      gogId?: string;
      stores?: Array<{ category: number; name: string; id: string; url: string }>;
    } = {};
    let steamData: import("@/lib/steam").SteamGameInfo | null = null;

    // Resolve store IDs + real Steam data before generation (best-effort)
    try {
      const { findStoreIds } = await import("@/lib/store-search");
      gameStoreIds = await findStoreIds(data.name, data.id);
    } catch {
      // Non-blocking
    }
    if (gameStoreIds.steamAppId) {
      try {
        const { getSteamAppDetails, getSteamReviewSummary } = await import("@/lib/steam");
        const [details, reviews] = await Promise.allSettled([
          getSteamAppDetails(gameStoreIds.steamAppId),
          getSteamReviewSummary(gameStoreIds.steamAppId),
        ]);
        if (details.status === "fulfilled" && details.value) {
          steamData = details.value;
          if (reviews.status === "fulfilled" && reviews.value) {
            steamData.reviewSummary = reviews.value;
          }
        }
      } catch {
        // Non-blocking
      }
    }
    const result = await generateReviewContent(data, 0, { steamData });

    const pubDate = calculatePublicationDate(data.first_release_date);

    // Process metadata for games
    const gameMetadata = {
        developers: data.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company.name) || [],
        publishers: data.involved_companies?.filter((c: any) => c.publisher).map((c: any) => c.company.name) || [],
        platforms: data.platforms?.map((p: any) => p.name) || [],
        genres: data.genres?.map((g: any) => g.name) || [],
        gameModes: data.game_modes?.map((m: any) => m.name) || [],
        perspectives: data.player_perspectives?.map((p: any) => p.name) || [],
        engines: data.game_engines?.map((e: any) => e.name) || [],
        releaseDate: data.first_release_date,
        igdbScore: data.rating,
        criticScore: data.aggregated_rating ?? steamData?.metacriticScore ?? undefined,
        steamMetacritic: steamData?.metacriticScore ?? undefined,
        steamRatingPercent: steamData?.reviewSummary?.percentPositive ?? undefined,
        steamPrice: steamData?.priceFormatted ?? undefined,
        stores: gameStoreIds.stores || [],
    };

    // Sync image to Vercel Blob
    const imageUrls: string[] = [];
    
    if (data.cover?.url) {
        const url = data.cover.url.startsWith("//") ? "https:" + data.cover.url : data.cover.url;
        const highResCoverUrl = url.replace("t_thumb", "t_720p");
        const syncedUrl = await uploadImage(highResCoverUrl, `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-cover.jpg`);
        imageUrls.push(syncedUrl);
    }
    if (data.screenshots && data.screenshots.length > 0) {
        const screenshotsToSync = data.screenshots.slice(0, 5);
        for (let i = 0; i < screenshotsToSync.length; i++) {
            const s = screenshotsToSync[i];
            const url = s.url.startsWith("//") ? "https:" + s.url : s.url;
            const highResUrl = url.replace("t_thumb", "t_1080p");
            try {
                const syncedUrl = await uploadImage(highResUrl, `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-screen-${i+1}.jpg`);
                imageUrls.push(syncedUrl);
            } catch {}
        }
    }

    // Attach YouTube videos
    let youtubeVideos: string[] = [];
    try {
      youtubeVideos = extractYouTubeVideoIdsFromIGDB(data);
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      title: result.de.title || data.name,
      title_en: result.en.title || data.name,
      content: result.de.content || "",
      content_en: result.en.content || "",
      pros: result.de.pros || [],
      pros_en: result.en.pros || [],
      cons: result.de.cons || [],
      cons_en: result.en.cons || [],
      score: result.score || 0,
      specs: result.specs || data.specs || null,
      metadata: gameMetadata,
      category: "game",
      igdbId: data.id,
      steamAppId: gameStoreIds.steamAppId || null,
      epicId: gameStoreIds.epicId || null,
      gogId: gameStoreIds.gogId || null,
      images: imageUrls,
      youtubeVideos,
      createdAt: pubDate,
    });
  } catch (error: any) {
    console.error("Auto-generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
