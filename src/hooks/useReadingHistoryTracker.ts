'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReadingHistoryPreference } from '@/hooks/useReadingHistoryPreference';

interface UseReadingHistoryTrackerOptions {
  reviewId: string;
  featureEnabled: boolean; // Feature-Flag
  onTrack?: (data: { progress: number; scrollDepth: number; dwellTime: number }) => void;
}

interface ReadingProgress {
  progress: number;
  scrollDepth: number;
  dwellTime: number;
}

const DEBOUNCE_MS = 10_000; // 10 Sekunden
const SCROLL_THRESHOLD = 50; // 50% Scroll-Tiefe
const DWELL_THRESHOLD_MS = 30_000; // 30 Sekunden Verweildauer

export function useReadingHistoryTracker({
  reviewId,
  featureEnabled,
  onTrack,
}: UseReadingHistoryTrackerOptions) {
  const { enabled: preferenceEnabled, loading: preferenceLoading } = useReadingHistoryPreference();
  const enabled = featureEnabled && preferenceEnabled && !preferenceLoading;
  const [lastSentAt, setLastSentAt] = useState<number>(0);
  const [progress, setProgress] = useState<ReadingProgress>({
    progress: 0,
    scrollDepth: 0,
    dwellTime: 0,
  });

  const startTimeRef = useRef<number>(0);
  const lastVisibleStartRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingDwellTimeRef = useRef<number>(0);
  const sentProgressRef = useRef<ReadingProgress>({ progress: 0, scrollDepth: 0, dwellTime: 0 });
  // Refs for cleanup effect to avoid dependency issues
  const enabledRef = useRef(enabled);
  const progressRef = useRef(progress);
  const reviewIdRef = useRef(reviewId);

  // Initialize refs on mount
  useEffect(() => {
    const now = Date.now();
    startTimeRef.current = now;
    lastVisibleStartRef.current = now;
  }, []);

  // Dwell-Time aktualisieren bei Visibility-Change
  const handleVisibilityChange = useCallback(() => {
    const now = Date.now();

    if (document.hidden) {
      // Tab wird versteckt: akkumulierte Dwell-Time speichern
      if (isVisibleRef.current) {
        pendingDwellTimeRef.current += now - lastVisibleStartRef.current;
        isVisibleRef.current = false;
      }
    } else {
      // Tab wird sichtbar: neuen Start-Zeitpunkt setzen
      isVisibleRef.current = true;
      lastVisibleStartRef.current = now;
    }
  }, []);

  // Scroll-Tiefe messen via IntersectionObserver
  const setupScrollObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Observer für das Haupt-Inhalts-Element
    // Wir beobachten mehrere Schwellenwerte für granulare Messung
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!enabled) return;

        for (const entry of entries) {
          if (entry.isIntersecting) {
            // intersectionRatio ist 0-1, wir brauchen Prozent
            const scrollDepth = Math.round(entry.intersectionRatio * 100);
            setProgress((prev) => ({
              ...prev,
              scrollDepth: Math.max(prev.scrollDepth, scrollDepth),
              progress: Math.max(
                prev.progress,
                scrollDepth,
                Math.min(Math.round((prev.dwellTime / 60_000) * 10), 100) // dwell-basiert: 10 Min = 100%
              ),
            }));
          }
        }
      },
      {
        root: null, // Viewport
        rootMargin: '0px 0px -50% 0px', // Trigger bei 50% im Viewport
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0], // Granulare Schwellenwerte
      }
    );

    // Ziel-Element finden (Review-Content Container)
    const targetElement = document.querySelector('[data-reading-content]');
    if (targetElement) {
      observerRef.current.observe(targetElement);
    }
  }, [enabled]);

  // Tracking-Daten an API senden (debounced)
  const sendTrackingData = useCallback(async () => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastSentAt < DEBOUNCE_MS) return;

    // Aktuelle Dwell-Time berechnen
    let currentDwellTime = progress.dwellTime;
    if (isVisibleRef.current) {
      currentDwellTime += now - lastVisibleStartRef.current;
    }
    currentDwellTime += pendingDwellTimeRef.current;

    // Nur senden wenn Schwellenwerte erreicht oder Progress geändert
    const shouldTrack =
      progress.scrollDepth >= SCROLL_THRESHOLD ||
      currentDwellTime >= DWELL_THRESHOLD_MS ||
      progress.progress > sentProgressRef.current.progress;

    if (!shouldTrack) return;

    try {
      const response = await fetch('/api/reading-history/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reviewId,
          progress: progress.progress,
          scrollDepth: progress.scrollDepth,
          dwellTime: Math.round(currentDwellTime / 1000), // Sekunden
        }),
      });

      if (response.ok) {
        setLastSentAt(now);
        sentProgressRef.current = { ...progress, dwellTime: Math.round(currentDwellTime / 1000) };
        pendingDwellTimeRef.current = 0;
        lastVisibleStartRef.current = now;
        onTrack?.({
          progress: progress.progress,
          scrollDepth: progress.scrollDepth,
          dwellTime: Math.round(currentDwellTime / 1000),
        });
      } else if (response.status === 401) {
        // Nicht authentifiziert - Tracking stillschweigend deaktivieren
        console.debug('[ReadingHistory] User nicht authentifiziert, Tracking deaktiviert');
        return;
      } else {
        console.error('[ReadingHistory] Tracking fehlgeschlagen:', await response.text());
      }
    } catch (error) {
      console.error('[ReadingHistory] Tracking Error:', error);
    }
  }, [enabled, reviewId, progress, lastSentAt, onTrack]);

  // Periodisch prüfen ob Tracking gesendet werden soll
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      sendTrackingData();
    }, 5_000); // Alle 5s prüfen (Debounce verhindert doppeltes Senden)

    return () => clearInterval(interval);
  }, [enabled, sendTrackingData]);

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      // Finalen Dwell-Time flush beim Verlassen der Seite
      const now = Date.now();
      let finalDwellTime = progressRef.current.dwellTime;
      if (isVisibleRef.current) {
        finalDwellTime += now - lastVisibleStartRef.current;
      }
      finalDwellTime += pendingDwellTimeRef.current;

      if (
        enabledRef.current &&
        (progressRef.current.scrollDepth >= SCROLL_THRESHOLD || finalDwellTime >= DWELL_THRESHOLD_MS)
      ) {
        // sendBeacon für zuverlässiges Senden beim Unload
        navigator.sendBeacon(
          '/api/reading-history/track',
          JSON.stringify({
            reviewId: reviewIdRef.current,
            progress: progressRef.current.progress,
            scrollDepth: progressRef.current.scrollDepth,
            dwellTime: Math.round(finalDwellTime / 1000),
          })
        );
      }
    };
  }, []); // Nur einmal beim Mount/Unmount

  // Visibility Change Listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Observer setup bei enabled-Änderung
  useEffect(() => {
    if (enabled) {
      setupScrollObserver();
    } else if (observerRef.current) {
      observerRef.current.disconnect();
    }
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, setupScrollObserver]);

  return {
    progress,
    isTracking: enabled,
  };
}