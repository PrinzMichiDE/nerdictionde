"use client";

import { useState } from "react";
import { Share2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
}

export function ShareButton({ url, title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await copyToClipboard();
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        await copyToClipboard();
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link in Zwischenablage kopiert");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={loading}
      className={className}
      aria-label={copied ? "Kopiert" : "Teilen"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}