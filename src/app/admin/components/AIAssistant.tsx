"use client";

import { useState } from "react";
import { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles, Wand2, MessageSquare, Zap, CheckCircle } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface AIAssistantProps {
  review: Review;
  setReview: (review: Review) => void;
}

export function AIAssistant({ review, setReview }: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/ai/generate", { 
        input: `${action}. Nutze eine journalistische Struktur mit Überschriften und integriere gelegentlich Bild-Platzhalter wie ![[IMAGE_1]], ![[IMAGE_2]] etc. (bis IMAGE_5), falls diese den Text bereichern. WICHTIG: Erwähne NIEMALS, dass dieser Text von einer KI generiert wurde. Schreibe als Nerdiction-Experte. Review-Titel: "${review.title}". Aktueller Inhalt: ${review.content}` 
      });
      setReview({ ...review, content: response.data.content });
      toast({
        title: "Inhalt aktualisiert",
        description: "Der generierte Text wurde in den Inhalt übernommen.",
      });
    } catch (error) {
      console.error("Action failed:", error);
      toast({
        title: "Anfrage fehlgeschlagen",
        description: "Fehler bei der KI-Anfrage.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
        const response = await axios.post("/api/ai/generate", { 
            input: `Nerdiction Experten-Chat. Aufgabe: ${prompt}. Kontext: "${review.title}". Aktueller Inhalt: ${review.content}. Du kannst Bild-Platzhalter wie ![[IMAGE_1]] bis ![[IMAGE_5]] verwenden, um den Text zu strukturieren. WICHTIG: Erwähne NIEMALS, dass du eine KI bist.` 
        });
        setReview({ ...review, content: response.data.content });
        setPrompt("");
    } catch (error) {
        console.error("Chat failed:", error);
        toast({
          title: "Anfrage fehlgeschlagen",
          description: "Fehler bei der KI-Anfrage.",
          variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <p className="flex items-center text-sm font-medium text-primary">
          <Zap className="mr-2 h-3.5 w-3.5" />
          Schnellaktionen
        </p>
        <div className="grid grid-cols-1 gap-2">
          <Button variant="secondary" size="sm" className="h-9 justify-start text-sm" onClick={() => handleAction("Verbessere die Einleitung")}>
            <Wand2 className="mr-2 h-3.5 w-3.5 text-primary" />
            Einleitung optimieren
          </Button>
          <Button variant="secondary" size="sm" className="h-9 justify-start text-sm" onClick={() => handleAction("Erweitere den Testbericht um ausführliche Details und Unterüberschriften")}>
            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
            Ausführlich erweitern
          </Button>
          <Button variant="secondary" size="sm" className="h-9 justify-start text-sm" onClick={() => handleAction("Erweitere den Testbericht um einen technischen Deep-Dive mit Benchmarks und detaillierten Analysen")}>
            <Zap className="mr-2 h-3.5 w-3.5 text-primary" />
            Technischer Deep-Dive
          </Button>
          <Button variant="secondary" size="sm" className="h-9 justify-start text-sm" onClick={() => handleAction("Schreibe ein prägnantes Fazit mit Kaufempfehlung")}>
            <CheckCircle className="mr-2 h-3.5 w-3.5 text-primary" />
            Fazit & Empfehlung
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="flex items-center text-sm font-medium text-muted-foreground">
          <MessageSquare className="mr-2 h-3.5 w-3.5" />
          Chat
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
            Frag mich alles: „Mach den Text kürzer“, „Übersetze in Jugendsprache“ oder „Füge technische Details hinzu“.
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Anweisung eingeben"
              aria-label="Anweisung an den Assistenten"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
            />
            <Button
              size="icon"
              className="shrink-0"
              aria-label="Anweisung senden"
              disabled={loading || !prompt}
              onClick={handleChat}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

