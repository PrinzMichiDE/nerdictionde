import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth, checkAdminAuth } from "@/lib/auth";
import { apiHandler, validateQuery } from "@/lib/api-handler";
import { successResponse, ApiErrors } from "@/lib/api-response";
import { ReviewQuerySchema } from "@/lib/validations/review";

export const GET = apiHandler(async (req: NextRequest) => {
  const query = validateQuery(ReviewQuerySchema)(req);
  
  // Only admins can see all reviews or drafts
  const isAdmin = checkAdminAuth(req);
  const canSeeAll = isAdmin && (query.all || query.status === "all");

  const where: any = {
    // Non-admins can only see published reviews
    ...(canSeeAll ? {} : isAdmin && query.status ? { status: query.status } : { status: "published" }),
  };

  // Add score filter
  if (query.minScore !== undefined || query.maxScore !== undefined) {
    where.score = {
      ...(query.minScore !== undefined ? { gte: query.minScore } : {}),
      ...(query.maxScore !== undefined ? { lte: query.maxScore } : {}),
    };
  }

  // Add date filter
  if (query.dateFilter !== "all") {
    const now = new Date();
    let startDate = new Date();
    
    switch (query.dateFilter) {
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
  if (query.category) {
    where.category = query.category;
  }

  // Add search query filter
  if (query.query && query.query.trim()) {
    const searchTerm = query.query.trim();
    const searchOR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { title_en: { contains: searchTerm, mode: "insensitive" } },
      { content: { contains: searchTerm, mode: "insensitive" } },
      { content_en: { contains: searchTerm, mode: "insensitive" } },
    ];

    if (where.AND) {
      where.AND.push({ OR: searchOR });
    } else if (where.OR) {
      const existingWhere = { ...where };
      delete existingWhere.OR;
      where.AND = [existingWhere, { OR: searchOR }];
    } else {
      where.OR = searchOR;
    }
  }

  // Determine orderBy
  let orderBy: any = { createdAt: "desc" };
  switch (query.sort) {
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
  const totalPages = Math.ceil(total / query.limit);

  const reviews = await prisma.review.findMany({
    where,
    orderBy,
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });

  return successResponse(
    { reviews },
    {
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    }
  );
});

export const POST = apiHandler(async (req: NextRequest) => {
  // Require admin authentication for creating reviews
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const { validateBody } = await import("@/lib/api-handler");
  const { ReviewCreateSchema } = await import("@/lib/validations/review");
  
  const body = await validateBody(ReviewCreateSchema)(req);

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
      category: body.category,
      content: body.content,
      content_en: body.content_en || null,
      score: body.score,
      pros: body.pros,
      pros_en: body.pros_en,
      cons: body.cons,
      cons_en: body.cons_en,
      images: body.images,
      youtubeVideos: body.youtubeVideos,
      status: body.status,
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
  
  return successResponse(review, undefined, 201);
});

