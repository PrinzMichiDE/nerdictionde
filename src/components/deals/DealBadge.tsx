"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface DealBadgeProps {
  count: number;
  reviewSlug: string;
  lowestPrice?: number;
  currency?: string;
}

export function DealBadge({ count, reviewSlug, lowestPrice, currency = "EUR" }: DealBadgeProps) {
  if (count === 0) return null;
  return (
    <Link href={`/reviews/${reviewSlug}#deals`}>
      <Badge variant="secondary" className="gap-1 text-xs">
        <Tag className="size-3" />
        {count} Deal{count !== 1 ? "s" : ""}
        {lowestPrice != null && (
          <span className="font-semibold text-primary"> ab {lowestPrice.toFixed(2)} {currency}</span>
        )}
      </Badge>
    </Link>
  );
}
