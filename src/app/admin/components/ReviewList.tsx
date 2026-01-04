"use client";

import { useState, useEffect } from "react";
import { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Eye, Search, Filter, Loader2, X, Trash2 } from "lucide-react";
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

export function ReviewList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get("category") || "all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sync URL params with state
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }
    if (categoryFilter !== "all") {
      params.set("category", categoryFilter);
    } else {
      params.delete("category");
    }
    params.set("tab", "list");
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [searchQuery, statusFilter, categoryFilter, router, searchParams]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/reviews/${reviewToDelete.id}`);
      
      // Remove from local state
      setReviews(reviews.filter((r) => r.id !== reviewToDelete.id));
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    } catch (error: any) {
      console.error("Error deleting review:", error);
      alert(error.response?.data?.error || "Fehler beim Löschen des Beitrags");
    } finally {
      setDeleting(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reviews?all=true");
      if (response.ok) {
        const data = await response.json();
        // API returns array when all=true, otherwise { reviews: [...], pagination: {...} }
        setReviews(Array.isArray(data) ? data : (data.reviews || []));
      } else {
        console.error("Failed to fetch reviews:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const query = searchQuery.toLowerCase().trim();
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Nach Titel, Slug, Inhalt oder Kategorie suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 rounded-lg h-11 text-base"
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
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="series">Series</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredReviews.length} {filteredReviews.length === 1 ? "Beitrag" : "Beiträge"} gefunden
        </span>
      </div>

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <Card
              key={review.id}
              className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-48 h-48 sm:h-auto aspect-video sm:aspect-square overflow-hidden bg-muted shrink-0">
                  {review.images?.[0] ? (
                    <Image
                      src={review.images[0]}
                      alt={review.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <span className="text-muted-foreground text-xs font-medium">Kein Bild</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="capitalize text-xs font-semibold border-primary/30 bg-primary/5"
                        >
                          {review.category}
                        </Badge>
                        <Badge
                          variant={review.status === "published" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {review.status === "published" ? "Veröffentlicht" : "Entwurf"}
                        </Badge>
                        <ScoreBadge score={review.score} className="scale-90" />
                      </div>
                      <CardTitle className="text-xl mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {review.title}
                      </CardTitle>
                      {review.title_en && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{review.title_en}</p>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-0 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {review.content.replace(/[#*`]/g, "").substring(0, 200)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Erstellt: {formatDate(review.createdAt)}</span>
                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                          <span>Bearbeitet: {formatDate(review.updatedAt)}</span>
                        )}
                      </div>
                      <span className="font-mono text-xs">/{review.slug}</span>
                    </div>
                  </CardContent>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Link href={`/admin/reviews/${review.id}/edit`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </Button>
                    </Link>
                    {review.status === "published" && (
                      <Link href={`/reviews/${review.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(review)}
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
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beitrag löschen?</DialogTitle>
            <DialogDescription>
              Möchtest du den Beitrag "{reviewToDelete?.title}" wirklich löschen?
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
                  Wird gelöscht...
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

