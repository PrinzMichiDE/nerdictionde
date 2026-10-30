/**
 * review-generation — Base processor
 *
 * Shared logic for all review processors: SEO metadata, image placeholder
 * replacement, database creation/update, and side-effect generation.
 * Designed to minimise duplication across game/movie/series/hardware.
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateSEOMetadata } from "@/lib/seo-generation";
import { replaceImagePlaceholders } from "@/lib/image-placeholder";
import {
  generateAndSaveCommentsForReview,
} from "@/lib/comment-generation";
import {
  generateAndSaveQAForReview,
} from "@/lib/qa-generation";
import {
  generateAndAttachTagsForReview,
} from "@/lib/tag-generation";
import type {
  GeneratedReviewContent,
  ProcessOptions,
  ProcessResult,
  ReviewMetadataInput,
  PrismaReviewCreateInput,
  GenerationSideEffects,
} from "./types";

/**
 * Result of generating SEO metadata.
 */
export interface SeoMetaResult {
  metaDescription: string | null;
  metaKeywords: string | null;
}

/**
 * Generates SEO metadata, swallowing errors so the review pipeline is not
 * blocked by a failing SEO call.
 */
export async function generateSeoMetadataSafe(
  title: string,
  content: string,
  category: string
): Promise<SeoMetaResult> {
  try {
    const seo = await generateSEOMetadata(title, content, category);
    return {
      metaDescription: seo.metaDescription ?? null,
      metaKeywords: seo.metaKeywords ?? null,
    };
  } catch {
    return { metaDescription: null, metaKeywords: null };
  }
}

/**
 * Replaces [[IMAGE_X]] placeholders with real uploaded URLs.
 */
export function applyImagePlaceholders(
  contentDe: string,
  contentEn: string,
  imageUrls: string[],
  itemName: string
): { contentDe: string; contentEn: string } {
  return {
    contentDe: replaceImagePlaceholders(contentDe, imageUrls, itemName),
    contentEn: replaceImagePlaceholders(contentEn, imageUrls, itemName),
  };
}

/**
 * Runs side-effect generation (comments, Q&A, tags) in parallel without
 * blocking the review creation. Errors are logged but do not fail the
 * overall operation. Returns once all side-effects have settled.
 */
export async function runSideEffects(
  reviewId: string,
  {
    reviewTitle,
    score,
    pros,
    cons,
    category,
    contentExcerpt,
    metadata,
  }: {
    reviewTitle: string;
    score: number;
    pros: string[];
    cons: string[];
    category: string;
    contentExcerpt?: string;
    metadata?: ReviewMetadataInput;
  },
  effects: GenerationSideEffects = { comments: true, qa: true, tags: true }
): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (effects.comments) {
    tasks.push(
      generateAndSaveCommentsForReview(reviewId, {
        reviewTitle,
        score,
        pros,
        cons,
        category,
      }).catch((e) =>
        console.warn(`Comment generation for review ${reviewId} failed:`, e)
      )
    );
  }

  if (effects.qa) {
    tasks.push(
      generateAndSaveQAForReview(reviewId, {
        reviewTitle,
        score,
        pros,
        cons,
        category,
      }).catch((e) =>
        console.warn(`Q&A generation for review ${reviewId} failed:`, e)
      )
    );
  }

  if (effects.tags) {
    tasks.push(
      generateAndAttachTagsForReview(reviewId, {
        reviewTitle,
        category,
        score,
        metadata,
        contentExcerpt: contentExcerpt ?? "",
      }).catch((e) =>
        console.warn(`Tag generation for review ${reviewId} failed:`, e)
      )
    );
  }

  await Promise.allSettled(tasks);
}

/**
 * Clamps a score to the valid [0, 100] range.
 */
export function clampScore(score: unknown): number {
  const parsed = Number(score);
  if (!Number.isFinite(parsed)) return 70;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

/**
 * Creates a review record inside a Prisma transaction for atomicity.
 */
export async function createReviewInTransaction(
  data: PrismaReviewCreateInput
): Promise<{ id: string }> {
  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        title: data.title,
        title_en: data.title_en,
        slug: data.slug,
        category: data.category,
        content: data.content,
        content_en: data.content_en,
        score: data.score,
        pros: data.pros,
        pros_en: data.pros_en,
        cons: data.cons,
        cons_en: data.cons_en,
        images: data.images,
        youtubeVideos: data.youtubeVideos,
        status: data.status,
        igdbId: data.igdbId ?? null,
        tmdbId: data.tmdbId ?? null,
        hardwareId: data.hardwareId ?? null,
        steamAppId: data.steamAppId ?? null,
        epicId: data.epicId ?? null,
        gogId: data.gogId ?? null,
        specs: data.specs as Prisma.InputJsonValue,
        metadata: data.metadata as Prisma.InputJsonValue,
        metaDescription: data.metaDescription ?? null,
        metaKeywords: data.metaKeywords ?? null,
        releaseDate: data.releaseDate ?? null,
        createdAt: data.createdAt ?? new Date(),
        templateId: data.templateId ?? null,
        templateData: data.templateData as unknown as Prisma.InputJsonValue,
        templateVersion: data.templateVersion ?? null,
      },
      select: { id: true },
    });
    return created;
  });
  return review;
}

/**
 * Updates an existing review record inside a Prisma transaction.
 */
export async function updateReview(
  reviewId: string,
  data: {
    title: string;
    title_en: string;
    content: string;
    content_en: string;
    score: number;
    pros: string[];
    pros_en: string[];
    cons: string[];
    cons_en: string[];
    images: string[];
    youtubeVideos?: string[];
    status: "draft" | "published";
    steamAppId?: string | null;
    epicId?: string | null;
    gogId?: string | null;
    specs?: unknown;
    metadata: ReviewMetadataInput;
    metaDescription?: string | null;
    metaKeywords?: string | null;
    releaseDate?: Date | null;
  }
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id: reviewId },
      data: {
        title: data.title,
        title_en: data.title_en,
        content: data.content,
        content_en: data.content_en,
        score: data.score,
        pros: data.pros,
        pros_en: data.pros_en,
        cons: data.cons,
        cons_en: data.cons_en,
        images: data.images,
        youtubeVideos: data.youtubeVideos ?? [],
        status: data.status,
        steamAppId: data.steamAppId ?? null,
        epicId: data.epicId ?? null,
        gogId: data.gogId ?? null,
        specs: data.specs as unknown as Prisma.InputJsonValue | undefined,
        metadata: data.metadata as Prisma.InputJsonValue,
        metaDescription: data.metaDescription ?? null,
        metaKeywords: data.metaKeywords ?? null,
        releaseDate: data.releaseDate ?? null,
      },
    });
  });
}
