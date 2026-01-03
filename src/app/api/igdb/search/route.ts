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
  } catch (error: any) {
    console.error("IGDB Search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

