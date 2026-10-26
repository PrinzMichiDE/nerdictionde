// ============================================
// Embed Widget Components (Shadow DOM Inner)
// ============================================

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { EmbedReviewData, EmbedCollectionData, EmbedSeriesData, EmbedWidgetProps, EmbedTheme } from '@/types/embed';

// ============================================
// Theme & Styles
// ============================================

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

.nerdiction-embed {
  display: flex;
  flex-direction: column;
}

.nerdiction-embed__cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: var(--nerdiction-surface);
}

.nerdiction-embed__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nerdiction-embed__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nerdiction-embed__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  color: var(--nerdiction-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nerdiction-embed__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--nerdiction-text-muted);
}

.nerdiction-embed__score {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 12px;
  background: var(--nerdiction-primary);
  color: white;
}

.nerdiction-embed__category {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: var(--nerdiction-surface);
  color: var(--nerdiction-text-muted);
  border: 1px solid var(--nerdiction-border);
}

.nerdiction-embed__excerpt {
  font-size: 14px;
  line-height: 1.5;
  color: var(--nerdiction-text-muted);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nerdiction-embed__pros-cons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--nerdiction-border);
}

.nerdiction-embed__pros,
.nerdiction-embed__cons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nerdiction-embed__pro,
.nerdiction-embed__con {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
}

.nerdiction-embed__pro-icon {
  color: #22c55e;
  flex-shrink: 0;
  margin-top: 2px;
}

.nerdiction-embed__con-icon {
  color: #ef4444;
  flex-shrink: 0;
  margin-top: 2px;
}

.nerdiction-embed__footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--nerdiction-border);
}

.nerdiction-embed__author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--nerdiction-text-muted);
}

.nerdiction-embed__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--nerdiction-surface);
}

.nerdiction-embed__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  color: var(--nerdiction-primary);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid var(--nerdiction-primary);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.nerdiction-embed__link:hover {
  background: var(--nerdiction-primary);
  color: white;
}

.nerdiction-embed__external-icon {
  width: 14px;
  height: 14px;
}

.nerdiction-embed__items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nerdiction-embed__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  background: var(--nerdiction-surface);
  border: 1px solid var(--nerdiction-border);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s;
}

.nerdiction-embed__item:hover {
  border-color: var(--nerdiction-primary);
}

.nerdiction-embed__item-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--nerdiction-border);
  flex-shrink: 0;
}

.nerdiction-embed__item-content {
  flex: 1;
  min-width: 0;
}

.nerdiction-embed__item-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--nerdiction-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 4px;
}

.nerdiction-embed__item-score {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--nerdiction-accent);
}

.nerdiction-embed__parts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nerdiction-embed__part {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  background: var(--nerdiction-surface);
  border: 1px solid var(--nerdiction-border);
}

.nerdiction-embed__part-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--nerdiction-primary);
  color: white;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.nerdiction-embed__part-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--nerdiction-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 4px;
}

.nerdiction-embed__part-score {
  font-size: 12px;
  font-weight: 600;
  color: var(--nerdiction-accent);
}

.nerdiction-embed__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.nerdiction-embed__skeleton-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--nerdiction-radius) var(--nerdiction-radius) 0 0;
  background: linear-gradient(90deg, var(--nerdiction-surface) 25%, var(--nerdiction-border) 50%, var(--nerdiction-surface) 75%);
  background-size: 200% 100%;
  animation: nerdiction-shimmer 1.5s infinite;
}

.nerdiction-embed__skeleton-title {
  height: 24px;
  width: 70%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--nerdiction-surface) 25%, var(--nerdiction-border) 50%, var(--nerdiction-surface) 75%);
  background-size: 200% 100%;
  animation: nerdiction-shimmer 1.5s infinite;
}

.nerdiction-embed__skeleton-meta {
  height: 16px;
  width: 40%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--nerdiction-surface) 25%, var(--nerdiction-border) 50%, var(--nerdiction-surface) 75%);
  background-size: 200% 100%;
  animation: nerdiction-shimmer 1.5s infinite;
}

