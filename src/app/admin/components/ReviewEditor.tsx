"use client";

import { useState } from "react";
import { Review } from "@/types/review";
import { PreviewPanel } from "./PreviewPanel";
import { AIAssistant } from "./AIAssistant";
import { FormPanel } from "./FormPanel";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle, Globe, ArrowLeft } from "lucide-react";
import axios from "axios";
import Link from "next/link";

interface ReviewEditorProps {
  review: Review;
}

export function ReviewEditor({ review: initialReview }: ReviewEditorProps) {
  const [review, setReview] = useState<Review>(initialReview);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/reviews/${review.id}`, review);
      // alert("Erfolgreich gespeichert!");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
        const updatedReview = { ...review, status: "published" as const };
        await axios.put(`/api/reviews/${review.id}`, updatedReview);
        setReview(updatedReview);
        alert("Beitrag veröffentlicht!");
    } catch (error) {
        console.error("Publish failed:", error);
    } finally {
        setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
      <div className="flex items-center justify-between border-b pb-4 shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/admin?tab=list">
            <Button variant="ghost" size="sm" className="shrink-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Liste
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold line-clamp-1">{review.title}</h2>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="capitalize">{review.category}</span>
              <span>•</span>
              <span className={review.status === "published" ? "text-green-500 font-medium" : "text-yellow-500"}>
                {review.status === "published" ? "Veröffentlicht" : "Entwurf"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Globe className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing || review.status === "published"}>
            {publishing ? <Globe className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
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
    </div>
  );
}

