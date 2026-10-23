"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Review } from "@/types/review";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { Loader2, Upload, X, Plus, Youtube } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface FormPanelProps {
  review: Review;
  setReview: (review: Review) => void;
}

export function FormPanel({ review, setReview }: FormPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const handleChange = (field: keyof Review, value: any) => {
    setReview({ ...review, [field]: value });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setUploading(true);

    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
      });

      handleChange("images", [...review.images, newBlob.url]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...review.images];
    newImages.splice(index, 1);
    handleChange("images", newImages);
  };

  const addYouTubeVideo = () => {
    if (newVideoUrl && newVideoUrl.trim()) {
      const currentVideos = review.youtubeVideos || [];
      handleChange("youtubeVideos", [...currentVideos, newVideoUrl.trim()]);
      setNewVideoUrl("");
    }
  };

  const handleVideoUrlKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addYouTubeVideo();
    }
  };

  const removeYouTubeVideo = (index: number) => {
    const newVideos = [...(review.youtubeVideos || [])];
    newVideos.splice(index, 1);
    handleChange("youtubeVideos", newVideos);
  };

  return (
    <div className="space-y-6 pb-8">
      <Tabs defaultValue="de" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="de">Deutsch</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>
        
        <TabsContent value="de" className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel (DE)</Label>
            <Input
              id="title"
              value={review.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhalt (Markdown - DE)</Label>
            <Textarea
              id="content"
              className="min-h-[400px] resize-none font-mono text-sm"
              value={review.content}
              onChange={(e) => handleChange("content", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <Label htmlFor="pros" className="text-success">Pros (DE)</Label>
                <Textarea
                id="pros"
                className="min-h-[100px] border-success/20 focus:border-success"
                value={review.pros.join("\n")}
                onChange={(e) => handleChange("pros", e.target.value.split("\n").filter(line => line.trim() !== ""))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="cons" className="text-destructive">Cons (DE)</Label>
                <Textarea
                id="cons"
                className="min-h-[100px] border-destructive/20 focus:border-destructive"
                value={review.cons.join("\n")}
                onChange={(e) => handleChange("cons", e.target.value.split("\n").filter(line => line.trim() !== ""))}
                />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="en" className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title_en">Title (EN)</Label>
            <Input
              id="title_en"
              value={review.title_en || ""}
              onChange={(e) => handleChange("title_en", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_en">Content (Markdown - EN)</Label>
            <Textarea
              id="content_en"
              className="min-h-[400px] resize-none font-mono text-sm"
              value={review.content_en || ""}
              onChange={(e) => handleChange("content_en", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <Label htmlFor="pros_en" className="text-success">Pros (EN)</Label>
                <Textarea
                id="pros_en"
                className="min-h-[100px] border-success/20 focus:border-success"
                value={(review.pros_en || []).join("\n")}
                onChange={(e) => handleChange("pros_en", e.target.value.split("\n").filter(line => line.trim() !== ""))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="cons_en" className="text-destructive">Cons (EN)</Label>
                <Textarea
                id="cons_en"
                className="min-h-[100px] border-destructive/20 focus:border-destructive"
                value={(review.cons_en || []).join("\n")}
                onChange={(e) => handleChange("cons_en", e.target.value.split("\n").filter(line => line.trim() !== ""))}
                />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={review.slug}
          onChange={(e) => handleChange("slug", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select 
                value={review.category} 
                onValueChange={(v) => handleChange("category", v)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="game">Game</SelectItem>
                    <SelectItem value="movie">Film</SelectItem>
                    <SelectItem value="series">Serie</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label htmlFor="score">Score (0-100)</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={review.score}
                onChange={(e) => handleChange("score", parseInt(e.target.value) || 0)}
                className="flex-1 accent-primary"
                aria-label="Score"
              />
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                value={review.score}
                onChange={(e) => handleChange("score", parseInt(e.target.value) || 0)}
                className="w-24 shrink-0"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className={review.score >= 80 ? "font-medium text-success" : ""}>80+ = Top</span>
              <span>100</span>
            </div>
        </div>
      </div>

      {/* Image Management */}
      <div className="space-y-4 border-t pt-4">
        <Label>Bilder {review.category === "game" ? "(IGDB Auto-Sync aktiv)" : ""}</Label>
        
        <div className="grid grid-cols-3 gap-2">
          {review.images.map((url, i) => (
            <div key={i} className="group relative aspect-video overflow-hidden rounded-md border">
              <Image src={url} alt={`Bild ${i}`} fill className="object-cover" unoptimized />
              <button
                onClick={() => removeImage(i)}
                aria-label={`Bild ${i + 1} entfernen`}
                className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {review.category !== "game" && (
            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/5 transition-colors hover:border-primary/50">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Hochladen</span>
                </>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      {/* YouTube Videos Management */}
      <div className="space-y-4 border-t pt-4">
        <Label className="flex items-center gap-2">
          <Youtube className="h-4 w-4" />
          YouTube Videos & Trailer
        </Label>
        
        <div className="flex gap-2">
          <Input
            id="youtube-url"
            placeholder="YouTube URL oder Video-ID (z.B. dQw4w9WgXcQ)"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            onKeyPress={handleVideoUrlKeyPress}
            className="flex-1"
            aria-label="YouTube URL oder Video-ID"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addYouTubeVideo}
            disabled={!newVideoUrl.trim()}
            aria-label="Video hinzufügen"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {(review.youtubeVideos || []).length > 0 && (
          <div className="space-y-3">
            {(review.youtubeVideos || []).map((videoId, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-muted-foreground">
                    {videoId}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeYouTubeVideo(i)}
                  aria-label={`Video ${i + 1} entfernen`}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {(review.youtubeVideos || []).length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Noch keine Videos hinzugefügt. Füge ein YouTube-Video oder einen Trailer hinzu.
          </p>
        )}
      </div>
      
      {review.category === "game" && (
        <div className="space-y-2 border-t pt-4">
            <Label htmlFor="specs">Systemanforderungen (JSON)</Label>
            <Textarea
              id="specs"
              className="min-h-[150px] resize-none font-mono text-xs"
              value={JSON.stringify(review.specs || {}, null, 2)}
              onChange={(e) => {
                try {
                  const val = JSON.parse(e.target.value);
                  handleChange("specs", val);
                } catch (err) {
                  // Silently fail while typing invalid JSON
                }
              }}
            />
            <p className="text-xs text-muted-foreground italic">Änderungen werden nur übernommen, wenn das JSON valide ist.</p>
        </div>
      )}
    </div>
  );
}
