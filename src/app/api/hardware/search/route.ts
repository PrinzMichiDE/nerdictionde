import { NextRequest, NextResponse } from "next/server";
import { searchHardware } from "@/lib/hardware";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = await searchHardware(query);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Hardware Search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

