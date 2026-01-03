"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon, Twitter, Facebook, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackShare } from "@/lib/analytics";
import { copyToClipboard, generateShareLink } from "@/lib/export";

interface ShareButtonsProps {
  title: string;
  url: string;
  reviewId?: string;
}

export function ShareButtons({ title, url, reviewId }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined" ? window.location.origin + url : url;
  const shareUrl = generateShareLink(url.replace("/reviews/", ""), {
    utm_source: "share",
    utm_medium: "button",
  });

  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (reviewId) {
        trackShare("clipboard", reviewId, title);
      }
    }
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
    if (reviewId) {
      trackShare("twitter", reviewId, title);
    }
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
    if (reviewId) {
      trackShare("facebook", reviewId, title);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyToClipboard}
        className="h-9 rounded-full px-4 gap-2 border-2 transition-all hover:border-primary/50"
      >
        {copied ? (
          <>
            <Check className="size-4 text-green-500" />
            <span className="text-xs font-semibold">Kopiert</span>
          </>
        ) : (
          <>
            <LinkIcon className="size-4" />
            <span className="text-xs font-semibold">Link kopieren</span>
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={shareTwitter}
        className="size-9 rounded-full border-2 transition-all hover:border-sky-500/50 hover:text-sky-500"
        aria-label="Auf Twitter teilen"
      >
        <Twitter className="size-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={shareFacebook}
        className="size-9 rounded-full border-2 transition-all hover:border-blue-600/50 hover:text-blue-600"
        aria-label="Auf Facebook teilen"
      >
        <Facebook className="size-4" />
      </Button>
    </div>
  );
}

