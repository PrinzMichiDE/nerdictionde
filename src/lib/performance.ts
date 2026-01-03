/**
 * Performance monitoring utilities
 * Track Core Web Vitals and custom metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: PerformanceMetric) {
  if (typeof window === "undefined") return;

  // Send to analytics API
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "web-vital",
      name: metric.name,
      properties: {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      },
    }),
  }).catch(() => {
    // Silently fail
  });
}

/**
 * Measure time taken for async function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (typeof window !== "undefined") {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Track resource loading performance
 */
export function trackResourcePerformance() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "resource") {
          const resourceEntry = entry as PerformanceResourceTiming;
          const duration = resourceEntry.responseEnd - resourceEntry.requestStart;

          // Log slow resources (> 1 second)
          if (duration > 1000) {
            console.warn(`[Performance] Slow resource: ${resourceEntry.name} (${duration.toFixed(2)}ms)`);
          }
        }
      }
    });

    observer.observe({ entryTypes: ["resource"] });
  } catch (error) {
    // PerformanceObserver not supported
    console.warn("PerformanceObserver not supported:", error);
  }
}

/**
 * Initialize performance tracking
 */
export function initPerformanceTracking() {
  if (typeof window === "undefined") return;

  // Track resource performance
  trackResourcePerformance();

  // Track Web Vitals if available
  if (typeof window !== "undefined" && "web-vitals" in window) {
    // This would require installing web-vitals package
    // import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
    // onCLS(reportWebVitals);
    // onFID(reportWebVitals);
    // onFCP(reportWebVitals);
    // onLCP(reportWebVitals);
    // onTTFB(reportWebVitals);
  }
}
