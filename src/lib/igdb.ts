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

