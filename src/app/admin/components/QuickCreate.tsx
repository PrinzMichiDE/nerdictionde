"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket, Search, Gamepad2, Cpu, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type ReviewCategory = "game" | "hardware" | "product";

export function QuickCreate() {
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<ReviewCategory>("game");
  const [loading, setLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [disclosure, setDisclosure] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [gamePageLink, setGamePageLink] = useState("");
  const router = useRouter();

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

  const handleGenerate = async () => {
    if (!input) return;
    setLoading(true);
    try {
      const response = await axios.post("/api/reviews/auto-generate", { 
        input,
        category 
      });
      const data = response.data;
      
      // Append optional disclosure and hashtags to content
      const contentDe = appendOptionalContent(data.content || "", "de");
      const contentEn = appendOptionalContent(data.content_en || "", "en");
      
      const saveResponse = await axios.post("/api/reviews", {
        ...data,
        content: contentDe,
        content_en: contentEn,
        status: "published",
      });
      
      router.push(`/admin/reviews/${saveResponse.data.id}/edit`);
    } catch (error: any) {
      console.error("Generation failed:", error);
      alert("Fehler bei der Generierung: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions: { value: ReviewCategory; label: string; icon: React.ReactNode; placeholder: string }[] = [
    {
      value: "game",
      label: "Game",
      icon: <Gamepad2 className="h-4 w-4" />,
      placeholder: "z.B. Elden Ring, Steam Link..."
    },
    {
      value: "hardware",
      label: "Hardware",
      icon: <Cpu className="h-4 w-4" />,
      placeholder: "z.B. RTX 4090, Ryzen 9 7950X..."
    },
    {
      value: "product",
      label: "Produkt",
      icon: <ShoppingCart className="h-4 w-4" />,
      placeholder: "natural elements Omega 3 – 365 Kapseln – 2000mg Fischöl pro Tagesdosis – mit EPA und DHA in Triglycerid-Form – Laborgeprüft, aufwendig aufgereinigt und aus nachhaltigem Fischfang"
    },
  ];

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
          {category === "product" ? (
            <Textarea
              placeholder={categoryOptions.find(opt => opt.value === category)?.placeholder || "Eingabe..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={loading}
            />
          ) : (
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
          )}
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
            {category === "game" && "Unterstützt IGDB Datenbank-Suche und Steam Store Links."}
            {category === "hardware" && "Unterstützt Hardware-Produkte wie GPUs, CPUs, Peripheriegeräte und mehr."}
            {category === "product" && "Geben Sie den vollständigen Produktnamen ein. Die Review wird automatisch generiert."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

