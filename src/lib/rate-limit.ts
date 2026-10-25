// ============================================
// Rate Limiting (In-Memory, for development)
// For production, use Redis or similar
// ============================================

import { headers } from 'next/headers';

interface RateLimitOptions {
  key: string;
  limit: number;
  window: number; // milliseconds
}

interface RateLimitResult {
  success: boolean;
  headers: Headers;
  remaining: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  _request: Request,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { key, limit, window } = options;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + window });
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', limit.toString());
    headers.set('X-RateLimit-Remaining', (limit - 1).toString());
    headers.set('X-RateLimit-Reset', Math.ceil((now + window) / 1000).toString());
    return {
      success: true,
      headers,
      remaining: limit - 1,
      resetTime: now + window,
    };
  }
  
  if (entry.count >= limit) {
    // Rate limited
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', limit.toString());
    headers.set('X-RateLimit-Remaining', '0');
    headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    return {
      success: false,
      headers,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', (limit - entry.count).toString());
  headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
  
  return {
    success: true,
    headers,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

// Cleanup old entries periodically (call this in a cron job or middleware)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}