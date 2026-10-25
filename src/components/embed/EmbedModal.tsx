// ============================================
// Embed Modal Component (for Detail Pages)
// ============================================

'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink, Code2, Palette, Shield, Minimize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EmbedType, EmbedTheme } from '@/types/embed';

interface EmbedModalProps {
  type: EmbedType;
  slug: string;
  title: string;
  coverImage?: string | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nerdiction.de';

function generateEmbedCode(type: EmbedType, slug: string, options: { theme: EmbedTheme; consent: boolean; compact: boolean }) {
  const attrs = [
    `data-nerdiction-embed="${type}"`,
    `data-slug="${slug}"`,
    `data-theme="${options.theme}"`,
    !options.consent ? 'data-consent="false"' : '',
    options.compact ? 'data-compact="true"' : '',
  ].filter(Boolean).join(' ');

  return `<script async src="${BASE_URL}/embed.js"></script>\n<div ${attrs}></div>`;
}

export function EmbedModal({ type, slug, title, coverImage }: EmbedModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [theme, setTheme] = useState<EmbedTheme>('auto');
  const [consent, setConsent] = useState(true);
  const [compact, setCompact] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const embedCode = generateEmbedCode(type, slug, { theme, consent, compact });

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast({ title: 'Kopiert!', description: 'Embed-Code in Zwischenablage.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Fehler', description: 'Konnte nicht kopieren.', variant: 'destructive' });
    }
  }, [embedCode, toast]);

  const typeLabels: Record<EmbedType, string> = {
    review: 'Review',
    collection: 'Liste',
    series: 'Serie',
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Einbetten: ${title}`}>
          <Code2 className="mr-2 h-4 w-4" />
          Einbetten
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Einbetten: {title}</DialogTitle>
          <DialogDescription>
            Kopiere den Embed-Code, um diesen {typeLabels[type].toLowerCase()} auf deiner Website einzubetten.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">
              <span className="flex items-center justify-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Vorschau
              </span>
            </TabsTrigger>
            <TabsTrigger value="code">
              <span className="flex items-center justify-center gap-2">
                <Code2 className="h-4 w-4" />
                Code
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="focus-visible:outline-none">
            <div className="border rounded-lg p-4 min-h-[350px] bg-muted/30">
              <EmbedPreview
                type={type}
                slug={slug}
                theme={theme}
                consent={consent}
                compact={compact}
                coverImage={coverImage}
              />
            </div>
          </TabsContent>

          <TabsContent value="code" className="focus-visible:outline-none space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-4">
                <Label htmlFor="embed-theme" className="text-sm font-medium">
                  <Palette className="mr-1 h-4 w-4" /> Theme
                </Label>
                <div className="flex items-center gap-2" role="radiogroup" aria-label="Theme auswählen">
                  {(['auto', 'light', 'dark'] as EmbedTheme[]).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="embed-theme"
                        value={t}
                        checked={theme === t}
                        onChange={() => setTheme(t)}
                        className="sr-only peer"
                      />
                      <span className="px-3 py-1.5 rounded-md border transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary hover:bg-accent">
                        {t === 'auto' ? 'Auto' : t === 'light' ? 'Hell' : 'Dunkel'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="peer-checked:text-primary">
                    <Shield className="mr-1 h-4 w-4" /> Analytics deaktivieren
                  </span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={compact}
                    onChange={(e) => setCompact(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="peer-checked:text-primary">
                    <Minimize2 className="mr-1 h-4 w-4" /> Kompakt-Modus
                  </span>
                </Label>
              </div>
            </div>

            <pre className="p-4 overflow-x-auto bg-muted/50 rounded-lg border"><code className="text-sm">{embedCode}</code></pre>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={copied}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Kopieren
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// EmbedPreview Component for Modal
function EmbedPreview({
  type,
  slug,
  theme,
  consent,
  compact,
  coverImage,
}: {
  type: EmbedType;
  slug: string;
  theme: EmbedTheme;
  consent: boolean;
  compact: boolean;
  coverImage?: string | null;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetch(`/api/embed/${type}/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (mounted) {
          setData(d.data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [type, slug]);

  if (loading) {
    return (
      <div className="nerdiction-embed__skeleton" style={{ padding: 0 }}>
        <div className="nerdiction-embed__skeleton-cover" style={{ borderRadius: '12px 12px 0 0', margin: '-4px -4px 12px' }} />
        <div className="nerdiction-embed__skeleton-title" />
        <div className="nerdiction-embed__skeleton-meta" />
        <div className="nerdiction-embed__skeleton-text" />
        <div className="nerdiction-embed__skeleton-text short" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="nerdiction-embed__error" style={{ padding: '24px 16px' }}>
        <svg className="nerdiction-embed__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3 className="nerdiction-embed__error-title">Vorschau nicht verfügbar</h3>
        <p className="nerdiction-embed__error-message">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const isDark = theme === 'dark' || (theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isCompact = compact;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '600px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '14px',
    lineHeight: 1.5,
    color: isDark ? '#f1f5f9' : '#1e293b',
    background: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: '12px',
    boxShadow: isDark ? '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2)' : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  if (isCompact) {
    containerStyle.maxWidth = '100%';
  }

  return (
    <div style={containerStyle} data-theme={theme} data-compact={compact ? 'true' : 'false'}>
      {data.coverImage && (
        <img
          src={data.coverImage}
          alt={data.coverAlt || data.title}
          style={{
            width: '100%',
            aspectRatio: '16/9',
            objectFit: 'cover',
            background: isDark ? '#1e293b' : '#f8fafc',
          }}
        />
      )}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.3, margin: 0, color: isDark ? '#f1f5f9' : '#1e293b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {data.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600, fontSize: '12px', background: '#3b82f6', color: 'white' }}>
              {data.score?.toFixed(1) ?? data.score?.toFixed(1)}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 500, background: isDark ? '#1e293b' : '#f8fafc', color: isDark ? '#94a3b8' : '#64748b', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
              {data.categoryLabel ?? data.type === 'collection' ? `${data.itemCount} Einträge` : data.type === 'series' ? `${data.partCount} Teile` : ''}
            </span>
          </div>
        </div>
        {data.excerpt && (
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: isDark ? '#94a3b8' : '#64748b', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {data.excerpt}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
            {data.owner?.avatar && (
              <img src={data.owner.avatar} alt="" aria-hidden="true" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', background: isDark ? '#1e293b' : '#f8fafc' }} />
            )}
            <span>
              {data.type === 'collection' ? 'Kuratiert von ' : 'Von '}
              <strong>{data.owner?.displayName || data.owner?.username || data.author?.displayName || data.author?.username || 'Nerdiction'}</strong>
            </span>
          </div>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              color: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid #3b82f6',
              textDecoration: 'none',
            }}
          >
            {data.type === 'collection' ? 'Liste ansehen' : data.type === 'series' ? 'Serie ansehen' : 'Auf nerdiction.de lesen'}
            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}