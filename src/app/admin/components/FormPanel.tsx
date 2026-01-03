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
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhalt (Markdown - DE)</Label>
            <Textarea
              id="content"
              className="min-h-[400px] font-mono text-sm rounded-lg resize-none"
              value={review.content}
              onChange={(e) => handleChange("content", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <Label className="text-green-500">Pros (DE)</Label>
                <Textarea
                className="min-h-[100px] rounded-lg border-green-500/20 focus:border-green-500"
                value={review.pros.join("\n")}
                onChange={(e) => handleChange("pros", e.target.value.split("\n").filter(line => line.trim() !== ""))}
                />
            </div>

            <div className="space-y-2">
                <Label className="text-red-500">Cons (DE)</Label>
                <Textarea
                className="min-h-[100px] rounded-lg border-red-500/20 focus:border-red-500"
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
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_en">Content (Markdown - EN)</Label>
            <Textarea
              id="content_en"
              className="min-h-[400px] font-mono text-sm rounded-lg resize-none"
              value={review.content_en || ""}
              onChange={(e) => handleChange("content_en", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <Label className="text-green-500">Pros (EN)</Label>
                <Textarea
                className="min-h-[100px] rounded-lg border-green-500/20 focus:border-green-500"
                value={(review.pros_en || []).join("\n")}
                onChange={(e) => handleChange("pros_en", e.target.value.split("\n").filter(line => line.trim() !== ""))}
                />
            </div>

            <div className="space-y-2">
                <Label className="text-red-500">Cons (EN)</Label>
                <Textarea
                className="min-h-[100px] rounded-lg border-red-500/20 focus:border-red-500"
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
          className="rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select 
                value={review.category} 
                onValueChange={(v) => handleChange("category", v)}
            >
                <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="game">Game</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="amazon">Amazon Product</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label htmlFor="score">Score (0-100)</Label>
            <Input
            id="score"
            type="number"
            min="0"
            max="100"
            value={review.score}
            onChange={(e) => handleChange("score", parseInt(e.target.value) || 0)}
            className="rounded-lg"
            />
        </div>
      </div>

      {/* Image Management */}
      <div className="space-y-4 border-t pt-4">
        <Label>Bilder {review.category === "game" ? "(IGDB Auto-Sync aktiv)" : ""}</Label>
        
        <div className="grid grid-cols-3 gap-2">
          {review.images.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-lg overflow-hidden border group">
              <Image src={url} alt={`Bild ${i}`} fill className="object-cover" unoptimized />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {review.category !== "game" && (
            <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors bg-muted/5">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground">Hochladen</span>
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
          <Youtube className="h-4 w-4 text-red-500" />
          YouTube Videos & Trailer
        </Label>
        
        <div className="flex gap-2">
          <Input
            placeholder="YouTube URL oder Video-ID (z.B. dQw4w9WgXcQ)"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            onKeyPress={handleVideoUrlKeyPress}
            className="rounded-lg flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addYouTubeVideo}
            disabled={!newVideoUrl.trim()}
            className="rounded-lg"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {(review.youtubeVideos || []).length > 0 && (
          <div className="space-y-3">
            {(review.youtubeVideos || []).map((videoId, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate text-muted-foreground">
                    {videoId}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeYouTubeVideo(i)}
                  className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {(review.youtubeVideos || []).length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Keine Videos hinzugefügt. Klicken Sie auf "Video hinzufügen", um ein YouTube-Video oder einen Trailer hinzuzufügen.
          </p>
        )}
      </div>
      
      {(review.category === "amazon" || review.category === "hardware") && (
        <div className="space-y-2 border-t pt-4">
            <Label htmlFor="affiliateLink">Amazon Affiliate Link</Label>
            <Input
              id="affiliateLink"
              placeholder="https://amazon.de/..."
              value={review.affiliateLink || ""}
              onChange={(e) => handleChange("affiliateLink", e.target.value)}
              className="rounded-lg"
            />
        </div>
      )}

      {review.category === "game" && (
        <div className="space-y-2 border-t pt-4">
            <Label htmlFor="specs">Systemanforderungen (JSON)</Label>
            <Textarea
              id="specs"
              className="min-h-[150px] font-mono text-xs rounded-lg resize-none"
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
            <p className="text-[10px] text-muted-foreground italic">Änderungen werden nur übernommen, wenn das JSON valide ist.</p>
        </div>
      )}
    </div>
  );
}
