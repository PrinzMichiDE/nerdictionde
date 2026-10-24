"use client";

import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface PricePoint {
  date: Date;
  price: number;
  source: string;
  currency: string;
}

interface DealItem {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  currency: string;
  url: string;
  imageUrl: string | null;
  source: string;
  status: string;
  expiresAt: Date | null;
}

interface ReviewComparePriceChartProps {
  priceHistory: PricePoint[];
  deals: DealItem[];
}

export function ReviewComparePriceChart({ priceHistory, deals }: ReviewComparePriceChartProps) {
  if (priceHistory.length === 0 && deals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Keine Preisdaten verfügbar
      </div>
    );
  }

  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory.map((p) => p.price)) : 0;
  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory.map((p) => p.price)) : 0;
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="space-y-4">
      {priceHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preisverlauf (letzte 5)</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {priceHistory.map((point, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                <span className="text-muted-foreground">
                  {format(point.date, "dd.MM.yyyy", { locale: de })}
                </span>
                <span className="font-semibold tabular-nums">
                  {point.price.toFixed(2)} {point.currency}
                </span>
                <span className="text-xs text-muted-foreground">{point.source}</span>
              </div>
            ))}
          </div>
          {priceHistory.length > 1 && (
            <div className="h-32 w-full relative" aria-label="Preisverlauf Diagramm">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={priceHistory
                    .slice()
                    .reverse()
                    .map((point, i) => {
                      const x = (i / (priceHistory.length - 1)) * 100;
                      const y = 100 - ((point.price - minPrice) / priceRange) * 90;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
                <polyline
                  fill="url(#priceGradient)"
                  stroke="none"
                  points={[
                    ...priceHistory
                      .slice()
                      .reverse()
                      .map((point, i) => {
                        const x = (i / (priceHistory.length - 1)) * 100;
                        const y = 100 - ((point.price - minPrice) / priceRange) * 90;
                        return `${x},${y}`;
                      }),
                    `${100},100`,
                    `0,100`,
                  ].join(" ")}
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {deals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aktuelle Deals</h3>
          <div className="space-y-2">
            {deals.map((deal) => (
              <a
                key={deal.id}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                {deal.imageUrl && (
                  <Image
                    src={deal.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded object-cover"
                    unoptimized
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deal.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {deal.originalPrice && deal.discount && (
                      <>
                        <span className="line-through">{deal.originalPrice.toFixed(2)} {deal.currency}</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          -{deal.discount.toFixed(0)}%
                        </span>
                      </>
                    )}
                    <span className="font-semibold text-foreground">
                      {deal.price.toFixed(2)} {deal.currency}
                    </span>
                    <span>{deal.source}</span>
                  </div>
                </div>
                <svg className="size-4 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}