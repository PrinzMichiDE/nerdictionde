/**
 * reviews — Create service
 *
 * Business logic for creating a review. Runs inside a Prisma transaction for
 * atomicity. Side effects (comments, Q&A) are awaited — no fire-and-forget.
 */

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateAndSaveCommentsForReview } from "@/lib/comment-generation";
import { generateAndSaveQAForReview } from "@/lib/qa-generation";
import { validateCreateReviewBody } from "./create-validation";
import type { CreateReviewInput } from "./create-validation";

/**
 * Result of creating a review.
 */
export interface CreateReviewResult {
  success: boolean;
  review?: Awaited<ReturnType<typeof prisma.review.create>>;
  error?: string;
  status?: number;
}

/**
 * Ensures a slug is unique in the reviews table. Uses a deterministic counter
 * suffix instead of Math.random or timestamps.
 */
export async function ensureUniqueSlug(
  baseSlug: string
): Promise<string> {
  const MAX_ATTEMPTS = 20;
  let slug = baseSlug;
  let attempts = 0;

  while (await prisma.review.findUnique({ where: { slug } })) {
    attempts++;
    if (attempts > MAX_ATTEMPTS) {
      slug = `${baseSlug}-${attempts}`;
      break;
    }
    slug = `${baseSlug}-${attempts + 1}`;
  }

  return slug;
}

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
 * Create a new review atomically.
 */
export async function createReviewService(
  body: unknown
): Promise<CreateReviewResult> {
  // 1. Validate input
  let input: CreateReviewInput;
  try {
    input = validateCreateReviewBody(body);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Validierungsfehler: ${error.message}`
          : "Ungültiger Request-Body",
      status: 400,
    };
  }

  // 2. Generate and ensure unique slug (deterministic, no Math.random)
  const baseSlug = input.slug || generateSlug(input.title);
  const slug = await ensureUniqueSlug(baseSlug);

  // 3. Create review inside a transaction
  let review;
  try {
    review = await prisma.$transaction(async (tx) => {
      return await tx.review.create({
        data: {
          title: input.title,
          title_en: (input.title_en ?? null) as string | null,
          slug,
          category: input.category ?? "game",
          content: input.content,
          content_en: (input.content_en ?? null) as string | null,
          score: input.score ?? 0,
          pros: input.pros ?? [],
          pros_en: (input.pros_en ?? undefined) as string[] | undefined,
          cons: input.cons ?? [],
          cons_en: (input.cons_en ?? undefined) as string[] | undefined,
          images: input.images ?? [],
          youtubeVideos: input.youtubeVideos ?? [],
          status: input.status ?? "draft",
          igdbId: (input.igdbId ?? null) as number | null,
          tmdbId: (input.tmdbId ?? null) as number | null,
          hardwareId: (input.hardwareId ?? null) as string | null,
          steamAppId: (input.steamAppId ?? null) as string | null,
          epicId: (input.epicId ?? null) as string | null,
          gogId: (input.gogId ?? null) as string | null,
          specs: (input.specs ?? null) as unknown as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined,
          metadata: (input.metadata ?? null) as unknown as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined,
          createdAt: input.releaseDate
            ? new Date(input.releaseDate)
            : undefined,
          templateId: (input.templateId ?? null) as string | null,
          templateData: (input.templateData ?? null) as unknown as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined,
          templateVersion: input.templateId ? 1 : null,
        },
      });
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unbekannter Fehler",
      status: 500,
    };
  }

  // 4. Side effects — awaited, not fire-and-forget
  try {
    await generateAndSaveCommentsForReview(review.id, {
      reviewTitle: input.title,
      score: input.score ?? 0,
      pros: input.pros ?? [],
      cons: input.cons ?? [],
      category: input.category ?? "game",
    });
  } catch (e) {
    console.warn("Comment generation for review failed:", e);
  }

  try {
    await generateAndSaveQAForReview(review.id, {
      reviewTitle: input.title,
      score: input.score ?? 0,
      pros: input.pros ?? [],
      cons: input.cons ?? [],
      category: input.category ?? "game",
    });
  } catch (e) {
    console.warn("Q&A generation for review failed:", e);
  }

  return { success: true, review };
}
