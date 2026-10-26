'use client';

import { useState, useEffect, useCallback } from 'react';

export function useReadingHistoryPreference() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/user/reading-history-preference', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled);
      }
    } catch {
      // Ignore errors - default to false
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { enabled, loading, refresh: load };
}