import { NextResponse } from "next/server";
import { getIGDBPlatforms } from "@/lib/igdb";

export async function POST() {
  try {
    const platforms = await getIGDBPlatforms();
    return NextResponse.json(platforms);
  } catch (error: any) {
    console.error("IGDB Platforms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

