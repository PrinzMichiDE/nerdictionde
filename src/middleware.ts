import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth-twitch";

export async function middleware(request: NextRequest) {
  // Protect /tools/* routes
  if (request.nextUrl.pathname.startsWith("/tools")) {
    const session = await verifySession(request);

    if (!session) {
      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tools/:path*",
  ],
};
