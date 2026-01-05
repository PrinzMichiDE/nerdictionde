import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth, checkAdminAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ price: string }> }
) {
  try {
    const { price } = await params;
    const isAdmin = checkAdminAuth(req);

    // Try to find by pricePoint first (if it's a number), then by slug
    const pricePoint = parseInt(price);
    const where: any = isNaN(pricePoint) 
      ? { slug: price } 
      : { pricePoint };

    if (!isAdmin) {
      where.status = "published";
    }

    const pcBuild = await prisma.pCBuild.findFirst({
      where,
      include: {
        components: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!pcBuild) {
      return NextResponse.json({ error: "PC build not found" }, { status: 404 });
    }

    return NextResponse.json(pcBuild);
  } catch (error: any) {
    console.error("Fetch PC build error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ price: string }> }
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { price } = await params;
    const body = await req.json();

    const pricePoint = parseInt(price);
    const where: any = isNaN(pricePoint) 
      ? { slug: price } 
      : { pricePoint };

    const existingBuild = await prisma.pCBuild.findFirst({ where });
    if (!existingBuild) {
      return NextResponse.json({ error: "PC build not found" }, { status: 404 });
    }

    // Handle components update: delete all and recreate for simplicity
    // A more sophisticated approach would be to update existing and delete missing
    if (body.components) {
      await prisma.pCComponent.deleteMany({
        where: { pcBuildId: existingBuild.id },
      });
    }

    const pcBuild = await prisma.pCBuild.update({
      where: { id: existingBuild.id },
      data: {
        pricePoint: body.pricePoint,
        title: body.title,
        title_en: body.title_en,
        slug: body.slug,
        description: body.description,
        description_en: body.description_en,
        totalPrice: body.totalPrice,
        currency: body.currency,
        status: body.status,
        affiliateLink: body.affiliateLink,
        metadata: body.metadata,
        components: body.components ? {
          create: body.components.map((comp: any, index: number) => ({
            type: comp.type,
            name: comp.name,
            manufacturer: comp.manufacturer,
            model: comp.model,
            price: comp.price,
            currency: comp.currency || "EUR",
            affiliateLink: comp.affiliateLink,
            reviewId: comp.reviewId,
            specs: comp.specs,
            sortOrder: comp.sortOrder !== undefined ? comp.sortOrder : index,
          })),
        } : undefined,
      },
      include: {
        components: true,
      },
    });

    return NextResponse.json(pcBuild);
  } catch (error: any) {
    console.error("Update PC build error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ price: string }> }
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { price } = await params;
    const pricePoint = parseInt(price);
    const where: any = isNaN(pricePoint) 
      ? { slug: price } 
      : { pricePoint };

    const existingBuild = await prisma.pCBuild.findFirst({ where });
    if (!existingBuild) {
      return NextResponse.json({ error: "PC build not found" }, { status: 404 });
    }

    await prisma.pCBuild.delete({
      where: { id: existingBuild.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete PC build error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

