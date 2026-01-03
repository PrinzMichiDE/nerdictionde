import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const review = await prisma.review.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(review);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

