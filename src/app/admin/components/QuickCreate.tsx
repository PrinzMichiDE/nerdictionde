"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Gamepad2, ChevronDown, ChevronUp, FileCheck, FilePen, SearchCheck, Store, Sparkles, ImagePlus, Video, CheckCircle2, Circle } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ReviewCategory = "game";
type ReviewStatus = "draft" | "published";

interface ImageProgress {
  done: number;
  total: number;
}

interface GeneratedReviewData {
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  pros: string[];
  pros_en: string[];
  cons: string[];
  cons_en: string[];
  score: number;
  specs?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  category: string;
  igdbId?: number;
  steamAppId?: string | null;
  epicId?: string | null;
  gogId?: string | null;
  images: string[];
  youtubeVideos: string[];
  createdAt?: string;
}

interface SSEPayload {
  type: "phase" | "phase-progress" | "done" | "error";
  phase?: string;
  message?: string;
  progress?: ImageProgress;
  error?: string;
  data?: GeneratedReviewData;
}

const PHASES: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "search", label: "Spiel suchen", icon: <SearchCheck className="h-3.5 w-3.5" /> },
  { key: "store", label: "Store-Daten abgleichen", icon: <Store className="h-3.5 w-3.5" /> },
  { key: "generate", label: "KI-Inhalt generieren", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "images", label: "Bilder synchronisieren", icon: <ImagePlus className="h-3.5 w-3.5" /> },
  { key: "videos", label: "Trailer suchen", icon: <Video className="h-3.5 w-3.5" /> },
];

