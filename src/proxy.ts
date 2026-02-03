import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth-twitch';

export async function proxy(request: NextRequest) {
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
    const session = await verifySession(request);

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

