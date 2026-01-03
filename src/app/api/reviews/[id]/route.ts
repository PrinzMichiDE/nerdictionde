import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { apiHandler, validateBody } from "@/lib/api-handler";
import { successResponse, ApiErrors } from "@/lib/api-response";
import { ReviewUpdateSchema } from "@/lib/validations/review";
import { z } from "zod";

const ReviewIdSchema = z.object({
  id: z.string().uuid("Invalid review ID"),
});

export const GET = apiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const validatedId = ReviewIdSchema.parse({ id });
  
  const review = await prisma.review.findUnique({
    where: { id: validatedId.id },
    include: { comments: true, userRatings: true },
  });
  
  if (!review) {
    return ApiErrors.notFound("Review not found");
  }
  
  return successResponse(review);
});

export const PUT = apiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Require admin authentication for updating reviews
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const validatedId = ReviewIdSchema.parse({ id });
  
  const { validateBody } = await import("@/lib/api-handler");
  const body = await validateBody(ReviewUpdateSchema.partial())(req);
  
  // Check if review exists
  const existingReview = await prisma.review.findUnique({
    where: { id: validatedId.id },
  });
  
  if (!existingReview) {
    return ApiErrors.notFound("Review not found");
  }

  const review = await prisma.review.update({
    where: { id: validatedId.id },
    data: body,
  });
  
  return successResponse(review);
});

export const DELETE = apiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Require admin authentication for deleting reviews
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const validatedId = ReviewIdSchema.parse({ id });
  
  // Check if review exists
  const existingReview = await prisma.review.findUnique({
    where: { id: validatedId.id },
  });
  
  if (!existingReview) {
    return ApiErrors.notFound("Review not found");
  }

  await prisma.review.delete({
    where: { id: validatedId.id },
  });
  
  return successResponse({ message: "Review deleted successfully" });
});

