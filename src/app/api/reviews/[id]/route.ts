import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from "@/lib/feature-flags";
import { createCategoryNotifications } from "@/lib/category-subscriptions";
import { mapReviewCategoryToEnum } from "@/lib/category-mapping";
import { getTemplate, validateTemplateDataForTemplate } from "@/lib/review-templates";
import { featureFlags } from "@/lib/feature-flags";
import { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const review = await prisma.review.findUnique({
      where: { id },
      include: { comments: true, userRatings: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json(review);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication for updating reviews
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();

    // Check current status before update to detect transition to "published"
    const currentReview = await prisma.review.findUnique({
      where: { id },
      select: { status: true, category: true, title: true, slug: true, images: true, templateId: true, templateVersion: true },
    });

    if (!currentReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const wasPublished = currentReview?.status === 'published';
    const willBePublished = body.status === 'published';

    // Template validation (if feature enabled and templateId provided or changed)
    let templateVersion: number | null = currentReview.templateVersion ?? 1;
    if (featureFlags.reviewTemplates && body.templateId) {
      const validation = validateTemplateDataForTemplate(body.templateData ?? {}, body.templateId);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Template-Validierung fehlgeschlagen', details: validation.errors },
          { status: 400 }
        );
      }
      const template = await getTemplate(body.templateId);
      templateVersion = 1;
    } else if (featureFlags.reviewTemplates && body.templateId === null && currentReview.templateId) {
      // Template removed
      templateVersion = null;
    }

    // Prepare template data for storage
    const templateId = featureFlags.reviewTemplates && body.templateId !== undefined ? body.templateId : currentReview.templateId;
    const templateData = featureFlags.reviewTemplates && body.templateData !== undefined ? body.templateData : undefined;

    // Only allow updatable fields to avoid passing read-only/relation fields
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      comments: _comments,
      userRatings: _userRatings,
      ...updatableFields
    } = body;

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...updatableFields,
        templateId,
        templateData: templateData as Prisma.InputJsonValue | null,
        templateVersion: templateId ? templateVersion : null,
      },
    });

    // Trigger category notifications if review is newly published
    if (FEATURE_CATEGORY_SUBSCRIPTIONS && !wasPublished && willBePublished && review.category) {
      // Fire-and-forget: don't await, errors logged internally
      const thumbnailUrl = review.images && review.images.length > 0 ? review.images[0] : undefined;
      const categoryEnum = mapReviewCategoryToEnum(review.category);
      if (categoryEnum) {
        createCategoryNotifications(
          review.id,
          review.title,
          review.slug,
          categoryEnum,
          thumbnailUrl
        ).catch(err => {
          console.error('[CategorySubscriptions] Failed to create notifications:', err);
        });
      } else {
        console.warn('[CategorySubscriptions] Unknown review category, skipping notification:', review.category);
      }
    }

    return NextResponse.json(review);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication for deleting reviews
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    await prisma.review.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Review deleted" });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, { status: 500 });
  }
}