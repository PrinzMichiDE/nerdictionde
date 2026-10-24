"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { Review } from "@/types/review";
import { PreviewPanel } from "./PreviewPanel";
import { AIAssistant } from "./AIAssistant";
import { FormPanel } from "./FormPanel";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReviewEditorProps {
  review: Review;
}

type Pane = "form" | "preview" | "assistant";

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function ReviewEditor({ review: initialReview }: ReviewEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [review, setReview] = useState<Review>(initialReview);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pane, setPane] = useState<Pane>("form");
  const wideMatches = useMediaQuery("(min-width: 80rem)");
  const isWide = wideMatches;

  const initialSnapshot = useRef(JSON.stringify(initialReview));
  const dirty = JSON.stringify(review) !== initialSnapshot.current;

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(review) !== initialSnapshot.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [review]);

  // Ctrl/Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await axios.put(`/api/reviews/${review.id}`, review);
      initialSnapshot.current = JSON.stringify(review);
      setLastSavedAt(new Date());
      toast({
        title: "Gespeichert",
        description: `Änderungen an „${review.title}“ wurden gespeichert.`,
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Speichern fehlgeschlagen",
        description: "Fehler beim Speichern. Bitte erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [review, saving, toast]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const updatedReview = { ...review, status: "published" as const };
      await axios.put(`/api/reviews/${review.id}`, updatedReview);
      initialSnapshot.current = JSON.stringify(updatedReview);
      setReview(updatedReview);
      setLastSavedAt(new Date());
      toast({
        title: "Veröffentlicht",
        description: `„${review.title}“ ist jetzt online.`,
      });
    } catch (error: unknown) {
      console.error("Publish failed:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: "Veröffentlichung fehlgeschlagen",
        description: err.response?.data?.error || "Fehler beim Veröffentlichen.",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleBackToList = () => {
    if (dirty) {
      setLeaveDialogOpen(true);
    } else {
      router.push("/admin?tab=list");
    }
  };

  const statusLabel =
    publishing || saving ? (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Speichert
      </span>
    ) : dirty ? (
      <span className="font-medium text-warning">Ungespeicherte Änderungen</span>
    ) : lastSavedAt ? (
      <span className="font-medium text-success">
        Gespeichert um {lastSavedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
      </span>
    ) : (
      <span className="text-muted-foreground">Keine Änderungen</span>
    );

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[480px] flex-col md:h-[calc(100dvh-7.5rem)]">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" className="shrink-0" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Zurück zur Liste</span>
            <span className="sm:hidden">Zurück</span>
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold md:text-xl">{review.title || "Ohne Titel"}</h2>
            <div className="flex flex-wrap items-center gap-y-0.5 text-xs text-muted-foreground">
              <span className="capitalize">{review.category}</span>
              <span aria-hidden="true" className="mr-2 text-muted-foreground/50">,</span>
              <span className={review.status === "published" ? "font-medium text-success" : "font-medium text-warning"}>
                {review.status === "published" ? "Veröffentlicht" : "Entwurf"}
              </span>
              <span aria-hidden="true" className="mr-2 text-muted-foreground/50">,</span>
              {statusLabel}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || publishing}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
            <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground md:inline-flex">
              Ctrl S
            </kbd>
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing || saving || review.status === "published"}>
            {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Veröffentlichen
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col pt-4">
        {isWide ? (
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-5">
            {/* Form */}
            <div className="col-span-5 min-h-0 overflow-y-auto pr-1 scrollbar-hide">
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">Formular</h3>
              <FormPanel review={review} setReview={setReview} />
            </div>
            {/* Preview */}
            <div className="col-span-4 min-h-0 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-4 scrollbar-hide">
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">Vorschau</h3>
              <PreviewPanel review={review} />
            </div>
            {/* Assistant */}
            <div className="col-span-3 min-h-0 overflow-y-auto pl-1 scrollbar-hide">
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">Assistent</h3>
              <AIAssistant review={review} setReview={setReview} />
            </div>
          </div>
        ) : (
          <Tabs value={pane} onValueChange={(v) => setPane(v as Pane)} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="w-fit">
              <TabsTrigger value="form">Formular</TabsTrigger>
              <TabsTrigger value="preview">Vorschau</TabsTrigger>
              <TabsTrigger value="assistant">Assistent</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="min-h-0 flex-1 overflow-y-auto pt-4 scrollbar-hide">
              <FormPanel review={review} setReview={setReview} />
            </TabsContent>
            <TabsContent value="preview" className="min-h-0 flex-1 overflow-y-auto pt-4 scrollbar-hide">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <PreviewPanel review={review} />
              </div>
            </TabsContent>
            <TabsContent value="assistant" className="min-h-0 flex-1 overflow-y-auto pt-4 scrollbar-hide">
              <AIAssistant review={review} setReview={setReview} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Unsaved changes dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ungespeicherte Änderungen</DialogTitle>
            <DialogDescription>
              Du hast ungespeicherte Änderungen. Wenn du die Seite verlässt, gehen diese verloren.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Bleiben
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setLeaveDialogOpen(false);
                router.push("/admin?tab=list");
              }}
            >
              Verwerfen & verlassen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
