import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { getUserProfileById, updateUserProfile } from "@/lib/user-profiles";
import { updateProfileSchema } from "@/lib/schemas/profile-schema";

export async function GET(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const profile = await getUserProfileById(auth.userId);

  if (!profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: profile });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { result, username } = await updateUserProfile(auth.userId, parsed.data);

  return NextResponse.json({
    success: true,
    data: result,
    revalidatePath: username ? `/u/${username}` : undefined,
  });
}