import { NextRequest, NextResponse } from "next/server";
import { getFollowers } from "@/lib/follow";
import { getUserProfile } from "@/lib/user-profiles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  // Get user by username
  const profile = await getUserProfile(username);
  if (!profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  const result = await getFollowers(profile.user.id, cursor, limit);

  return NextResponse.json({
    success: true,
    data: {
      items: result.items,
      nextCursor: result.nextCursor,
    },
  });
}