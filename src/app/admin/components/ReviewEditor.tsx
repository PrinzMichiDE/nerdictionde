"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

interface ReviewEditorProps {
  review: Review;
}

export function ReviewEditor({ review: initialReview }: ReviewEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [review, setReview] = useState<Review>(initialReview);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

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
        description: `Änderungen an "${review.title}" wurden gespeichert.`,
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
        description: `"${review.title}" ist jetzt online.`,
      });
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast({
        title: "Veröffentlichung fehlgeschlagen",
        description: error.response?.data?.error || "Fehler beim Veröffentlichen.",
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
        Speichert...
      </span>
    ) : dirty ? (
      <span className="text-yellow-500 font-medium">Ungespeicherte Änderungen</span>
    ) : lastSavedAt ? (
      <span className="text-green-500 font-medium">
        Gespeichert um {lastSavedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
      </span>
    ) : (
      <span className="text-muted-foreground">Keine Änderungen</span>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
      <div className="flex items-center justify-between border-b pb-4 shrink-0 flex-wrap gap-3">
        <div className="flex items-center space-x-4 min-w-0">
          <Button variant="ghost" size="sm" className="shrink-0" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Liste
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-bold line-clamp-1">{review.title}</h2>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="capitalize">{review.category}</span>
              <span>•</span>
              <span className={review.status === "published" ? "text-green-500 font-medium" : "text-yellow-500"}>
                {review.status === "published" ? "Veröffentlicht" : "Entwurf"}
              </span>
              <span>•</span>
              {statusLabel}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || publishing}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
            <kbd className="ml-2 hidden md:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              Ctrl S
            </kbd>
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing || saving || review.status === "published"}>
            {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Veröffentlichen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Form Panel */}
        <div className="overflow-y-auto pr-2 space-y-6 scrollbar-hide">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Formular</h3>
            <FormPanel review={review} setReview={setReview} />
        </div>

        {/* Center: Preview Panel */}
        <div className="border-x px-4 overflow-y-auto space-y-6 scrollbar-hide bg-muted/10 rounded-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 py-2 bg-background/0 backdrop-blur-sm z-10">Live Vorschau</h3>
            <PreviewPanel review={review} />
        </div>

        {/* Right: Assistant */}
        <div className="overflow-y-auto pl-2 space-y-6 scrollbar-hide">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Assistent</h3>
            <AIAssistant review={review} setReview={setReview} />
        </div>
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
