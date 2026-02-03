"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple toast notification component
function Toast({ toast }: { toast: { id: string; title?: string; description?: string; variant?: string } }) {
  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border ${
        toast.variant === "destructive"
          ? "bg-destructive text-destructive-foreground"
          : "bg-background border-border"
      }`}
    >
      {toast.title && <div className="font-semibold">{toast.title}</div>}
      {toast.description && <div className="text-sm">{toast.description}</div>}
    </div>
  );
}

export default function TitleGeneratorPage() {
  const [game, setGame] = useState("");
  const [theme, setTheme] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const { toast, toasts } = useToast();

  const generateTitles = async () => {
    if (!game && !theme) {
      toast({
        title: "Fehler",
        description: "Bitte gib mindestens ein Game oder Thema ein.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tools/title-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, theme, mood }),
      });

      const data = await response.json();

      if (data.success && data.data?.titles) {
        setTitles(data.data.titles);
      } else {
        toast({
          title: "Fehler",
          description: data.error || "Fehler beim Generieren der Titel",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopiert!",
      description: "Titel wurde in die Zwischenablage kopiert",
    });
  };

  return (
    <>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
      <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Stream Title Generator</h1>
        <p className="text-muted-foreground">
          Generiere optimierte Stream-Titel basierend auf Game, Thema und Stimmung
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Einstellungen</CardTitle>
          <CardDescription>
            Gib Informationen zu deinem Stream ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game">Game / Kategorie</Label>
            <Input
              id="game"
              placeholder="z.B. Valorant, Just Chatting, IRL"
              value={game}
              onChange={(e) => setGame(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">Thema / Inhalt</Label>
            <Input
              id="theme"
              placeholder="z.B. Ranked, Speedrun, Q&A"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mood">Stimmung (optional)</Label>
            <Input
              id="mood"
              placeholder="z.B. entspannt, competitive, chill"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
          </div>
          <Button
            onClick={generateTitles}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Titel generieren
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {titles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generierte Titel</CardTitle>
            <CardDescription>
              Klicke auf einen Titel um ihn zu kopieren
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {titles.map((title, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => copyToClipboard(title)}
              >
                <span className="flex-1">{title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(title);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}
