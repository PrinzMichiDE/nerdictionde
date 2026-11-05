import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production-min-32-chars"
);

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "twitch_session";

async function verifySessionEdge(request: NextRequest): Promise<{ userId: string; twitchId: string; username: string } | null> {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; twitchId: string; username: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Protect /admin routes with token auth
  if (pathname.startsWith('/admin')) {
    const adminToken = process.env.ADMIN_TOKEN;
    
    // If no token is configured, block access for safety
    if (!adminToken) {
      return new NextResponse('Admin token not configured', { status: 500 });
    }

    const tokenFromQuery = searchParams.get('token');
    const tokenFromCookie = request.cookies.get('admin_token')?.value;

    // 1. If token is in query, set cookie and redirect to remove token from URL
    if (tokenFromQuery && tokenFromQuery === adminToken) {
      // Preserve other query parameters (like tab) when redirecting
      const newUrl = new URL(pathname, request.url);
      searchParams.forEach((value, key) => {
        if (key !== 'token') {
          newUrl.searchParams.set(key, value);
        }
      });
      const response = NextResponse.redirect(newUrl);
      response.cookies.set('admin_token', adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return response;
    }

    // 2. Check if valid token is in cookie
    if (tokenFromCookie !== adminToken) {
      // Not authorized, redirect to home or return 404 to hide admin presence
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect /tools routes with Twitch session auth
  if (pathname.startsWith('/tools')) {
    const session = await verifySessionEdge(request);

    if (!session) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tools/:path*',
  ],
};

