/**
 * Hardware Compatibility Badge Component
 * Displays compatibility status and FPS estimates on hardware review detail pages
 */

'use client';

import { useState } from 'react';
import { CompatibilityResult, CompatibilityStatus, FpsEstimate } from '@/types/hardware';
import { getBadgeColorClass, getBadgeIcon } from '@/lib/hardware-compatibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { ExternalLink, Info, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HardwareCompatibilityBadgeProps {
  data: CompatibilityResult | null;
  isLoading?: boolean;
  reviewSlug?: string;
}

const statusLabels: Record<CompatibilityStatus, string> = {
  COMPATIBLE: 'Kompatibel',
  BOTTLENECK_WARNING: 'Flaschenhals m\u00f6glich',
  INCOMPATIBLE: 'Nicht kompatibel',
  NO_DATA: 'Keine Daten',
  PROFILE_INCOMPLETE: 'Profil unvollst\u00e4ndig',
  NOT_HARDWARE_REVIEW: 'Kein Hardware-Review',
};

const statusDescriptions: Record<CompatibilityStatus, string> = {
  COMPATIBLE: 'Deine Hardware erf\u00fcllt die Anforderungen dieses Reviews.',
  BOTTLENECK_WARNING: 'Ein Komponenten-Flaschenhals k\u00f6nnte die Leistung limitieren.',
  INCOMPATIBLE: 'Deine Hardware entspricht nicht den Mindestanforderungen.',
  NO_DATA: 'Dieser Review hat keine Mindestanforderungen hinterlegt.',
  PROFILE_INCOMPLETE: 'Vervollst\u00e4ndige dein Hardware-Profil in den Einstellungen.',
  NOT_HARDWARE_REVIEW: 'Kompatibilit\u00e4ts-Checks sind nur f\u00fcr Hardware-Reviews verf\u00fcgbar.',
};

export function HardwareCompatibilityBadge({ data, isLoading, reviewSlug }: HardwareCompatibilityBadgeProps) {
  const [showFpsDetails, setShowFpsDetails] = useState(false);

  if (isLoading) {
    return (
      <HardwareCompatibilitySkeleton />
    );
  }

  if (!data) {
    return null;
  }

  const { status, badgeLabel, badgeDetails, fpsEstimates, limitingComponent, recommendation } = data;

  // Don't show badge for non-hardware reviews
  if (status === 'NOT_HARDWARE_REVIEW') {
    return null;
  }

  const badgeColor = getBadgeColorClass(status);
  const badgeIcon = getBadgeIcon(status);

  return (
    <TooltipProvider>
      <div className="w-full">
        {/* Main Badge */}
        <div className={cn('flex items-center gap-3 p-4 rounded-xl border transition-all', badgeColor)}>
          <span className="text-2xl" aria-hidden="true">{badgeIcon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{badgeLabel}</div>
            <div className="text-sm text-muted-foreground truncate">{badgeDetails}</div>
          </div>
          
          {/* Tooltip with full details */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" aria-label="Details anzeigen">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">{statusLabels[status]}</p>
                <p className="text-sm text-muted-foreground">{statusDescriptions[status]}</p>
                {badgeDetails !== statusDescriptions[status] && (
                  <p className="text-sm">{badgeDetails}</p>
                )}
                {limitingComponent && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Limitierende Komponente: {limitingComponent.toUpperCase()}
                  </p>
                )}
                {recommendation && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {recommendation}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* FPS Toggle Button */}
          {fpsEstimates.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFpsDetails(!showFpsDetails)}
              className="gap-1 whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              FPS-Sch\u00e4tzungen {showFpsDetails ? 'ausblenden' : 'anzeigen'}
            </Button>
          )}

          {/* Profile CTA for incomplete profile */}
          {status === 'PROFILE_INCOMPLETE' && reviewSlug && (
            <Link href="/einstellungen/hardware" className="ml-auto">
              <Button size="sm" variant="default">
                Profil vervollst\u00e4ndigen
              </Button>
            </Link>
          )}
        </div>

        {/* FPS Estimates Expandable Section */}
        {showFpsDetails && fpsEstimates.length > 0 && (
          <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-amber-800 dark:text-amber-200">
                    Gesch\u00e4tzte FPS (basierend auf Review-Benchmarks \u00d7 dein Profil)
                  </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">
                  \u26a0\ufe0f Sch\u00e4tzung! Reale Werte h\u00e4ngen von Spiel, Settings, Treibern, K\u00fhlung und weiteren Faktoren ab.
                  CPU-Flaschenhals-Faktor und RAM-Geschwindigkeit wurden ber\u00fccksichtigt.
                </p>
                <ScrollArea className="rounded-border -mx-4 px-4">
                  <table className="w-full text-sm" role="table">
                    <thead>
                      <tr className="border-b border-amber-300 dark:border-amber-800">
                        <th className="text-left py-2 px-3 font-medium">Aufl\u00f6sung</th>
                        <th className="text-left py-2 px-3 font-medium">Preset</th>
                        <th className="text-right py-2 px-3 font-medium">Min FPS</th>
                        <th className="text-right py-2 px-3 font-medium">Avg FPS</th>
                        <th className="text-right py-2 px-3 font-medium">Max FPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fpsEstimates.map((est: FpsEstimate, idx: number) => (
                        <tr key={`${est.resolution}-${est.preset}-${idx}`} className={idx % 2 === 0 ? 'bg-amber-100/50 dark:bg-amber-900/20' : ''}>
                          <td className="py-2 px-3 font-mono">{est.resolution}</td>
                          <td className="py-2 px-3">{est.preset}</td>
                          <td className="py-2 px-3 text-right font-mono text-red-600 dark:text-red-400">{est.min}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium">{est.avg}</td>
                          <td className="py-2 px-3 text-right font-mono text-green-600 dark:text-green-400">{est.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Skeleton Loader for Hardware Compatibility Badge
 */
export function HardwareCompatibilitySkeleton() {
  return (
    <div className="w-full animate-pulse space-y-3">
      <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted">
        <div className="h-8 w-8 rounded-full bg-muted-foreground/20" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-1/4 bg-muted-foreground/20 rounded" />
          <div className="h-3 w-1/2 bg-muted-foreground/20 rounded" />
        </div>
        <div className="h-8 w-20 bg-muted-foreground/20 rounded" />
      </div>
      <div className="h-40 bg-muted rounded-xl border" />
    </div>
  );
}

/**
 * Compact Badge for Review Cards / Lists
 */
export function HardwareCompatibilityCompactBadge({ data }: { data: CompatibilityResult | null }) {
  if (!data || data.status === 'NOT_HARDWARE_REVIEW') return null;

  const badgeColor = getBadgeColorClass(data.status);
  const badgeIcon = getBadgeIcon(data.status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn('gap-1.5 px-2 py-1', badgeColor)} variant="outline">
            <span aria-hidden="true">{badgeIcon}</span>
            <span className="text-xs font-medium">{data.badgeLabel}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{data.badgeLabel}</p>
          <p className="text-sm text-muted-foreground">{data.badgeDetails}</p>
          {data.fpsEstimates.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              FPS: {data.fpsEstimates.map(f => `${f.resolution} ${f.preset}: ~${f.avg}`).join(', ')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}