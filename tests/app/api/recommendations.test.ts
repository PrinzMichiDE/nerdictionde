import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getHomeRecommendations } from '@/app/api/recommendations/route';
import { POST as dismissRecommendation } from '@/app/api/recommendations/dismiss/route';
import { GET as getReviewRecommendations } from '@/app/api/reviews/[id]/recommendations/route';
import { ZodError } from 'zod';

// Mock dependencies
vi.mock('@/lib/session', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/recommendations', () => ({
  getRecommendations: vi.fn(),
  getReviewRecommendations: vi.fn(),
  dismissRecommendation: vi.fn(),
}));

// Mock feature-flags with a getter that can be overridden
const mockRecommendationsFlag = { value: true };
vi.mock('@/lib/feature-flags', () => ({
  featureFlags: {
    get recommendations() { return mockRecommendationsFlag.value; },
  },
}));

vi.mock('@/lib/api-response', () => ({
  successResponse: vi.fn((data, headers) => new Response(JSON.stringify(data), { status: 200, headers })),
  errorResponse: vi.fn((message, status, options) => 
    new Response(JSON.stringify({ error: message, ...options?.extra, errors: options?.errors }), { status })
  ),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ 
    success: true, 
    headers: new Headers(), 
    remaining: 59, 
    resetTime: Date.now() + 60000 
  })),
}));

vi.mock('@/lib/recommendation-schema', () => ({
  recommendationsQuerySchema: {
    safeParse: vi.fn(),
  },
  reviewRecommendationsQuerySchema: {
    safeParse: vi.fn(),
  },
  dismissRecommendationSchema: {
    safeParse: vi.fn(),
  },
}));

import { getServerSession } from '@/lib/session';
import { getRecommendations } from '@/lib/recommendations';
import { dismissRecommendation as libDismissRecommendation } from '@/lib/recommendations';
import { getReviewRecommendations as libGetReviewRecommendations } from '@/lib/recommendations';
import { featureFlags } from '@/lib/feature-flags';
import { successResponse, errorResponse } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';
import {
  recommendationsQuerySchema,
  reviewRecommendationsQuerySchema,
  dismissRecommendationSchema,
} from '@/lib/recommendation-schema';

function createZodError<T>(fieldErrors: Record<string, string[]>): ZodError<T> {
  const issues = Object.entries(fieldErrors).flatMap(([field, messages]) =>
    messages.map((message) => ({
      code: 'custom' as const,
      message,
      path: [field],
    }))
  );
  return new ZodError(issues) as ZodError<T>;
}

