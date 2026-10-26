// ============================================
// Embed Script API Integration Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/embed.js/route';

describe('api/embed.js (script)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns JavaScript content', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/javascript');
    expect(response.headers.get('Cache-Control')).toContain('max-age=31536000');
    expect(response.headers.get('Cache-Control')).toContain('immutable');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const text = await response.text();
    expect(text).toContain('nerdiction-embed');
    expect(text).toContain('EmbedWidget');
    expect(text).toContain('data-nerdiction-embed');
    expect(text).toContain('nerdiction.de/api/embed/');
  });

  it('includes CSS custom properties for theming', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('--nerdiction-primary');
    expect(text).toContain('--nerdiction-bg');
    expect(text).toContain('--nerdiction-text');
    expect(text).toContain('data-theme="dark"');
  });

  it('includes Shadow DOM initialization logic', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('attachShadow');
    expect(text).toContain('shadow.host');
    expect(text).toContain('data-nerdiction-embed');
  });

  it('includes all three widget types (review, collection, series)', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('renderReviewHTML');
    expect(text).toContain('renderCollectionHTML');
    expect(text).toContain('renderSeriesHTML');
  });

  it('includes error and skeleton rendering', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('renderError');
    expect(text).toContain('renderSkeleton');
    expect(text).toContain('nerdiction-embed__error');
    expect(text).toContain('nerdiction-embed__skeleton');
  });

  it('includes MutationObserver for dynamic embeds', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('MutationObserver');
    expect(text).toContain('observeMutations');
    expect(text).toContain('childList: true');
    expect(text).toContain('subtree: true');
  });

  it('includes theme attribute handling for auto/light/dark', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    // Theme is handled via data-theme attribute on host element
    // CSS :host([data-theme="dark"]) handles dark mode styling
    expect(text).toContain('data-theme');
    expect(text).toContain('host.setAttribute');
    expect(text).toContain("theme === 'auto'");
  });

  it('includes reduced motion support', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('prefers-reduced-motion');
    expect(text).toContain('data-reduced-motion');
  });

  it('includes XSS protection via escapeHtml', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('escapeHtml');
    expect(text).toContain('document.createElement');
    expect(text).toContain('textContent');
  });

  it('includes compact mode support', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('data-compact');
    expect(text).toContain('compact ? 2 : 3');
    expect(text).toContain('compact ? 3 : 5');
  });

  it('exposes NerdictionEmbed globally for debugging', async () => {
    const req = new NextRequest('http://localhost/embed.js');
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('window.NerdictionEmbed');
  });
});