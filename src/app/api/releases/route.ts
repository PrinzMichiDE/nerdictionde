import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * API Endpoint: Get upcoming game releases
 * 
 * Query parameters:
 * - limit: Number of releases to return (default: 1000)
 * - days: Number of days ahead to look (default: 365)
 * - month: Filter by specific month (YYYY-MM format)
 * - year: Filter by specific year
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "1000", 10);
    const days = parseInt(searchParams.get("days") || "365", 10);
    const month = searchParams.get("month"); // YYYY-MM format
    const year = searchParams.get("year");

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Build where clause
    const where: any = {
      category: "game",
      releaseDate: {
        gte: now,
        lte: futureDate,
      },
    };

    // Filter by month if provided
    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const monthStart = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
      const monthEnd = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0, 23, 59, 59);
      where.releaseDate = {
        gte: monthStart,
        lte: monthEnd,
      };
    }

    // Filter by year if provided
    if (year && !month) {
      const yearStart = new Date(parseInt(year, 10), 0, 1);
      const yearEnd = new Date(parseInt(year, 10), 11, 31, 23, 59, 59);
      where.releaseDate = {
        gte: yearStart,
        lte: yearEnd,
      };
    }

    const releases = await prisma.review.findMany({
      where,
      select: {
        id: true,
        title: true,
        title_en: true,
        slug: true,
        releaseDate: true,
        images: true,
        score: true,
        metadata: true,
        steamAppId: true,
        epicId: true,
        gogId: true,
      },
      orderBy: {
        releaseDate: "asc",
      },
      take: limit,
    });

    // Group releases by month
    const releasesByMonth: Record<string, typeof releases> = {};
    releases.forEach((release) => {
      if (release.releaseDate) {
        const monthKey = release.releaseDate.toISOString().substring(0, 7); // YYYY-MM
        if (!releasesByMonth[monthKey]) {
          releasesByMonth[monthKey] = [];
        }
        releasesByMonth[monthKey].push(release);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        releases,
        releasesByMonth,
        total: releases.length,
        dateRange: {
          from: now.toISOString(),
          to: futureDate.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching releases:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
