"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Gamepad2, Film, Tv } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "movies", label: "Filme", icon: Film },
  { value: "series", label: "Serien", icon: Tv },
] as const;

interface CreateThreadDialogProps {
  isLoggedIn: boolean;
  displayName: string | null;
}

export function CreateThreadDialog({ isLoggedIn, displayName }: CreateThreadDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("gaming");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const authorName = displayName || customName.trim() || "";

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !authorName) return;

    setLoading(true);
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          displayName: authorName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Thread konnte nicht erstellt werden.");
      }

      setSuccess(true);
      toast({
        title: "Thread erstellt",
        description: "Dein Thread wurde erfolgreich erstellt!",
      });

      setTimeout(() => {
        setOpen(false);
        setTitle("");
        setContent("");
        setCategory("gaming");
        setSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Thread
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuen Thread erstellen</DialogTitle>
          <DialogDescription>
            Starte eine neue Diskussion im Forum.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Thread erfolgreich erstellt!
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategorie</label>
              <div className="flex gap-2">
                {categories.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={category === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(value)}
                    type="button"
                  >
                    <Icon className="mr-1.5 h-3.5 w-3.5" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Titel</label>
              <Input
                placeholder="Was möchtest du diskutieren?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Inhalt</label>
              <Textarea
                placeholder="Beschreibe dein Thema genauer..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {!isLoggedIn && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Dein Name</label>
                <Input
                  placeholder="Wie soll dich die Community nennen?"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={30}
                />
              </div>
            )}

            {!isLoggedIn && (
              <p className="text-xs text-muted-foreground">
                Möchtest du persistent angemeldet sein?{" "}
                <a href="/api/auth/twitch/login" className="text-primary hover:underline">
                  Twitch Login
                </a>
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim() || !authorName}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {success ? "Erstellt!" : "Thread erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
