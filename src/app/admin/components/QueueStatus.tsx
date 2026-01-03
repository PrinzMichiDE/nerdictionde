"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle2, XCircle, Play, Pause, X } from "lucide-react";
import axios from "axios";
import { Progress } from "@/components/ui/progress";

interface QueueJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  type: string;
  config: any;
  progress: any;
  result?: any;
  error?: string;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  skippedItems: number;
  currentBatch: number;
  totalBatches: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export function QueueStatus() {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchQueueStatus();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchQueueStatus();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchQueueStatus = async () => {
    try {
      const response = await axios.get("/api/queue");
      setJobs(response.data.jobs || []);
      setStats(response.data.stats || null);
    } catch (error) {
      console.error("Error fetching queue status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (jobId: string) => {
    if (!confirm("Möchten Sie diesen Job wirklich abbrechen?")) {
      return;
    }

    try {
      await axios.post(`/api/queue/${jobId}/cancel`);
      await fetchQueueStatus();
    } catch (error) {
      console.error("Error cancelling job:", error);
      alert("Fehler beim Abbrechen des Jobs");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Wartend" },
      processing: { variant: "default", icon: Play, label: "Verarbeitung" },
      completed: { variant: "default", icon: CheckCircle2, label: "Abgeschlossen" },
      failed: { variant: "destructive", icon: XCircle, label: "Fehlgeschlagen" },
      cancelled: { variant: "outline", icon: X, label: "Abgebrochen" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getProgressPercentage = (job: QueueJob) => {
    if (job.totalItems === 0) return 0;
    return Math.round((job.processedItems / job.totalItems) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Lade Queue-Status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Queue-Übersicht</CardTitle>
                <CardDescription>Status der Massenerstellungs-Warteschlange</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Auto-Update pausieren
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Auto-Update aktivieren
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Gesamt</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Wartend</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
                <div className="text-sm text-muted-foreground">Verarbeitung</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Abgeschlossen</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Queue-Jobs</CardTitle>
          <CardDescription>Liste aller Massenerstellungs-Jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Jobs in der Warteschlange
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(job.status)}
                            <Badge variant="outline">{job.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(job.createdAt)}
                            </span>
                          </div>
                          {job.progress?.currentGame && (
                            <p className="text-sm text-muted-foreground">
                              Aktuell: <span className="font-medium">{job.progress.currentGame}</span>
                            </p>
                          )}
                        </div>
                        {(job.status === "pending" || job.status === "processing") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(job.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Progress */}
                      {(job.status === "processing" || job.status === "completed") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              Fortschritt: {job.processedItems} / {job.totalItems}
                            </span>
                            <span className="font-medium">{getProgressPercentage(job)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(job)} className="h-2" />
                          {job.totalBatches > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Batch {job.currentBatch} / {job.totalBatches}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Results */}
                      {job.status === "completed" && job.result && (
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="text-center p-2 bg-green-500/10 rounded">
                            <div className="font-bold text-green-600">{job.successfulItems}</div>
                            <div className="text-xs text-muted-foreground">Erfolgreich</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-500/10 rounded">
                            <div className="font-bold text-yellow-600">{job.skippedItems}</div>
                            <div className="text-xs text-muted-foreground">Übersprungen</div>
                          </div>
                          <div className="text-center p-2 bg-red-500/10 rounded">
                            <div className="font-bold text-red-600">{job.failedItems}</div>
                            <div className="text-xs text-muted-foreground">Fehlgeschlagen</div>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <div className="font-bold">{job.totalItems}</div>
                            <div className="text-xs text-muted-foreground">Gesamt</div>
                          </div>
                        </div>
                      )}

                      {/* Error */}
                      {job.status === "failed" && job.error && (
                        <div className="p-3 bg-red-500/10 rounded text-sm text-red-600">
                          <strong>Fehler:</strong> {job.error}
                        </div>
                      )}

                      {/* Timing */}
                      {job.startedAt && (
                        <p className="text-xs text-muted-foreground">
                          Gestartet: {formatDate(job.startedAt)}
                        </p>
                      )}
                      {job.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Abgeschlossen: {formatDate(job.completedAt)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
