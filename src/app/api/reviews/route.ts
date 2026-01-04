import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth, checkAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const query = searchParams.get("query");
    const sort = searchParams.get("sort") || "date-desc";
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const dateFilter = searchParams.get("dateFilter") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const all = searchParams.get("all") === "true"; // Admin flag to get all reviews
    
    // Only admins can see all reviews or drafts
    const isAdmin = checkAdminAuth(req);
    const canSeeAll = isAdmin && (all || status === "all");

    const where: any = {
      // Non-admins can only see published reviews
      ...(canSeeAll ? {} : isAdmin && status ? { status } : { status: "published" }),
    };

    // If all=true, don't apply pagination
    const shouldPaginate = !all;

    // Add score filter
    if (minScore || maxScore) {
      where.score = {
        ...(minScore ? { gte: parseInt(minScore) } : {}),
        ...(maxScore ? { lte: parseInt(maxScore) } : {}),
      };
    }

    // Add date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      where.createdAt = {
        gte: startDate,
      };
    }

    // Add category filter
    if (category) {
      where.category = category;
    }

    // Add search query filter
    if (query && query.trim()) {
      const searchTerm = query.trim();
      const searchOR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { title_en: { contains: searchTerm, mode: "insensitive" } },
        { content: { contains: searchTerm, mode: "insensitive" } },
        { content_en: { contains: searchTerm, mode: "insensitive" } },
      ];

      if (where.AND) {
        where.AND.push({ OR: searchOR });
      } else if (where.OR) {
        // If we already have an OR (rare but possible with how we build it), 
        // we might want to wrap existing where in AND
        const existingWhere = { ...where };
        delete existingWhere.OR;
        where.AND = [existingWhere, { OR: searchOR }];
      } else {
        where.OR = searchOR;
      }
    }

    // Determine orderBy
    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "date-asc":
        orderBy = { createdAt: "asc" };
        break;
      case "score-desc":
        orderBy = { score: "desc" };
        break;
      case "score-asc":
        orderBy = { score: "asc" };
        break;
      case "title-asc":
        orderBy = { title: "asc" };
        break;
      case "title-desc":
        orderBy = { title: "desc" };
        break;
    }

    // Get total count for pagination
    const total = await prisma.review.count({ where });
    const totalPages = shouldPaginate ? Math.ceil(total / limit) : 1;

    const reviews = await prisma.review.findMany({
      where,
      orderBy,
      ...(shouldPaginate ? {
        skip: (page - 1) * limit,
        take: limit,
      } : {}),
    });

    // If all=true, return array directly for backward compatibility, otherwise return object
    if (all) {
      return NextResponse.json(reviews);
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Require admin authentication for creating reviews
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    let slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    // Check for existing slug and append suffix if necessary
    const existingReview = await prisma.review.findUnique({ where: { slug } });
    if (existingReview) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const review = await prisma.review.create({
      data: {
        title: body.title,
        title_en: body.title_en || null,
        slug,
        category: body.category || "game",
        content: body.content,
        content_en: body.content_en || null,
        score: body.score || 0,
        pros: body.pros || [],
        pros_en: body.pros_en || [],
        cons: body.cons || [],
        cons_en: body.cons_en || [],
        images: body.images || [],
        youtubeVideos: body.youtubeVideos || [],
        status: body.status || "draft",
        igdbId: body.igdbId || null,
        steamAppId: body.steamAppId || null,
        amazonAsin: body.amazonAsin || null,
        affiliateLink: body.affiliateLink || null,
        hardwareId: body.hardwareId || null,
        specs: body.specs || null,
        metadata: body.metadata || null,
        createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
      },
    });
    return NextResponse.json(review);
  } catch (error: any) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

