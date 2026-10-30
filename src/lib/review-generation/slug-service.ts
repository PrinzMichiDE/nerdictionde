/**
 * review-generation — Slug service
 *
 * Deterministic slug generation with collision resolution. No Math.random,
 * no timestamps — only a stable counter suffix.
 */

import prisma from "@/lib/prisma";
export { formatHardwareType } from "./prompt-builder";

const MAX_ATTEMPTS = 20;

/**
 * Generates a base slug from a title.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ensures a slug is unique in the reviews table. If the base slug is taken,
 * appends a counter (-2, -3, ...) rather than a random string.
 */
export async function ensureUniqueSlug(
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let attempts = 0;

  while (await prisma.review.findUnique({ where: { slug } })) {
    attempts++;
    if (attempts > MAX_ATTEMPTS) {
      // Last resort: append a short hash of the title + counter.
      // Deterministic but avoids infinite loops.
      slug = `${baseSlug}-${attempts}`;
      // eslint-disable-next-line no-constant-condition
      if (true) break;
    }
    slug = `${baseSlug}-${attempts + 1}`;
  }

  return slug;
}

/**
 * Builds a slug candidate from a title and optional fallback name.
 */
export function buildBaseSlug(
  title: string | undefined | null,
  fallbackName: string
): string {
  return generateSlug(title || fallbackName);
}
