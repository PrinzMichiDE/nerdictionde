"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserSeriesForm } from "@/components/series/UserSeriesForm";
import { useUserSeriesMutations, useUserSeriesCollaborators } from "@/hooks/useUserSeries";
import type { UserSeriesEditData } from "@/lib/user-series-schema";
import { toast } from "sonner";

interface EditUserSeriesPageClientProps {
  initialData: UserSeriesEditData;
}

interface CollaboratorWithStringDates {
  userId: string;
  username: string;
  displayName: string;
  role: "OWNER" | "EDITOR";
  invitedAt: string;
  acceptedAt: string | null;
}

function convertCollaboratorsToStrings(collaborators: UserSeriesEditData["collaborators"]): CollaboratorWithStringDates[] {
  return collaborators.map((c) => ({
    ...c,
    invitedAt: c.invitedAt.toISOString(),
    acceptedAt: c.acceptedAt?.toISOString() || null,
  }));
}

function convertCollaboratorsToDates(collaborators: CollaboratorWithStringDates[]): UserSeriesEditData["collaborators"] {
  return collaborators.map((c) => ({
    ...c,
    invitedAt: new Date(c.invitedAt),
    acceptedAt: c.acceptedAt ? new Date(c.acceptedAt) : null,
  }));
}

export default function EditUserSeriesPageClient({ initialData }: EditUserSeriesPageClientProps) {
  const [seriesData, setSeriesData] = useState<UserSeriesEditData>(initialData);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    updateSeries,
    deleteSeries,
    reorderSeries,
    addSeriesItem,
    removeSeriesItem,
    isLoading,
    error,
  } = useUserSeriesMutations();

  const {
    collaborators,
    isLoading: collabLoading,
    invite,
    updateRole,
    remove,
    refresh: refreshCollaborators,
  } = useUserSeriesCollaborators(initialData.slug, convertCollaboratorsToStrings(initialData.collaborators));

  const handleSubmit = async (data: Parameters<typeof updateSeries>[1]) => {
    await updateSeries(initialData.slug, data);
    await refreshData();
  };

  const handleReorder = async (items: { reviewId: string; seriesOrder: number }[]) => {
    await reorderSeries(initialData.slug, { items, version: seriesData.version });
    await refreshData();
  };

  const handleAddItem = async (reviewId: string) => {
    await addSeriesItem(initialData.slug, { reviewId });
    await refreshData();
  };

  const handleRemoveItem = async (reviewId: string) => {
    await removeSeriesItem(initialData.slug, reviewId);
    await refreshData();
  };

  const handleInviteCollaborator = async (userId: string) => {
    await invite(userId);
  };

  const handleUpdateCollaboratorRole = async (userId: string, role: "OWNER" | "EDITOR") => {
    await updateRole(userId, role);
  };

  const handleRemoveCollaborator = async (userId: string) => {
    await remove(userId);
  };

  const refreshData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`/api/user/serien/${initialData.slug}`);
      if (res.ok) {
        const data = await res.json();
        setSeriesData(data.series);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Serie wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;

    const success = await deleteSeries(initialData.slug);
    if (success) {
      toast.success("Serie gelöscht");
      window.location.href = "/serien";
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href={`/serien/${initialData.slug}`}
            className={cn(
              "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Zur Serie
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">Serie bearbeiten</h1>
          <p className="mt-1 text-muted-foreground">
            Ändere Details, ordne Teile neu oder verwalte Kollaboratoren.
          </p>
        </div>

        <Button variant="outline" onClick={handleDelete} disabled={isLoading}>
          Löschen
        </Button>
      </div>

      <div className="max-w-3xl">
        {isLoadingData && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        <UserSeriesForm
          initialData={seriesData}
          isEditing={true}
          onSubmit={handleSubmit}
          onReorder={handleReorder}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          collaborators={convertCollaboratorsToDates(collaborators)}
          currentUserId={initialData.collaborators.find((c) => c.role === "OWNER")?.userId || ""}
          isOwner={seriesData.collaborators.some((c) => c.role === "OWNER")}
          onInviteCollaborator={handleInviteCollaborator}
          onUpdateCollaboratorRole={handleUpdateCollaboratorRole}
          onRemoveCollaborator={handleRemoveCollaborator}
          disabled={isLoading}
        />
      </div>
    </main>
  );
}