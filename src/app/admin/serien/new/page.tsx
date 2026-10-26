"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export default function NewSeriesPage() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_FEATURE_REVIEW_SERIES !== "true") {
    // Client-side check - will be handled by server
  }

  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/serien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, coverImage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Erstellen der Serie");
      }

      toast.success("Serie erfolgreich erstellt");
      router.push(`/admin/serien/${data.series.slug}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <h1 className="text-3xl font-bold tracking-tight">Neue Serie anlegen</h1>
        <p className="mt-1 text-muted-foreground">
          Erstelle eine neue kuratierte Review-Serie.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className={cn(
            "p-4 rounded-lg border text-sm",
            "bg-destructive/10 border-destructive text-destructive"
          )}>
            {error}
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
            placeholder='z. B. "The Witcher Serie"'
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
            placeholder="Kurze Beschreibung der Serie (optional)..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="coverImage" className="block text-sm font-medium">
            Cover-Bild URL (optional)
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
            placeholder="https://example.com/cover.jpg"
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

        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium",
              "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Erstelle..." : "Serie erstellen"}
          </button>
          <Link
            href="/admin/serien"
            className={cn(
              "inline-flex items-center justify-center gap-2 px-6 py-2.5 border rounded-lg font-medium",
              "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "transition-colors"
            )}
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </main>
  );
}