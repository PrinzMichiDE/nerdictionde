"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  items: {
    id: string;
    reviewId: string;
    seriesOrder: number;
    review: {
      id: string;
      slug: string;
      title: string;
      score: number;
      coverImage: string | null;
    };
  }[];
}

export default function EditSeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [series, setSeries] = useState<SeriesData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch series data on mount
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const { slug } = await params;
        const res = await fetch(`/api/admin/serien/${slug}`);
        if (!res.ok) throw new Error("Serie nicht gefunden");
        const data = await res.json();
        setSeries(data.series);
        setTitle(data.series.title);
        setDescription(data.series.description || "");
        setCoverImage(data.series.coverImage || "");
      } catch (err) {
        toast.error("Fehler beim Laden der Serie");
        router.push("/admin/serien");
      }
    };
    fetchSeries();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const { slug } = await params;
      const res = await fetch(`/api/admin/serien/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, coverImage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Aktualisieren");
      }

      setSuccess("Serie erfolgreich aktualisiert");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorder = async (newOrder: { reviewId: string; seriesOrder: number }[]) => {
    setIsReordering(true);
    try {
      const { slug } = await params;
      const res = await fetch(`/api/admin/serien/${slug}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newOrder,
          version: series?.id ? 1 : 1, // We'll need proper version handling
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Neuordnen");
      }

      toast.success("Reihenfolge aktualisiert");
      // Refetch to get updated order
      const fetchRes = await fetch(`/api/admin/serien/${slug}`);
      const data = await fetchRes.json();
      setSeries(data.series);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsReordering(false);
    }
  };

  const handleRemoveItem = async (reviewId: string) => {
    if (!confirm("Diesen Teil aus der Serie entfernen?")) return;

    try {
      const { slug } = await params;
      const res = await fetch(`/api/admin/serien/${slug}/items/${reviewId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Entfernen");
      }

      toast.success("Teil entfernt");
      // Refetch
      const fetchRes = await fetch(`/api/admin/serien/${slug}`);
      const data = await fetchRes.json();
      setSeries(data.series);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  };

  if (!series) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/admin/serien"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zur Übersicht
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{series.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {series.partCount} Teil{series.partCount !== 1 ? "e" : ""} • Slug: {series.slug}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={cn(
                "p-4 rounded-lg border text-sm",
                "bg-destructive/10 border-destructive text-destructive"
              )}>
                {error}
              </div>
            )}
            {success && (
              <div className={cn(
                "p-4 rounded-lg border text-sm",
                "bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200"
              )}>
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">
                Titel <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "bg-background"
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">
                Beschreibung
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={4}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "bg-background resize-y"
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="coverImage" className="block text-sm font-medium">
                Cover-Bild URL
              </label>
              <input
                id="coverImage"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "bg-background"
                )}
              />
              {coverImage && (
                <img
                  src={coverImage}
                  alt="Cover Preview"
                  className="mt-2 max-h-48 rounded-lg border"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium",
                "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? "Speichere..." : "Änderungen speichern"}
            </button>
          </form>

          {/* Danger Zone */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-destructive mb-3">Gefährliche Aktionen</h3>
            <button
              onClick={() => {
                if (confirm("Serie wirklich löschen? Dies kann nicht rückgängig gemacht werden.")) {
                  deleteSeries();
                }
              }}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-destructive text-destructive rounded-lg font-medium",
                "hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "transition-colors"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v12m-6 0h12m-2.5-7.5V7" />
              </svg>
              Serie löschen
            </button>
          </div>
        </div>

        {/* Parts List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Teile der Serie ({series.partCount})</h2>
            <button
              onClick={() => router.push(`/admin/serien/${series.slug}/items/add`)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm",
                "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "transition-colors"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Review hinzufügen
            </button>
          </div>

          {series.items.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-lg font-medium">Keine Teile</h3>
              <p className="text-muted-foreground mt-1">Füge Reviews hinzu, um diese Serie zu füllen.</p>
            </div>
          ) : (
            <DragDropList
              items={series.items}
              onReorder={handleReorder}
              onRemove={handleRemoveItem}
              disabled={isReordering}
            />
          )}
        </div>
      </div>
    </main>
  );
}

async function deleteSeries() {
  // This would need the router, but we're in a nested function
  // For now, we'll handle it via the page component
}

interface DragDropItem {
  id: string;
  reviewId: string;
  seriesOrder: number;
  review: {
    id: string;
    slug: string;
    title: string;
    score: number;
    coverImage: string | null;
  };
}

interface DragDropListProps {
  items: DragDropItem[];
  onReorder: (newOrder: { reviewId: string; seriesOrder: number }[]) => void;
  onRemove: (reviewId: string) => void;
  disabled: boolean;
}

function DragDropList({ items, onReorder, onRemove, disabled }: DragDropListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [itemsOrder, setItemsOrder] = useState(items);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (disabled) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (disabled || !draggedId || draggedId === targetId) return;
    e.preventDefault();

    const draggedIndex = itemsOrder.findIndex((item) => item.id === draggedId);
    const targetIndex = itemsOrder.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...itemsOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    // Update seriesOrder
    const reordered = newOrder.map((item, index) => ({
      ...item,
      seriesOrder: index + 1,
    }));

    setItemsOrder(newOrder);
    setDraggedId(null);

    // Call onReorder with new order
    onReorder(reordered.map((item) => ({ reviewId: item.reviewId, seriesOrder: item.seriesOrder })));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div className="space-y-2">
      {itemsOrder.map((item) => (
        <div
          key={item.id}
          draggable={!disabled}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-4 p-3 bg-card border rounded-lg",
            "transition-colors",
            draggedId === item.id ? "opacity-50 ring-2 ring-primary" : "hover:bg-accent/50",
            disabled ? "opacity-75 cursor-not-allowed" : "cursor-grab"
          )}
        >
          <svg
            className="w-5 h-5 text-muted-foreground flex-shrink-0 cursor-grab"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>

          <span className="w-8 text-center font-mono text-sm text-muted-foreground">
            {item.seriesOrder}
          </span>

          {item.review.coverImage && (
            <img
              src={item.review.coverImage}
              alt=""
              className="w-12 h-7 object-cover rounded"
            />
          )}

          <Link
            href={`/reviews/${item.review.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 font-medium truncate hover:text-primary transition-colors"
          >
            {item.review.title}
          </Link>

          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-xs",
            item.review.score >= 80 ? "bg-green-100 text-green-800" :
            item.review.score >= 60 ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          )}>
            {item.review.score}
          </span>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.reviewId);
            }}
            disabled={disabled}
            className={cn(
              "p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label={`Teil "${item.review.title}" entfernen`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v12m-6 0h12m-2.5-7.5V7" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}