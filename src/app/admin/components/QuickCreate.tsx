"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket, Search, Gamepad2, Cpu, ShoppingCart } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type ReviewCategory = "game" | "hardware" | "amazon";

export function QuickCreate() {
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<ReviewCategory>("game");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!input) return;
    setLoading(true);
    try {
      const response = await axios.post("/api/reviews/auto-generate", { 
        input,
        category 
      });
      const data = response.data;
      
      const saveResponse = await axios.post("/api/reviews", {
        ...data,
        status: "draft",
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
      value: "amazon",
      label: "Amazon",
      icon: <ShoppingCart className="h-4 w-4" />,
      placeholder: "z.B. Amazon Produkt-URL oder ASIN..."
    },
  ];

  return (
    <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Rocket className="text-primary h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Quick Review Generator</CardTitle>
        <CardDescription>
          Wähle eine Kategorie und gib einen Namen oder Link ein, 
          um sofort ein professionelles Review zu generieren.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="flex gap-2">
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
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={categoryOptions.find(opt => opt.value === category)?.placeholder || "Eingabe..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9 rounded-full h-11"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              disabled={loading}
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !input}
            className="rounded-full h-11 px-6 font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              "Review erstellen"
            )}
          </Button>
        </div>
        
        {/* Help Text */}
        <div className="text-xs text-center text-muted-foreground space-y-1 pt-2">
          <p>
            {category === "game" && "Unterstützt IGDB Datenbank-Suche und Steam Store Links."}
            {category === "hardware" && "Unterstützt Hardware-Produkte wie GPUs, CPUs, Peripheriegeräte und mehr."}
            {category === "amazon" && "Unterstützt Amazon Produkt-URLs und ASINs für automatische Produktdaten."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

