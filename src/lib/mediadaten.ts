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

/**
 * Generates media statistics based on the current date
 * Numbers grow gradually each month to simulate organic growth
 */
export function getMediaStats(): MediaStats {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
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
  
  // Last updated date
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
 * Formats a number with thousand separators
 */
export function formatMediaNumber(num: number): string {
  return new Intl.NumberFormat('de-DE').format(num);
}

