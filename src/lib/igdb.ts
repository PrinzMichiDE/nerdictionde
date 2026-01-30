import axios from "axios";

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("IGDB_CLIENT_ID or IGDB_CLIENT_SECRET is not set");
  }

  const response = await axios.post(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
  );

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000;
  return accessToken;
}

const IGDB_GAME_FIELDS = "name, id, cover.url, screenshots.url, genres.name, first_release_date, summary, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, platforms.name, game_modes.name, player_perspectives.name, aggregated_rating, rating, total_rating_count, videos.video_id, videos.name";

export async function searchIGDB(query: string) {
  const token = await getAccessToken();
  const response = await axios.post(
    "https://api.igdb.com/v4/games",
    `search "${query}"; fields ${IGDB_GAME_FIELDS}; limit 10;`,
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

export async function getIGDBGameBySteamId(steamId: string) {
  const token = await getAccessToken();
  const response = await axios.post(
    "https://api.igdb.com/v4/external_games",
    `fields game; where category = 1 & uid = "${steamId}";`,
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.data.length > 0) {
    const gameId = response.data[0].game;
    const gameResponse = await axios.post(
      "https://api.igdb.com/v4/games",
      `fields ${IGDB_GAME_FIELDS}; where id = ${gameId};`,
      {
        headers: {
          "Client-ID": process.env.IGDB_CLIENT_ID,
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return gameResponse.data[0];
  }
  return null;
}

export interface BulkQueryOptions {
  genreId?: number;
  platformId?: number;
  releaseYear?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: "popularity" | "rating" | "release_date" | "name";
  order?: "asc" | "desc";
}

export async function getIGDBGamesBulk(options: BulkQueryOptions = {}) {
  const token = await getAccessToken();
  const {
    genreId,
    platformId,
    releaseYear,
    minRating,
    limit = 50,
    offset = 0,
    sortBy = "total_rating_count",
    order = "desc",
  } = options;

  // Build where clause
  const whereConditions: string[] = [];
  
  // Only add genreId if it's a valid number (not "all" or undefined)
  if (genreId !== undefined && genreId !== null && typeof genreId === "number") {
    whereConditions.push(`genres = ${genreId}`);
  }
  
  // Only add platformId if it's a valid number (not "all" or undefined)
  if (platformId !== undefined && platformId !== null && typeof platformId === "number") {
    whereConditions.push(`platforms = ${platformId}`);
  }
  
  if (releaseYear) {
    const startDate = Math.floor(new Date(`${releaseYear}-01-01`).getTime() / 1000);
    const endDate = Math.floor(new Date(`${releaseYear}-12-31T23:59:59`).getTime() / 1000);
    whereConditions.push(`first_release_date >= ${startDate} & first_release_date <= ${endDate}`);
  }
  
  if (minRating !== undefined && minRating !== null) {
    whereConditions.push(`rating >= ${Math.floor(minRating)}`);
  }
  
  // Ensure we only get games with cover and summary
  whereConditions.push(`cover != null`);
  whereConditions.push(`summary != null`);
  
  const whereClause = whereConditions.length > 0 
    ? `where ${whereConditions.join(" & ")};` 
    : "";

  // Build sort clause
  let sortClause = "";
  switch (sortBy) {
    case "popularity":
    case "total_rating_count":
      sortClause = `sort total_rating_count ${order};`;
      break;
    case "rating":
      sortClause = `sort rating ${order};`;
      break;
    case "release_date":
      sortClause = `sort first_release_date ${order};`;
      break;
    case "name":
      sortClause = `sort name ${order};`;
      break;
    default:
      sortClause = `sort total_rating_count ${order};`;
  }

  // Build query with proper spacing
  const queryParts: string[] = [
    `fields ${IGDB_GAME_FIELDS};`,
  ];
  
  if (whereClause) {
    queryParts.push(whereClause);
  }
  
  if (sortClause) {
    queryParts.push(sortClause);
  }
  
  queryParts.push(`limit ${limit};`);
  queryParts.push(`offset ${offset};`);
  
  const query = queryParts.join(" ");

  try {
    const response = await axios.post(
      "https://api.igdb.com/v4/games",
      query,
      {
        headers: {
          "Client-ID": process.env.IGDB_CLIENT_ID!,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    // Log the query for debugging
    const errorMessage = error.response?.data 
      ? (typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data))
      : error.message;
    
    console.error("IGDB Query Error:", {
      query,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: errorMessage,
    });
    
    throw new Error(`IGDB API error: ${errorMessage}`);
  }
}

/**
 * Fetches a large number of games from IGDB by making multiple requests if needed.
 * IGDB has a limit of 500 games per request, so this function handles pagination automatically.
 */
export async function getIGDBGamesBulkLarge(
  totalLimit: number,
  options: Omit<BulkQueryOptions, "limit" | "offset"> = {}
): Promise<any[]> {
  const IGDB_MAX_LIMIT = 500;
  const allGames: any[] = [];
  let offset = 0;
  const requestDelay = 1000; // 1 second delay between requests to respect rate limits

  let requestCount = 0;
  while (allGames.length < totalLimit) {
    const remaining = totalLimit - allGames.length;
    const currentLimit = Math.min(remaining, IGDB_MAX_LIMIT);
    requestCount++;

    try {
      console.log(
        `📥 IGDB Games Request ${requestCount}: Fetching ${currentLimit} games (offset: ${offset}, total so far: ${allGames.length}/${totalLimit})`
      );

      const games = await getIGDBGamesBulk({
        ...options,
        limit: currentLimit,
        offset,
      });

      if (games.length === 0) {
        // No more games available
        console.log(`⚠️ No more games available at offset ${offset}`);
        break;
      }

      allGames.push(...games);

      console.log(
        `✅ IGDB Games Request ${requestCount}: Received ${games.length} games (Total: ${allGames.length}/${totalLimit})`
      );

      // If we got fewer games than requested, we've reached the end
      if (games.length < currentLimit) {
        console.log(`⚠️ Received fewer games than requested (${games.length} < ${currentLimit}), reached end of results`);
        break;
      }

      offset += games.length;

      // Rate limiting: wait between requests (except for the last one)
      if (allGames.length < totalLimit) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    } catch (error: any) {
      console.error(`Error fetching games at offset ${offset}:`, error.message);
      
      // If it's a rate limit error, wait longer before retrying
      if (error.response?.status === 429 || error.message.includes("rate limit")) {
        console.log("Rate limit hit, waiting 10 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue; // Retry the same request
      }
      
      // For other errors, throw to let the caller handle it
      throw error;
    }
  }

  const finalGames = allGames.slice(0, totalLimit);
  console.log(
    `✅ IGDB Games Fetch Complete: ${finalGames.length} games fetched in ${requestCount} request(s) (requested: ${totalLimit})`
  );
  return finalGames;
}

/**
 * Parses an IGDB ID from input string.
 * Returns the numeric ID if the input is a pure numeric string (IGDB ID).
 */
export function parseIGDBId(input: string): number | null {
  // Check if input is a pure numeric string (IGDB IDs are numeric)
  const numericMatch = input.trim().match(/^\d+$/);
  if (numericMatch) {
    const id = parseInt(numericMatch[0], 10);
    // IGDB IDs are typically positive integers
    if (id > 0) {
      return id;
    }
  }
  return null;
}

export async function getIGDBGameById(id: number) {
  const token = await getAccessToken();
  const response = await axios.post(
    "https://api.igdb.com/v4/games",
    `fields ${IGDB_GAME_FIELDS}; where id = ${id};`,
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data[0];
}

/**
 * IGDB external game category mapping
 * Based on IGDB API documentation
 */
export const IGDB_STORE_CATEGORIES: Record<number, { name: string; urlTemplate: (id: string) => string }> = {
  1: { name: "Steam", urlTemplate: (id) => `https://store.steampowered.com/app/${id}` },
  5: { name: "Epic Games", urlTemplate: (id) => `https://store.epicgames.com/de/p/${id}` },
  7: { name: "GOG", urlTemplate: (id) => `https://www.gog.com/game/${id}` },
  11: { name: "Xbox Store", urlTemplate: (id) => `https://www.xbox.com/de-de/games/store/${id}` },
  12: { name: "PlayStation Store", urlTemplate: (id) => `https://store.playstation.com/de-de/product/${id}` },
  13: { name: "Nintendo eShop", urlTemplate: (id) => `https://www.nintendo.de/Spiele/Nintendo-Switch/${id}` },
  14: { name: "Google Play", urlTemplate: (id) => `https://play.google.com/store/apps/details?id=${id}` },
  15: { name: "App Store", urlTemplate: (id) => `https://apps.apple.com/app/id${id}` },
  16: { name: "itch.io", urlTemplate: (id) => `https://${id}.itch.io/` },
  17: { name: "Twitch", urlTemplate: (id) => `https://www.twitch.tv/directory/game/${encodeURIComponent(id)}` },
  18: { name: "Discord", urlTemplate: (id) => `https://discord.com/store/skus/${id}` },
  19: { name: "Xbox Game Pass", urlTemplate: (id) => `https://www.xbox.com/de-de/games/store/${id}` },
  20: { name: "PlayStation Plus", urlTemplate: (id) => `https://store.playstation.com/de-de/product/${id}` },
};

/**
 * Fetches ALL external store IDs for a game from IGDB
 * Returns: Array of store objects with category, name, id, and url
 * IGDB external game categories include Steam, Epic, GOG, Xbox, PlayStation, Nintendo, etc.
 */
export async function getIGDBExternalStoreIds(gameId: number): Promise<{
  steamAppId?: string;
  epicId?: string;
  gogId?: string;
  stores?: Array<{ category: number; name: string; id: string; url: string }>;
}> {
  const token = await getAccessToken();
  
  try {
    // Fetch ALL external store IDs (not just Steam, Epic, GOG)
    const response = await axios.post(
      "https://api.igdb.com/v4/external_games",
      `fields category, uid; where game = ${gameId};`,
      {
        headers: {
          "Client-ID": process.env.IGDB_CLIENT_ID,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result: {
      steamAppId?: string;
      epicId?: string;
      gogId?: string;
      stores?: Array<{ category: number; name: string; id: string; url: string }>;
    } = {
      stores: [],
    };
    
    for (const external of response.data) {
      const storeInfo = IGDB_STORE_CATEGORIES[external.category];
      
      if (storeInfo) {
        const store = {
          category: external.category,
          name: storeInfo.name,
          id: external.uid,
          url: storeInfo.urlTemplate(external.uid),
        };
        
        result.stores!.push(store);
        
        // Keep backward compatibility
        if (external.category === 1) {
          result.steamAppId = external.uid;
        } else if (external.category === 5) {
          result.epicId = external.uid;
        } else if (external.category === 7) {
          result.gogId = external.uid;
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching external store IDs for game ${gameId}:`, error);
    return {};
  }
}

export async function getIGDBGenres() {
  const token = await getAccessToken();
  const response = await axios.post(
    "https://api.igdb.com/v4/genres",
    "fields id, name; sort name asc; limit 50;",
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

export async function getIGDBPlatforms() {
  const token = await getAccessToken();
  const response = await axios.post(
    "https://api.igdb.com/v4/platforms",
    "fields id, name; where category = (1,2,3,4); sort name asc; limit 50;",
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

