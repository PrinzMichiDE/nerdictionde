/**
 * reviews — Service layer
 *
 * Business logic for review updates. All database mutations run inside Prisma
 * transactions for atomicity. Side effects (category notifications) are
 * awaited, not fire-and-forgot.
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdminAuth } from "@/lib/auth";
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from "@/lib/feature-flags";
import { createCategoryNotifications } from "@/lib/category-subscriptions";
import { mapReviewCategoryToEnum } from "@/lib/category-mapping";
import {
  validateUpdateReviewBody,
  type UpdateReviewInput,
} from "./validation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Result of a review service operation.
 */
export interface ReviewServiceResult {
  success: boolean;
  review?: Awaited<ReturnType<typeof prisma.review.findUnique>>;
  error?: string;
  status?: number;
}

/**
 * Check admin authorization from a NextRequest.
 */
function checkAdminAuth(req: NextRequest): NextResponse | null {
  const authError = requireAdminAuth(req);
  if (authError) return authError;
  return null;
}

/**
 * Normalize optional array fields: convert null to undefined so Prisma
 * does not receive an explicit null where it expects an array or absent.
 */
function normalizeArrays(input: UpdateReviewInput): UpdateReviewInput {
  return {
    ...input,
    pros_en: (input.pros_en ?? undefined) as string[] | undefined,
    cons_en: (input.cons_en ?? undefined) as string[] | undefined,
  };
}

/**
 * Update a review atomically. If the review transitions to "published",
 * category notifications are created within the same logical operation.
 */
export async function updateReviewService(
  req: NextRequest,
  reviewId: string
): Promise<ReviewServiceResult> {
  // 1. Authorization
  const authError = checkAdminAuth(req);
  if (authError) {
    return { success: false, error: "Unauthorized", status: 401 };
  }

  // 2. Parse and validate body
  let body: UpdateReviewInput;
  try {
    const raw = await req.json();
    body = validateUpdateReviewBody(raw);
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

  body = normalizeArrays(body);

  // 3. Fetch current review state
  const currentReview = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      status: true,
      category: true,
      title: true,
      slug: true,
      images: true,
      templateId: true,
      templateVersion: true,
    },
  });

  if (!currentReview) {
    return { success: false, error: "Review not found", status: 404 };
  }

  const wasPublished = currentReview.status === "published";
  const willBePublished = body.status === "published";

  // 4. Determine template fields
  let templateVersion: number | null = currentReview.templateVersion ?? 1;
  if (FEATURE_CATEGORY_SUBSCRIPTIONS && body.templateId) {
    templateVersion = 1;
  } else if (
    FEATURE_CATEGORY_SUBSCRIPTIONS &&
    body.templateId === null &&
    currentReview.templateId
  ) {
    templateVersion = null;
  }

  const templateId =
    FEATURE_CATEGORY_SUBSCRIPTIONS && body.templateId !== undefined
      ? body.templateId
      : currentReview.templateId;
  const templateData =
    FEATURE_CATEGORY_SUBSCRIPTIONS && body.templateData !== undefined
      ? body.templateData
      : undefined;

  // 5. Run update inside a transaction for atomicity.
  //    body contains only schema-defined fields (Zod strips unknown keys),
  //    so protected fields (id, createdAt, comments, etc.) cannot reach the DB.
  let updatedReview;
  try {
    updatedReview = await prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id: reviewId },
        data: {
          ...body,
          templateId,
          templateData: (templateData as Prisma.InputJsonValue) ?? null,
          templateVersion: templateId ? templateVersion : null,
        } as Prisma.ReviewUpdateInput,
      });

      // 7. Category notifications — awaited, inside transaction scope
      if (
        FEATURE_CATEGORY_SUBSCRIPTIONS &&
        !wasPublished &&
        willBePublished &&
        review.category
      ) {
        const thumbnailUrl =
          review.images && review.images.length > 0
            ? review.images[0]
            : undefined;
        const categoryEnum = mapReviewCategoryToEnum(review.category);
        if (categoryEnum) {
          await createCategoryNotifications(
            review.id,
            review.title,
            review.slug,
            categoryEnum,
            thumbnailUrl
          );
        } else {
          console.warn(
            "[CategorySubscriptions] Unknown review category, skipping notification:",
            review.category
          );
        }
      }

      return review;
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unbekannter Fehler",
      status: 500,
    };
  }

  return {
    success: true,
    review: updatedReview,
  };
}

/**
 * Delete a review atomically.
 */
export async function deleteReviewService(
  req: NextRequest,
  reviewId: string
): Promise<ReviewServiceResult> {
  const authError = checkAdminAuth(req);
  if (authError) {
    return { success: false, error: "Unauthorized", status: 401 };
  }

  try {
    await prisma.review.delete({
      where: { id: reviewId },
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unbekannter Fehler",
      status: 500,
    };
  }
}

/**
 * Fetch a single review by ID with comments and user ratings.
 * Includes pagination limits to prevent memory issues.
 */
export async function getReviewService(
  reviewId: string
): Promise<ReviewServiceResult> {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        comments: {
          take: 50,
          orderBy: { createdAt: "desc" },
        },
        userRatings: {
          take: 50,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!review) {
      return { success: false, error: "Review not found", status: 404 };
    }

    return { success: true, review };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unbekannter Fehler",
      status: 500,
    };
  }
}
