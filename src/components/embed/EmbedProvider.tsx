// ============================================
// Embed Provider (Script Entry Point for /embed.js)
// ============================================

'use client';

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReviewEmbedWidget, CollectionEmbedWidget, SeriesEmbedWidget, EmbedSkeleton, EmbedError } from './EmbedWidgets';
import type { EmbedWidgetProps } from '@/types/embed';

interface EmbedElement extends HTMLElement {
  dataset: {
    nerdictionEmbed: 'review' | 'collection' | 'series';
    slug: string;
    theme?: 'auto' | 'light' | 'dark';
    consent?: string;
    compact?: string;
  };
}

function getTheme(themeAttr?: string): 'auto' | 'light' | 'dark' {
  if (!themeAttr) return 'auto';
  if (['auto', 'light', 'dark'].includes(themeAttr)) return themeAttr as 'auto' | 'light' | 'dark';
  return 'auto';
}

function renderWidget(element: EmbedElement) {
  const { nerdictionEmbed: type, slug, theme, consent, compact } = element.dataset;
  const widgetTheme = getTheme(theme);
  const isCompact = compact === 'true';
  const hasConsent = consent !== 'false';

  // Show skeleton initially
  const shadow = element.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  container.id = 'nerdiction-embed-root';
  shadow.appendChild(container);

  const EMBED_CSS = `
:host {
  --nerdiction-primary: #3b82f6;
  --nerdiction-primary-hover: #2563eb;
  --nerdiction-bg: #ffffff;
  --nerdiction-surface: #f8fafc;
  --nerdiction-border: #e2e8f0;
  --nerdiction-text: #1e293b;
  --nerdiction-text-muted: #64748b;
  --nerdiction-accent: #f59e0b;
  --nerdiction-error: #ef4444;
  --nerdiction-radius: 12px;
  --nerdiction-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --nerdiction-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-family: var(--nerdiction-font);
  font-size: 14px;
  line-height: 1.5;
  color: var(--nerdiction-text);
  background: var(--nerdiction-bg);
  border: 1px solid var(--nerdiction-border);
  border-radius: var(--nerdiction-radius);
  box-shadow: var(--nerdiction-shadow);
  overflow: hidden;
  max-width: 600px;
  width: 100%;
  box-sizing: border-box;
}

:host([data-compact="true"]) {
  max-width: 100%;
}

:host([data-theme="dark"]) {
  --nerdiction-bg: #0f172a;
  --nerdiction-surface: #1e293b;
  --nerdiction-border: #334155;
  --nerdiction-text: #f1f5f9;
  --nerdiction-text-muted: #94a3b8;
  --nerdiction-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2);
}

.nerdiction-embed { display: flex; flex-direction: column; }
.nerdiction-embed__cover { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: var(--nerdiction-surface); }
.nerdiction-embed__content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.nerdiction-embed__header { display: flex; flex-direction: column; gap: 8px; }
.nerdiction-embed__title { font-size: 18px; font-weight: 700; line-height: 1.3; margin: 0; color: var(--nerdiction-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.nerdiction-embed__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; color: var(--nerdiction-text-muted); }
.nerdiction-embed__score { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 12px; background: var(--nerdiction-primary); color: white; }
.nerdiction-embed__category { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: var(--nerdiction-surface); color: var(--nerdiction-text-muted); border: 1px solid var(--nerdiction-border); }
.nerdiction-embed__excerpt { font-size: 14px; line-height: 1.5; color: var(--nerdiction-text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.nerdiction-embed__pros-cons { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; border-top: 1px solid var(--nerdiction-border); }
.nerdiction-embed__pros, .nerdiction-embed__cons { display: flex; flex-direction: column; gap: 4px; }
.nerdiction-embed__pro, .nerdiction-embed__con { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; line-height: 1.4; }
.nerdiction-embed__pro-icon { color: #22c55e; flex-shrink: 0; margin-top: 2px; }
.nerdiction-embed__con-icon { color: #ef4444; flex-shrink: 0; margin-top: 2px; }
.nerdiction-embed__footer { display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid var(--nerdiction-border); }
.nerdiction-embed__author { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--nerdiction-text-muted); }
.nerdiction-embed__avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; background: var(--nerdiction-surface); }
.nerdiction-embed__link { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; color: var(--nerdiction-primary); background: rgba(59, 130, 246, 0.1); border: 1px solid var(--nerdiction-primary); text-decoration: none; transition: background 0.2s, color 0.2s; }
.nerdiction-embed__link:hover { background: var(--nerdiction-primary); color: white; }
.nerdiction-embed__external-icon { width: 14px; height: 14px; }
.nerdiction-embed__items { display: flex; flex-direction: column; gap: 8px; }
.nerdiction-embed__item { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 8px; background: var(--nerdiction-surface); border: 1px solid var(--nerdiction-border); text-decoration: none; color: inherit; transition: border-color 0.2s; }
.nerdiction-embed__item:hover { border-color: var(--nerdiction-primary); }
.nerdiction-embed__item-image { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; background: var(--nerdiction-border); flex-shrink: 0; }
.nerdiction-embed__item-content { flex: 1; min-width: 0; }
.nerdiction-embed__item-title { font-size: 13px; font-weight: 600; line-height: 1.3; color: var(--nerdiction-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0 0 4px; }
.nerdiction-embed__item-score { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--nerdiction-accent); }
.nerdiction-embed__parts { display: flex; flex-direction: column; gap: 8px; }
.nerdiction-embed__part { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 8px; background: var(--nerdiction-surface); border: 1px solid var(--nerdiction-border); }
.nerdiction-embed__part-number { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: var(--nerdiction-primary); color: white; font-weight: 700; font-size: 12px; flex-shrink: 0; }
.nerdiction-embed__part-title { font-size: 13px; font-weight: 600; line-height: 1.3; color: var(--nerdiction-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0 0 4px; }
.nerdiction-embed__part-score { font-size: 12px; font-weight: 600; color: var(--nerdiction-accent); }
.nerdiction-embed__skeleton { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.nerdiction-embed__skeleton-cover { width: 100%; aspect-ratio: 16 / 9; border-radius: var(--nerdiction-radius) var(--nerdiction-radius) 0 0; background: linear-gradient(90deg, var(--nerdiction-surface) 25%, var(--nerdiction-border) 50%, var(--nerdiction-surface) 75%); background-size: 200% 100%; animation: nerdiction-shimmer 1.5s infinite; }
.nerdiction-embed__skeleton-title { height: 24px; width: 70%; border-radius: 4px; background: linear-gradient(90deg, var(--nerdiction-surface) 25%, var(--nerdiction-border) 50%, var(--nerdiction-surface) 75%); background-size: 200% 100%; animation: nerdiction-shimmer 1.5s infinite; }
.nerdiction-embed__skeleton-meta { height: 16px; width: 40%; border-radius: 4px; background: linear-gradient(90deg, var(--nerdiction-surface) 25%, var(--nerdiction-border) 50%, var(--nerdiction-surface) 75%); background-size: 200% 100%; animation: nerdiction-shimmer 1.5s infinite; }
.nerdiction-embed__skeleton-text { height: 16px; width: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--nerdiction-surface) 25%, var(--nerdiction-border) 50%, var(--nerdiction-surface) 75%); background-size: 200% 100%; animation: nerdiction-shimmer 1.5s infinite; }
.nerdiction-embed__skeleton-text.short { width: 60%; }
@keyframes nerdiction-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.nerdiction-embed__error { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; text-align: center; gap: 12px; color: var(--nerdiction-text-muted); }
.nerdiction-embed__error-icon { width: 48px; height: 48px; color: var(--nerdiction-error); opacity: 0.7; }
.nerdiction-embed__error-title { font-size: 16px; font-weight: 600; color: var(--nerdiction-text); margin: 0; }
.nerdiction-embed__error-message { font-size: 13px; margin: 0; }
.nerdiction-embed__error-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; color: var(--nerdiction-primary); background: rgba(59, 130, 246, 0.1); border: 1px solid var(--nerdiction-primary); text-decoration: none; }
:host([data-reduced-motion="true"]) .nerdiction-embed__skeleton-cover,
:host([data-reduced-motion="true"]) .nerdiction-embed__skeleton-title,
:host([data-reduced-motion="true"]) .nerdiction-embed__skeleton-meta,
:host([data-reduced-motion="true"]) .nerdiction-embed__skeleton-text { animation: none; }
`;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = EMBED_CSS;
  shadow.appendChild(style);

  // Set theme attribute on host
  const host = shadow.host as HTMLElement;
  host.setAttribute('data-theme', widgetTheme);
  if (isCompact) host.setAttribute('data-compact', 'true');

  // Respect reduced motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) {
    host.setAttribute('data-reduced-motion', 'true');
  }

  // Listen for theme changes if auto
  if (widgetTheme === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      host.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
    };
    mq.addEventListener?.('change', handleChange);
    // Cleanup function would be needed in real implementation
  }
}

