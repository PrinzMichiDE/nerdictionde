import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/user-profiles";
import { getProfileRatings, getProfileBookmarks } from "@/lib/user-profiles";

type ProfileTabItem = {
  id: string;
  score?: number;
  text?: string | null;
  review?: {
    id: string;
    title: string;
    slug: string;
    category: string;
    score: number;
    images: string[];
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const searchParams = request.nextUrl.searchParams;
  const tab = searchParams.get("tab") || "ratings";
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  // Get base profile
  const profile = await getUserProfile(username);

  if (!profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  // Get paginated data based on tab
  let items: ProfileTabItem[] = [];
  let totalCount = 0;
  let nextCursor: string | null = null;

  if (tab === "ratings" && profile.user.userProfile?.showRatings) {
    const result = await getProfileRatings(profile.user.id, cursor, limit);
    items = result.items as ProfileTabItem[];
    totalCount = result.totalCount;
    nextCursor = result.nextCursor;
  } else if (tab === "bookmarks" && profile.user.userProfile?.showBookmarks) {
    const result = await getProfileBookmarks(profile.user.id, cursor, limit);
    items = result.items as ProfileTabItem[];
    totalCount = result.totalCount;
    nextCursor = result.nextCursor;
  }

  return NextResponse.json({
    success: true,
    data: {
      user: profile.user,
      [tab]: {
        items,
        totalCount,
        nextCursor,
      },
    },
  });
}