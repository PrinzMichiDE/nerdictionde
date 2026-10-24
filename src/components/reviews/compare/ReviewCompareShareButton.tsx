"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ReviewCompareShareButtonProps {
  url: string;
  title: string;
}

export function ReviewCompareShareButton({ url, title }: ReviewCompareShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `Vergleich: ${title}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or error, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      aria-label="Vergleich teilen"
    >
      {copied ? <Check className="size-4 text-green-600" /> : <Share2 className="size-4" />}
      {copied ? "Link kopiert!" : "Teilen"}
    </button>
  );
}