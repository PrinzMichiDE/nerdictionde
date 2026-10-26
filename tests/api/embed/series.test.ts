// ============================================
// Embed Series API Integration Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/embed/series/[slug]/route';
import { getEmbedSeriesData } from '@/lib/embed-data';

vi.mock('@/lib/embed-data');
vi.mock('@/lib/feature-flags', () => ({
  isReviewEmbedEnabled: vi.fn(() => true),
  FEATURE_REVIEW_EMBED: true,
}));

import { getEmbedSeriesData as mockGetEmbedSeriesData } from '@/lib/embed-data';

describe('api/embed/series/[slug]', () => {
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

    const req = new NextRequest('http://localhost/api/embed/series/test');
    const params = Promise.resolve({ slug: 'test' });
    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('returns 400 for invalid slug', async () => {
    const req = new NextRequest('http://localhost/api/embed/series/');
    const params = Promise.resolve({ slug: '' });
    const response = await GET(req, { params });
    expect(response.status).toBe(400);
  });

  it('returns 404 when series not found', async () => {
    vi.mocked(mockGetEmbedSeriesData).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/embed/series/not-found');
    const params = Promise.resolve({ slug: 'not-found' });
    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('returns 200 with series data', async () => {
    const mockData = {
      type: 'series' as const,
      slug: 'elden-ring-series',
      title: 'Elden Ring Series',
      description: 'All reviews',
      partCount: 2,
      owner: { username: 'max', displayName: 'Max Mustermann', avatar: 'https://example.com/avatar.png' },
      coverImage: 'https://example.com/cover.jpg',
      createdAt: '2024-06-15T10:00:00.000Z',
      url: 'https://nerdiction.de/serien/elden-ring-series',
      parts: [
        { order: 1, review: { slug: 'base', title: 'Elden Ring', score: 9.5 } },
        { order: 2, review: { slug: 'dlc', title: 'Shadow of the Erdtree', score: 9.0 } },
      ],
    };

    vi.mocked(mockGetEmbedSeriesData).mockResolvedValue(mockData);

    const req = new NextRequest('http://localhost/api/embed/series/elden-ring-series');
    const params = Promise.resolve({ slug: 'elden-ring-series' });
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual(mockData);
    expect(json.cachedAt).toBeDefined();
  });
});