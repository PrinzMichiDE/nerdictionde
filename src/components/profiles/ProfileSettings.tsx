"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Eye, EyeOff, Star, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ProfileSettingsProps {
  initialData: {
    bio: string | null;
    isPublic: boolean;
    showRatings: boolean;
    showBookmarks: boolean;
  };
}

export function ProfileSettings({ initialData }: ProfileSettingsProps) {
  const router = useRouter();
  const [bio, setBio] = useState(initialData.bio || "");
  const [isPublic, setIsPublic] = useState(initialData.isPublic);
  const [showRatings, setShowRatings] = useState(initialData.showRatings);
  const [showBookmarks, setShowBookmarks] = useState(initialData.showBookmarks);
  const [saving, setSaving] = useState(false);
  const [charCount, setCharCount] = useState(bio.length);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, isPublic, showRatings, showBookmarks }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Speichern");
      }

      toast.success("Profil gespeichert");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Profil-Einstellungen</h1>
          <p className="text-muted-foreground">Verwalte dein öffentliches Profil und deine Sichtbarkeit</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Über mich</CardTitle>
          <CardDescription>Diese Informationen werden auf deinem öffentlichen Profil angezeigt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (max. 500 Zeichen)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => {
                const value = e.target.value;
                setBio(value);
                setCharCount(value.length);
              }}
              maxLength={500}
              rows={4}
              placeholder="Erzähl etwas über dich..."
              className="resize-none"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{charCount}/500</span>
              {charCount > 450 && <span className="text-amber-500">Fast am Limit</span>}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">Sichtbarkeit</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Profil öffentlich</p>
                    <p className="text-sm text-muted-foreground">
                      Andere Nutzer können dein Profil sehen
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between" style={{ opacity: isPublic ? 1 : 0.5 }}>
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Bewertungen anzeigen</p>
                    <p className="text-sm text-muted-foreground">
                      Deine öffentlichen Bewertungen auf deinem Profil sichtbar machen
                    </p>
                  </div>
                </div>
                <Switch
                  checked={showRatings}
                  onCheckedChange={setShowRatings}
                  disabled={saving || !isPublic}
                />
              </div>

              <div className="flex items-center justify-between" style={{ opacity: isPublic ? 1 : 0.5 }}>
                <div className="flex items-center gap-3">
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Gespeicherte Reviews anzeigen</p>
                    <p className="text-sm text-muted-foreground">
                      Deine Bookmarks auf deinem Profil sichtbar machen
                    </p>
                  </div>
                </div>
                <Switch
                  checked={showBookmarks}
                  onCheckedChange={setShowBookmarks}
                  disabled={saving || !isPublic}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Speichern...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </>
          )}
        </Button>
      </div>
    </div>
  );
}