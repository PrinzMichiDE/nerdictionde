"use client";

import { useState } from "react";
import { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles, Wand2, MessageSquare, Zap, CheckCircle } from "lucide-react";
import axios from "axios";

interface AIAssistantProps {
  review: Review;
  setReview: (review: Review) => void;
}

export function AIAssistant({ review, setReview }: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/ai/generate", { 
        input: `${action}. Nutze eine journalistische Struktur mit Überschriften und integriere gelegentlich Bild-Platzhalter wie ![[IMAGE_1]], ![[IMAGE_2]] etc. (bis IMAGE_5), falls diese den Text bereichern. WICHTIG: Erwähne NIEMALS, dass dieser Text von einer KI generiert wurde. Schreibe als Nerdiction-Experte. Review-Titel: "${review.title}". Aktueller Inhalt: ${review.content}` 
      });
      setReview({ ...review, content: response.data.content });
    } catch (error) {
      console.error("Action failed:", error);
      alert("Anfrage fehlgeschlagen.");
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
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="p-5 rounded-2xl border-2 border-primary/10 bg-primary/5 space-y-4 shadow-sm">
        <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center text-primary">
            <Zap className="h-3 w-3 mr-2 fill-primary" />
            Smart Actions
        </h4>
        <div className="grid grid-cols-1 gap-2">
            <Button variant="secondary" size="sm" className="justify-start text-[11px] h-9 rounded-xl hover:bg-primary/10 transition-colors border-none shadow-none" onClick={() => handleAction("Verbessere die Einleitung")}>
                <Wand2 className="h-3.5 w-3.5 mr-2 text-primary" />
                Einleitung optimieren
            </Button>
            <Button variant="secondary" size="sm" className="justify-start text-[11px] h-9 rounded-xl hover:bg-primary/10 transition-colors border-none shadow-none" onClick={() => handleAction("Erweitere den Testbericht um ausführliche Details und Unterüberschriften")}>
                <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                Ausführlich erweitern
            </Button>
            <Button variant="secondary" size="sm" className="justify-start text-[11px] h-9 rounded-xl hover:bg-primary/10 transition-colors border-none shadow-none" onClick={() => handleAction("Erweitere den Testbericht um einen technischen Deep-Dive mit Benchmarks und detaillierten Analysen")}>
                <Zap className="h-3.5 w-3.5 mr-2 text-primary" />
                Technischer Deep-Dive
            </Button>
            <Button variant="secondary" size="sm" className="justify-start text-[11px] h-9 rounded-xl hover:bg-primary/10 transition-colors border-none shadow-none" onClick={() => handleAction("Schreibe ein prägnantes Fazit mit Kaufempfehlung")}>
                <CheckCircle className="h-3.5 w-3.5 mr-2 text-primary" />
                Fazit & Empfehlung
            </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center text-muted-foreground">
            <MessageSquare className="h-3 w-3 mr-2" />
            Assistent Chat
        </h4>
        <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-2xl text-[11px] leading-relaxed text-muted-foreground border border-border/50">
                Frag mich alles: "Mach den Text kürzer", "Übersetze in Jugendsprache" oder "Füge technische Details hinzu".
            </div>
            <div className="flex space-x-2">
                <Input 
                    placeholder="Anweisung eingeben..." 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="text-[12px] rounded-2xl h-11 bg-background shadow-sm border-border/50"
                    onKeyDown={(e) => e.key === "Enter" && handleChat()}
                />
                <Button 
                    size="icon" 
                    className="rounded-2xl h-11 w-11 shrink-0 shadow-lg active:scale-95 transition-all" 
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

