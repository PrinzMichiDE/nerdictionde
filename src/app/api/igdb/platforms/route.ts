import { NextResponse } from "next/server";
import { getIGDBPlatforms } from "@/lib/igdb";

export async function POST() {
  try {
    const platforms = await getIGDBPlatforms();
    return NextResponse.json(platforms);
  } catch (error: unknown) {
    console.error("IGDB Platforms error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

