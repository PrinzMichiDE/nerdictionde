/**
 * Generates realistic monthly visitor and page view statistics
 * Numbers are calculated based on the current month/year to simulate growth
 */

interface MediaStats {
  monthlyVisitors: number;
  monthlyPageViews: number;
  averageSessionDuration: string;
  bounceRate: string;
  averagePagesPerVisit: string;
  newVisitorsPercentage: string;
  returningVisitorsPercentage: string;
  mobileTrafficPercentage: string;
  desktopTrafficPercentage: string;
  averageReviewReadTime: string;
  topCountry: string;
  lastUpdated: string;
}

export interface MonthlyDataPoint {
  month: string;
  visitors: number;
  pageViews: number;
  year: number;
  monthIndex: number;
}

/**
 * Get data for the previous month (always show last month's data)
 */
export function getMediaStats(): MediaStats {
  const now = new Date();
  // Always use previous month
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = previousMonth.getFullYear();
  const month = previousMonth.getMonth(); // 0-11
  
  // Base numbers (starting point - can be adjusted)
  const baseVisitors = 5000;
  const basePageViews = 25000;
  
  // Calculate months since start (adjust start date as needed)
  // Example: Start from January 2024
  const startYear = 2024;
  const startMonth = 0; // January
  const monthsSinceStart = (year - startYear) * 12 + (month - startMonth);
  
  // Growth factors (adjustable)
  const visitorGrowthRate = 1.08; // ~8% growth per month
  const pageViewGrowthRate = 1.10; // ~10% growth per month
  
  // Calculate current numbers with growth
  const monthlyVisitors = Math.round(
    baseVisitors * Math.pow(visitorGrowthRate, monthsSinceStart)
  );
  
  const monthlyPageViews = Math.round(
    basePageViews * Math.pow(pageViewGrowthRate, monthsSinceStart)
  );
  
  // Format numbers with thousand separators
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('de-DE').format(num);
  };
  
  // Calculate average session duration (slightly improving over time)
  const baseDuration = 4.5; // minutes
  const durationImprovement = monthsSinceStart * 0.05;
  const averageDuration = (baseDuration + durationImprovement).toFixed(1);
  
  // Calculate bounce rate (slightly improving over time)
  const baseBounceRate = 45; // percentage
  const bounceImprovement = monthsSinceStart * 0.3;
  const bounceRate = Math.max(25, baseBounceRate - bounceImprovement).toFixed(0);
  
  // Calculate average pages per visit (improving over time)
  const basePagesPerVisit = 2.8;
  const pagesImprovement = monthsSinceStart * 0.05;
  const avgPagesPerVisit = (basePagesPerVisit + pagesImprovement).toFixed(1);
  
  // Calculate new vs returning visitors (more returning over time)
  const baseNewVisitors = 65; // percentage
  const newVisitorsDecrease = monthsSinceStart * 0.4;
  const newVisitors = Math.max(45, baseNewVisitors - newVisitorsDecrease).toFixed(0);
  const returningVisitors = (100 - parseFloat(newVisitors)).toFixed(0);
  
  // Calculate device distribution (mobile growing)
  const baseMobile = 42; // percentage
  const mobileGrowth = monthsSinceStart * 0.3;
  const mobileTraffic = Math.min(65, baseMobile + mobileGrowth).toFixed(0);
  const desktopTraffic = (100 - parseFloat(mobileTraffic)).toFixed(0);
  
  // Average review read time (increasing engagement)
  const baseReadTime = 6.5; // minutes
  const readTimeImprovement = monthsSinceStart * 0.08;
  const avgReadTime = (baseReadTime + readTimeImprovement).toFixed(1);
  
  // Top country (Germany for German site)
  const topCountry = "Deutschland";
  
  // Last updated date (previous month)
  const lastUpdated = new Date(year, month, 1).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
  });
  
  return {
    monthlyVisitors: monthlyVisitors,
    monthlyPageViews: monthlyPageViews,
    averageSessionDuration: `${averageDuration} Min.`,
    bounceRate: `${bounceRate}%`,
    averagePagesPerVisit: avgPagesPerVisit,
    newVisitorsPercentage: `${newVisitors}%`,
    returningVisitorsPercentage: `${returningVisitors}%`,
    mobileTrafficPercentage: `${mobileTraffic}%`,
    desktopTrafficPercentage: `${desktopTraffic}%`,
    averageReviewReadTime: `${avgReadTime} Min.`,
    topCountry: topCountry,
    lastUpdated: lastUpdated,
  };
}

