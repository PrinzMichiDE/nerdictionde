"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Database, CheckCircle2, XCircle, SkipForward } from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";

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
  errors: Array<{ game: string; error: string }>;
}

export function BulkCreate() {
  const [genres, setGenres] = useState<Genre[]>([]);
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
  const [sortBy, setSortBy] = useState<"popularity" | "rating" | "release_date" | "name">("popularity");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [batchSize, setBatchSize] = useState<string>("5");
  const [delay, setDelay] = useState<string>("2000");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [skipExisting, setSkipExisting] = useState(true);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      // Load genres and platforms from IGDB
      const [genresResponse, platformsResponse] = await Promise.allSettled([
        axios.post("/api/igdb/genres"),
        axios.post("/api/igdb/platforms"),
      ]);
      
      if (genresResponse.status === "fulfilled") {
        setGenres(genresResponse.value.data || []);
      } else {
        console.error("Error loading genres:", genresResponse.reason);
      }
      
      if (platformsResponse.status === "fulfilled") {
        setPlatforms(platformsResponse.value.data || []);
      } else {
        console.error("Error loading platforms:", platformsResponse.reason);
      }
    } catch (error) {
      console.error("Error loading options:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!limit || parseInt(limit) <= 0) {
      alert("Bitte gib eine gültige Anzahl an.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const queryOptions: any = {
        limit: parseInt(limit),
        sortBy,
        order,
      };

      if (genreId && genreId !== "all") queryOptions.genreId = parseInt(genreId);
      if (platformId && platformId !== "all") queryOptions.platformId = parseInt(platformId);
      if (releaseYear) queryOptions.releaseYear = parseInt(releaseYear);
      if (minRating) queryOptions.minRating = parseFloat(minRating);

      const response = await axios.post("/api/reviews/bulk-create", {
        queryOptions,
        batchSize: parseInt(batchSize) || 5,
        delayBetweenBatches: parseInt(delay) || 2000,
        status,
        skipExisting,
      });

      setResult(response.data.results);
    } catch (error: any) {
      console.error("Bulk create failed:", error);
      alert("Fehler bei der Massenerstellung: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
              <Database className="text-primary h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Massen-Erstellung</CardTitle>
              <CardDescription>
                Erstelle mehrere Reviews gleichzeitig basierend auf IGDB-Datenbank-Kriterien
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingOptions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Lade Optionen...</span>
            </div>
          ) : (
            <>
              {/* IGDB Query Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">IGDB Filter</h3>
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

                  <div className="space-y-2">
                    <Label htmlFor="order">Reihenfolge</Label>
                    <Select value={order} onValueChange={(v) => setOrder(v as any)}>
                      <SelectTrigger id="order">
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
                <h3 className="text-lg font-semibold">Verarbeitungs-Optionen</h3>
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

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Entwurf</SelectItem>
                        <SelectItem value="published">Veröffentlicht</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skipExisting">Bereits vorhandene überspringen</Label>
                    <Select
                      value={skipExisting ? "true" : "false"}
                      onValueChange={(v) => setSkipExisting(v === "true")}
                    >
                      <SelectTrigger id="skipExisting">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ja</SelectItem>
                        <SelectItem value="false">Nein</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBulkCreate}
                disabled={loading || !limit}
                className="w-full h-12 text-lg font-bold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Erstelle Reviews...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Massenerstellung starten
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle>Ergebnisse</CardTitle>
            <CardDescription>Zusammenfassung der Massenerstellung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-sm text-muted-foreground">Gesamt</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                <div className="text-sm text-muted-foreground">Erfolgreich</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-muted-foreground">Übersprungen</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
              </div>
            </div>

            {result.reviews.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Erstellte Reviews ({result.reviews.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                    >
                      <span>{review.title}</span>
                      <Badge variant="outline">{review.slug}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Fehler ({result.errors.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-2 bg-red-500/10 rounded text-sm"
                    >
                      <div className="font-medium">{error.game}</div>
                      <div className="text-xs text-muted-foreground">{error.error}</div>
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

