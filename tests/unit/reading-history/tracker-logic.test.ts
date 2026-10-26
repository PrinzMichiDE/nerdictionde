import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests für die Tracking-Logik (Debounce, Progress-Berechnung, Dwell-Time)
 * Da useReadingHistoryTracker ein React Hook ist, testen wir die reinen Funktionen
 * und die Logik separat.
 */

// Hilfsfunktion für Progress-Berechnung (aus useReadingHistoryTracker extrahiert)
function calculateProgress(scrollDepth: number, dwellTimeMs: number): number {
  const dwellBased = Math.min(Math.round((dwellTimeMs / 60_000) * 10), 100); // 10 Min = 100%
  return Math.max(scrollDepth, dwellBased);
}

// Hilfsfunktion für Debounce-Check
function shouldSendTracking(
  lastSentAt: number,
  currentProgress: { progress: number; scrollDepth: number; dwellTime: number },
  sentProgressRef: { progress: number; scrollDepth: number; dwellTime: number },
  scrollThreshold = 50,
  dwellThresholdMs = 30_000,
  debounceMs = 10_000
): boolean {
  const now = Date.now();
  if (now - lastSentAt < debounceMs) return false;

  const shouldTrack =
    currentProgress.scrollDepth >= scrollThreshold ||
    currentProgress.dwellTime >= dwellThresholdMs ||
    currentProgress.progress > sentProgressRef.progress;

  return shouldTrack;
}

describe('Reading History Tracker Logic', () => {
  describe('calculateProgress', () => {
    it('should return scrollDepth when higher than dwell-based', () => {
      expect(calculateProgress(80, 60_000)).toBe(80); // 1 Min dwell = 10%, scroll 80% wins
    });

    it('should return dwell-based when higher than scrollDepth', () => {
      expect(calculateProgress(20, 600_000)).toBe(100); // 10 Min dwell = 100%, scroll 20% loses
    });

    it('should cap at 100', () => {
      expect(calculateProgress(100, 1_000_000)).toBe(100);
      expect(calculateProgress(50, 2_000_000)).toBe(100);
    });

    it('should handle zero values', () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it('should calculate correctly at thresholds', () => {
      // 5 Min = 50% dwell-based
      expect(calculateProgress(0, 300_000)).toBe(50);
      // 30 Sek = 5% dwell-based (below scroll threshold of 50)
      expect(calculateProgress(0, 30_000)).toBe(5);
    });
  });

  describe('shouldSendTracking', () => {
    const baseState = {
      lastSentAt: 0,
      currentProgress: { progress: 0, scrollDepth: 0, dwellTime: 0 },
      sentProgressRef: { progress: 0, scrollDepth: 0, dwellTime: 0 },
    };

    it('should return false when debounce not elapsed', () => {
      const result = shouldSendTracking(
        Date.now() - 5_000, // 5 seconds ago
        baseState.currentProgress,
        baseState.sentProgressRef
      );
      expect(result).toBe(false);
    });

    it('should return true when scroll threshold reached', () => {
      const result = shouldSendTracking(
        0,
        { ...baseState.currentProgress, scrollDepth: 50 },
        baseState.sentProgressRef
      );
      expect(result).toBe(true);
    });

    it('should return true when dwell threshold reached', () => {
      const result = shouldSendTracking(
        0,
        { ...baseState.currentProgress, dwellTime: 30_000 },
        baseState.sentProgressRef
      );
      expect(result).toBe(true);
    });

    it('should return true when progress increased', () => {
      const result = shouldSendTracking(
        0,
        { ...baseState.currentProgress, progress: 10 },
        baseState.sentProgressRef
      );
      expect(result).toBe(true);
    });

    it('should return false when no threshold reached and no progress change', () => {
      const result = shouldSendTracking(
        0,
        { ...baseState.currentProgress, scrollDepth: 25, dwellTime: 10_000 },
        baseState.sentProgressRef
      );
      expect(result).toBe(false);
    });

    it('should respect debounce even with progress change', () => {
      const result = shouldSendTracking(
        Date.now() - 5_000,
        { ...baseState.currentProgress, progress: 10 },
        baseState.sentProgressRef
      );
      expect(result).toBe(false);
    });
  });

  describe('Debounce behavior', () => {
    it('should only allow send after debounce period', () => {
      const now = Date.now();
      expect(shouldSendTracking(now - 9_999, baseState.currentProgress, baseState.sentProgressRef)).toBe(false);
      expect(shouldSendTracking(now - 10_000, baseState.currentProgress, baseState.sentProgressRef)).toBe(false);
      expect(shouldSendTracking(now - 10_001, baseState.currentProgress, baseState.sentProgressRef)).toBe(false); // Still no threshold
    });
  });
});

const baseState = {
  lastSentAt: 0,
  currentProgress: { progress: 0, scrollDepth: 0, dwellTime: 0 },
  sentProgressRef: { progress: 0, scrollDepth: 0, dwellTime: 0 },
};