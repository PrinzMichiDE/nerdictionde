"use client";

import React from "react";
import { SpecTable } from "@/components/shared/SpecTable";
import type { SpecRow } from "@/lib/review-compare-types";

interface ReviewCompareSpecsTableProps {
  specs: SpecRow[];
}

export function ReviewCompareSpecsTable({ specs }: ReviewCompareSpecsTableProps) {
  if (specs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Keine technischen Daten verfügbar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <SpecTable specs={specs} />
    </div>
  );
}