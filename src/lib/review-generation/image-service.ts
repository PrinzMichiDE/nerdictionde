/**
 * review-generation — Image service
 *
 * Handles all image uploading for reviews: cover images, screenshots,
 * posters, backdrops. Uploads run in parallel where possible.
 */

import { uploadImage } from "@/lib/blob";
import type { ImageUploadResult } from "./types";

/**
 * Normalises a protocol-relative URL (//...) to HTTPS.
 */
function normaliseUrl(url: string): string {
  return url.startsWith("//") ? "https:" + url : url;
}

/**
 * Replaces t_thumb with a higher-resolution variant.
 */
function upgradeResolution(url: string, variant: string): string {
  return url.replace("t_thumb", variant);
}

/**
 * Uploads a single image and returns the result.
 */
async function uploadSingle(
  url: string,
  fileName: string
): Promise<ImageUploadResult> {
  try {
    const synced = await uploadImage(url, fileName);
    return { success: true, url: synced, originalUrl: url };
  } catch {
    return { success: false, url: url, originalUrl: url };
  }
}

/**
 * Uploads a cover image for a game review.
 */
export async function uploadGameCover(
  coverUrl: string | undefined,
  slug: string
): Promise<string[]> {
  if (!coverUrl) return [];
  const result = await uploadSingle(
    upgradeResolution(normaliseUrl(coverUrl), "t_720p"),
    `${slug}-cover.jpg`
  );
  return result.success ? [result.url] : [result.url];
}

/**
 * Uploads screenshot images for a game review (max 5).
 */
export async function uploadGameScreenshots(
  screenshots: Array<{ url: string }> | undefined,
  slug: string
): Promise<string[]> {
  if (!screenshots || screenshots.length === 0) return [];

  const urls = screenshots
    .slice(0, 5)
    .map((s) => upgradeResolution(normaliseUrl(s.url), "t_1080p"));

  const results = await Promise.allSettled(
    urls.map((url, i) =>
      uploadSingle(url, `${slug}-screen-${i + 1}.jpg`)
    )
  );

  return results.map((r, i) =>
    r.status === "fulfilled" && r.value.success
      ? r.value.url
      : urls[i]
  );
}

type TmdbImageSize = "w1280" | "w300" | "w500" | "w780" | "original";

/**
 * Uploads a poster image for a movie/series review.
 */
export async function uploadPoster(
  posterPath: string | null | undefined,
  getImageUrl: (path: string | null, size?: TmdbImageSize) => string | null | undefined,
  slug: string
): Promise<string[]> {
  if (!posterPath) return [];
  const url = getImageUrl(posterPath, "w1280");
  if (!url) return [];
  const result = await uploadSingle(url, `${slug}-poster.jpg`);
  return result.success ? [result.url] : [url];
}

/**
 * Uploads backdrop images for a movie/series review (max 3).
 */
export async function uploadBackdrops(
  backdrops: Array<{ file_path: string }> | undefined,
  getImageUrl: (path: string | null, size?: TmdbImageSize) => string | null | undefined,
  slug: string
): Promise<string[]> {
  if (!backdrops || backdrops.length === 0) return [];

  const urls = backdrops
    .slice(0, 3)
    .map((b) => getImageUrl(b.file_path, "w1280"))
    .filter((u): u is string => Boolean(u));

  const results = await Promise.allSettled(
    urls.map((url, i) =>
      uploadSingle(url, `${slug}-backdrop-${i + 1}.jpg`)
    )
  );

  return results.map((r, i) =>
    r.status === "fulfilled" && r.value.success
      ? r.value.url
      : urls[i]
  );
}

/**
 * Uploads official hardware product images from the catalog (max 6).
 */
export async function uploadHardwareImages(
  imageUrls: string[],
  slug: string
): Promise<string[]> {
  if (imageUrls.length === 0) return [];

  const limited = imageUrls.slice(0, 6);
  const results = await Promise.allSettled(
    limited.map((url, i) => uploadSingle(url, `${slug}-product-${i + 1}.jpg`))
  );

  return results.map((r, i) =>
    r.status === "fulfilled" && r.value.success
      ? r.value.url
      : limited[i]
  );
}

/**
 * Uploads an official manufacturer image for hardware.
 */
export async function uploadOfficialImage(
  imageUrl: string | undefined,
  slug: string
): Promise<string[]> {
  if (!imageUrl) return [];
  const result = await uploadSingle(imageUrl, `${slug}-official.jpg`);
  return result.success ? [result.url] : [imageUrl];
}
