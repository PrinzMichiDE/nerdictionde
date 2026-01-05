import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth, checkAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const isAdmin = checkAdminAuth(req);

    const where: any = {};
    if (!isAdmin) {
      where.status = "published";
    } else if (status && status !== "all") {
      where.status = status;
    }

    const pcBuilds = await prisma.pCBuild.findMany({
      where,
      include: {
        components: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        pricePoint: "asc",
      },
    });

    return NextResponse.json(pcBuilds);
  } catch (error: any) {
    console.error("Fetch PC builds error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();

    if (!body.pricePoint || !body.title) {
      return NextResponse.json({ error: "Price point and title are required" }, { status: 400 });
    }

    const slug = body.slug || `bester-${body.pricePoint}-euro-gaming-pc`;

    // Calculate total price if not provided
    const totalPrice = body.totalPrice || (body.components || []).reduce((acc: number, comp: any) => acc + (comp.price || 0), 0);

    const pcBuild = await prisma.pCBuild.create({
      data: {
        pricePoint: body.pricePoint,
        title: body.title,
        title_en: body.title_en,
        slug,
        description: body.description,
        description_en: body.description_en,
        totalPrice,
        currency: body.currency || "EUR",
        status: body.status || "draft",
        affiliateLink: body.affiliateLink,
        metadata: body.metadata,
        components: {
          create: (body.components || []).map((comp: any, index: number) => ({
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
        },
      },
      include: {
        components: true,
      },
    });

    return NextResponse.json(pcBuild);
  } catch (error: any) {
    console.error("Create PC build error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

