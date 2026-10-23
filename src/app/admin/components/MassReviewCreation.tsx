"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Play, Pause, CheckCircle2, XCircle, Clock, Database, 
  TrendingUp, Film, Tv, Cpu, RefreshCcw, List, ChevronDown, ChevronUp, ExternalLink, Plus
} from "lucide-react";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ReviewCategory = "game" | "movie" | "series" | "hardware";

interface JobItem {
  name: string;
  igdbId?: number;
  tmdbId?: number;
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
  error?: string;
  reviewId?: string;
}

interface JobStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  category: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  queue: JobItem[];
  currentBatch: number;
  totalBatches: number;
  startTime: number;
  estimatedTimeRemaining?: number;
  errors: Array<{ item: string; error: string }>;
  reviews: Array<{ id: string; title: string; slug: string; igdbId?: number; tmdbId?: number }>;
}

export function MassReviewCreation() {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Form state
  const [category, setCategory] = useState<ReviewCategory>("game");
  const [count, setCount] = useState<string>("200");
  const [batchSize, setBatchSize] = useState<string>("5");
  const [delayBetweenBatches, setDelayBetweenBatches] = useState<string>("3000");
  const [delayBetweenItems, setDelayBetweenItems] = useState<string>("2000");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [skipExisting, setSkipExisting] = useState<boolean>(true);
  const [genreId, setGenreId] = useState<string>("all");
  const [platformId, setPlatformId] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("");
  const [maxRating, setMaxRating] = useState<string>("");
  const [genres, setGenres] = useState<Array<{ id: number; name: string }>>([]);
  const [platforms, setPlatforms] = useState<Array<{ id: number; name: string }>>([]);
  const [tmdbMovieGenres, setTmdbMovieGenres] = useState<Array<{ id: number; name: string }>>([]);
  const [tmdbSeriesGenres, setTmdbSeriesGenres] = useState<Array<{ id: number; name: string }>>([]);

  // Auto-poll for all jobs if any are running
  useEffect(() => {
    const hasActiveJobs = jobs.some(j => j.status === "running" || j.status === "pending");
    
    if (hasActiveJobs && !pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        fetchJobs(false); // Silent update
      }, 3000);
    } else if (!hasActiveJobs && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [jobs]);

  // Update selected jobStatus when jobs list changes
  useEffect(() => {
    if (jobId) {
      const updatedJob = jobs.find(j => j.jobId === jobId);
      if (updatedJob) {
        setJobStatus(updatedJob);
      }
    }
  }, [jobs, jobId]);

  // Initial load: Fetch all jobs
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (showLoading = true) => {
    if (showLoading) setLoadingJobs(true);
    try {
      const response = await axios.get("/api/reviews/jobs");
      const fetchedJobs = response.data.jobs;
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      if (showLoading) setLoadingJobs(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);

    try {
      const requestBody: any = {
        category,
        count: parseInt(count) || 200,
        batchSize: parseInt(batchSize) || 5,
        delayBetweenBatches: parseInt(delayBetweenBatches) || 3000,
        delayBetweenItems: parseInt(delayBetweenItems) || 2000,
        status,
        skipExisting,
      };

      if (category === "game") {
        requestBody.queryOptions = {
          sortBy: "popularity",
          order: "desc",
          minRating: parseFloat(minRating) || 50,
        };
        if (genreId && genreId !== "all") requestBody.queryOptions.genreId = parseInt(genreId);
        if (platformId && platformId !== "all") requestBody.queryOptions.platformId = parseInt(platformId);
      } else if (category === "movie" || category === "series") {
        // TMDB uses 0-10 scale, IGDB uses 0-100.
        // If minRating is > 10, it's likely the IGDB default, so we scale it down.
        const rating = parseFloat(minRating);
        const adjustedRating = rating > 10 ? rating / 10 : rating;
        
        requestBody.queryOptions = {
          sortBy: "popularity",
          order: "desc",
          minRating: adjustedRating || 5,
        };
        if (genreId && genreId !== "all") requestBody.queryOptions.genreId = parseInt(genreId);
      }

      const response = await axios.post("/api/reviews/bulk-create-mass", requestBody);
      const newJobId = response.data.jobId;
      
      setJobId(newJobId);
      fetchJobs(); // Refresh the list to include the new job
    } catch (error: any) {
      console.error("Error starting job:", error);
      alert("Fehler beim Starten des Jobs: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const selectJob = (job: JobStatus) => {
    setJobId(job.jobId);
    setJobStatus(job);
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds) return "Berechne";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "game": return <Database className="h-4 w-4" />;
      case "movie": return <Film className="h-4 w-4" />;
      case "series": return <Tv className="h-4 w-4" />;
      case "hardware": return <Cpu className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const progressPercentage = jobStatus
    ? Math.round((jobStatus.processed / jobStatus.total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Form & History */}
      <div className="lg:col-span-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Neuer Massen-Job</CardTitle>
            <CardDescription>Konfigurieren und starten</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ReviewCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game">Games</SelectItem>
                  <SelectItem value="movie">Filme</SelectItem>
                  <SelectItem value="series">Serien</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Anzahl</Label>
                <Input type="number" value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Batch-Größe</Label>
                <Input type="number" value={batchSize} onChange={(e) => setBatchSize(e.target.value)} />
              </div>
            </div>

            {(category === "game" || category === "movie" || category === "series") && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select value={genreId} onValueChange={setGenreId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Genres" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Genres</SelectItem>
                        {(category === "game" ? genres : (category === "movie" ? tmdbMovieGenres : tmdbSeriesGenres)).map((g) => (
                          <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {category === "game" && (
                    <div className="space-y-2">
                      <Label>Plattform</Label>
                      <Select value={platformId} onValueChange={setPlatformId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Alle Plattformen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Plattformen</SelectItem>
                          {platforms.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Mindest-Rating ({category === "game" ? "0-100" : "0-10"})</Label>
                    <Input 
                      type="number" 
                      value={minRating} 
                      onChange={(e) => setMinRating(e.target.value)} 
                      step={category === "game" ? "1" : "0.1"}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleStart} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Job starten
            </Button>
          </CardContent>
        </Card>

        {/* Job History List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Job Historie</CardTitle>
              <CardDescription>Die letzten 50 Jobs</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setJobId(null);
                  setJobStatus(null);
                  setPolling(false);
                  if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                  }
                }}
                title="Neuen Job konfigurieren"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => fetchJobs()} disabled={loadingJobs}>
                <RefreshCcw className={cn("h-4 w-4", loadingJobs && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-4">
                {jobs.length === 0 && !loadingJobs && (
                  <div className="text-center py-8 text-muted-foreground italic text-sm">
                    Keine Jobs gefunden
                  </div>
                )}
                {jobs.map((job) => (
                  <div
                    key={job.jobId}
                    onClick={() => selectJob(job)}
                    className={cn(
                      "flex flex-col p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                      jobId === job.jobId ? "bg-primary/5 border-primary/30" : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(job.category)}
                        <span className="font-semibold text-sm capitalize">{job.category} ({job.total})</span>
                      </div>
                      <Badge variant={
                        job.status === "completed" ? "default" : 
                        job.status === "failed" ? "destructive" : 
                        "secondary"
                      } className="capitalize text-xs font-medium">
                        {job.status === "running" ? "Läuft" : job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                      <span>{formatDate(job.startTime)}</span>
                      <span>{job.processed}/{job.total} verarbeitet</span>
                    </div>
                    {job.status === "running" && (
                      <Progress value={(job.processed / job.total) * 100} className="h-1 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Active Job Details */}
      <div className="lg:col-span-7 space-y-6">
        {!jobStatus ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
            <List className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Kein Job ausgewählt</h3>
            <p className="text-sm text-muted-foreground/70 max-w-xs mt-2">
              Wähle einen Job aus der Liste aus oder starte einen neuen, um Details anzuzeigen.
            </p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Job Details</CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      {jobStatus.jobId.substring(0, 8)}…
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    {getCategoryIcon(jobStatus.category)}
                    <span className="capitalize">{jobStatus.category}</span>
                    <span className="text-muted-foreground/60">,</span>
                    <span>Gestartet am {formatDate(jobStatus.startTime)}</span>
                  </CardDescription>
                </div>
                {jobStatus.status === "running" && (
                  <Badge className="flex items-center gap-1.5 bg-primary motion-safe:animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Aktiv
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-success">{jobStatus.successful}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Erfolg</div>
                </div>
                <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-warning">{jobStatus.skipped}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Übersprungen</div>
                </div>
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-destructive">{jobStatus.failed}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Fehler</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums">{jobStatus.processed}/{jobStatus.total}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Gesamt</div>
                </div>
              </div>

              {/* Main Progress */}
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <Label className="text-sm font-medium">Fortschritt</Label>
                  <span className="text-lg font-semibold tabular-nums text-primary">{progressPercentage} %</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Batch {jobStatus.currentBatch} von {jobStatus.totalBatches}</span>
                  {jobStatus.status === "running" && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ETA: {formatTime(jobStatus.estimatedTimeRemaining)}
                    </div>
                  )}
                </div>
              </div>

              {/* Errors Section */}
              {jobStatus.errors && jobStatus.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <XCircle className="h-4 w-4" />
                    Fehler ({jobStatus.errors.length})
                  </div>
                  <ScrollArea className="h-[120px] rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="space-y-2 p-3">
                      {jobStatus.errors.map((err, i) => (
                        <div key={i} className="rounded border border-border bg-card p-2 text-xs">
                          <span className="font-medium">{err.item}:</span> {err.error}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Queue Header */}
              <div className="flex items-center justify-between border-t pt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowQueue(!showQueue)}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  {showQueue ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Warteschlange ({jobStatus.queue.length})
                </Button>
                {jobStatus.reviews && jobStatus.reviews.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {jobStatus.reviews.length} Reviews erstellt
                  </Badge>
                )}
              </div>

              {/* Queue Items */}
              {showQueue && (
                <ScrollArea className="h-[400px] rounded-lg border border-border bg-muted/5 p-4">
                  <div className="space-y-2">
                    {jobStatus.queue.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col justify-between gap-2 rounded-lg border border-border bg-card p-3 transition-colors sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{item.name}</span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            {item.igdbId && <span className="text-xs tabular-nums text-muted-foreground">IGDB: {item.igdbId}</span>}
                            {item.tmdbId && <span className="text-xs tabular-nums text-muted-foreground">TMDB: {item.tmdbId}</span>}
                            {item.error && <span className="max-w-[200px] truncate text-xs text-destructive">{item.error}</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {item.reviewId && (
                            <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs font-medium">
                              <a href={`/reviews/${item.reviewId}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                Ansehen
                              </a>
                            </Button>
                          )}
                          <Badge
                            variant={item.status === "completed" ? "default" : item.status === "failed" ? "destructive" : "secondary"}
                            className="h-6 capitalize text-xs font-medium"
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
