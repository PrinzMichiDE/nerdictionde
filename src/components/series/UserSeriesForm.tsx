"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ReviewSearchAutocomplete } from "./ReviewSearchAutocomplete";
import { UserSeriesPartsDnD } from "./UserSeriesPartsDnD";
import { CollaboratorsManager } from "./CollaboratorsManager";
import { toast } from "sonner";
import type { CreateUserSeriesInput, UpdateUserSeriesInput } from "@/lib/user-series-schema";
import type { UserSeriesEditData, PublicSeriesPart } from "@/lib/user-series-schema";

interface UserSeriesFormProps {
  initialData?: UserSeriesEditData;
  isEditing?: boolean;
  onSubmit: (data: CreateUserSeriesInput | UpdateUserSeriesInput) => Promise<void>;
  onReorder?: (items: { reviewId: string; seriesOrder: number }[]) => Promise<void>;
  onAddItem?: (reviewId: string) => Promise<void>;
  onRemoveItem?: (reviewId: string) => Promise<void>;
  collaborators?: UserSeriesEditData["collaborators"];
  currentUserId?: string;
  isOwner?: boolean;
  onInviteCollaborator?: (userId: string) => Promise<void>;
  onUpdateCollaboratorRole?: (userId: string, role: "OWNER" | "EDITOR") => Promise<void>;
  onRemoveCollaborator?: (userId: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

// Internal representation for form state
interface FormSeriesPart {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  category: string;
  score: number;
  coverImage: string | null;
  releaseDate: Date | null;
  excerpt: string | null;
  seriesOrder: number;
}

interface ReviewSearchResult {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  category: string;
  score: number;
  images: string[];
  releaseDate: string | null;
  seriesId: string | null;
  seriesOrder: number | null;
}

function convertSearchResultToFormPart(review: ReviewSearchResult): FormSeriesPart {
  return {
    id: review.id,
    slug: review.slug,
    title: review.title,
    title_en: review.title_en,
    category: review.category,
    score: review.score,
    coverImage: review.images?.[0] || null,
    releaseDate: review.releaseDate ? new Date(review.releaseDate) : null,
    excerpt: null,
    seriesOrder: 0, // Will be set when added
  };
}

function convertEditDataToFormParts(items: UserSeriesEditData["items"]): FormSeriesPart[] {
  return items.map((item, index) => ({
    id: item.review.id,
    slug: item.review.slug,
    title: item.review.title,
    title_en: item.review.title_en,
    category: item.review.category,
    score: item.review.score,
    coverImage: item.review.images?.[0] || null,
    releaseDate: item.review.releaseDate,
    excerpt: item.review.content ? item.review.content.slice(0, 200) : null,
    seriesOrder: item.seriesOrder,
  }));
}

export function UserSeriesForm({
  initialData,
  isEditing = false,
  onSubmit,
  onReorder,
  onAddItem,
  onRemoveItem,
  collaborators = [],
  currentUserId,
  isOwner = false,
  onInviteCollaborator,
  onUpdateCollaboratorRole,
  onRemoveCollaborator,
  disabled = false,
  className,
}: UserSeriesFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(initialData?.visibility || "PUBLIC");
  const [selectedReviews, setSelectedReviews] = useState<FormSeriesPart[]>(
    initialData ? convertEditDataToFormParts(initialData.items) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "parts" | "collaborators">("details");

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCoverImage(value);
    if (value) {
      try {
        new URL(value);
        setCoverError(false);
      } catch {
        setCoverError(true);
      }
    } else {
      setCoverError(false);
    }
  };

  const handleAddReview = useCallback((review: ReviewSearchResult) => {
    if (selectedReviews.some((r) => r.id === review.id)) {
      toast.error("Review bereits hinzugefügt");
      return;
    }
    if (selectedReviews.length >= 50) {
      toast.error("Maximal 50 Reviews pro Serie");
      return;
    }
    const newPart = convertSearchResultToFormPart(review);
    newPart.seriesOrder = selectedReviews.length + 1;
    setSelectedReviews((prev) => [...prev, newPart]);
    toast.success(`"${review.title}" hinzugefügt`);
  }, [selectedReviews]);

  const handleRemoveReview = useCallback(
    async (reviewId: string) => {
      if (onRemoveItem) {
        await onRemoveItem(reviewId);
      }
      setSelectedReviews((prev) =>
        prev.filter((r) => r.id !== reviewId).map((r, i) => ({ ...r, seriesOrder: i + 1 }))
      );
    },
    [onRemoveItem]
  );

  const handleReorder = useCallback(
    async (items: { reviewId: string; seriesOrder: number }[]) => {
      if (onReorder) {
        await onReorder(items);
      }
      setSelectedReviews((prev) =>
        items.map((item) => {
          const existing = prev.find((r) => r.id === item.reviewId);
          return existing ? { ...existing, seriesOrder: item.seriesOrder } : null;
        }).filter(Boolean) as FormSeriesPart[]
      );
    },
    [onReorder]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Titel ist erforderlich");
      return;
    }

    if (coverError) {
      setError("Ungültige Cover-URL");
      return;
    }

    const data: CreateUserSeriesInput | UpdateUserSeriesInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      visibility,
      ...(!isEditing && { reviewIds: selectedReviews.map((r) => r.id) }),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch {
      // Error handled in onSubmit
    } finally {
      setIsSubmitting(false);
    }
  };

  const excludeIds = selectedReviews.map((r) => r.id);

  // Convert FormSeriesPart to UserSeriesPartsDnD format
  const partsForDnD = selectedReviews.map((r) => ({
    reviewId: r.id,
    seriesOrder: r.seriesOrder,
    review: {
      id: r.id,
      slug: r.slug,
      title: r.title,
      score: r.score,
      images: r.coverImage ? [r.coverImage] : [],
      category: r.category,
      releaseDate: r.releaseDate?.toISOString() || null,
    },
  }));

  // Convert collaborators to string dates for CollaboratorsManager
  const collaboratorsForManager = collaborators.map((c) => ({
    ...c,
    invitedAt: c.invitedAt.toISOString(),
    acceptedAt: c.acceptedAt?.toISOString() || null,
  }));

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {error && (
        <div className={cn(
          "p-4 rounded-lg border text-sm",
          "bg-destructive/10 border-destructive text-destructive"
        )}>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div role="tablist" className="border-b flex gap-1">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "details"}
          aria-controls="panel-details"
          id="tab-details"
          onClick={() => setActiveTab("details")}
          className={cn(
            "px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors",
            activeTab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Details
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "parts"}
          aria-controls="panel-parts"
          id="tab-parts"
          onClick={() => setActiveTab("parts")}
          className={cn(
            "px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors",
            activeTab === "parts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Teile ({selectedReviews.length}/50)
        </button>
        {isOwner && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "collaborators"}
            aria-controls="panel-collaborators"
            id="tab-collaborators"
            onClick={() => setActiveTab("collaborators")}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors",
              activeTab === "collaborators"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Kollaboratoren ({collaborators.length}/10)
          </button>
        )}
      </div>

      {/* Details Tab */}
      <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden={activeTab !== "details"}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              disabled={disabled || isSubmitting}
              placeholder='z. B. "Meine Top 10 RPGs 2024"'
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={4}
              disabled={disabled || isSubmitting}
              placeholder="Beschreibe deine Serie... (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover-Bild URL (optional)</Label>
            <Input
              id="coverImage"
              type="url"
              value={coverImage}
              onChange={handleCoverImageChange}
              disabled={disabled || isSubmitting}
              placeholder="https://example.com/cover.jpg"
              className={coverError ? "border-destructive" : ""}
            />
            {coverError && <p className="text-sm text-destructive">Bitte eine gültige URL eingeben</p>}
            {coverImage && !coverError && (
              <div className="relative max-w-xs">
                <img
                  src={coverImage}
                  alt="Cover Preview"
                  className="mt-2 max-h-48 rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    setCoverError(true);
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Sichtbarkeit</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="PUBLIC"
                  checked={visibility === "PUBLIC"}
                  onChange={() => setVisibility("PUBLIC")}
                  disabled={disabled || isSubmitting}
                  className="sr-only peer"
                />
                <span className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                  visibility === "PUBLIC"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent"
                )}>
                  <span className="w-3 h-3 rounded-full border-2 flex items-center justify-center">
                    {visibility === "PUBLIC" && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </span>
                  <span>Öffentlich</span>
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="PRIVATE"
                  checked={visibility === "PRIVATE"}
                  onChange={() => setVisibility("PRIVATE")}
                  disabled={disabled || isSubmitting}
                  className="sr-only peer"
                />
                <span className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                  visibility === "PRIVATE"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent"
                )}>
                  <span className="w-3 h-3 rounded-full border-2 flex items-center justify-center">
                    {visibility === "PRIVATE" && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </span>
                  <span>Privat</span>
                </span>
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Private Serien sind nur für dich und eingeladene Kollaboratoren sichtbar.
            </p>
          </div>
        </div>
      </div>

      {/* Parts Tab */}
      <div role="tabpanel" id="panel-parts" aria-labelledby="tab-parts" hidden={activeTab !== "parts"}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Füge Reviews zur Serie hinzu. Maximale 50 Teile.
            </p>
            <span className="text-sm font-medium text-muted-foreground">
              {selectedReviews.length} / 50
            </span>
          </div>

          <ReviewSearchAutocomplete
            onSelect={handleAddReview}
            excludeIds={excludeIds}
            placeholder="Review suchen und hinzufügen..."
          />

          <Separator />

          <UserSeriesPartsDnD
            initialParts={partsForDnD}
            isOwner={true}
            onReorder={handleReorder}
            onRemove={handleRemoveReview}
            disabled={disabled || isSubmitting}
          />
        </div>
      </div>

      {/* Collaborators Tab */}
      <div role="tabpanel" id="panel-collaborators" aria-labelledby="tab-collaborators" hidden={activeTab !== "collaborators"}>
        {isOwner && currentUserId && (
          <CollaboratorsManager
            collaborators={collaboratorsForManager}
            isOwner={isOwner}
            currentUserId={currentUserId}
            onInvite={onInviteCollaborator!}
            onUpdateRole={onUpdateCollaboratorRole!}
            onRemove={onRemoveCollaborator!}
            isLoading={isSubmitting}
          />
        )}
        {!isOwner && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nur der Owner kann Kollaboratoren verwalten.</p>
          </div>
        )}
      </div>

      {/* Submit Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || disabled || !title.trim() || coverError}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {isEditing ? "Speichere..." : "Erstelle..."}
            </>
          ) : isEditing ? (
            "Änderungen speichern"
          ) : (
            "Serie erstellen"
          )}
        </Button>
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}