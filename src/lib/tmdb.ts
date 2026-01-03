import axios from "axios";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

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

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  production_companies?: Array<{ id: number; name: string }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages?: Array<{ iso_639_1: string; name: string }>;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
  images?: {
    backdrops: Array<{ file_path: string }>;
    posters: Array<{ file_path: string }>;
  };
}

export interface TMDBSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  genres?: Array<{ id: number; name: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
  production_companies?: Array<{ id: number; name: string }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages?: Array<{ iso_639_1: string; name: string }>;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
  images?: {
    backdrops: Array<{ file_path: string }>;
    posters: Array<{ file_path: string }>;
  };
}

export interface BulkQueryOptions {
  genreId?: number;
  releaseYear?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: "popularity" | "rating" | "release_date" | "title";
  order?: "asc" | "desc";
}

/**
 * Get popular movies from TMDB
 */
export async function getTMDBMoviesBulk(options: BulkQueryOptions = {}): Promise<TMDBMovie[]> {
  const apiKey = getApiKey();
  const {
    genreId,
    releaseYear,
    minRating,
    limit = 20,
    offset = 0,
    sortBy = "popularity",
    order = "desc",
  } = options;

  try {
    // Build query parameters
    const params: Record<string, string | number> = {
      api_key: apiKey,
      language: "de-DE",
      page: Math.floor(offset / limit) + 1,
      "vote_count.gte": 50, // Only movies with at least 50 votes
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
    
    let movies = response.data.results || [];
    
    // Filter out movies without overview or poster
    movies = movies.filter((m: TMDBMovie) => m.overview && m.poster_path);
    
    // Limit results
    const startIndex = offset % limit;
    movies = movies.slice(startIndex, startIndex + limit);

    // Fetch detailed information for each movie (including videos and images)
    const detailedMovies = await Promise.all(
      movies.map(async (movie: TMDBMovie) => {
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

    return detailedMovies;
  } catch (error: any) {
    console.error("TMDB Movies Query Error:", {
      options,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.response?.data || error.message,
    });
    throw new Error(`TMDB API error: ${error.response?.data?.status_message || error.message}`);
  }
}

/**
 * Get popular TV series from TMDB
 */
export async function getTMDBSeriesBulk(options: BulkQueryOptions = {}): Promise<TMDBSeries[]> {
  const apiKey = getApiKey();
  const {
    genreId,
    releaseYear,
    minRating,
    limit = 20,
    offset = 0,
    sortBy = "popularity",
    order = "desc",
  } = options;

  try {
    // Build query parameters
    const params: Record<string, string | number> = {
      api_key: apiKey,
      language: "de-DE",
      page: Math.floor(offset / limit) + 1,
      "vote_count.gte": 50, // Only series with at least 50 votes
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
    
    let series = response.data.results || [];
    
    // Filter out series without overview or poster
    series = series.filter((s: TMDBSeries) => s.overview && s.poster_path);
    
    // Limit results
    const startIndex = offset % limit;
    series = series.slice(startIndex, startIndex + limit);

    // Fetch detailed information for each series (including videos and images)
    const detailedSeries = await Promise.all(
      series.map(async (serie: TMDBSeries) => {
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

    return detailedSeries;
  } catch (error: any) {
    console.error("TMDB Series Query Error:", {
      options,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.response?.data || error.message,
    });
    throw new Error(`TMDB API error: ${error.response?.data?.status_message || error.message}`);
  }
}

/**
 * Get movie by TMDB ID
 */
export async function getTMDBMovieById(id: number): Promise<TMDBMovie | null> {
  try {
    const apiKey = getApiKey();
    const response = await axios.get(`${TMDB_API_BASE}/movie/${id}`, {
      params: {
        api_key: apiKey,
        language: "de-DE",
        append_to_response: "videos,images",
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get TV series by TMDB ID
 */
export async function getTMDBSeriesById(id: number): Promise<TMDBSeries | null> {
  try {
    const apiKey = getApiKey();
    const response = await axios.get(`${TMDB_API_BASE}/tv/${id}`, {
      params: {
        api_key: apiKey,
        language: "de-DE",
        append_to_response: "videos,images",
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Search movies on TMDB
 */
export async function searchTMDBMovies(query: string, limit = 10): Promise<TMDBMovie[]> {
  try {
    const apiKey = getApiKey();
    const response = await axios.get(`${TMDB_API_BASE}/search/movie`, {
      params: {
        api_key: apiKey,
        language: "de-DE",
        query,
        page: 1,
      },
    });
    return (response.data.results || []).slice(0, limit);
  } catch (error: any) {
    console.error("TMDB Movie Search Error:", error);
    throw new Error(`TMDB API error: ${error.response?.data?.status_message || error.message}`);
  }
}

/**
 * Search TV series on TMDB
 */
export async function searchTMDBSeries(query: string, limit = 10): Promise<TMDBSeries[]> {
  try {
    const apiKey = getApiKey();
    const response = await axios.get(`${TMDB_API_BASE}/search/tv`, {
      params: {
        api_key: apiKey,
        language: "de-DE",
        query,
        page: 1,
      },
    });
    return (response.data.results || []).slice(0, limit);
  } catch (error: any) {
    console.error("TMDB Series Search Error:", error);
    throw new Error(`TMDB API error: ${error.response?.data?.status_message || error.message}`);
  }
}

/**
 * Get full image URL from TMDB path
 */
export function getTMDBImageUrl(path: string | null, size: "w300" | "w500" | "w780" | "w1280" | "original" = "w1280"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
