import axios from "axios";

/**
 * Searches for a game on Steam and returns the app ID
 * Falls back to search URL if ID cannot be found
 */
export async function searchSteamStore(gameName: string): Promise<string | null> {
  try {
    // Try to find Steam app ID via search
    // Note: Steam doesn't have a public API for search, so we return a search URL
    // The actual app ID would need to be extracted from IGDB or manually entered
    return null; // Will use IGDB external IDs instead
  } catch (error) {
    console.error(`Error searching Steam for ${gameName}:`, error);
    return null;
  }
}

/**
 * Searches for a game on Epic Games Store and returns the product slug/ID
 * Epic Games Store uses product slugs (e.g., "cyberpunk-2077")
 */
export async function searchEpicStore(gameName: string): Promise<string | null> {
  try {
    // Epic Games Store GraphQL API endpoint
    const query = `
      query searchStoreQuery($keywords: String!, $locale: String, $country: String!) {
        Catalog {
          searchStore(keywords: $keywords, locale: $locale, country: $country) {
            elements {
              title
              id
              productSlug
              urlSlug
            }
          }
        }
      }
    `;

    const variables = {
      keywords: gameName,
      locale: "de-DE",
      country: "DE",
    };

    const response = await axios.post(
      "https://graphql.epicgames.com/graphql",
      { query, variables },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const elements = response.data?.data?.Catalog?.searchStore?.elements;
    if (elements && elements.length > 0) {
      // Return the product slug or ID from the first result
      return elements[0].productSlug || elements[0].urlSlug || elements[0].id || null;
    }

    return null;
  } catch (error) {
    console.error(`Error searching Epic Store for ${gameName}:`, error);
    return null;
  }
}

/**
 * Searches for a game on GOG.com and returns the product ID
 * GOG uses numeric product IDs
 */
export async function searchGOGStore(gameName: string): Promise<string | null> {
  try {
    // GOG.com search API
    const response = await axios.get("https://www.gog.com/games/ajax/filtered", {
      params: {
        mediaType: "game",
        search: gameName,
        limit: 1,
      },
      headers: {
        "Accept": "application/json",
      },
    });

    const products = response.data?.products;
    if (products && products.length > 0) {
      // GOG product ID is in the slug or can be extracted from the URL
      const product = products[0];
      return product.id?.toString() || product.slug || null;
    }

    return null;
  } catch (error) {
    console.error(`Error searching GOG for ${gameName}:`, error);
    return null;
  }
}

/**
 * Searches for a game/product on Amazon and returns the ASIN
 */
export async function searchAmazonStore(gameName: string): Promise<string | null> {
  try {
    // Amazon Product Advertising API 5.0 search
    // Note: This requires AWS credentials and PA API access
    // For now, we'll return null and let the existing Amazon search handle it
    return null;
  } catch (error) {
    console.error(`Error searching Amazon for ${gameName}:`, error);
    return null;
  }
}

/**
 * Finds all available store IDs for a game
 * Tries IGDB first, then falls back to direct store searches
 */
export async function findStoreIds(
  gameName: string,
  igdbId?: number
): Promise<{
  steamAppId?: string;
  epicId?: string;
  gogId?: string;
  amazonAsin?: string;
  stores?: Array<{ category: number; name: string; id: string; url: string }>;
}> {
  const result: {
    steamAppId?: string;
    epicId?: string;
    gogId?: string;
    amazonAsin?: string;
    stores?: Array<{ category: number; name: string; id: string; url: string }>;
  } = {};

  // If we have IGDB ID, try to get external IDs from IGDB first
  if (igdbId) {
    try {
      const { getIGDBExternalStoreIds } = await import("./igdb");
      const externalIds = await getIGDBExternalStoreIds(igdbId);
      if (externalIds.steamAppId) result.steamAppId = externalIds.steamAppId;
      if (externalIds.epicId) result.epicId = externalIds.epicId;
      if (externalIds.gogId) result.gogId = externalIds.gogId;
      if (externalIds.stores) result.stores = externalIds.stores;
    } catch (error) {
      console.warn(`Could not fetch IGDB external IDs for ${gameName}:`, error);
    }
  }

  // Fallback: Search stores directly if IGDB didn't provide IDs
  if (!result.steamAppId) {
    const steamId = await searchSteamStore(gameName);
    if (steamId) {
      result.steamAppId = steamId;
      if (!result.stores) result.stores = [];
      result.stores.push({
        category: 1,
        name: "Steam",
        id: steamId,
        url: `https://store.steampowered.com/app/${steamId}`,
      });
    }
  }

  if (!result.epicId) {
    const epicId = await searchEpicStore(gameName);
    if (epicId) {
      result.epicId = epicId;
      if (!result.stores) result.stores = [];
      result.stores.push({
        category: 5,
        name: "Epic Games",
        id: epicId,
        url: `https://store.epicgames.com/de/p/${epicId}`,
      });
    }
  }

  if (!result.gogId) {
    const gogId = await searchGOGStore(gameName);
    if (gogId) {
      result.gogId = gogId;
      if (!result.stores) result.stores = [];
      result.stores.push({
        category: 7,
        name: "GOG",
        id: gogId,
        url: `https://www.gog.com/game/${gogId}`,
      });
    }
  }

  // Amazon search is handled separately via existing Amazon search functions
  // So we don't search here to avoid duplication

  return result;
}
