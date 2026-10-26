import { NextResponse } from "next/server";
import { getIGDBGenres } from "@/lib/igdb";

export async function POST() {
  try {
    const genres = await getIGDBGenres();
    return NextResponse.json(genres);
  } catch (error: unknown) {
    console.error("IGDB Genres error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

