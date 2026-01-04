"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Pause, CheckCircle2, XCircle, Clock, Database, TrendingUp } from "lucide-react";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GameJobItem {
  name: string;
  igdbId?: number;
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
  error?: string;
  reviewId?: string;
}

interface JobStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  queue: GameJobItem[];
  currentBatch: number;
  totalBatches: number;
  startTime: number;
  estimatedTimeRemaining?: number;
  errors: Array<{ game: string; igdbId?: number; error: string }>;
  reviews: Array<{ id: string; title: string; slug: string; igdbId?: number }>;
}

export function GameReviewMassCreation() {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [genreId, setGenreId] = useState<string>("all");
  const [platformId, setPlatformId] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("50");
  const [batchSize, setBatchSize] = useState<string>("5");
  const [delayBetweenBatches, setDelayBetweenBatches] = useState<string>("3000");
  const [delayBetweenGames, setDelayBetweenGames] = useState<string>("2000");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [skipExisting, setSkipExisting] = useState(true);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startPolling = (id: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setPolling(true);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/reviews/bulk-create-200-progress/${id}`);
        const job = response.data.job;
        setJobStatus(job);

        // Stop polling if job is completed or failed
        if (job.status === "completed" || job.status === "failed") {
          setPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error polling job status:", error);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleStart = async () => {
    setLoading(true);
    setJobId(null);
    setJobStatus(null);

    try {
      const queryOptions: any = {
        sortBy: "popularity",
        order: "desc",
        minRating: parseFloat(minRating) || 50,
      };

      if (genreId && genreId !== "all") {
        queryOptions.genreId = parseInt(genreId);
      }
      if (platformId && platformId !== "all") {
        queryOptions.platformId = parseInt(platformId);
      }

      const response = await axios.post("/api/reviews/bulk-create-200", {
        queryOptions,
        batchSize: parseInt(batchSize) || 5,
        delayBetweenBatches: parseInt(delayBetweenBatches) || 3000,
        delayBetweenGames: parseInt(delayBetweenGames) || 2000,
        status,
        skipExisting,
      });

      const newJobId = response.data.jobId;
      setJobId(newJobId);
      startPolling(newJobId);
    } catch (error: any) {
      console.error("Error starting job:", error);
      alert("Fehler beim Starten des Jobs: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds) return "Berechne...";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const progressPercentage = jobStatus
    ? Math.round((jobStatus.processed / jobStatus.total) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "processing":
        return "bg-blue-500";
      case "skipped":
        return "bg-yellow-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-primary/10 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Database className="text-primary h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg md:text-xl lg:text-2xl break-words">
                200 Game Reviews Massenerstellung
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                Erstellt automatisch 200 Game Reviews von IGDB mit Progress-Tracking und Warteschlange
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Konfiguration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minRating">Mindest-Rating (0-100)</Label>
                <Input
                  id="minRating"
                  type="number"
                  placeholder="50"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  min="0"
                  max="100"
                />
              </div>

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
              </div>

              <div className="space-y-2">
                <Label htmlFor="delayBatches">Delay zwischen Batches (ms)</Label>
                <Input
                  id="delayBatches"
                  type="number"
                  placeholder="3000"
                  value={delayBetweenBatches}
                  onChange={(e) => setDelayBetweenBatches(e.target.value)}
                  min="0"
                  max="10000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delayGames">Delay zwischen Games (ms)</Label>
                <Input
                  id="delayGames"
                  type="number"
                  placeholder="2000"
                  value={delayBetweenGames}
                  onChange={(e) => setDelayBetweenGames(e.target.value)}
                  min="0"
                  max="10000"
                />
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
            onClick={handleStart}
            disabled={loading || polling}
            className="w-full h-10 md:h-12 text-sm md:text-base lg:text-lg font-bold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                <span className="hidden sm:inline">Starte Job...</span>
                <span className="sm:hidden">Starte...</span>
              </>
            ) : polling ? (
              <>
                <Pause className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Job läuft...</span>
                <span className="sm:hidden">Läuft...</span>
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Job starten (200 Reviews)</span>
                <span className="sm:hidden">Start (200)</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {jobStatus && (
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Job Progress</CardTitle>
            <CardDescription className="text-xs md:text-sm break-all">
              <span className="hidden sm:inline">Job ID: {jobStatus.jobId} | </span>
              <span className="sm:hidden">ID: {jobStatus.jobId.substring(0, 8)}... | </span>
              Status:{" "}
              <Badge
                variant={
                  jobStatus.status === "completed"
                    ? "default"
                    : jobStatus.status === "failed"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs"
              >
                {jobStatus.status === "running" && "Läuft"}
                {jobStatus.status === "completed" && "Abgeschlossen"}
                {jobStatus.status === "failed" && "Fehlgeschlagen"}
                {jobStatus.status === "pending" && "Wartend"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="font-medium">Fortschritt</span>
                <span className="text-muted-foreground">
                  {jobStatus.processed} / {jobStatus.total} ({progressPercentage}%)
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2 md:h-3" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-green-500/10 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-green-600 flex items-center justify-center gap-1 md:gap-2">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                  {jobStatus.successful}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Erfolgreich</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1 md:gap-2">
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                  {jobStatus.skipped}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Übersprungen</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-red-500/10 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-red-600 flex items-center justify-center gap-1 md:gap-2">
                  <XCircle className="h-4 w-4 md:h-5 md:w-5" />
                  {jobStatus.failed}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Fehlgeschlagen</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-blue-500/10 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-blue-600 flex items-center justify-center gap-1 md:gap-2">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                  {jobStatus.currentBatch}/{jobStatus.totalBatches}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Batch</div>
              </div>
            </div>

            {/* ETA */}
            {jobStatus.status === "running" && jobStatus.estimatedTimeRemaining && (
              <div className="flex items-center gap-2 p-2 md:p-3 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs md:text-sm">
                  <span className="hidden sm:inline">Geschätzte verbleibende Zeit: </span>
                  <span className="sm:hidden">ETA: </span>
                  {formatTime(jobStatus.estimatedTimeRemaining)}
                </span>
              </div>
            )}

            {/* Queue */}
            {jobStatus.queue && jobStatus.queue.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm md:text-base">
                  Warteschlange ({jobStatus.queue.length} Games)
                </h4>
                <ScrollArea className="h-[300px] md:h-[400px] border rounded-lg p-2 md:p-4">
                  <div className="space-y-2">
                    {jobStatus.queue.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 md:p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 ${getStatusColor(item.status)}`}
                          />
                          <span className="text-xs md:text-sm font-medium truncate">{item.name}</span>
                          {item.igdbId && (
                            <Badge variant="outline" className="text-[10px] md:text-xs hidden sm:inline-flex">
                              IGDB: {item.igdbId}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.status === "completed" && (
                            <Badge variant="default" className="bg-green-500 text-[10px] md:text-xs">
                              <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                              <span className="hidden sm:inline">Erfolgreich</span>
                              <span className="sm:hidden">✓</span>
                            </Badge>
                          )}
                          {item.status === "failed" && (
                            <Badge variant="destructive" className="text-[10px] md:text-xs">
                              <XCircle className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                              <span className="hidden sm:inline">Fehler</span>
                              <span className="sm:hidden">✗</span>
                            </Badge>
                          )}
                          {item.status === "processing" && (
                            <Badge variant="secondary" className="text-[10px] md:text-xs">
                              <Loader2 className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1 animate-spin" />
                              <span className="hidden sm:inline">Verarbeitung</span>
                              <span className="sm:hidden">...</span>
                            </Badge>
                          )}
                          {item.status === "skipped" && (
                            <Badge variant="outline" className="bg-yellow-500/20 text-[10px] md:text-xs">
                              <span className="hidden sm:inline">Übersprungen</span>
                              <span className="sm:hidden">⏭</span>
                            </Badge>
                          )}
                          {item.status === "pending" && (
                            <Badge variant="outline" className="text-[10px] md:text-xs">
                              <span className="hidden sm:inline">Wartend</span>
                              <span className="sm:hidden">⏳</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Errors */}
            {jobStatus.errors && jobStatus.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-red-600 text-sm md:text-base">
                  <XCircle className="h-4 w-4" />
                  Fehler ({jobStatus.errors.length})
                </h4>
                <ScrollArea className="h-[200px] md:h-[250px] border rounded-lg p-2 md:p-4">
                  <div className="space-y-2">
                    {jobStatus.errors.map((error, index) => (
                      <div key={index} className="p-2 md:p-3 bg-red-500/10 rounded text-xs md:text-sm">
                        <div className="font-medium break-words">{error.game}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground break-words mt-1">{error.error}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
