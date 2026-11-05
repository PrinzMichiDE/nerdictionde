"use client";

import { useEffect } from "react";

export function GuideSyncTrigger() {
  useEffect(() => {
    fetch("/api/guides/refresh", { method: "GET", cache: "no-store" }).catch(() => {
      // Ignore errors in background sync
    });
  }, []);

  return null;
}
