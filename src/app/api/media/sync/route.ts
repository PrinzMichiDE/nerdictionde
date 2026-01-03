import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/blob";

export async function POST(req: NextRequest) {
  try {
    const { url, filename } = await req.json();
    if (!url || !filename) {
      return NextResponse.json({ error: "URL and filename are required" }, { status: 400 });
    }

    const blobUrl = await uploadImage(url, filename);
    return NextResponse.json({ url: blobUrl });
  } catch (error: any) {
    console.error("Media Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

