import { NextResponse } from "next/server";
import { getIGDBGenres } from "@/lib/igdb";

export async function POST() {
  try {
    const genres = await getIGDBGenres();
    return NextResponse.json(genres);
  } catch (error: any) {
    console.error("IGDB Genres error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

