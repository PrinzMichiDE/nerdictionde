import axios from "axios";
import { TMDBMovie, TMDBSeries, BulkQueryOptions } from "./tmdb";

// Re-export BulkQueryOptions for convenience
export type { BulkQueryOptions };

const TMDB_API_BASE = "https://api.themoviedb.org/3";

let tmdbApiKey: string | null = null;

function getApiKey() {
  if (!tmdbApiKey) {
    tmdbApiKey = process.env.TMDB_API_KEY || null;
    if (!tmdbApiKey) {
      throw new Error("TMDB_API_KEY is not set");
    }
  }
  return tmdbApiKey;
}

/**
 * Fetch large number of movies from TMDB with proper pagination
 * Handles filtering and continues fetching until target count is reached
 */
export async function getTMDBMoviesBulkLarge(
  targetCount: number,
  options: BulkQueryOptions = {}
): Promise<TMDBMovie[]> {
  const apiKey = getApiKey();
  const {
    genreId,
    releaseYear,
    minRating,
    sortBy = "popularity",
    order = "desc",
  } = options;

  const allMovies: TMDBMovie[] = [];
  let currentPage = 1;
  const maxPages = 500; // TMDB API limit
  const requestDelay = 250; // 250ms delay between requests

  while (allMovies.length < targetCount && currentPage <= maxPages) {
    try {
      // Build query parameters
      const params: Record<string, string | number> = {
        api_key: apiKey,
        language: "de-DE",
        page: currentPage,
        "vote_count.gte": 50,
      };

      if (genreId) {
        params.with_genres = genreId;
      }

      if (releaseYear) {
        params.primary_release_year = releaseYear;
      }

      if (minRating !== undefined) {
        params["vote_average.gte"] = minRating;
      }

      // Determine sort parameter
      let sortParam = "popularity.desc";
      switch (sortBy) {
        case "popularity":
          sortParam = order === "asc" ? "popularity.asc" : "popularity.desc";
          break;
        case "rating":
          sortParam = order === "asc" ? "vote_average.asc" : "vote_average.desc";
          break;
        case "release_date":
          sortParam = order === "asc" ? "primary_release_date.asc" : "primary_release_date.desc";
          break;
        case "title":
          sortParam = order === "asc" ? "title.asc" : "title.desc";
          break;
      }
      params.sort_by = sortParam;

      const response = await axios.get(`${TMDB_API_BASE}/discover/movie`, { params });
      const pageMovies = response.data.results || [];

      if (pageMovies.length === 0) {
        // No more results available
        break;
      }

      // Filter out movies without overview or poster
      const validMovies = pageMovies.filter(
        (m: TMDBMovie) => m.overview && m.poster_path
      );

      // Fetch detailed information for valid movies
      const detailedMovies = await Promise.all(
        validMovies.map(async (movie: TMDBMovie) => {
          try {
            const detailResponse = await axios.get(`${TMDB_API_BASE}/movie/${movie.id}`, {
              params: {
                api_key: apiKey,
                language: "de-DE",
                append_to_response: "videos,images",
              },
            });
            return detailResponse.data;
          } catch (error) {
            console.error(`Error fetching details for movie ${movie.id}:`, error);
            return movie;
          }
        })
      );

      allMovies.push(...detailedMovies);

      console.log(
        `📥 TMDB Movies Page ${currentPage}: Found ${validMovies.length} valid movies (Total: ${allMovies.length}/${targetCount})`
      );

      // If we got fewer than 20 results, we've likely reached the end
      if (pageMovies.length < 20) {
        break;
      }

      currentPage++;

      // Rate limiting: wait between requests (except for the last one)
      if (allMovies.length < targetCount) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    } catch (error: any) {
      console.error(`Error fetching TMDB movies page ${currentPage}:`, error.message);
      
      // If it's a rate limit error, wait longer before retrying
      if (error.response?.status === 429) {
        console.log("Rate limit hit, waiting 10 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue; // Retry the same page
      }
      
      // For other errors, break to avoid infinite loops
      break;
    }
  }

  return allMovies.slice(0, targetCount);
}

/**
 * Fetch large number of series from TMDB with proper pagination
 * Handles filtering and continues fetching until target count is reached
 */
export async function getTMDBSeriesBulkLarge(
  targetCount: number,
  options: BulkQueryOptions = {}
): Promise<TMDBSeries[]> {
  const apiKey = getApiKey();
  const {
    genreId,
    releaseYear,
    minRating,
    sortBy = "popularity",
    order = "desc",
  } = options;

  const allSeries: TMDBSeries[] = [];
  let currentPage = 1;
  const maxPages = 500; // TMDB API limit
  const requestDelay = 250; // 250ms delay between requests

  while (allSeries.length < targetCount && currentPage <= maxPages) {
    try {
      // Build query parameters
      const params: Record<string, string | number> = {
        api_key: apiKey,
        language: "de-DE",
        page: currentPage,
        "vote_count.gte": 50,
      };

      if (genreId) {
        params.with_genres = genreId;
      }

      if (releaseYear) {
        params.first_air_date_year = releaseYear;
      }

      if (minRating !== undefined) {
        params["vote_average.gte"] = minRating;
      }

      // Determine sort parameter
      let sortParam = "popularity.desc";
      switch (sortBy) {
        case "popularity":
          sortParam = order === "asc" ? "popularity.asc" : "popularity.desc";
          break;
        case "rating":
          sortParam = order === "asc" ? "vote_average.asc" : "vote_average.desc";
          break;
        case "release_date":
          sortParam = order === "asc" ? "first_air_date.asc" : "first_air_date.desc";
          break;
        case "title":
          sortParam = order === "asc" ? "name.asc" : "name.desc";
          break;
      }
      params.sort_by = sortParam;

      const response = await axios.get(`${TMDB_API_BASE}/discover/tv`, { params });
      const pageSeries = response.data.results || [];

      if (pageSeries.length === 0) {
        // No more results available
        break;
      }

      // Filter out series without overview or poster
      const validSeries = pageSeries.filter(
        (s: TMDBSeries) => s.overview && s.poster_path
      );

      // Fetch detailed information for valid series
      const detailedSeries = await Promise.all(
        validSeries.map(async (serie: TMDBSeries) => {
          try {
            const detailResponse = await axios.get(`${TMDB_API_BASE}/tv/${serie.id}`, {
              params: {
                api_key: apiKey,
                language: "de-DE",
                append_to_response: "videos,images",
              },
            });
            return detailResponse.data;
          } catch (error) {
            console.error(`Error fetching details for series ${serie.id}:`, error);
            return serie;
          }
        })
      );

      allSeries.push(...detailedSeries);

      console.log(
        `📥 TMDB Series Page ${currentPage}: Found ${validSeries.length} valid series (Total: ${allSeries.length}/${targetCount})`
      );

      // If we got fewer than 20 results, we've likely reached the end
      if (pageSeries.length < 20) {
        break;
      }

      currentPage++;

      // Rate limiting: wait between requests (except for the last one)
      if (allSeries.length < targetCount) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    } catch (error: any) {
      console.error(`Error fetching TMDB series page ${currentPage}:`, error.message);
      
      // If it's a rate limit error, wait longer before retrying
      if (error.response?.status === 429) {
        console.log("Rate limit hit, waiting 10 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue; // Retry the same page
      }
      
      // For other errors, break to avoid infinite loops
      break;
    }
  }

  return allSeries.slice(0, targetCount);
}