describe('Recommendations API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecommendationsFlag.value = true;
    vi.mocked(rateLimit).mockResolvedValue({ 
      success: true, 
      headers: new Headers(), 
      remaining: 59, 
      resetTime: Date.now() + 60000 
    });
    // For rate limiting tests
    vi.mocked(rateLimit).mockImplementation(async (req, opts) => {
      if (opts.key.includes('ratelimited')) {
        return { success: false, headers: new Headers(), remaining: 0, resetTime: Date.now() + 60000 };
      }
      return { success: true, headers: new Headers(), remaining: 59, resetTime: Date.now() + 60000 };
    });
    vi.mocked(successResponse).mockImplementation((data) => new Response(JSON.stringify(data), { status: 200 }));
    vi.mocked(errorResponse).mockImplementation((msg, status, options) => 
      new Response(JSON.stringify({ error: msg, ...options?.extra, errors: options?.errors }), { status })
    );
  });

  describe('GET /api/recommendations', () => {
    it('returns 404 when feature flag is disabled', async () => {
      mockRecommendationsFlag.value = false;

      const request = new Request('http://localhost/api/recommendations');
      const response = await getHomeRecommendations(request);

      expect(response.status).toBe(404);
    });

    it('returns 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request('http://localhost/api/recommendations');
      const response = await getHomeRecommendations(request);

      expect(response.status).toBe(401);
    });

    it('returns 400 for invalid query params', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ userId: 'user1', username: 'test' });
      vi.mocked(recommendationsQuerySchema.safeParse).mockReturnValue({
        success: false,
        error: createZodError({ limit: ['Invalid'] }),
      });

      const request = new Request('http://localhost/api/recommendations?limit=invalid');
      const response = await getHomeRecommendations(request);

      expect(response.status).toBe(400);
    });

    it('returns recommendations on success', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ userId: 'user1', username: 'test' });
      vi.mocked(recommendationsQuerySchema.safeParse).mockReturnValue({
        success: true,
        data: { limit: 10, cursor: undefined },
      });
      vi.mocked(getRecommendations).mockResolvedValue({
        recommendations: [],
        strategy: 'cold-start',
      });

      const request = new Request('http://localhost/api/recommendations?limit=10');
      const response = await getHomeRecommendations(request);

      expect(response.status).toBe(200);
      expect(getRecommendations).toHaveBeenCalledWith('user1', { limit: 10, cursor: undefined });
    });

    it('applies rate limiting', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ userId: 'user1', username: 'test' });
      // Simulate rate limit by mocking the rateLimit function to return failure
      vi.mocked(rateLimit).mockResolvedValueOnce({ 
        success: false, 
        headers: new Headers(), 
        remaining: 0, 
        resetTime: Date.now() + 60000 
      });

      const request = new Request('http://localhost/api/recommendations');
      const response = await getHomeRecommendations(request);

      expect(response.status).toBe(429);
    });
  });

  describe('POST /api/recommendations/dismiss', () => {
    it('returns 404 when feature flag is disabled', async () => {
      mockRecommendationsFlag.value = false;

      const request = new Request('http://localhost/api/recommendations/dismiss', {
        method: 'POST',
        body: JSON.stringify({ reviewId: 'rev1' }),
      });
      const response = await dismissRecommendation(request);

      expect(response.status).toBe(404);
    });

    it('returns 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request('http://localhost/api/recommendations/dismiss', {
        method: 'POST',
        body: JSON.stringify({ reviewId: 'rev1' }),
      });
      const response = await dismissRecommendation(request);

      expect(response.status).toBe(401);
    });

    it('returns 400 for invalid JSON', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ userId: 'user1', username: 'test' });

      const request = new Request('http://localhost/api/recommendations/dismiss', {
        method: 'POST',
        body: 'invalid json',
      });
      const response = await dismissRecommendation(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid body params', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ userId: 'user1', username: 'test' });
      vi.mocked(dismissRecommendationSchema.safeParse).mockReturnValue({
        success: false,
        error: createZodError({ reviewId: ['Invalid'] }),
      });

      const request = new Request('http://localhost/api/recommendations/dismiss', {
        method: 'POST',
        body: JSON.stringify({ reviewId: 'invalid' }),
      });
      const response = await dismissRecommendation(request);

      expect(response.status).toBe(400);
    });

    it('dismisses recommendation on success', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ userId: 'user1', username: 'test' });
      vi.mocked(dismissRecommendationSchema.safeParse).mockReturnValue({
        success: true,
        data: { reviewId: 'rev1', reason: 'not_interested' },
      });
      vi.mocked(libDismissRecommendation).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/recommendations/dismiss', {
        method: 'POST',
        body: JSON.stringify({ reviewId: 'rev1', reason: 'not_interested' }),
      });
      const response = await dismissRecommendation(request);

      expect(response.status).toBe(200);
      expect(libDismissRecommendation).toHaveBeenCalledWith('user1', 'rev1', 'not_interested');
    });

    it('applies rate limiting', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ userId: 'user1', username: 'test' });
      vi.mocked(rateLimit).mockResolvedValueOnce({ 
        success: false, 
        headers: new Headers(), 
        remaining: 0, 
        resetTime: Date.now() + 60000 
      });

      const request = new Request('http://localhost/api/recommendations/dismiss', {
        method: 'POST',
        body: JSON.stringify({ reviewId: 'rev1' }),
      });
      const response = await dismissRecommendation(request);

      expect(response.status).toBe(429);
    });
  });

  describe('GET /api/reviews/[id]/recommendations', () => {
    it('returns 404 when feature flag is disabled', async () => {
      mockRecommendationsFlag.value = false;

      const request = new Request('http://localhost/api/reviews/test/recommendations');
      const response = await getReviewRecommendations(request, { params: Promise.resolve({ id: 'test' }) });

      expect(response.status).toBe(404);
    });

    it('returns 400 for invalid query params', async () => {
      vi.mocked(reviewRecommendationsQuerySchema.safeParse).mockReturnValue({
        success: false,
        error: createZodError({ limit: ['Invalid'] }),
      });

      const request = new Request('http://localhost/api/reviews/test/recommendations?limit=invalid');
      const response = await getReviewRecommendations(request, { params: Promise.resolve({ id: 'test' }) });

      expect(response.status).toBe(400);
    });

    it('returns recommendations for authenticated user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ userId: 'user1', username: 'test' });
      vi.mocked(reviewRecommendationsQuerySchema.safeParse).mockReturnValue({
        success: true,
        data: { limit: 5 },
      });
      vi.mocked(libGetReviewRecommendations).mockResolvedValue({
        recommendations: [],
        strategy: 'content-based',
      });

      const request = new Request('http://localhost/api/reviews/test/recommendations?limit=5');
      const response = await getReviewRecommendations(request, { params: Promise.resolve({ id: 'test' }) });

      expect(response.status).toBe(200);
      expect(libGetReviewRecommendations).toHaveBeenCalledWith('test', 'user1', { limit: 5 });
    });

    it('returns recommendations for anonymous user', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      vi.mocked(reviewRecommendationsQuerySchema.safeParse).mockReturnValue({
        success: true,
        data: { limit: 5 },
      });
      vi.mocked(libGetReviewRecommendations).mockResolvedValue({
        recommendations: [],
        strategy: 'content-based',
      });

      const request = new Request('http://localhost/api/reviews/test/recommendations?limit=5');
      const response = await getReviewRecommendations(request, { params: Promise.resolve({ id: 'test' }) });

      expect(response.status).toBe(200);
      expect(libGetReviewRecommendations).toHaveBeenCalledWith('test', undefined, { limit: 5 });
    });

    it('applies rate limiting', async () => {
      vi.mocked(rateLimit).mockResolvedValueOnce({ 
        success: false, 
        headers: new Headers(), 
        remaining: 0, 
        resetTime: Date.now() + 60000 
      });

      const request = new Request('http://localhost/api/reviews/test/recommendations');
      const response = await getReviewRecommendations(request, { params: Promise.resolve({ id: 'test' }) });

      expect(response.status).toBe(429);
    });
  });
});