.nerdiction-embed__skeleton-text {
  height: 16px;
  width: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--nerdiction-surface) 25%, var(--nerdiction-border) 50%, var(--nerdiction-surface) 75%);
  background-size: 200% 100%;
  animation: nerdiction-shimmer 1.5s infinite;
}

.nerdiction-embed__skeleton-text.short {
  width: 60%;
}

@keyframes nerdiction-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.nerdiction-embed__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  gap: 12px;
  color: var(--nerdiction-text-muted);
}

.nerdiction-embed__error-icon {
  width: 48px;
  height: 48px;
  color: var(--nerdiction-error);
  opacity: 0.7;
}

.nerdiction-embed__error-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--nerdiction-text);
  margin: 0;
}

.nerdiction-embed__error-message {
  font-size: 13px;
  margin: 0;
}

.nerdiction-embed__error-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  color: var(--nerdiction-primary);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid var(--nerdiction-primary);
  text-decoration: none;
}

:host([data-reduced-motion="true"]) .nerdiction-embed__skeleton-cover,
:host([data-reduced-motion="true"]) .nerdiction-embed__skeleton-title,
:host([data-reduced-motion="true"]) .nerdiction-embed__skeleton-meta,
:host([data-reduced-motion="true"]) .nerdiction-embed__skeleton-text {
  animation: none;
}
`;

// ============================================
// Utility: Inject Styles into Shadow DOM
// ============================================

function injectStyles(shadowRoot: ShadowRoot, theme: EmbedTheme, compact: boolean) {
  const style = document.createElement('style');
  style.textContent = EMBED_CSS;
  shadowRoot.appendChild(style);

  // Set theme attribute on host
  const host = shadowRoot.host as HTMLElement;
  host.setAttribute('data-theme', theme);
  if (compact) host.setAttribute('data-compact', 'true');

  // Respect reduced motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) {
    host.setAttribute('data-reduced-motion', 'true');
  }
}

// ============================================
// Review Widget
// ============================================

interface ReviewWidgetInnerProps {
  data: EmbedReviewData;
  compact: boolean;
}

function ReviewWidgetInner({ data, compact }: ReviewWidgetInnerProps) {
  return (
    <article className="nerdiction-embed" data-type="review">
      {data.coverImage && (
        <img
          className="nerdiction-embed__cover"
          src={data.coverImage}
          alt={data.coverAlt || data.title}
          loading="lazy"
        />
      )}
      <div className="nerdiction-embed__content">
        <header className="nerdiction-embed__header">
          <h1 className="nerdiction-embed__title">{data.title}</h1>
          <div className="nerdiction-embed__meta">
            <span className="nerdiction-embed__score">{data.score.toFixed(1)}</span>
            <span className="nerdiction-embed__category">{data.categoryLabel}</span>
          </div>
        </header>
        {data.excerpt && (
          <p className="nerdiction-embed__excerpt">{data.excerpt}</p>
        )}
        {(data.pros.length > 0 || data.cons.length > 0) && (
          <div className="nerdiction-embed__pros-cons">
            {data.pros.length > 0 && (
              <div className="nerdiction-embed__pros">
                {data.pros.slice(0, compact ? 2 : 3).map((pro, i) => (
                  <div key={i} className="nerdiction-embed__pro">
                    <svg className="nerdiction-embed__pro-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
            )}
            {data.cons.length > 0 && (
              <div className="nerdiction-embed__cons">
                {data.cons.slice(0, compact ? 2 : 3).map((con, i) => (
                  <div key={i} className="nerdiction-embed__con">
                    <svg className="nerdiction-embed__con-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <footer className="nerdiction-embed__footer">
          <div className="nerdiction-embed__author">
            {data.author?.avatar && (
              <img className="nerdiction-embed__avatar" src={data.author.avatar} alt="" aria-hidden="true" />
            )}
            <span>
              Von <strong>{data.author?.displayName || data.author?.username || 'Nerdiction'}</strong>
              {data.publishedAt && ` · ${new Date(data.publishedAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' })}`}
            </span>
          </div>
          <a
            className="nerdiction-embed__link"
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Auf nerdiction.de lesen
            <svg className="nerdiction-embed__external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </footer>
      </div>
    </article>
  );
}

