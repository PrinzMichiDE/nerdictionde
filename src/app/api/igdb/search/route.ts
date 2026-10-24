import { NextRequest, NextResponse } from "next/server";
import { searchIGDB } from "@/lib/igdb";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = await searchIGDB(query);
    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error("IGDB Search error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

