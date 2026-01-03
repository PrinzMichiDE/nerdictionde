/**
 * Analytics and tracking utilities
 * Client-side analytics for user behavior tracking
 */

export interface AnalyticsEvent {
  type: string;
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined") return;

  const event: AnalyticsEvent = {
    type: "pageview",
    name: "page_view",
    properties: {
      path,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    },
  };

  // Send to API
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {
    // Silently fail if analytics fails
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  const event: AnalyticsEvent = {
    type: "event",
    name,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  };

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {
    // Silently fail
  });
}

/**
 * Track review view
 */
export function trackReviewView(reviewId: string, reviewTitle: string) {
  trackEvent("review_view", {
    reviewId,
    reviewTitle,
  });
}

/**
 * Track search
 */
export function trackSearch(query: string, resultsCount: number) {
  trackEvent("search", {
    query,
    resultsCount,
  });
}

/**
 * Track share
 */
export function trackShare(platform: string, reviewId: string, reviewTitle: string) {
  trackEvent("share", {
    platform,
    reviewId,
    reviewTitle,
  });
}

/**
 * Track filter usage
 */
export function trackFilter(filterType: string, filterValue: string) {
  trackEvent("filter_used", {
    filterType,
    filterValue,
  });
}

/**
 * Track bookmark
 */
export function trackBookmark(reviewId: string, action: "add" | "remove") {
  trackEvent("bookmark", {
    reviewId,
    action,
  });
}
