// ============================================
// Embed Review API Integration Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/embed/review/[slug]/route';
import { getEmbedReviewData } from '@/lib/embed-data';

vi.mock('@/lib/embed-data');
vi.mock('@/lib/feature-flags', () => ({
  isReviewEmbedEnabled: vi.fn(() => true),
  FEATURE_REVIEW_EMBED: true,
}));

import { getEmbedReviewData as mockGetEmbedReviewData } from '@/lib/embed-data';

describe('api/embed/review/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 404 when feature disabled', async () => {
    vi.doMock('@/lib/feature-flags', () => ({
      isReviewEmbedEnabled: vi.fn(() => false),
    }));

    const req = new NextRequest('http://localhost/api/embed/review/test');
    const params = Promise.resolve({ slug: 'test' });
    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('returns 400 for invalid slug', async () => {
    const req = new NextRequest('http://localhost/api/embed/review/');
    const params = Promise.resolve({ slug: '' });
    const response = await GET(req, { params });
    expect(response.status).toBe(400);
  });

  it('returns 404 when review not found', async () => {
    vi.mocked(mockGetEmbedReviewData).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/embed/review/not-found');
    const params = Promise.resolve({ slug: 'not-found' });
    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('returns 200 with review data', async () => {
    const mockData = {
      type: 'review' as const,
      slug: 'elden-ring',
      title: 'Elden Ring',
      excerpt: 'A masterpiece',
      score: 9.5,
      scoreLabel: 'Meisterwerk',
      category: 'game',
      categoryLabel: 'Games',
      coverImage: 'https://example.com/cover.jpg',
      coverAlt: 'Elden Ring Cover',
      publishedAt: '2024-03-15T10:00:00.000Z',
      url: 'https://nerdiction.de/reviews/elden-ring',
      pros: ['Open World', 'Combat'],
      cons: ['Technical issues'],
      specs: { Developer: 'FromSoftware', Publisher: 'Bandai Namco' },
    };

    vi.mocked(mockGetEmbedReviewData).mockResolvedValue(mockData);

    const req = new NextRequest('http://localhost/api/embed/review/elden-ring');
    const params = Promise.resolve({ slug: 'elden-ring' });
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual(mockData);
    expect(json.cachedAt).toBeDefined();
  });
});