"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket, Search, Gamepad2, ChevronDown, ChevronUp, FileCheck, FilePen, SearchCheck, Store, Sparkles, ImagePlus, Video, CheckCircle2, Circle } from "lucide-react";
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

    if (!reviewData) throw new Error("Keine Review-Daten empfangen");
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
    <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-xl">
      <CardHeader className="text-center px-4 md:px-6">
        <div className="mx-auto bg-primary/10 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-3 md:mb-4">
            <Rocket className="text-primary h-5 w-5 md:h-6 md:w-6" />
        </div>
        <CardTitle className="text-xl md:text-2xl">Quick Review Generator</CardTitle>
        <CardDescription className="text-xs md:text-sm mt-2">
          Wähle eine Kategorie und gib einen Namen oder Link ein, 
          um sofort ein professionelles Review zu generieren.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-6">
        {/* Category Selection */}
        <div className="flex flex-col sm:flex-row gap-2">
          {categoryOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={category === option.value ? "default" : "outline"}
              onClick={() => setCategory(option.value)}
              disabled={loading}
              className={cn(
                "flex-1 h-11 font-medium transition-all",
                category === option.value && "shadow-md"
              )}
            >
              {option.icon}
              <span className="ml-2">{option.label}</span>
            </Button>
          ))}
        </div>

        {/* Input and Generate Button */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={categoryOptions.find(opt => opt.value === category)?.placeholder || "Eingabe..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9 rounded-full h-11"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleGenerate()}
              disabled={loading}
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !input}
            className="w-full rounded-full h-11 px-4 md:px-6 font-bold text-sm md:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Generiere...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Review erstellen</span>
                <span className="sm:hidden">Erstellen</span>
              </>
            )}
          </Button>
        </div>

        {/* Generation Progress */}
        {loading && (
          <div className="space-y-3 border rounded-xl p-4 bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fortschritt
              </span>
              {activePhase && (
                <span className="text-xs text-primary font-medium">{phaseMessage}</span>
              )}
            </div>
            <div className="space-y-2">
              {PHASES.map((phase, index) => {
                const isDone = activePhaseIndex > index || (activePhase === "videos" && index === PHASES.length - 1);
                const isActive = activePhaseIndex === index;
                return (
                  <div key={phase.key} className="flex items-center gap-2 text-xs">
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={cn(
                      "flex items-center gap-1.5",
                      isActive ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"
                    )}>
                      {phase.icon}
                      {phase.label}
                    </span>
                    {phase.key === "images" && imageProgress && imageProgress.total > 0 && (
                      <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                        {imageProgress.done}/{imageProgress.total} ({imagePercent}%)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {imageProgress && imageProgress.total > 0 && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${imagePercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Status Selection */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant={status === "published" ? "default" : "outline"}
            onClick={() => setStatus("published")}
            disabled={loading}
            className="flex-1 h-10 text-xs sm:text-sm font-medium"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Veröffentlichen
          </Button>
          <Button
            type="button"
            variant={status === "draft" ? "secondary" : "outline"}
            onClick={() => setStatus("draft")}
            disabled={loading}
            className="flex-1 h-10 text-xs sm:text-sm font-medium"
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
              <label htmlFor="disclosure" className="text-sm font-medium text-foreground">
                Disclosure / Transparenzhinweis
              </label>
              <Textarea
                id="disclosure"
                placeholder="z.B. Dieses Produkt wurde uns kostenlos zur Verfügung gestellt..."
                value={disclosure}
                onChange={(e) => setDisclosure(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Wird am Ende des Reviews als &quot;Transparenzhinweis&quot; (DE) / &quot;Disclosure&quot; (EN) eingefügt.
              </p>
            </div>

            {/* GAME.PAGE Link */}
            <div className="space-y-2">
              <label htmlFor="gamePageLink" className="text-sm font-medium text-foreground">
                GAME.PAGE Link
              </label>
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
              <label htmlFor="hashtags" className="text-sm font-medium text-foreground">
                Hashtags
              </label>
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
        <div className="text-xs text-center text-muted-foreground space-y-1 pt-2">
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
  );
}
