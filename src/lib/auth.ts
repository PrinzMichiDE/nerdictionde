import { NextRequest, NextResponse } from "next/server";

/**
 * Check if the request is authenticated with admin token
 */
export function checkAdminAuth(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken) {
    return false;
  }

  // Check token from cookie
  const tokenFromCookie = request.cookies.get('admin_token')?.value;
  
  // Check token from Authorization header (for API requests)
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.replace('Bearer ', '');

  return tokenFromCookie === adminToken || tokenFromHeader === adminToken;
}

/**
 * Middleware helper to protect admin API routes
 */
export function requireAdminAuth(request: NextRequest): NextResponse | null {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return null;
}

