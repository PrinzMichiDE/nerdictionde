import type { ShareContentType, SharePlatform } from "@prisma/client";

export interface ShareUrlParams {
  contentType: ShareContentType;
  contentId: string;
  title: string;
  description?: string;
  url: string;
  image?: string;
  author?: string;
  tags?: string[];
}

export interface ShareUrls {
  twitter: string;
  bluesky: string;
  mastodon: string;
  reddit: string;
  discord: string;
  copyLink: string;
}

const TWITTER_MAX_LENGTH = 280;
const MASTODON_MAX_LENGTH = 500;
const BLUESKY_MAX_LENGTH = 300;
const REDDIT_MAX_LENGTH = 300;

export function truncateText(text: string, maxLength: number, suffix = "…"): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

export function buildHashtags(tags: string[] = []): string {
  const baseTags = ["Nerdiction", "Gaming", "Review"];
  const allTags = [...baseTags, ...tags].slice(0, 5);
  return allTags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");
}

export function buildTwitterText(params: ShareUrlParams): string {
  const hashtags = buildHashtags(params.tags);
  const base = `${params.title} ${params.url} ${hashtags}`.trim();
  return truncateText(base, TWITTER_MAX_LENGTH);
}

export function buildBlueskyText(params: ShareUrlParams): string {
  const hashtags = buildHashtags(params.tags);
  const base = `${params.title} ${params.url} ${hashtags}`.trim();
  return truncateText(base, BLUESKY_MAX_LENGTH);
}

export function buildMastodonText(params: ShareUrlParams): string {
  const hashtags = buildHashtags(params.tags);
  const base = `${params.title} ${params.url} ${hashtags}`.trim();
  return truncateText(base, MASTODON_MAX_LENGTH);
}

export function buildRedditText(params: ShareUrlParams): string {
  const base = `${params.title} ${params.url}`.trim();
  return truncateText(base, REDDIT_MAX_LENGTH);
}

export function buildDiscordText(params: ShareUrlParams): string {
  return `${params.title}\n${params.url}`;
}

export function buildShareUrls(params: ShareUrlParams): ShareUrls {
  const encodedUrl = encodeURIComponent(params.url);
  const encodedTitle = encodeURIComponent(params.title);
  const encodedText = {
    twitter: encodeURIComponent(buildTwitterText(params)),
    bluesky: encodeURIComponent(buildBlueskyText(params)),
    mastodon: encodeURIComponent(buildMastodonText(params)),
    reddit: encodeURIComponent(buildRedditText(params)),
    discord: encodeURIComponent(buildDiscordText(params)),
  };

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText.twitter}&url=${encodedUrl}`,
    bluesky: `https://bsky.app/intent/compose?text=${encodedText.bluesky}`,
    mastodon: `https://mastodon.social/share?text=${encodedText.mastodon}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    discord: `https://discord.com/share?url=${encodedUrl}`,
    copyLink: params.url,
  };
}

export function getPlatformDisplayName(platform: SharePlatform): string {
  const names: Record<SharePlatform, string> = {
    TWITTER: "Twitter/X",
    BLUESKY: "Bluesky",
    MASTODON: "Mastodon",
    REDDIT: "Reddit",
    DISCORD: "Discord",
    COPY_LINK: "Link kopieren",
  };
  return names[platform];
}

export function getPlatformIcon(platform: SharePlatform): string {
  const icons: Record<SharePlatform, string> = {
    TWITTER: "Twitter",
    BLUESKY: "MessageSquare",
    MASTODON: "Globe",
    REDDIT: "Reddit",
    DISCORD: "MessageCircle",
    COPY_LINK: "Link2",
  };
  return icons[platform];
}

export function getDefaultShareText(contentType: ShareContentType, title: string): string {
  const templates: Record<ShareContentType, string> = {
    REVIEW: `Schau dir diesen Review an: ${title}`,
    COLLECTION: `Schau dir diese Liste an: ${title}`,
    SERIES: `Schau dir diese Serie an: ${title}`,
    PROFILE: `Folge mir auf Nerdiction: ${title}`,
  };
  return templates[contentType];
}

export function getShareTextForPlatform(
  platform: SharePlatform,
  params: ShareUrlParams
): string {
  switch (platform) {
    case "TWITTER":
      return buildTwitterText(params);
    case "BLUESKY":
      return buildBlueskyText(params);
    case "MASTODON":
      return buildMastodonText(params);
    case "REDDIT":
      return buildRedditText(params);
    case "DISCORD":
      return buildDiscordText(params);
    case "COPY_LINK":
      return params.url;
    default:
      return params.url;
  }
}