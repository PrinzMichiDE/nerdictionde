"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Edit, Eye, Search, Filter, Loader2, X, Trash2, Gamepad2, Film, Tv, ArrowUpDown, CheckCircle2, Circle, AlertCircle, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useAdminReviews } from "../reviews-store";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  game: <Gamepad2 className="h-3.5 w-3.5" />,
  movie: <Film className="h-3.5 w-3.5" />,
  series: <Tv className="h-3.5 w-3.5" />,
};

type SortKey = "date-desc" | "date-asc" | "score-desc" | "score-asc" | "title-asc" | "title-desc";

function ReviewSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row motion-safe:animate-pulse">
        <div className="w-full sm:w-48 h-48 sm:h-auto aspect-video sm:aspect-square bg-muted" />
        <div className="flex-1 p-6 space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-6 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="flex gap-2 pt-3">
            <div className="h-9 bg-muted rounded flex-1" />
            <div className="h-9 bg-muted rounded w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ReviewList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { reviews, loading, error, reload, updateReview, removeReview } = useAdminReviews();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState<SortKey>((searchParams.get("sort") as SortKey) || "date-desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const urlSyncTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced sync of filter/sort state to URL
  useEffect(() => {
    if (urlSyncTimeout.current) clearTimeout(urlSyncTimeout.current);
    urlSyncTimeout.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (sortBy !== "date-desc") params.set("sort", sortBy);
      if (currentPage > 1) params.set("page", String(currentPage));
      params.set("tab", "list");
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    }, 400);
    return () => {
      if (urlSyncTimeout.current) clearTimeout(urlSyncTimeout.current);
    };
  }, [searchQuery, statusFilter, categoryFilter, sortBy, currentPage, router]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, sortBy]);

  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/reviews/${reviewToDelete.id}`);
      
      // Remove from shared store
      removeReview(reviewToDelete.id);
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      toast({
        title: "Gelöscht",
        description: `„${reviewToDelete.title}“ wurde entfernt.`,
      });
    } catch (error: unknown) {
      console.error("Error deleting review:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: "Löschen fehlgeschlagen",
        description: err.response?.data?.error || "Fehler beim Löschen des Beitrags",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (review: Review) => {
    setTogglingStatusId(review.id);
    const nextStatus = review.status === "published" ? "draft" : "published";
    try {
      await axios.put(`/api/reviews/${review.id}`, { status: nextStatus });
      updateReview({ ...review, status: nextStatus });
      toast({
        title: nextStatus === "published" ? "Veröffentlicht" : "Zurück in Entwurf",
        description: `„${review.title}“ ist jetzt ${nextStatus === "published" ? "online" : "ein Entwurf"}.`,
      });
    } catch (error: unknown) {
      console.error("Error toggling status:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: "Statuswechsel fehlgeschlagen",
        description: err.response?.data?.error || "Fehler beim Ändern des Status",
        variant: "destructive",
      });
    } finally {
      setTogglingStatusId(null);
    }
  };

  const bulkPublishScored = async () => {
    try {
      setBulkPublishing(true);
      const res = await axios.post("/api/reviews/bulk-publish-scored");
      const count = res.data?.count || 0;
      toast({
        title: "Veröffentlicht",
        description: `${count} Beitrag${count === 1 ? "" : "e"} mit Bewertung wurden veröffentlicht.`,
      });
      await reload();
    } catch (error: unknown) {
      console.error("Error bulk publishing scored reviews:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: "Massenveröffentlichung fehlgeschlagen",
        description: err.response?.data?.error || "Fehler beim Veröffentlichen",
        variant: "destructive",
      });
    } finally {
      setBulkPublishing(false);
    }
  };

  const filteredReviews = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = reviews.filter((review) => {
      let matchesSearch = true;

      if (query) {
        const searchInContent = review.content?.toLowerCase().replace(/[#*`\[\]()]/g, "") || "";
        const searchInContentEn = review.content_en?.toLowerCase().replace(/[#*`\[\]()]/g, "") || "";
        
        matchesSearch =
          review.title.toLowerCase().includes(query) ||
          review.slug.toLowerCase().includes(query) ||
          (review.title_en?.toLowerCase().includes(query) ?? false) ||
          searchInContent.includes(query) ||
          searchInContentEn.includes(query) ||
          review.category.toLowerCase().includes(query) ||
          (review.pros?.some(pro => pro.toLowerCase().includes(query)) ?? false) ||
          (review.cons?.some(con => con.toLowerCase().includes(query)) ?? false);
      }

      const matchesStatus = statusFilter === "all" || review.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || review.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    switch (sortBy) {
      case "date-asc":
        result = result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "score-desc":
        result = result.sort((a, b) => b.score - a.score);
        break;
      case "score-asc":
        result = result.sort((a, b) => a.score - b.score);
        break;
      case "title-asc":
        result = result.sort((a, b) => a.title.localeCompare(b.title, "de"));
        break;
      case "title-desc":
        result = result.sort((a, b) => b.title.localeCompare(a.title, "de"));
        break;
      default:
        result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [reviews, searchQuery, statusFilter, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / itemsPerPage));
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage, itemsPerPage]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Beiträge werden geladen">
        <div className="h-24 bg-muted rounded-lg motion-safe:animate-pulse" />
        {[1, 2, 3].map((i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="flex items-center gap-2 font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Beiträge konnten nicht geladen werden.
        </p>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={reload}>
          Erneut laden
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Entwürfe mit Bewertung (Score &gt; 0) auf „Veröffentlicht“ setzen
            </div>
            <Button size="sm" onClick={bulkPublishScored} disabled={bulkPublishing}>
              {bulkPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird veröffentlicht
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Alle Beiträge mit Bewertung veröffentlichen
                </>
              )}
            </Button>
          </div>
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              aria-label="Beiträge suchen"
              placeholder="Nach Titel, Slug, Inhalt oder Kategorie suchen"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-10 text-base"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Suche zurücksetzen"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="published">Veröffentlicht</SelectItem>
                <SelectItem value="draft">Entwurf</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="game">Game</SelectItem>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="series">Series</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[220px] rounded-lg">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sortierung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Neueste zuerst</SelectItem>
                <SelectItem value="date-asc">Älteste zuerst</SelectItem>
                <SelectItem value="score-desc">Beste Bewertung</SelectItem>
                <SelectItem value="score-asc">Niedrigste Bewertung</SelectItem>
                <SelectItem value="title-asc">Titel A-Z</SelectItem>
                <SelectItem value="title-desc">Titel Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredReviews.length} {filteredReviews.length === 1 ? "Beitrag" : "Beiträge"} gefunden
          {filteredReviews.length > itemsPerPage && (
            <>, Seite {currentPage} von {totalPages}</>
          )}
        </span>
        <div className="flex items-center gap-3">
          {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Filter zurücksetzen
            </button>
          )}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Beiträge pro Seite"
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value={10}>10 pro Seite</option>
            <option value={25}>25 pro Seite</option>
            <option value={50}>50 pro Seite</option>
            <option value={100}>100 pro Seite</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {paginatedReviews.length > 0 ? (
        <div className="grid gap-4">
          {paginatedReviews.map((review) => (
            <Card
              key={review.id}
              className="group overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-40 h-40 sm:h-auto aspect-video sm:aspect-square overflow-hidden bg-muted shrink-0">
                  {review.images?.[0] ? (
                    <Image
                      src={review.images[0]}
                      alt={review.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <span className="text-muted-foreground text-xs">Kein Bild</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="capitalize text-xs font-medium border-primary/30 bg-primary/5"
                      >
                        <span className="inline-flex items-center gap-1">
                          {CATEGORY_ICONS[review.category] || null}
                          {review.category}
                        </span>
                      </Badge>
                      <Badge
                        variant={review.status === "published" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {review.status === "published" ? "Veröffentlicht" : "Entwurf"}
                      </Badge>
                      <ScoreBadge score={review.score} className="scale-90" />
                    </div>
                    <CardTitle className="mb-1 line-clamp-2 text-lg">{review.title}</CardTitle>
                    {review.title_en && (
                      <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">{review.title_en}</p>
                    )}
                  </div>

                  <CardContent className="p-0 flex-1">
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                      {review.content.replace(/[#*`]/g, "").substring(0, 200)}…
                    </p>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="tabular-nums">Erstellt: {formatDate(review.createdAt)}</span>
                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                          <span className="tabular-nums">Bearbeitet: {formatDate(review.updatedAt)}</span>
                        )}
                      </div>
                      <span className="hidden font-mono text-xs sm:inline">/{review.slug}</span>
                    </div>
                  </CardContent>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 border-t pt-3">
                    <Link href={`/admin/reviews/${review.id}/edit`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(review)}
                      disabled={togglingStatusId === review.id}
                      title={review.status === "published" ? "In Entwurf verschieben" : "Veröffentlichen"}
                      aria-label={review.status === "published" ? "In Entwurf verschieben" : "Veröffentlichen"}
                      className="shrink-0"
                    >
                      {togglingStatusId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : review.status === "published" ? (
                        <Circle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </Button>
                    {review.status === "published" && (
                      <Link href={`/reviews/${review.slug}`} target="_blank">
                        <Button variant="outline" size="sm" aria-label="Beitrag öffnen">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(review)}
                      aria-label="Beitrag löschen"
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center">
          <p className="text-muted-foreground text-lg font-medium">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Keine Beiträge gefunden."
              : "Noch keine Beiträge vorhanden."}
          </p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Versuche andere Filter oder Suchbegriffe."
              : "Erstelle deinen ersten Review im Quick Create Tab."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Zurück
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true;
              if (page === 1 || page === totalPages) return true;
              if (Math.abs(page - currentPage) <= 1) return true;
              return false;
            })
            .reduce<(number | "...")[]>((acc, page, idx, arr) => {
              if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(page);
              return acc;
            }, [])
            .map((page, idx) =>
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[36px]"
                >
                  {page}
                </Button>
              )
            )}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Weiter
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beitrag löschen?</DialogTitle>
            <DialogDescription>
              Möchtest du den Beitrag &quot;{reviewToDelete?.title}&quot; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setReviewToDelete(null);
              }}
              disabled={deleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gelöscht
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
