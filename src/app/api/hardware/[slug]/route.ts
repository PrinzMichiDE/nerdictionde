import { NextRequest, NextResponse } from "next/server";
import { getHardwareBySlug } from "@/lib/hardware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const hardware = await getHardwareBySlug(slug);
    
    if (!hardware) {
      return NextResponse.json({ error: "Hardware not found" }, { status: 404 });
    }

    return NextResponse.json(hardware);
  } catch (error: any) {
    console.error("Hardware Get error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
