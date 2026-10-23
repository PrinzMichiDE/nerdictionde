"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Database, CheckCircle2, XCircle, Film, Tv } from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Genre {
  id: number;
  name: string;
}

interface Platform {
  id: number;
  name: string;
}

interface BulkCreateResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  reviews: Array<{ id: string; title: string; slug: string }>;
  errors: Array<{ game?: string; movie?: string; series?: string; error: string }>;
}

type Category = "game" | "movie" | "series";

export function BulkCreate() {
  const { toast } = useToast();
  const [category, setCategory] = useState<Category>("game");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [tmdbMovieGenres, setTmdbMovieGenres] = useState<Genre[]>([]);
  const [tmdbSeriesGenres, setTmdbSeriesGenres] = useState<Genre[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [result, setResult] = useState<BulkCreateResult | null>(null);

  // Form state
  const [genreId, setGenreId] = useState<string>("all");
  const [platformId, setPlatformId] = useState<string>("all");
  const [releaseYear, setReleaseYear] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [limit, setLimit] = useState<string>("20");
  const [sortBy, setSortBy] = useState<"popularity" | "rating" | "release_date" | "name" | "title">("popularity");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [batchSize, setBatchSize] = useState<string>("5");
  const [delay, setDelay] = useState<string>("2000");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [skipExisting, setSkipExisting] = useState(true);

  // Reset filters when category changes
  useEffect(() => {
    if (category === "game") {
      setMinRating("70");
    } else {
      setMinRating("7.0");
    }
    setGenreId("all");
    setPlatformId("all");
    setReleaseYear("");
  }, [category]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      // Load genres and platforms
      const [genresResponse, platformsResponse, movieGenresRes, seriesGenresRes] = await Promise.allSettled([
        axios.post("/api/igdb/genres"),
        axios.post("/api/igdb/platforms"),
        axios.post("/api/tmdb/genres", { type: "movie" }),
        axios.post("/api/tmdb/genres", { type: "series" }),
      ]);
      
      if (genresResponse.status === "fulfilled") {
        setGenres(genresResponse.value.data || []);
      }
      
      if (platformsResponse.status === "fulfilled") {
        setPlatforms(platformsResponse.value.data || []);
      }

      if (movieGenresRes.status === "fulfilled") {
        setTmdbMovieGenres(movieGenresRes.value.data || []);
      }

      if (seriesGenresRes.status === "fulfilled") {
        setTmdbSeriesGenres(seriesGenresRes.value.data || []);
      }
    } catch (error) {
      console.error("Error loading options:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!limit || parseInt(limit) <= 0) {
      toast({
        title: "Ungültige Anzahl",
        description: "Bitte gib eine gültige Anzahl an.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const queryOptions: any = {
        limit: parseInt(limit),
        sortBy: sortBy === "title" ? "name" : sortBy, // TMDB uses "name" for title sorting
        order,
      };

      if (genreId && genreId !== "all") queryOptions.genreId = parseInt(genreId);
      if (platformId && platformId !== "all" && category === "game") {
        queryOptions.platformId = parseInt(platformId);
      }
      if (releaseYear) queryOptions.releaseYear = parseInt(releaseYear);
      if (minRating) queryOptions.minRating = parseFloat(minRating);

      let endpoint = "/api/reviews/bulk-create";
      const requestBody: any = {
        batchSize: parseInt(batchSize) || 5,
        delayBetweenBatches: parseInt(delay) || 2000,
        status,
        skipExisting,
      };

      if (category === "movie") {
        endpoint = "/api/reviews/bulk-create-movies";
        requestBody.queryOptions = queryOptions;
      } else if (category === "series") {
        endpoint = "/api/reviews/bulk-create-series";
        requestBody.queryOptions = queryOptions;
      } else {
        requestBody.queryOptions = queryOptions;
      }

      const response = await axios.post(endpoint, requestBody);

      setResult(response.data.results);
      toast({
        title: "Massenerstellung abgeschlossen",
        description: `${response.data.results.successful} von ${response.data.results.total} Reviews erstellt.`,
      });
    } catch (error: any) {
      console.error("Bulk create failed:", error);
      toast({
        title: "Massenerstellung fehlgeschlagen",
        description: error.response?.data?.error || error.message || "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Massen-Erstellung</CardTitle>
          <CardDescription>
            Mehrere Reviews nach Datenbank-Kriterien auf einmal erstellen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <Tabs value={category} onValueChange={(v) => setCategory(v as Category)}>
            <TabsList className="grid w-full grid-cols-3 gap-1">
              <TabsTrigger value="game" className="flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-4">
                <Database className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Games
              </TabsTrigger>
              <TabsTrigger value="movie" className="flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-4">
                <Film className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Filme
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-4">
                <Tv className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Serien
              </TabsTrigger>
            </TabsList>

            <TabsContent value="game" className="space-y-6 mt-4">
              {loadingOptions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Lade Optionen</span>
                </div>
              ) : (
                <>
                  {/* IGDB Query Options */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">IGDB Filter</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select value={genreId} onValueChange={setGenreId}>
                      <SelectTrigger id="genre">
                        <SelectValue placeholder="Alle Genres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Genres</SelectItem>
                        {genres.map((genre) => (
                          <SelectItem key={genre.id} value={genre.id.toString()}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={platformId} onValueChange={setPlatformId}>
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Alle Plattformen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Plattformen</SelectItem>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id.toString()}>
                            {platform.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="releaseYear">Erscheinungsjahr</Label>
                    <Input
                      id="releaseYear"
                      type="number"
                      placeholder="z.B. 2023"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      min="1970"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minRating">Mindest-Rating (0-100)</Label>
                    <Input
                      id="minRating"
                      type="number"
                      placeholder="z.B. 70"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limit">Anzahl Spiele</Label>
                    <Input
                      id="limit"
                      type="number"
                      placeholder="20"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sortBy">Sortieren nach</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger id="sortBy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularität</SelectItem>
                        <SelectItem value="rating">Bewertung</SelectItem>
                        <SelectItem value="release_date">Erscheinungsdatum</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Processing Options */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-base font-semibold">Verarbeitungs-Optionen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchSize">Batch-Größe</Label>
                    <Input
                      id="batchSize"
                      type="number"
                      placeholder="5"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value)}
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Anzahl der gleichzeitig verarbeiteten Spiele
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delay">Verzögerung zwischen Batches (ms)</Label>
                    <Input
                      id="delay"
                      type="number"
                      placeholder="2000"
                      value={delay}
                      onChange={(e) => setDelay(e.target.value)}
                      min="0"
                      max="10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pause zwischen Batches (verhindert Rate-Limiting)
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBulkCreate}
                disabled={loading || !limit}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Erstelle Reviews
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Massenerstellung starten
                  </>
                )}
              </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="movie" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-base font-semibold">TMDB Filter</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="movie-genre">Genre</Label>
                    <Select value={genreId} onValueChange={setGenreId}>
                      <SelectTrigger id="movie-genre">
                        <SelectValue placeholder="Alle Genres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Genres</SelectItem>
                        {tmdbMovieGenres.map((genre) => (
                          <SelectItem key={genre.id} value={genre.id.toString()}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movie-releaseYear">Erscheinungsjahr</Label>
                    <Input
                      id="movie-releaseYear"
                      type="number"
                      placeholder="z.B. 2023"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movie-minRating">Mindest-Rating (0-10)</Label>
                    <Input
                      id="movie-minRating"
                      type="number"
                      placeholder="z.B. 7.0"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      min="0"
                      max="10"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movie-limit">Anzahl Filme</Label>
                    <Input
                      id="movie-limit"
                      type="number"
                      placeholder="20"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movie-sortBy">Sortieren nach</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger id="movie-sortBy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularität</SelectItem>
                        <SelectItem value="rating">Bewertung</SelectItem>
                        <SelectItem value="release_date">Erscheinungsdatum</SelectItem>
                        <SelectItem value="title">Titel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movie-order">Reihenfolge</Label>
                    <Select value={order} onValueChange={(v) => setOrder(v as any)}>
                      <SelectTrigger id="movie-order">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Absteigend</SelectItem>
                        <SelectItem value="asc">Aufsteigend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Processing Options */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-base font-semibold">Verarbeitungs-Optionen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="movie-batchSize">Batch-Größe</Label>
                    <Input
                      id="movie-batchSize"
                      type="number"
                      placeholder="5"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value)}
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Anzahl der gleichzeitig verarbeiteten Filme
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movie-delay">Verzögerung zwischen Batches (ms)</Label>
                    <Input
                      id="movie-delay"
                      type="number"
                      placeholder="2000"
                      value={delay}
                      onChange={(e) => setDelay(e.target.value)}
                      min="0"
                      max="10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pause zwischen Batches (verhindert Rate-Limiting)
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBulkCreate}
                disabled={loading || !limit}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Erstelle Reviews
                  </>
                ) : (
                  <>
                    <Film className="mr-2 h-4 w-4" />
                    Massenerstellung starten
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="series" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-base font-semibold">TMDB Filter</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="series-genre">Genre</Label>
                    <Select value={genreId} onValueChange={setGenreId}>
                      <SelectTrigger id="series-genre">
                        <SelectValue placeholder="Alle Genres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Genres</SelectItem>
                        {tmdbSeriesGenres.map((genre) => (
                          <SelectItem key={genre.id} value={genre.id.toString()}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="series-releaseYear">Erstausstrahlungsjahr</Label>
                    <Input
                      id="series-releaseYear"
                      type="number"
                      placeholder="z.B. 2023"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="series-minRating">Mindest-Rating (0-10)</Label>
                    <Input
                      id="series-minRating"
                      type="number"
                      placeholder="z.B. 7.0"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      min="0"
                      max="10"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="series-limit">Anzahl Serien</Label>
                    <Input
                      id="series-limit"
                      type="number"
                      placeholder="20"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="series-sortBy">Sortieren nach</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger id="series-sortBy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularität</SelectItem>
                        <SelectItem value="rating">Bewertung</SelectItem>
                        <SelectItem value="release_date">Erstausstrahlung</SelectItem>
                        <SelectItem value="title">Titel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="series-order">Reihenfolge</Label>
                    <Select value={order} onValueChange={(v) => setOrder(v as any)}>
                      <SelectTrigger id="series-order">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Absteigend</SelectItem>
                        <SelectItem value="asc">Aufsteigend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Processing Options */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-base font-semibold">Verarbeitungs-Optionen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="series-batchSize">Batch-Größe</Label>
                    <Input
                      id="series-batchSize"
                      type="number"
                      placeholder="5"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value)}
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Anzahl der gleichzeitig verarbeiteten Serien
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="series-delay">Verzögerung zwischen Batches (ms)</Label>
                    <Input
                      id="series-delay"
                      type="number"
                      placeholder="2000"
                      value={delay}
                      onChange={(e) => setDelay(e.target.value)}
                      min="0"
                      max="10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pause zwischen Batches (verhindert Rate-Limiting)
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBulkCreate}
                disabled={loading || !limit}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Erstelle Reviews
                  </>
                ) : (
                  <>
                    <Tv className="mr-2 h-4 w-4" />
                    Massenerstellung starten
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ergebnisse</CardTitle>
            <CardDescription>Zusammenfassung der Massenerstellung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="rounded-lg bg-muted px-3 py-3 text-center">
                <div className="text-xl font-semibold tabular-nums md:text-2xl">{result.total}</div>
                <div className="text-sm text-muted-foreground">Gesamt</div>
              </div>
              <div className="rounded-lg bg-success/10 px-3 py-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-success md:text-2xl">{result.successful}</div>
                <div className="text-sm text-muted-foreground">Erfolgreich</div>
              </div>
              <div className="rounded-lg bg-warning/10 px-3 py-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-warning md:text-2xl">{result.skipped}</div>
                <div className="text-sm text-muted-foreground">Übersprungen</div>
              </div>
              <div className="rounded-lg bg-destructive/10 px-3 py-3 text-center">
                <div className="text-xl font-semibold tabular-nums text-destructive md:text-2xl">{result.failed}</div>
                <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
              </div>
            </div>

            {result.reviews.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Erstellte Reviews ({result.reviews.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 p-2 bg-muted/50 rounded text-xs md:text-sm"
                    >
                      <span className="truncate">{review.title}</span>
                      <Badge variant="outline" className="text-[10px] md:text-xs w-fit">{review.slug}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Fehler ({result.errors.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="rounded bg-destructive/10 p-2 text-xs md:text-sm"
                    >
                      <div className="font-medium break-words">
                        {error.game || error.movie || error.series}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground break-words mt-1">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

