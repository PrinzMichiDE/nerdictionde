import { NextRequest, NextResponse } from "next/server";

/**
 * Security Headers Configuration
 * Implements OWASP best practices and security headers
 */
const securityHeaders = {
  // Prevent clickjacking attacks
  "X-Frame-Options": "DENY",
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",
  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions Policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https://www.youtube.com blob:",
    "connect-src 'self' https://api.openai.com https://*.vercel-blob-storage.com https://*.igdb.com",
    "frame-src 'self' https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

/**
 * Rate Limiting Store (in-memory for single instance)
 * For production, use Redis or similar distributed store
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.ip || "unknown";
  return `rate_limit:${ip}`;
}

function checkRateLimit(req: NextRequest): boolean {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!checkRateLimit(request)) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...securityHeaders,
          },
        }
      );
    }
  }

  // Create response
  const response = NextResponse.next();

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Additional headers
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
