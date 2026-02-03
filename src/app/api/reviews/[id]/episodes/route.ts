import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/reviews/[id]/episodes
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const episodes = await prisma.episodeReview.findMany({
      where: { reviewId: id },
      orderBy: [{ season: "asc" }, { episode: "asc" }],
    });
    return NextResponse.json(episodes);
  } catch (error) {
    console.error("GET /api/reviews/[id]/episodes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews/[id]/episodes
 * Body: { season: number, episode: number, title?: string, score?: number, notes?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const season = parseInt(String(body.season), 10);
    const episode = parseInt(String(body.episode), 10);
    const title = body.title ? String(body.title) : null;
    const score = body.score != null ? parseInt(String(body.score), 10) : null;
    const notes = body.notes ? String(body.notes) : null;

    if (Number.isNaN(season) || Number.isNaN(episode) || season < 1 || episode < 1) {
      return NextResponse.json({ error: "Invalid season or episode" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const episodeReview = await prisma.episodeReview.upsert({
      where: {
        reviewId_season_episode: { reviewId: id, season, episode },
      },
      create: { reviewId: id, season, episode, title, score, notes },
      update: { title, score, notes },
    });
    return NextResponse.json(episodeReview);
  } catch (error) {
    console.error("POST /api/reviews/[id]/episodes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create episode" },
      { status: 500 }
    );
  }
}
