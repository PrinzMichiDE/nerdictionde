"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, Gamepad2, Film, Tv, Plus, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GenerateResult {
  created: number;
  errors: string[];
}

interface GenerateCommentResult {
  created: number;
  error?: string;
}

const categories = [
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "movies", label: "Filme", icon: Film },
  { value: "series", label: "Serien", icon: Tv },
] as const;

export function ForumGenerator() {
  const [selectedCategory, setSelectedCategory] = useState<string>("gaming");
  const [threadCount, setThreadCount] = useState(5);
  const [commentCount, setCommentCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, GenerateResult> | null>(null);
  const [threadId, setThreadId] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentResult, setCommentResult] = useState<GenerateCommentResult | null>(null);
  const { toast } = useToast();

  const handleGenerateThreads = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/forum/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory, count: threadCount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Generierung fehlgeschlagen");
      }

      const data = await res.json();
      setResults({ [selectedCategory]: data });
      toast({
        title: "Threads generiert",
        description: `${data.created} neue Threads in ${selectedCategory} erstellt.`,
      });
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

  const handleGenerateAll = async () => {
    setLoading(true);
    setResults(null);
    const allResults: Record<string, GenerateResult> = {};

    try {
      for (const cat of categories) {
        const res = await fetch("/api/forum/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: cat.value, count: threadCount }),
        });

        if (res.ok) {
          allResults[cat.value] = await res.json();
        } else {
          allResults[cat.value] = { created: 0, errors: ["API Fehler"] };
        }
      }

      setResults(allResults);
      const total = Object.values(allResults).reduce((s, r) => s + r.created, 0);
      toast({
        title: "Alle Kategorien generiert",
        description: `${total} neue Threads insgesamt erstellt.`,
      });
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

  const handleGenerateComments = async () => {
    if (!threadId.trim()) return;
    setCommentLoading(true);
    setCommentResult(null);

    try {
      const res = await fetch("/api/forum/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: threadId.trim(), count: commentCount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Generierung fehlgeschlagen");
      }

      const data = await res.json();
      setCommentResult(data);
      toast({
        title: "Kommentare generiert",
        description: `${data.created} neue Kommentare hinzugefügt.`,
      });
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Thread Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Forum-Threads generieren
          </CardTitle>
          <CardDescription>
            Erstelle neue Diskussionsthemen für das Forum. Threads werden mit KI generierten Kommentaren befüllt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategorie</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={selectedCategory === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(value)}
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Anzahl Threads</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={threadCount}
                onChange={(e) => setThreadCount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kommentare pro Thread</label>
              <Input
                type="number"
                min={5}
                max={30}
                value={commentCount}
                onChange={(e) => setCommentCount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGenerateThreads} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Kategorie generieren
            </Button>
            <Button onClick={handleGenerateAll} disabled={loading} variant="outline">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Alle Kategorien
            </Button>
          </div>

          {results && (
            <div className="mt-4 space-y-2">
              {Object.entries(results).map(([cat, result]) => (
                <div key={cat} className="flex items-center gap-2 text-sm">
                  {result.created > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-medium capitalize">{cat}:</span>
                  <span>{result.created} Threads erstellt</span>
                  {result.errors.length > 0 && (
                    <span className="text-muted-foreground">({result.errors.length} Fehler)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment Generation for existing Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Kommentare zu bestehendem Thread hinzufügen
          </CardTitle>
          <CardDescription>
            Füge einem bestehenden Thread weitere KI-Kommentare hinzu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Thread ID</label>
            <Input
              placeholder="z.B. clxyz1234..."
              value={threadId}
              onChange={(e) => setThreadId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Anzahl Kommentare</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={commentCount}
              onChange={(e) => setCommentCount(Number(e.target.value))}
            />
          </div>

          <Button onClick={handleGenerateComments} disabled={commentLoading || !threadId.trim()}>
            {commentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Kommentare generieren
          </Button>

          {commentResult && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{commentResult.created} Kommentare hinzugefügt</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
