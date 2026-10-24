import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from "@/lib/feature-flags";
import { createCategoryNotifications } from "@/lib/category-subscriptions";

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
      select: { status: true, category: true, title: true, slug: true, images: true },
    });

    const wasPublished = currentReview?.status === 'published';
    const willBePublished = body.status === 'published';

    const review = await prisma.review.update({
      where: { id },
      data: body,
    });

    // Trigger category notifications if review is newly published
    if (FEATURE_CATEGORY_SUBSCRIPTIONS && !wasPublished && willBePublished && review.category) {
      // Fire-and-forget: don't await, errors logged internally
      const thumbnailUrl = review.images && review.images.length > 0 ? review.images[0] : undefined;
      createCategoryNotifications(
        review.id,
        review.title,
        review.slug,
        review.category as any, // Review.category is String, mapped to ReviewCategory enum
        thumbnailUrl
      ).catch(err => {
        console.error('[CategorySubscriptions] Failed to create notifications:', err);
      });
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

