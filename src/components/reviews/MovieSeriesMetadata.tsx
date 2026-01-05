"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Film, Users, Globe, Star, TrendingUp, Building2 } from "lucide-react";

interface MovieSeriesMetadataProps {
  metadata: {
    genres?: string[];
    production_companies?: string[];
    production_countries?: string[];
    spoken_languages?: string[];
    release_date?: string;
    first_air_date?: string;
    runtime?: number;
    number_of_seasons?: number;
    number_of_episodes?: number;
    tmdb_score?: number;
    vote_count?: number;
    popularity?: number;
  };
  category: "movie" | "series";
  isEn?: boolean;
}

export function MovieSeriesMetadata({ metadata, category, isEn = false }: MovieSeriesMetadataProps) {
  const isMovie = category === "movie";
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(isEn ? "en-US" : "de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format runtime
  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}${isEn ? "m" : " Min"}`;
    }
    return `${mins}${isEn ? "m" : " Min"}`;
  };

  const releaseDate = isMovie ? metadata.release_date : metadata.first_air_date;
  const formattedDate = formatDate(releaseDate);

  return (
    <div className="space-y-6 pt-10 border-t">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        <Film className="h-8 w-8 text-primary" />
        {isEn ? "Details" : "Details"}
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Release Date / First Air Date */}
        {formattedDate && (
          <div className="p-6 rounded-2xl bg-muted/30 border-2 border-border/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
              <Calendar className="h-4 w-4" />
              {isMovie 
                ? (isEn ? "Release Date" : "Erscheinungsdatum")
                : (isEn ? "First Air Date" : "Erstausstrahlung")
              }
            </div>
            <p className="text-lg font-semibold text-foreground">{formattedDate}</p>
          </div>
        )}

        {/* Runtime / Episodes */}
        {isMovie ? (
          metadata.runtime && (
            <div className="p-6 rounded-2xl bg-muted/30 border-2 border-border/50 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
                <Clock className="h-4 w-4" />
                {isEn ? "Runtime" : "Laufzeit"}
              </div>
              <p className="text-lg font-semibold text-foreground">{formatRuntime(metadata.runtime)}</p>
            </div>
          )
        ) : (
          <>
            {metadata.number_of_seasons && (
              <div className="p-6 rounded-2xl bg-muted/30 border-2 border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
                  <Film className="h-4 w-4" />
                  {isEn ? "Seasons" : "Staffeln"}
                </div>
                <p className="text-lg font-semibold text-foreground">{metadata.number_of_seasons}</p>
              </div>
            )}
            {metadata.number_of_episodes && (
              <div className="p-6 rounded-2xl bg-muted/30 border-2 border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
                  <Film className="h-4 w-4" />
                  {isEn ? "Episodes" : "Episoden"}
                </div>
                <p className="text-lg font-semibold text-foreground">{metadata.number_of_episodes}</p>
              </div>
            )}
          </>
        )}

        {/* TMDB Score */}
        {metadata.tmdb_score !== undefined && metadata.tmdb_score !== null && !isNaN(Number(metadata.tmdb_score)) && (
          <div className="p-6 rounded-2xl bg-muted/30 border-2 border-border/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
              <Star className="h-4 w-4" />
              {isEn ? "TMDB Rating" : "TMDB Bewertung"}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">
                {metadata.tmdb_score != null && !isNaN(Number(metadata.tmdb_score)) 
                  ? Number(metadata.tmdb_score).toFixed(1) 
                  : "N/A"}
              </p>
              <span className="text-sm text-muted-foreground">/ 10</span>
              {metadata.vote_count && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({metadata.vote_count.toLocaleString()} {isEn ? "votes" : "Stimmen"})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Popularity */}
        {metadata.popularity !== undefined && metadata.popularity !== null && !isNaN(Number(metadata.popularity)) && (
          <div className="p-6 rounded-2xl bg-muted/30 border-2 border-border/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
              <TrendingUp className="h-4 w-4" />
              {isEn ? "Popularity" : "Popularität"}
            </div>
            <p className="text-lg font-semibold text-foreground">
              {metadata.popularity != null && !isNaN(Number(metadata.popularity)) 
                ? Number(metadata.popularity).toFixed(1) 
                : "N/A"}
            </p>
          </div>
        )}
      </div>

      {/* Genres */}
      {metadata.genres && metadata.genres.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            {isEn ? "Genres" : "Genres"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {metadata.genres.map((genre, index) => (
              <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Production Companies */}
      {metadata.production_companies && metadata.production_companies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isEn ? "Production Companies" : "Produktionsfirmen"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {metadata.production_companies.map((company, index) => (
              <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                {company}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Production Countries */}
      {metadata.production_countries && metadata.production_countries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {isEn ? "Production Countries" : "Produktionsländer"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {metadata.production_countries.map((country, index) => (
              <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                {country}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Spoken Languages */}
      {metadata.spoken_languages && metadata.spoken_languages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {isEn ? "Spoken Languages" : "Sprachen"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {metadata.spoken_languages.map((language, index) => (
              <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                {language}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
