import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import {
  getNotifications,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const result = await getNotifications(auth.userId, {
    unreadOnly,
    cursor,
    limit,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { ids, all } = body;

  if (all === true) {
    const count = await markAllNotificationsAsRead(auth.userId);
    return NextResponse.json({ success: true, data: { count } });
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    const count = await markNotificationsAsRead(auth.userId, ids);
    return NextResponse.json({ success: true, data: { count } });
  }

  return NextResponse.json({ error: "ids or all required" }, { status: 400 });
}