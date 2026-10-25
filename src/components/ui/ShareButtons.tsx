"use client";

import { useState } from "react";
import {
  Twitter,
  MessageSquare,
  Globe,
  Link2,
  MessageCircle,
  Check,
  Loader2,
  X,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { buildShareUrls, getPlatformDisplayName, getPlatformIcon } from "@/lib/share-urls";
import type { SharePlatform } from "@prisma/client";
import { cn } from "@/lib/utils";
import { FEATURE_SOCIAL_SHARING, FEATURE_SHARE_TRACKING } from "@/lib/feature-flags";

export interface ShareButtonsProps {
  contentType: "review" | "collection" | "series" | "profile";
  contentId: string;
  title: string;
  description?: string;
  url: string;
  image?: string;
  author?: string;
  platforms?: SharePlatform[];
  variant?: "inline" | "dropdown" | "minimal";
  className?: string;
  showLabels?: boolean;
}

const PLATFORM_ICONS: Record<SharePlatform, typeof Twitter> = {
  TWITTER: Twitter,
  BLUESKY: MessageSquare,
  MASTODON: Globe,
  REDDIT: Link2,
  DISCORD: MessageCircle,
  COPY_LINK: Link2,
};

const DEFAULT_PLATFORMS: SharePlatform[] = [
  "TWITTER",
  "BLUESKY",
  "MASTODON",
  "REDDIT",
  "DISCORD",
  "COPY_LINK",
];

function trackShare(contentType: string, contentId: string, platform: SharePlatform) {
  if (!FEATURE_SHARE_TRACKING) return;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const apiUrl = `${baseUrl}/api/share/track`;

  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: contentType.toUpperCase(), contentId, platform }),
    keepalive: true,
  }).catch(() => {
    // Fire-and-forget, ignore errors
  });
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for non-secure contexts
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch (e) {
      reject(e);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

export function ShareButtons({
  contentType,
  contentId,
  title,
  description,
  url,
  image,
  author,
  platforms = DEFAULT_PLATFORMS,
  variant = "inline",
  className,
  showLabels = variant === "inline",
}: ShareButtonsProps) {
  const [copiedPlatform, setCopiedPlatform] = useState<SharePlatform | null>(null);
  const [loadingPlatform, setLoadingPlatform] = useState<SharePlatform | null>(null);
  const [mastodonInstance, setMastodonInstance] = useState("mastodon.social");
  const [showMastodonDialog, setShowMastodonDialog] = useState(false);
  const [pendingMastodonUrl, setPendingMastodonUrl] = useState<string | null>(null);

  const fullUrl = typeof window !== "undefined" ? window.location.origin + url : url;

  const handleShare = async (platform: SharePlatform) => {
    if (!FEATURE_SOCIAL_SHARING) return;

    setLoadingPlatform(platform);

    try {
      const params = { contentType, contentId, title, description, url: fullUrl, image, author, tags: [] };
      const urls = buildShareUrls(params as any);

      let shareUrl = urls[platform.toLowerCase() as keyof typeof urls];

      if (platform === "MASTODON") {
        shareUrl = `https://${mastodonInstance}/share?text=${encodeURIComponent(shareUrl)}`;
      }

      if (platform === "COPY_LINK") {
        await copyToClipboard(fullUrl);
        setCopiedPlatform(platform);
        toast.success("Link in Zwischenablage kopiert");
        setTimeout(() => setCopiedPlatform(null), 2000);
      } else {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }

      trackShare(contentType, contentId, platform);
    } catch (error) {
      if (platform === "COPY_LINK") {
        toast.error("Kopieren fehlgeschlagen");
      } else {
        console.error("Share failed:", error);
      }
    } finally {
      setLoadingPlatform(null);
    }
  };

  const handleMastodonConfirm = () => {
    if (pendingMastodonUrl) {
      window.open(pendingMastodonUrl, "_blank", "noopener,noreferrer");
      trackShare(contentType, contentId, "MASTODON");
    }
    setShowMastodonDialog(false);
    setPendingMastodonUrl(null);
  };

  const handleMastodonOpen = () => {
    const params = { contentType, contentId, title, description, url: fullUrl, image, author, tags: [] };
    const urls = buildShareUrls(params as any);
    const mastodonUrl = `https://${mastodonInstance}/share?text=${encodeURIComponent(urls.mastodon)}`;
    setPendingMastodonUrl(mastodonUrl);
    setShowMastodonDialog(true);
  };

  const getIcon = (platform: SharePlatform) => {
    const Icon = PLATFORM_ICONS[platform];
    return <Icon className="size-4" />;
  };

  const renderButton = (platform: SharePlatform, index: number) => {
    const isCopied = copiedPlatform === platform;
    const isLoading = loadingPlatform === platform;
    const isMastodon = platform === "MASTODON";
    const displayName = getPlatformDisplayName(platform);
    const showLabel = showLabels && variant !== "minimal";

    if (isMastodon) {
      return (
        <Button
          key={platform}
          variant="outline"
          size={variant === "minimal" ? "icon" : "sm"}
          onClick={handleMastodonOpen}
          disabled={isLoading}
          className={cn(
            "h-9 rounded-full px-4 gap-2 transition-colors hover:border-primary/50",
            variant === "minimal" && "size-9 p-0"
          )}
          aria-label={`Auf ${displayName} teilen`}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isCopied ? (
            <Check className="size-4 text-primary" />
          ) : (
            <>
              {showLabel && <span className="text-xs font-semibold">{displayName}</span>}
              <span className="sr-only">{displayName}</span>
              <span aria-hidden="true">{getIcon(platform)}</span>
            </>
          )}
        </Button>
      );
    }

    return (
      <Button
        key={platform}
        variant="outline"
        size={variant === "minimal" ? "icon" : "sm"}
        onClick={() => handleShare(platform)}
        disabled={isLoading}
        className={cn(
          "h-9 rounded-full px-4 gap-2 transition-colors hover:border-primary/50",
          variant === "minimal" && "size-9 p-0"
        )}
        aria-label={`Auf ${displayName} teilen`}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isCopied ? (
          <Check className="size-4 text-primary" />
        ) : (
          <>
            {showLabel && <span className="text-xs font-semibold">{displayName}</span>}
            <span className="sr-only">{displayName}</span>
            <span aria-hidden="true">{getIcon(platform)}</span>
          </>
        )}
      </Button>
    );
  };

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 rounded-full px-4 gap-2">
            <Share2 className="size-4" />
            <span className="text-xs font-semibold">Teilen</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {platforms.map((platform, index) => (
            <DropdownMenuItem
              key={platform}
              onClick={() => handleShare(platform)}
              disabled={loadingPlatform === platform}
              className={cn(
                "flex items-center gap-2",
                copiedPlatform === platform && "text-primary"
              )}
            >
              {getIcon(platform)}
              <span>{getPlatformDisplayName(platform)}</span>
              {copiedPlatform === platform && <Check className="size-4 ml-auto text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1", className)} role="group" aria-label="Teilen">
        {platforms.map((platform, index) => renderButton(platform, index))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} role="group" aria-label="Teilen">
      {platforms.map((platform, index) => renderButton(platform, index))}
    </div>
  );
}