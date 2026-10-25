"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import { UserSeriesForm } from "@/components/series/UserSeriesForm";
import { useUserSeriesMutations } from "@/hooks/useUserSeries";
import { featureFlags } from "@/lib/feature-flags";
import type { CreateUserSeriesInput, UpdateUserSeriesInput } from "@/lib/user-series-schema";

export default function NewUserSeriesPage() {
  const {
    createSeries,
    isLoading,
    error,
  } = useUserSeriesMutations();

  // Client-side feature flag check (server also checks)
  useEffect(() => {
    if (typeof window !== "undefined" && !featureFlags.userSeries) {
      // Will be handled by server-side notFound()
    }
  }, []);

  const handleSubmit = async (data: CreateUserSeriesInput | UpdateUserSeriesInput) => {
    const result = await createSeries(data as CreateUserSeriesInput);
    if (result) {
      // Navigation handled by router.push in the hook's toast or we do it here
      window.location.href = `/serien/${result.slug}`;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/serien"
          className={cn(
            "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Zurück zur Übersicht
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Neue Serie erstellen</h1>
        <p className="mt-1 text-muted-foreground">
          Erstelle deine eigene kuratierte Review-Serie. Füge bis zu 50 Reviews hinzu,
          ordne sie per Drag-and-Drop und teile sie mit der Community.
        </p>
      </div>

      <div className="max-w-3xl">
        <UserSeriesForm
          isEditing={false}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </main>
  );
}