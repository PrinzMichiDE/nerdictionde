"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReviewPdfDownloadProps {
  slug: string;
  lang?: string;
}

export function ReviewPdfDownload({ slug, lang = "de" }: ReviewPdfDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reviews/${slug}/pdf?lang=${lang}`, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Review nicht gefunden");
        }
        throw new Error("PDF konnte nicht erstellt werden");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}-review.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Erfolg",
        description: "PDF wurde heruntergeladen",
      });
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "PDF konnte nicht heruntergeladen werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isLoading}
      className="h-9 rounded-full px-4 gap-2 transition-colors hover:border-primary/50"
      aria-label="Review als PDF herunterladen"
      aria-busy={isLoading}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="size-4" aria-hidden="true" />
      )}
      <span className="text-xs font-semibold">
        {isLoading ? (lang === "en" ? "Generating..." : "Erstelle...") : (lang === "en" ? "PDF" : "PDF")}
      </span>
    </Button>
  );
}