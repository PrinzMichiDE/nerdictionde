"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface SeriesShareButtonProps {
  title: string;
  url: string;
}

export function SeriesShareButton({ title, url }: SeriesShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // Fallback to clipboard
        }
      }
    }
    await fallbackCopy();
  };

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link kopiert – in die Zwischenablage kopiert");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-1 px-4 py-2 text-sm font-medium",
        "border rounded-lg hover:bg-accent transition-colors"
      )}
      aria-label="Serie teilen"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Teilen
    </button>
  );
}