"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Play, Pause, CheckCircle2, XCircle, Clock, Database, 
  TrendingUp, Film, Tv, Cpu, ShoppingCart, RefreshCcw, List, ChevronDown, ChevronUp, ExternalLink 
} from "lucide-react";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ReviewCategory = "game" | "movie" | "series" | "hardware" | "product";

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
  const [count, setCount] = useState<string>("50");
  const [genreId, setGenreId] = useState<string>("all");
  const [platformId, setPlatformId] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("50");
  const [batchSize, setBatchSize] = useState<string>("5");
  const [delayBetweenBatches, setDelayBetweenBatches] = useState<string>("3000");
  const [delayBetweenItems, setDelayBetweenItems] = useState<string>("2000");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [skipExisting, setSkipExisting] = useState(true);
  const [hardwareNames, setHardwareNames] = useState<string>("");
  const [productNames, setProductNames] = useState<string>("");

  // Initial load: Fetch all jobs and auto-resume if necessary
  useEffect(() => {
    fetchJobs();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await axios.get("/api/reviews/jobs");
      const fetchedJobs = response.data.jobs;
      setJobs(fetchedJobs);

      // Auto-resume: Find first running or pending job and start polling if not already polling
      const activeJob = fetchedJobs.find((j: JobStatus) => j.status === "running" || j.status === "pending");
      if (activeJob && !polling) {
        setJobId(activeJob.jobId);
        setJobStatus(activeJob);
        startPolling(activeJob.jobId);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const startPolling = (id: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setPolling(true);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/reviews/bulk-create-mass-progress/${id}`);
        const job = response.data.job;
        setJobStatus(job);

        // Update jobs list with current status
        setJobs(prev => prev.map(j => j.jobId === job.jobId ? job : j));

        // Stop polling if job is completed or failed
        if (job.status === "completed" || job.status === "failed") {
          setPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Refresh list to make sure everything is in sync
          fetchJobs();
        }
      } catch (error) {
        console.error("Error polling job status:", error);
      }
    }, 2000);
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
        requestBody.queryOptions = {
          sortBy: "popularity",
          order: "desc",
          minRating: parseFloat(minRating) || 5,
        };
        if (genreId && genreId !== "all") requestBody.queryOptions.genreId = parseInt(genreId);
      } else if (category === "hardware") {
        if (!hardwareNames.trim()) {
          alert("Bitte geben Sie Hardware-Namen ein");
          setLoading(false);
          return;
        }
        requestBody.hardwareNames = hardwareNames.split("\n").map(n => n.trim()).filter(n => n.length > 0);
      } else if (category === "product") {
        if (!productNames.trim()) {
          alert("Bitte geben Sie Produktnamen ein");
          setLoading(false);
          return;
        }
        requestBody.productNames = productNames.split("\n").map(n => n.trim()).filter(n => n.length > 0);
      }

      const response = await axios.post("/api/reviews/bulk-create-mass", requestBody);
      const newJobId = response.data.jobId;
      
      setJobId(newJobId);
      fetchJobs(); // Refresh the list to include the new job
      startPolling(newJobId);
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
    if (job.status === "running" || job.status === "pending") {
      startPolling(job.jobId);
    } else {
      setPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds) return "Berechne...";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "failed": return "bg-red-500";
      case "processing":
      case "running": return "bg-blue-500";
      case "skipped": return "bg-yellow-500";
      default: return "bg-gray-300";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "game": return <Database className="h-4 w-4" />;
      case "movie": return <Film className="h-4 w-4" />;
      case "series": return <Tv className="h-4 w-4" />;
      case "hardware": return <Cpu className="h-4 w-4" />;
      case "product": return <ShoppingCart className="h-4 w-4" />;
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
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                <Play className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Neuer Massen-Job</CardTitle>
                <CardDescription>Konfigurieren und Starten</CardDescription>
              </div>
            </div>
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
                  <SelectItem value="product">Produkte</SelectItem>
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

            {(category === "hardware") && (
              <div className="space-y-2">
                <Label>Hardware Namen (einer pro Zeile)</Label>
                <Textarea 
                  placeholder="RTX 4090..." 
                  value={hardwareNames} 
                  onChange={(e) => setHardwareNames(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            {(category === "product") && (
              <div className="space-y-2">
                <Label>Produktnamen (einer pro Zeile)</Label>
                <Textarea 
                  placeholder="iPhone 15..." 
                  value={productNames} 
                  onChange={(e) => setProductNames(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            <Button 
              onClick={handleStart} 
              disabled={loading || polling} 
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Job starten
            </Button>
          </CardContent>
        </Card>

        {/* Job History List */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Job Historie</CardTitle>
              <CardDescription>Die letzten 50 Jobs</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchJobs} disabled={loadingJobs}>
              <RefreshCcw className={cn("h-4 w-4", loadingJobs && "animate-spin")} />
            </Button>
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
                      } className="text-[10px] px-1.5 py-0 h-5">
                        {job.status === "running" ? "Läuft" : job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/20 rounded-xl border-2 border-dashed">
            <List className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Kein Job ausgewählt</h3>
            <p className="text-sm text-muted-foreground/70 max-w-xs mt-2">
              Wählen Sie einen Job aus der Liste aus oder starten Sie einen neuen, um Details anzuzeigen.
            </p>
          </div>
        ) : (
          <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">Job Details</CardTitle>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {jobStatus.jobId.substring(0, 8)}...
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    {getCategoryIcon(jobStatus.category)}
                    <span className="capitalize">{jobStatus.category}</span>
                    <span>•</span>
                    <span>Gestartet am {formatDate(jobStatus.startTime)}</span>
                  </CardDescription>
                </div>
                {jobStatus.status === "running" && (
                  <Badge className="bg-blue-500 animate-pulse flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Aktiv
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
                  <div className="text-2xl font-bold text-green-600">{jobStatus.successful}</div>
                  <div className="text-[10px] uppercase tracking-wider text-green-700/70 font-bold">Erfolg</div>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{jobStatus.skipped}</div>
                  <div className="text-[10px] uppercase tracking-wider text-yellow-700/70 font-bold">Übersp.</div>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
                  <div className="text-2xl font-bold text-red-600">{jobStatus.failed}</div>
                  <div className="text-[10px] uppercase tracking-wider text-red-700/70 font-bold">Fehler</div>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-center">
                  <div className="text-2xl font-bold text-blue-600">{jobStatus.processed}/{jobStatus.total}</div>
                  <div className="text-[10px] uppercase tracking-wider text-blue-700/70 font-bold">Gesamt</div>
                </div>
              </div>

              {/* Main Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label className="text-sm font-semibold">Fortschritt</Label>
                  <span className="text-2xl font-black text-primary">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-4 shadow-inner" />
                <div className="flex justify-between text-xs text-muted-foreground italic font-medium">
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
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                    <XCircle className="h-4 w-4" />
                    Fehler ({jobStatus.errors.length})
                  </div>
                  <ScrollArea className="h-[120px] border border-red-200 bg-red-50/30 rounded-lg">
                    <div className="p-3 space-y-2">
                      {jobStatus.errors.map((err, i) => (
                        <div key={i} className="text-xs bg-white/80 p-2 rounded border border-red-100 shadow-sm">
                          <span className="font-bold">{err.item}:</span> {err.error}
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
                  className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]"
                >
                  {showQueue ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Warteschlange ({jobStatus.queue.length})
                </Button>
                {jobStatus.reviews && jobStatus.reviews.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    {jobStatus.reviews.length} Reviews erstellt
                  </Badge>
                )}
              </div>

              {/* Queue Items */}
              {showQueue && (
                <ScrollArea className="h-[400px] border rounded-xl bg-muted/5 p-4 shadow-inner">
                  <div className="space-y-2">
                    {jobStatus.queue.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-border/50 shadow-sm hover:border-primary/20 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0 shadow-sm",
                            getStatusColor(item.status)
                          )} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.igdbId && <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded">IGDB: {item.igdbId}</span>}
                              {item.tmdbId && <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded">TMDB: {item.tmdbId}</span>}
                              {item.error && <span className="text-[10px] text-red-500 font-medium truncate italic max-w-[200px]">{item.error}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          {item.reviewId && (
                            <Button variant="outline" size="sm" asChild className="h-8 px-2 text-[10px] font-bold">
                              <a href={`/reviews/${item.reviewId}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                VIEW
                              </a>
                            </Button>
                          )}
                          <Badge 
                            variant={item.status === "completed" ? "default" : item.status === "failed" ? "destructive" : "secondary"}
                            className="text-[9px] font-black uppercase tracking-tighter h-6"
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
