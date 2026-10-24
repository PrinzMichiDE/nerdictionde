"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface SeriesData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  partCount: number;
  aggregateScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export function SeriesTable() {
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const res = await fetch("/api/admin/serien");
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setSeries(data.series || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Serie wirklich löschen? Dies kann nicht rückgängig gemacht werden.")) return;

    setDeletingId(slug);
    try {
      const res = await fetch(`/api/admin/serien/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Löschen");
      }
      toast.success("Serie gelöscht");
      setSeries(series.filter((s) => s.slug !== slug));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border bg-destructive/10 border-destructive text-destructive">
        Fehler beim Laden der Serien: {error}
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="mt-2 text-lg font-medium">Keine Serien</h3>
        <p className="text-muted-foreground mt-1">Erstelle deine erste Serie!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Titel</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Slug</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Teile</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ø Score</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Erstellt</th>
            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
              <td className="p-3">
                <Link
                  href={`/admin/serien/${s.slug}/edit`}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {s.title}
                </Link>
                {s.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {s.description}
                  </p>
                )}
              </td>
              <td className="p-3 font-mono text-sm text-muted-foreground">{s.slug}</td>
              <td className="p-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {s.partCount}
                </span>
              </td>
              <td className="p-3">
                {s.aggregateScore !== null ? (
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-sm",
                    s.aggregateScore >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                    s.aggregateScore >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  )}>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {s.aggregateScore}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="p-3 text-sm text-muted-foreground">
                {new Date(s.createdAt).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/serien/${s.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg",
                      "hover:bg-accent transition-colors"
                    )}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ansehen
                  </Link>
                  <Link
                    href={`/admin/serien/${s.slug}/edit`}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg",
                      "hover:bg-accent transition-colors"
                    )}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => handleDelete(s.slug)}
                    disabled={deletingId === s.slug}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-destructive text-destructive rounded-lg",
                      "hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    )}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v12m-6 0h12m-2.5-7.5V7" />
                    </svg>
                    {deletingId === s.slug ? "Lösche..." : "Löschen"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}