import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { toggleFollow, isFollowing } from "@/lib/follow";
import { z } from "zod";

const followSchema = z.object({
  followingId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = followSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { followingId } = parsed.data;

  if (auth.userId === followingId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  try {
    const result = await toggleFollow(auth.userId, followingId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const followingId = searchParams.get("followingId");

  if (!followingId) {
    return NextResponse.json({ error: "followingId required" }, { status: 400 });
  }

  const following = await isFollowing(auth.userId, followingId);
  return NextResponse.json({ success: true, data: { following } });
}