export function QuickCreate() {
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<ReviewCategory>("game");
  const [status, setStatus] = useState<ReviewStatus>("published");
  const [loading, setLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [disclosure, setDisclosure] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [gamePageLink, setGamePageLink] = useState("");
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [phaseMessage, setPhaseMessage] = useState("");
  const [imageProgress, setImageProgress] = useState<ImageProgress | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  /**
   * Appends optional disclosure, game page link, and hashtags to the content.
   */
  const appendOptionalContent = (content: string, lang: "de" | "en"): string => {
    let result = content;
    
    if (disclosure.trim()) {
      const disclosureHeader = lang === "de" ? "## Transparenzhinweis" : "## Disclosure";
      result += `\n\n${disclosureHeader}\n\n${disclosure.trim()}`;
    }
    
    if (gamePageLink.trim()) {
      const linkText = lang === "de" ? "Mehr Infos auf GAME.PAGE" : "More info on GAME.PAGE";
      result += `\n\n[${linkText}](${gamePageLink.trim()})`;
    }
    
    if (hashtags.trim()) {
      result += `\n\n---\n\n${hashtags.trim()}`;
    }
    
    return result;
  };

  const parseSSE = async (response: Response): Promise<GeneratedReviewData> => {
    if (!response.body) throw new Error("Kein Stream empfangen");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let reviewData: GeneratedReviewData | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        for (const line of event.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as SSEPayload;

          if (payload.type === "phase") {
            setActivePhase(payload.phase ?? null);
            setPhaseMessage(payload.message ?? "");
          } else if (payload.type === "phase-progress") {
            setImageProgress(payload.progress ?? null);
          } else if (payload.type === "done") {
            reviewData = payload.data ?? null;
          } else if (payload.type === "error") {
            throw new Error(payload.error);
          }
        }
      }
    }

    // Flush any trailing bytes left in the decoder buffer
    buffer += decoder.decode();

    // Fallback: if no SSE "data:" events arrived, the endpoint may still be
    // serving a plain JSON response (e.g. legacy deployment). Try to parse it.
    if (!reviewData && buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim()) as GeneratedReviewData;
        if (parsed && typeof parsed === "object" && "content" in parsed) {
          reviewData = parsed;
        }
      } catch {
        // Not valid JSON – treat as no data
      }
    }

    if (!reviewData) throw new Error("Keine Review-Daten empfangen");
    if (!reviewData.title || !reviewData.content) {
      throw new Error("Generierte Review-Daten sind unvollständig (Titel/Inhalt fehlen)");
    }
    return reviewData;
  };

  const handleGenerate = async () => {
    if (!input) return;
    setLoading(true);
    setActivePhase("search");
    setPhaseMessage("Spiel in Datenbank suchen...");
    setImageProgress(null);
    try {
      const response = await fetch("/api/reviews/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, category }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || "Generierung fehlgeschlagen");
      }

      const data = await parseSSE(response);
      
      // Append optional disclosure and hashtags to content
      const contentDe = appendOptionalContent(data.content || "", "de");
      const contentEn = appendOptionalContent(data.content_en || "", "en");
      
      const saveResponse = await axios.post("/api/reviews", {
        ...data,
        content: contentDe,
        content_en: contentEn,
        status,
      });

      try {
        await axios.post(`/api/reviews/${saveResponse.data.id}/enrich`);
      } catch (enrichError: unknown) {
        console.warn("Enrich failed (review saved):", enrichError);
      }

      toast({
        title: status === "published" ? "Review veröffentlicht" : "Entwurf gespeichert",
        description: `"${saveResponse.data.title}" wurde erfolgreich erstellt.`,
      });

      router.push(`/admin/reviews/${saveResponse.data.id}/edit`);
    } catch (error: unknown) {
      console.error("Generation failed:", error);
      const errorMessage =
        (error instanceof Error && error.message) ||
        (typeof error === "object" && error !== null && "response" in error
          ? String((error as { response?: { data?: { error?: string } } }).response?.data?.error || "Unbekannter Fehler")
          : "Unbekannter Fehler");
      toast({
        title: "Generierung fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setActivePhase(null);
      setPhaseMessage("");
      setImageProgress(null);
    }
  };

  const categoryOptions: { value: ReviewCategory; label: string; icon: React.ReactNode; placeholder: string }[] = [
    {
      value: "game",
      label: "Game",
      icon: <Gamepad2 className="h-4 w-4" />,
      placeholder: "z.B. Elden Ring, Steam Link..."
    },
  ];

  const activePhaseIndex = activePhase ? PHASES.findIndex((p) => p.key === activePhase) : -1;
  const imagePercent = imageProgress && imageProgress.total > 0
    ? Math.round((imageProgress.done / imageProgress.total) * 100)
    : 0;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-6">
      {/* Left: input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review generieren</CardTitle>
          <CardDescription>
            Name, Steam-Link oder IGDB-ID eingeben. Store-Daten, Inhalt und
            Bilder kommen in einem Lauf zusammen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="flex flex-col sm:flex-row gap-2">
            {categoryOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={category === option.value ? "default" : "outline"}
                onClick={() => setCategory(option.value)}
                disabled={loading}
                className="flex-1 font-medium"
              >
                {option.icon}
                <span className="ml-2">{option.label}</span>
              </Button>
            ))}
          </div>

          {/* Input and Generate Button */}
          <div className="space-y-2">
            <Label htmlFor="quick-create-input">Spiel, Link oder IGDB-ID</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="quick-create-input"
                placeholder={categoryOptions.find(opt => opt.value === category)?.placeholder || "Eingabe..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleGenerate()}
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || !input}
              className="w-full font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Generiere</span>
                  <span className="sm:hidden">Läuft</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Review erstellen</span>
                  <span className="sm:hidden">Erstellen</span>
                </>
              )}
            </Button>
          </div>

          {/* Status Selection */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant={status === "published" ? "default" : "outline"}
              onClick={() => setStatus("published")}
              disabled={loading}
              className="flex-1 text-sm"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Veröffentlichen
            </Button>
            <Button
              type="button"
              variant={status === "draft" ? "secondary" : "outline"}
              onClick={() => setStatus("draft")}
              disabled={loading}
              className="flex-1 text-sm"
            >
              <FilePen className="h-4 w-4 mr-2" />
              Als Entwurf
            </Button>
          </div>

          {/* Optional Fields Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOptional(!showOptional)}
            disabled={loading}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {showOptional ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Optionale Felder ausblenden
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Optionale Felder anzeigen
              </>
            )}
          </Button>

          {/* Optional Fields */}
          {showOptional && (
            <div className="space-y-4 pt-2 border-t border-border/50">
              {/* Disclosure */}
              <div className="space-y-2">
                <Label htmlFor="disclosure">Disclosure / Transparenzhinweis</Label>
                <Textarea
                  id="disclosure"
                  placeholder="z.B. Dieses Produkt wurde uns kostenlos zur Verfügung gestellt..."
                  value={disclosure}
                  onChange={(e) => setDisclosure(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Wird am Ende des Reviews als „Transparenzhinweis“ (DE) / „Disclosure“ (EN) eingefügt.
                </p>
              </div>

              {/* GAME.PAGE Link */}
              <div className="space-y-2">
                <Label htmlFor="gamePageLink">GAME.PAGE Link</Label>
                <Input
                  id="gamePageLink"
                  placeholder="z.B. https://game.page/mygame"
                  value={gamePageLink}
                  onChange={(e) => setGamePageLink(e.target.value)}
                  className="text-sm"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Link zur GAME.PAGE wird als Markdown-Link am Ende eingefügt.
                </p>
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Input
                  id="hashtags"
                  placeholder="z.B. #Gaming #Review #Sponsored"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="text-sm"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Hashtags werden am Ende des Reviews nach einer Trennlinie eingefügt.
                </p>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1 border-t border-border/50 pt-3">
            <p>
              {category === "game" && "Unterstützt IGDB Datenbank-Suche, Steam Store Links und IGDB IDs."}
            </p>
            <p>
              {status === "published"
                ? "Der Review wird direkt nach der Erstellung veröffentlicht."
                : "Der Review wird als Entwurf gespeichert und kann später bearbeitet werden."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Right: pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ablauf</CardTitle>
          <CardDescription>
            Fünf Schritte vom Suchlauf bis zum fertigen Review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {PHASES.map((phase, index) => {
              const isDone = activePhaseIndex > index || (activePhase === "videos" && index === PHASES.length - 1);
              const isActive = activePhaseIndex === index;
              return (
                <div key={phase.key} className="flex items-center gap-3 text-sm">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "flex items-center gap-2 min-w-0",
                      isActive ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/60"
                    )}
                  >
                    {phase.icon}
                    {phase.label}
                  </span>
                  {phase.key === "images" && imageProgress && imageProgress.total > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {imageProgress.done}/{imageProgress.total}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {imageProgress && imageProgress.total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Bilder</span>
                <span className="tabular-nums">{imagePercent} %</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full origin-left rounded-full bg-primary transition-transform motion-reduce:transition-none"
                  style={{ transform: `scaleX(${imagePercent / 100})` }}
                />
              </div>
            </div>
          )}

          {loading && activePhase && (
            <p className="text-sm text-primary">{phaseMessage}</p>
          )}
          {!loading && (
            <p className="text-xs text-muted-foreground">
              Nach dem Start springst du direkt in den Editor, um den Inhalt
              zu prüfen.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
