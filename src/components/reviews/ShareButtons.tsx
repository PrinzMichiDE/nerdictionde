"use client";

import { useState } from "react";
import { Link as LinkIcon, Twitter, Facebook, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined" ? window.location.origin + url : url;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, "_blank");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        className="h-9 rounded-full px-4 gap-2 transition-colors hover:border-primary/50"
      >
        {copied ? (
          <>
            <Check className="size-4 text-primary" />
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
        className="size-9 rounded-full border-2 transition-colors hover:border-primary/50 hover:text-primary"
        aria-label="Auf Twitter teilen"
      >
        <Twitter className="size-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={shareFacebook}
        className="size-9 rounded-full border-2 transition-colors hover:border-primary/50 hover:text-primary"
        aria-label="Auf Facebook teilen"
      >
        <Facebook className="size-4" />
      </Button>
    </div>
  );
}
