"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  currency: string;
  url: string;
  source: string;
  asin: string | null;
}

interface PriceHistoryEntry {
  price: number;
  currency: string;
  source: string | null;
  recordedAt: Date | string;
}

interface DealsWidgetProps {
  deals: Deal[];
  priceHistory: PriceHistoryEntry[];
}

export function DealsWidget({ deals, priceHistory }: DealsWidgetProps) {
  if (!deals || deals.length === 0) {
    if (!priceHistory || priceHistory.length === 0) return null;
  }

  const formatPrice = (price: number, currency: string) =>
    price.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency,
    }) +
    " " +
    currency.toUpperCase();

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-semibold tracking-tight">
          Preis &amp; Angebote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {deals.length > 0 && (
          <section className="border-b border-border pb-4 mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Aktuelle Angebote
            </h3>
            <div className="space-y-3">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center gap-3 p-2 rounded-md bg-muted/50 hover:bg-muted/100 transition-colors"
                >
                  <Link
                    href={deal.url}
                    target="_blank"
                    rel="nofollow sponsored"
                    className="flex-1 text-sm text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    <span className="font-medium">{deal.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {deal.source}
                    </span>
                  </Link>
                  <span className="font-mono text-sm font-semibold">
                    {formatPrice(deal.price, deal.currency)}
                  </span>
                  {deal.discount && deal.discount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      -{deal.discount}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {priceHistory.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Preisverlauf
            </h3>
            <div className="space-y-2">
              {priceHistory
                .slice()
                .reverse()
                .slice(0, 6)
                .map((entry) => (
                  <div
                    key={`${entry.recordedAt}-${entry.price}`}
                    className="flex items-center justify-between text-sm p-1.5 rounded-sm bg-muted/50"
                  >
                    <span className="text-muted-foreground">
                      {new Date(entry.recordedAt).toLocaleDateString("de-DE", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {formatPrice(entry.price, entry.currency)}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
