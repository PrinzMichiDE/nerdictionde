"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Check, Code2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReviewBadge } from "./ReviewBadge";

interface ReviewBadgeGeneratorProps {
  score: number;
  title: string;
  slug: string;
  isEn?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nerdiction.de";

function generateEmbedCode(score: number, title: string, slug: string, isEn: boolean): string {
  const imageUrl = `${BASE_URL}/api/review-badge/${slug}`;
  const reviewUrl = `${BASE_URL}/reviews/${slug}`;
  const ariaLabel = isEn
    ? `Tested by Nerdiction: ${title}, ${score} of 100`
    : `Getestet von Nerdiction: ${title}, ${score} von 100`;

  return `<a href="${reviewUrl}" target="_blank" rel="noopener noreferrer nofollow">
  <img src="${imageUrl}" alt="${ariaLabel}" width="260" height="60" style="border:none;display:block;" />
</a>`;
}

export function ReviewBadgeGenerator({ score, title, slug, isEn = false }: ReviewBadgeGeneratorProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const embedCode = generateEmbedCode(score, title, slug, isEn);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast({
        title: isEn ? "Copied!" : "Kopiert!",
        description: isEn ? "HTML-Code in Zwischenablage." : "HTML-Code in Zwischenablage.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: isEn ? "Error" : "Fehler",
        description: isEn ? "Could not copy." : "Konnte nicht kopieren.",
        variant: "destructive",
      });
    }
  }, [embedCode, toast, isEn]);

  const imageUrl = `${BASE_URL}/api/review-badge/${slug}`;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
          {isEn ? "Publisher Badge" : "Badge für Publisher & Entwickler"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isEn
            ? "Embed this badge on your website to show your Nerdiction test score."
            : "Binde dieses Badge auf deiner Website ein, um deinen Nerdiction-Testwert zu zeigen."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        {/* Preview */}
        <div className="border rounded-lg border-border bg-card p-4">
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isEn ? "Preview" : "Vorschau"}
            </span>
            <ReviewBadge score={score} title={title} slug={slug} isEn={isEn} />
          </div>
        </div>

        {/* Code / Settings */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "code")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">
                <span className="flex items-center justify-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isEn ? "Preview" : "Vorschau"}
                </span>
              </TabsTrigger>
              <TabsTrigger value="code">
                <span className="flex items-center justify-center gap-2">
                  <Code2 className="h-3.5 w-3.5" />
                  {isEn ? "Code" : "Code"}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="focus-visible:outline-none">
              <div className="border rounded-lg p-4 min-h-[120px] bg-muted/30 flex items-center justify-center">
                <ReviewBadge score={score} title={title} slug={slug} isEn={isEn} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Label htmlFor="badge-image" className="text-xs font-medium text-muted-foreground">
                  {isEn ? "Image URL" : "Bild-URL"}
                </Label>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline-offset-4 hover:underline truncate max-w-[200px]"
                >
                  {imageUrl}
                </a>
              </div>
            </TabsContent>

            <TabsContent value="code" className="focus-visible:outline-none space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <Label htmlFor="embed-format" className="text-xs font-medium text-muted-foreground">
                  {isEn ? "Format" : "Format"}
                </Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-primary">HTML</span>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <span className="text-xs font-medium text-muted-foreground">{isEn ? "Image" : "Bild"}</span>
                </div>
              </div>

              <div className="relative group">
                <pre className="p-3 overflow-x-auto bg-background/50 rounded-lg border border-border/50 text-[10px] font-mono leading-relaxed text-muted-foreground">
                  <code>{embedCode}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={copied}
                  className="absolute right-3 top-3 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span className="text-xs">{isEn ? "Copied!" : "Kopiert!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-xs">{isEn ? "Copy" : "Kopieren"}</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <ImageIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {isEn
                    ? "Uses a dynamically generated SVG image."
                    : "Nutzt ein dynamisch generiertes SVG-Bild."}
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
