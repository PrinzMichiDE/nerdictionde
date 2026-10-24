import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { getFeed } from "@/lib/feed";

export async function GET(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const result = await getFeed(auth.userId, cursor, limit);

  return NextResponse.json({
    success: true,
    data: result,
  });
}