/**
 * Generate 12 months of historical data
 * Values vary naturally by month with seasonal patterns, not constant growth
 */
export function getMonthlyTimeline(locale: string = "de-DE"): MonthlyDataPoint[] {
  const now = new Date();
  const timeline: MonthlyDataPoint[] = [];
  
  // Get the current month's stats to synchronize with
  const currentStats = getMediaStats();
  const currentVisitors = currentStats.monthlyVisitors;
  const currentPageViews = currentStats.monthlyPageViews;
  
  // Base average numbers (around which values fluctuate)
  const avgVisitors = currentVisitors;
  const avgPageViews = currentPageViews;
  
  // Calculate the last month's values (previous month = current stats)
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousYear = previousMonthDate.getFullYear();
  const previousMonth = previousMonthDate.getMonth();
  
  // Monthly variation factors (month 0 = January, 11 = December)
  // These create realistic monthly variations without constant growth
  const monthlyVariations: Record<number, { visitors: number; pageViews: number }> = {
    0: { visitors: 0.85, pageViews: 0.87 }, // January - post-holiday dip
    1: { visitors: 0.90, pageViews: 0.92 }, // February - low
    2: { visitors: 0.95, pageViews: 0.96 }, // March - recovering
    3: { visitors: 1.02, pageViews: 1.01 }, // April - spring
    4: { visitors: 0.98, pageViews: 0.99 }, // May - slight dip
    5: { visitors: 1.05, pageViews: 1.04 }, // June - summer starts
    6: { visitors: 1.08, pageViews: 1.06 }, // July - summer peak
    7: { visitors: 1.10, pageViews: 1.08 }, // August - summer peak
    8: { visitors: 0.95, pageViews: 0.97 }, // September - back to school dip
    9: { visitors: 1.00, pageViews: 1.00 }, // October - baseline
    10: { visitors: 1.08, pageViews: 1.06 }, // November - Black Friday prep
    11: { visitors: 1.35, pageViews: 1.28 }, // December - Christmas boost!
  };
  
  for (let i = 11; i >= 0; i--) {
    // Calculate date for each month (going back from previous month)
    const date = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get monthly variation for this month
    const variation = monthlyVariations[month] || { visitors: 1.0, pageViews: 1.0 };
    
    // Calculate values based on average with monthly variation
    // Add small random-like variation based on month index for more realism
    const monthSeed = (year * 12 + month) % 100;
    const randomFactor = 1 + (monthSeed % 10 - 5) / 200; // ±2.5% variation
    
    let visitors = Math.round(avgVisitors * variation.visitors * randomFactor);
    let pageViews = Math.round(avgPageViews * variation.pageViews * randomFactor);
    
    // If this is the previous month (last month), use exact values from stats
    if (year === previousYear && month === previousMonth) {
      visitors = currentVisitors;
      pageViews = currentPageViews;
    }
    
    timeline.push({
      month: date.toLocaleDateString(locale, { month: "short", year: "numeric" }),
      visitors,
      pageViews,
      year,
      monthIndex: month,
    });
  }
  
  return timeline;
}

/**
 * Formats a number with thousand separators
 */
export function formatMediaNumber(num: number, locale: string = 'de-DE'): string {
  return new Intl.NumberFormat(locale).format(num);
}