class EmbedWidget {
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.processEmbeds());
    } else {
      this.processEmbeds();
    }

    // Also watch for dynamically added embeds
    this.observeMutations();
  }

  private processEmbeds() {
    const elements = document.querySelectorAll('[data-nerdiction-embed]') as NodeListOf<HTMLElement>;
    elements.forEach((element) => {
      if (!(element as any)._nerdictionInitialized) {
        (element as any)._nerdictionInitialized = true;
        this.renderEmbed(element);
      }
    });
  }

  private renderEmbed(element: HTMLElement) {
    const type = element.dataset.nerdictionEmbed;
    const slug = element.dataset.slug;
    const theme = (element.dataset.theme as 'auto' | 'light' | 'dark') || 'auto';
    const compact = element.dataset.compact === 'true';

    if (!type || !slug) return;

    // Show skeleton
    const shadow = element.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'nerdiction-embed-root';
    shadow.appendChild(container);

    // Inject base styles
    const style = document.createElement('style');
    style.textContent = this.getBaseStyles();
    shadow.appendChild(style);

    // Set theme attributes
    const host = shadow.host as HTMLElement;
    host.setAttribute('data-theme', theme);
    if (compact) host.setAttribute('data-compact', 'true');

    // Show skeleton
    this.renderSkeleton(shadow, theme, compact);

    // Fetch data
    this.fetchData(type, slug).then((data) => {
      if (!data) {
        this.renderError(shadow, theme, compact, 'Inhalt nicht gefunden', `https://nerdiction.de/${type}s/${slug}`);
        return;
      }

      // Render widget
      this.renderWidgetContent(shadow, type, data, theme, compact);
    }).catch(() => {
      this.renderError(shadow, theme, compact, 'Fehler beim Laden', `https://nerdiction.de/${type}s/${slug}`);
    });
  }

  private getBaseStyles(): string {
    return `/* Base styles injected here - see EmbedWidgets.tsx for full CSS */`;
  }

  private renderSkeleton(shadow: ShadowRoot, theme: string, compact: boolean) {
    const container = shadow.getElementById('nerdiction-embed-root');
    if (!container) return;

    container.innerHTML = `
      <div class="nerdiction-embed__skeleton">
        <div class="nerdiction-embed__skeleton-cover" />
        <div class="nerdiction-embed__skeleton-title" />
        <div class="nerdiction-embed__skeleton-meta" />
        <div class="nerdiction-embed__skeleton-text" />
        <div class="nerdiction-embed__skeleton-text short" />
      </div>
    `;
  }

  private async fetchData(type: string, slug: string) {
    try {
      const response = await fetch(`https://nerdiction.de/api/embed/${type}/${slug}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) return null;
      const json = await response.json();
      return json.data;
    } catch {
      return null;
    }
  }

  private renderWidgetContent(shadow: ShadowRoot, type: string, data: any, theme: string, compact: boolean) {
    const container = shadow.getElementById('nerdiction-embed-root');
    if (!container) return;

    // Use the React components from EmbedWidgets.tsx
    // For the script, we'll use a simplified vanilla JS rendering
    // In production, the React components would be bundled
    container.innerHTML = this.renderWidgetHTML(type, data, theme, compact);
  }

  private renderWidgetHTML(type: string, data: any, theme: string, compact: boolean): string {
    // Simplified HTML rendering for the script bundle
    // The actual React components are in EmbedWidgets.tsx
    switch (type) {
      case 'review':
        return this.renderReviewHTML(data, theme, compact);
      case 'collection':
        return this.renderCollectionHTML(data, theme, compact);
      case 'series':
        return this.renderSeriesHTML(data, theme, compact);
      default:
        return '';
    }
  }

  private renderReviewHTML(data: any, theme: string, compact: boolean): string {
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return `
      <article class="nerdiction-embed" data-type="review">
        ${data.coverImage ? `<img class="nerdiction-embed__cover" src="${data.coverImage}" alt="${this.escapeHtml(data.coverAlt || data.title)}" loading="lazy" />` : ''}
        <div class="nerdiction-embed__content">
          <header class="nerdiction-embed__header">
            <h1 class="nerdiction-embed__title">${this.escapeHtml(data.title)}</h1>
            <div class="nerdiction-embed__meta">
              <span class="nerdiction-embed__score">${data.score.toFixed(1)}</span>
              <span class="nerdiction-embed__category">${this.escapeHtml(data.categoryLabel)}</span>
            </div>
          </header>
          ${data.excerpt ? `<p class="nerdiction-embed__excerpt">${this.escapeHtml(data.excerpt)}</p>` : ''}
          ${data.pros.length > 0 || data.cons.length > 0 ? `
            <div class="nerdiction-embed__pros-cons">
              ${data.pros.slice(0, compact ? 2 : 3).map((pro: string) => `
                <div class="nerdiction-embed__pro">
                  <svg class="nerdiction-embed__pro-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>${this.escapeHtml(pro)}</span>
                </div>
              `).join('')}
              ${data.cons.slice(0, compact ? 2 : 3).map((con: string) => `
                <div class="nerdiction-embed__con">
                  <svg class="nerdiction-embed__con-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  <span>${this.escapeHtml(con)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <footer class="nerdiction-embed__footer">
            <div class="nerdiction-embed__author">
              ${data.author?.avatar ? `<img class="nerdiction-embed__avatar" src="${data.author.avatar}" alt="" aria-hidden="true" />` : ''}
              <span>Von <strong>${this.escapeHtml(data.author?.displayName || data.author?.username || 'Nerdiction')}</strong>${data.publishedAt ? ` · ${new Date(data.publishedAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' })}` : ''}</span>
            </div>
            <a class="nerdiction-embed__link" href="${data.url}" target="_blank" rel="noopener noreferrer">
              Auf nerdiction.de lesen
              <svg class="nerdiction-embed__external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </footer>
        </div>
      </article>
    `;
  }

  private renderCollectionHTML(data: any, theme: string, compact: boolean): string {
    return `
      <article class="nerdiction-embed" data-type="collection">
        ${data.coverImage ? `<img class="nerdiction-embed__cover" src="${data.coverImage}" alt="${this.escapeHtml(data.title)}" loading="lazy" />` : ''}
        <div class="nerdiction-embed__content">
          <header class="nerdiction-embed__header">
            <h1 class="nerdiction-embed__title">${this.escapeHtml(data.title)}</h1>
            <div class="nerdiction-embed__meta"><span class="nerdiction-embed__category">${data.itemCount} Einträge</span></div>
          </header>
          ${data.description ? `<p class="nerdiction-embed__excerpt">${this.escapeHtml(data.description)}</p>` : ''}
          ${data.items.length > 0 ? `
            <div class="nerdiction-embed__items">
              ${data.items.slice(0, compact ? 3 : 5).map((item: { position: number; review: { slug: string; title: string; score: number; coverImage: string | null } }) => `
                <a class="nerdiction-embed__item" href="https://nerdiction.de/reviews/${item.review.slug}" target="_blank" rel="noopener noreferrer">
                  ${item.review.coverImage ? `<img class="nerdiction-embed__item-image" src="${item.review.coverImage}" alt="" aria-hidden="true" loading="lazy" />` : ''}
                  <div class="nerdiction-embed__item-content">
                    <h3 class="nerdiction-embed__item-title">#${item.position} ${this.escapeHtml(item.review.title)}</h3>
                    <span class="nerdiction-embed__item-score">${item.review.score.toFixed(1)}</span>
                  </div>
                </a>
              `).join('')}
            </div>
          ` : ''}
          <footer class="nerdiction-embed__footer">
            <div class="nerdiction-embed__author">
              ${data.owner.avatar ? `<img class="nerdiction-embed__avatar" src="${data.owner.avatar}" alt="" aria-hidden="true" />` : ''}
              <span>Kuratiert von <strong>${this.escapeHtml(data.owner.displayName || data.owner.username)}</strong></span>
            </div>
            <a class="nerdiction-embed__link" href="${data.url}" target="_blank" rel="noopener noreferrer">
              Liste ansehen
              <svg class="nerdiction-embed__external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </footer>
        </div>
      </article>
    `;
  }

  private renderSeriesHTML(data: any, theme: string, compact: boolean): string {
    return `
      <article class="nerdiction-embed" data-type="series">
        ${data.coverImage ? `<img class="nerdiction-embed__cover" src="${data.coverImage}" alt="${this.escapeHtml(data.title)}" loading="lazy" />` : ''}
        <div class="nerdiction-embed__content">
          <header class="nerdiction-embed__header">
            <h1 class="nerdiction-embed__title">${this.escapeHtml(data.title)}</h1>
            <div class="nerdiction-embed__meta"><span class="nerdiction-embed__category">${data.partCount} Teile</span></div>
          </header>
          ${data.description ? `<p class="nerdiction-embed__excerpt">${this.escapeHtml(data.description)}</p>` : ''}
          ${data.parts.length > 0 ? `
            <div class="nerdiction-embed__parts">
              ${data.parts.slice(0, compact ? 3 : 5).map((part: { order: number; review: { title: string; score: number } }) => `
                <div class="nerdiction-embed__part">
                  <span class="nerdiction-embed__part-number">${part.order}</span>
                  <div class="nerdiction-embed__part-content">
                    <h3 class="nerdiction-embed__part-title">${this.escapeHtml(part.review.title)}</h3>
                    <span class="nerdiction-embed__part-score">${part.review.score.toFixed(1)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <footer class="nerdiction-embed__footer">
            <div class="nerdiction-embed__author">
              ${data.owner.avatar ? `<img class="nerdiction-embed__avatar" src="${data.owner.avatar}" alt="" aria-hidden="true" />` : ''}
              <span>${data.owner.username ? `Von <strong>${this.escapeHtml(data.owner.displayName || data.owner.username)}</strong>` : 'Redaktionelle Serie'}</span>
            </div>
            <a class="nerdiction-embed__link" href="${data.url}" target="_blank" rel="noopener noreferrer">
              Serie ansehen
              <svg class="nerdiction-embed__external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </footer>
        </div>
      </article>
    `;
  }

  private renderError(shadow: ShadowRoot, theme: string, compact: boolean, message: string, url: string) {
    const container = shadow.getElementById('nerdiction-embed-root');
    if (!container) return;
    container.innerHTML = `
      <div class="nerdiction-embed__error">
        <svg class="nerdiction-embed__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2 class="nerdiction-embed__error-title">Inhalt nicht verfügbar</h2>
        <p class="nerdiction-embed__error-message">${this.escapeHtml(message)}</p>
        <a class="nerdiction-embed__error-link" href="${url}" target="_blank" rel="noopener noreferrer">
          Auf nerdiction.de ansehen
          <svg class="nerdiction-embed__external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private observeMutations() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.matches('[data-nerdiction-embed]') && !(element as any)._nerdictionInitialized) {
              (element as any)._nerdictionInitialized = true;
              this.renderEmbed(element);
            }
            // Also check descendants
            const descendants = element.querySelectorAll('[data-nerdiction-embed]');
            descendants.forEach((descendant) => {
              if (!(descendant as any)._nerdictionInitialized) {
                (descendant as any)._nerdictionInitialized = true;
                this.renderEmbed(descendant as HTMLElement);
              }
            });
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// Auto-initialize
const embedWidget = new EmbedWidget();
embedWidget.init();

// Export for manual initialization
export { EmbedWidget };

// Make globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).NerdictionEmbed = embedWidget;
}