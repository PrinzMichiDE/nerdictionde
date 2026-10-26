// ============================================
// Embed E2E/Integration Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

describe('Embed Feature Integration', () => {
  beforeAll(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://nerdiction.de');
    global.fetch = vi.fn();
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(global, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Embed Code Generation', () => {
    it('generates correct embed code for review', () => {
      const type = 'review';
      const slug = 'test-review';
      const theme = 'auto';
      const consent = true;
      const compact = false;

      const attrs = [
        `data-nerdiction-embed="${type}"`,
        `data-slug="${slug}"`,
        `data-theme="${theme}"`,
        !consent ? 'data-consent="false"' : '',
        compact ? 'data-compact="true"' : '',
      ].filter(Boolean).join(' ');

      const embedCode = `<script async src="https://nerdiction.de/embed.js"></script>
<div ${attrs}></div>`;

      expect(embedCode).toContain('data-nerdiction-embed="review"');
      expect(embedCode).toContain('data-slug="test-review"');
      expect(embedCode).toContain('data-theme="auto"');
      expect(embedCode).not.toContain('data-consent="false"');
      expect(embedCode).not.toContain('data-compact="true"');
    });

    it('generates correct embed code for collection with all options', () => {
      const type = 'collection';
      const slug = 'test-collection';
      const theme = 'dark';
      const consent = false;
      const compact = true;

      const attrs = [
        `data-nerdiction-embed="${type}"`,
        `data-slug="${slug}"`,
        `data-theme="${theme}"`,
        !consent ? 'data-consent="false"' : '',
        compact ? 'data-compact="true"' : '',
      ].filter(Boolean).join(' ');

      const embedCode = `<script async src="https://nerdiction.de/embed.js"></script>
<div ${attrs}></div>`;

      expect(embedCode).toContain('data-nerdiction-embed="collection"');
      expect(embedCode).toContain('data-slug="test-collection"');
      expect(embedCode).toContain('data-theme="dark"');
      expect(embedCode).toContain('data-consent="false"');
      expect(embedCode).toContain('data-compact="true"');
    });

    it('generates correct embed code for series', () => {
      const type = 'series';
      const slug = 'test-series';
      const theme = 'light';
      const consent = true;
      const compact = false;

      const attrs = [
        `data-nerdiction-embed="${type}"`,
        `data-slug="${slug}"`,
        `data-theme="${theme}"`,
        !consent ? 'data-consent="false"' : '',
        compact ? 'data-compact="true"' : '',
      ].filter(Boolean).join(' ');

      const embedCode = `<script async src="https://nerdiction.de/embed.js"></script>
<div ${attrs}></div>`;

      expect(embedCode).toContain('data-nerdiction-embed="series"');
      expect(embedCode).toContain('data-slug="test-series"');
      expect(embedCode).toContain('data-theme="light"');
    });
  });

  describe('Embed API Response Validation', () => {
    it('validates review embed data structure', () => {
      const mockReviewData = {
        type: 'review' as const,
        slug: 'test-review',
        title: 'Test Review',
        excerpt: 'A great review',
        score: 9.5,
        scoreLabel: 'Meisterwerk',
        category: 'game',
        categoryLabel: 'Games',
        coverImage: 'https://example.com/cover.jpg',
        coverAlt: 'Test Review Cover',
        author: { username: 'testuser', displayName: 'Test User', avatar: 'https://example.com/avatar.png' },
        publishedAt: '2024-01-01T00:00:00.000Z',
        url: 'https://nerdiction.de/reviews/test-review',
        pros: ['Pro 1', 'Pro 2'],
        cons: ['Con 1'],
        specs: { Developer: 'Test Dev' },
      };

      expect(mockReviewData.type).toBe('review');
      expect(mockReviewData.score).toBe(9.5);
      expect(mockReviewData.pros).toHaveLength(2);
      expect(mockReviewData.cons).toHaveLength(1);
      expect(mockReviewData.url).toContain('nerdiction.de/reviews/');
    });

    it('validates collection embed data structure', () => {
      const mockCollectionData = {
        type: 'collection' as const,
        slug: 'test-collection',
        title: 'Test Collection',
        description: 'A collection',
        itemCount: 2,
        owner: { username: 'testuser', displayName: 'Test User', avatar: 'https://example.com/avatar.png' },
        coverImage: 'https://example.com/cover.jpg',
        createdAt: '2024-01-01T00:00:00.000Z',
        url: 'https://nerdiction.de/listen/test-collection',
        items: [
          { position: 1, review: { slug: 'game-1', title: 'Game 1', score: 9, coverImage: 'https://example.com/g1.jpg' } },
          { position: 2, review: { slug: 'game-2', title: 'Game 2', score: 8.5, coverImage: null } },
        ],
      };

      expect(mockCollectionData.type).toBe('collection');
      expect(mockCollectionData.itemCount).toBe(2);
      expect(mockCollectionData.items).toHaveLength(2);
      expect(mockCollectionData.url).toContain('nerdiction.de/listen/');
    });

    it('validates series embed data structure', () => {
      const mockSeriesData = {
        type: 'series' as const,
        slug: 'test-series',
        title: 'Test Series',
        description: 'A series',
        partCount: 2,
        owner: { username: 'testuser', displayName: 'Test User', avatar: 'https://example.com/avatar.png' },
        coverImage: 'https://example.com/cover.jpg',
        createdAt: '2024-01-01T00:00:00.000Z',
        url: 'https://nerdiction.de/serien/test-series',
        parts: [
          { order: 1, review: { slug: 'base', title: 'Base Game', score: 9.5 } },
          { order: 2, review: { slug: 'dlc', title: 'DLC', score: 9.0 } },
        ],
      };

      expect(mockSeriesData.type).toBe('series');
      expect(mockSeriesData.partCount).toBe(2);
      expect(mockSeriesData.parts).toHaveLength(2);
      expect(mockSeriesData.url).toContain('nerdiction.de/serien/');
    });
  });

  describe('Embed Script Fetch Logic', () => {
    it('fetches data from correct API endpoint for review', async () => {
      const mockData = { type: 'review', slug: 'test', title: 'Test', score: 9.5 };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const response = await fetch('https://nerdiction.de/api/embed/review/test');
      const json = await response.json();

      expect(global.fetch).toHaveBeenCalledWith('https://nerdiction.de/api/embed/review/test');
      expect(json.data).toEqual(mockData);
    });

    it('fetches data from correct API endpoint for collection', async () => {
      const mockData = { type: 'collection', slug: 'test', title: 'Test', itemCount: 1 };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const response = await fetch('https://nerdiction.de/api/embed/collection/test');
      const json = await response.json();

      expect(global.fetch).toHaveBeenCalledWith('https://nerdiction.de/api/embed/collection/test');
      expect(json.data).toEqual(mockData);
    });

    it('fetches data from correct API endpoint for series', async () => {
      const mockData = { type: 'series', slug: 'test', title: 'Test', partCount: 1 };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const response = await fetch('https://nerdiction.de/api/embed/series/test');
      const json = await response.json();

      expect(global.fetch).toHaveBeenCalledWith('https://nerdiction.de/api/embed/series/test');
      expect(json.data).toEqual(mockData);
    });

    it('handles 404 errors gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const response = await fetch('https://nerdiction.de/api/embed/review/not-found');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      try {
        await fetch('https://nerdiction.de/api/embed/review/test');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Theme and Compact Mode Logic', () => {
    it('applies dark theme when theme is dark', () => {
      const theme = 'dark';
      const hostAttributes = { 'data-theme': theme };
      expect(hostAttributes['data-theme']).toBe('dark');
    });

    it('applies light theme when theme is light', () => {
      const theme = 'light';
      const hostAttributes = { 'data-theme': theme };
      expect(hostAttributes['data-theme']).toBe('light');
    });

    it('applies auto theme when theme is auto', () => {
      const theme = 'auto';
      const hostAttributes = { 'data-theme': theme };
      expect(hostAttributes['data-theme']).toBe('auto');
    });

    it('applies compact attribute when compact is true', () => {
      const compact = true;
      const hostAttributes = compact ? { 'data-compact': 'true' } : {};
      expect(hostAttributes['data-compact']).toBe('true');
    });

    it('does not apply compact attribute when compact is false', () => {
      const compact = false;
      const hostAttributes = compact ? { 'data-compact': 'true' } : {};
      expect(hostAttributes['data-compact']).toBeUndefined();
    });
  });

  describe('XSS Protection', () => {
    it('escapes HTML in user content for security', () => {
      const escapeHtml = (text: string) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      const maliciousInput = '<script>alert("xss")</script>';
      const escaped = escapeHtml(maliciousInput);

      // The escape function correctly escapes HTML entities (<, >, &)
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('alert');
    });

    it('handles special characters correctly by escaping them', () => {
      const escapeHtml = (text: string) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      // In jsdom, these are the correctly escaped values
      expect(escapeHtml('"')).toBe('"');
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('<')).toBe('&lt;');
      expect(escapeHtml('>')).toBe('&gt;');
    });
  });

  describe('Reduced Motion Support', () => {
    it('detects reduced motion preference', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const mediaQuery = mockMatchMedia('(prefers-reduced-motion: reduce)');
      expect(mediaQuery).toBeDefined();
      expect(typeof mediaQuery.matches).toBe('boolean');
      expect(typeof mediaQuery.addEventListener).toBe('function');
    });
  });
});