export function ReviewEmbedWidget({ data, theme, compact }: { data: EmbedReviewData; theme: EmbedTheme; compact: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;
    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'nerdiction-embed-root';
    shadow.appendChild(container);

    injectStyles(shadow, theme, compact);

    const root = createRoot(container);
    root.render(<ReviewWidgetInner data={data} compact={compact} />);
    setMounted(true);

    return () => {
      root.unmount();
      shadow.innerHTML = '';
    };
  }, [data, theme, compact]);

  return <div ref={hostRef} className="nerdiction-embed-host" />;
}

// ============================================
// Collection Widget
// ============================================

interface CollectionWidgetInnerProps {
  data: EmbedCollectionData;
  compact: boolean;
}

function CollectionWidgetInner({ data, compact }: CollectionWidgetInnerProps) {
  return (
    <article className="nerdiction-embed" data-type="collection">
      {data.coverImage && (
        <img
          className="nerdiction-embed__cover"
          src={data.coverImage}
          alt={data.title}
          loading="lazy"
        />
      )}
      <div className="nerdiction-embed__content">
        <header className="nerdiction-embed__header">
          <h1 className="nerdiction-embed__title">{data.title}</h1>
          <div className="nerdiction-embed__meta">
            <span className="nerdiction-embed__category">{data.itemCount} Einträge</span>
          </div>
        </header>
        {data.description && (
          <p className="nerdiction-embed__excerpt">{data.description}</p>
        )}
        {data.items.length > 0 && (
          <div className="nerdiction-embed__items">
            {data.items.slice(0, compact ? 3 : 5).map((item) => (
              <a
                key={item.position}
                className="nerdiction-embed__item"
                href={`https://nerdiction.de/reviews/${item.review.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.review.coverImage && (
                  <img
                    className="nerdiction-embed__item-image"
                    src={item.review.coverImage}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                )}
                <div className="nerdiction-embed__item-content">
                  <h3 className="nerdiction-embed__item-title">
                    #{item.position} {item.review.title}
                  </h3>
                  <span className="nerdiction-embed__item-score">{item.review.score.toFixed(1)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
        <footer className="nerdiction-embed__footer">
          <div className="nerdiction-embed__author">
            {data.owner.avatar && (
              <img className="nerdiction-embed__avatar" src={data.owner.avatar} alt="" aria-hidden="true" />
            )}
            <span>
              Kuratiert von <strong>{data.owner.displayName || data.owner.username}</strong>
            </span>
          </div>
          <a
            className="nerdiction-embed__link"
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Liste ansehen
            <svg className="nerdiction-embed__external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </footer>
      </div>
    </article>
  );
}

export function CollectionEmbedWidget({ data, theme, compact }: { data: EmbedCollectionData; theme: EmbedTheme; compact: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;
    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'nerdiction-embed-root';
    shadow.appendChild(container);

    injectStyles(shadow, theme, compact);

    const root = createRoot(container);
    root.render(<CollectionWidgetInner data={data} compact={compact} />);
    setMounted(true);

    return () => {
      root.unmount();
      shadow.innerHTML = '';
    };
  }, [data, theme, compact]);

  return <div ref={hostRef} className="nerdiction-embed-host" />;
}

// ============================================
// Series Widget
// ============================================

interface SeriesWidgetInnerProps {
  data: EmbedSeriesData;
  compact: boolean;
}

function SeriesWidgetInner({ data, compact }: SeriesWidgetInnerProps) {
  return (
    <article className="nerdiction-embed" data-type="series">
      {data.coverImage && (
        <img
          className="nerdiction-embed__cover"
          src={data.coverImage}
          alt={data.title}
          loading="lazy"
        />
      )}
      <div className="nerdiction-embed__content">
        <header className="nerdiction-embed__header">
          <h1 className="nerdiction-embed__title">{data.title}</h1>
          <div className="nerdiction-embed__meta">
            <span className="nerdiction-embed__category">{data.partCount} Teile</span>
          </div>
        </header>
        {data.description && (
          <p className="nerdiction-embed__excerpt">{data.description}</p>
        )}
        {data.parts.length > 0 && (
          <div className="nerdiction-embed__parts">
            {data.parts.slice(0, compact ? 3 : 5).map((part) => (
              <div key={part.order} className="nerdiction-embed__part">
                <span className="nerdiction-embed__part-number">{part.order}</span>
                <div className="nerdiction-embed__part-content">
                  <h3 className="nerdiction-embed__part-title">{part.review.title}</h3>
                  <span className="nerdiction-embed__part-score">{part.review.score.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <footer className="nerdiction-embed__footer">
          <div className="nerdiction-embed__author">
            {data.owner.avatar && (
              <img className="nerdiction-embed__avatar" src={data.owner.avatar} alt="" aria-hidden="true" />
            )}
            <span>
              {data.owner.username ? `Von <strong>${data.owner.displayName || data.owner.username}</strong>` : 'Redaktionelle Serie'}
            </span>
          </div>
          <a
            className="nerdiction-embed__link"
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Serie ansehen
            <svg className="nerdiction-embed__external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </footer>
      </div>
    </article>
  );
}

export function SeriesEmbedWidget({ data, theme, compact }: { data: EmbedSeriesData; theme: EmbedTheme; compact: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;
    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'nerdiction-embed-root';
    shadow.appendChild(container);

    injectStyles(shadow, theme, compact);

    const root = createRoot(container);
    root.render(<SeriesWidgetInner data={data} compact={compact} />);
    setMounted(true);

    return () => {
      root.unmount();
      shadow.innerHTML = '';
    };
  }, [data, theme, compact]);

  return <div ref={hostRef} className="nerdiction-embed-host" />;
}

// ============================================
// Skeleton Widget
// ============================================

export function EmbedSkeleton({ theme, compact }: { theme: EmbedTheme; compact: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'nerdiction-embed-root';
    shadow.appendChild(container);

    injectStyles(shadow, theme, compact);

    const root = createRoot(container);
    root.render(
      <div className="nerdiction-embed__skeleton">
        <div className="nerdiction-embed__skeleton-cover" />
        <div className="nerdiction-embed__skeleton-title" />
        <div className="nerdiction-embed__skeleton-meta" />
        <div className="nerdiction-embed__skeleton-text" />
        <div className="nerdiction-embed__skeleton-text short" />
      </div>
    );

    return () => {
      root.unmount();
      shadow.innerHTML = '';
    };
  }, [theme, compact]);

  return <div ref={hostRef} className="nerdiction-embed-host" />;
}

// ============================================
// Error Widget
// ============================================

interface EmbedErrorProps {
  message: string;
  url?: string;
  theme: EmbedTheme;
  compact: boolean;
}

export function EmbedError({ message, url, theme, compact }: EmbedErrorProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'nerdiction-embed-root';
    shadow.appendChild(container);

    injectStyles(shadow, theme, compact);

    const root = createRoot(container);
    root.render(
      <div className="nerdiction-embed__error">
        <svg className="nerdiction-embed__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2 className="nerdiction-embed__error-title">Inhalt nicht verfügbar</h2>
        <p className="nerdiction-embed__error-message">{message}</p>
        {url && (
          <a className="nerdiction-embed__error-link" href={url} target="_blank" rel="noopener noreferrer">
            Auf nerdiction.de ansehen
            <svg className="nerdiction-embed__external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        )}
      </div>
    );

    return () => {
      root.unmount();
      shadow.innerHTML = '';
    };
  }, [message, url, theme, compact]);

  return <div ref={hostRef} className="nerdiction-embed-host" />;
}