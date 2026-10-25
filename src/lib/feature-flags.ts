// ============================================
// Feature Flags
// ============================================

export const FEATURE_REVIEW_REACTIONS = process.env.FEATURE_REVIEW_REACTIONS !== 'false';
export const FEATURE_REVIEW_COLLECTIONS = process.env.FEATURE_REVIEW_COLLECTIONS !== 'false';
export const FEATURE_READING_HISTORY = process.env.FEATURE_READING_HISTORY === 'true';
export const FEATURE_CATEGORY_SUBSCRIPTIONS = process.env.FEATURE_CATEGORY_SUBSCRIPTIONS !== 'false';
export const FEATURE_REVIEW_SERIES = process.env.FEATURE_REVIEW_SERIES === 'true';
export const FEATURE_REVIEW_COMPARE_ENHANCED = process.env.FEATURE_REVIEW_COMPARE_ENHANCED !== 'false';
export const FEATURE_ADVANCED_SEARCH_FILTERS = process.env.FEATURE_ADVANCED_SEARCH_FILTERS !== 'false';
export const FEATURE_PERSONALIZED_RECOMMENDATIONS = process.env.FEATURE_PERSONALIZED_RECOMMENDATIONS !== 'false';
export const FEATURE_COMMUNITY_QA = process.env.FEATURE_COMMUNITY_QA !== 'false';
export const FEATURE_HARDWARE_COMPATIBILITY = process.env.FEATURE_HARDWARE_COMPATIBILITY === 'true';

// Object export for easy access
export const featureFlags = {
  get reactions() { return FEATURE_REVIEW_REACTIONS; },
  get collections() { return FEATURE_REVIEW_COLLECTIONS; },
  get readingHistory() { return FEATURE_READING_HISTORY; },
  get categorySubscriptions() { return FEATURE_CATEGORY_SUBSCRIPTIONS; },
  get reviewSeries() { return FEATURE_REVIEW_SERIES; },
  get reviewCompareEnhanced() { return FEATURE_REVIEW_COMPARE_ENHANCED; },
  get advancedSearchFilters() { return FEATURE_ADVANCED_SEARCH_FILTERS; },
  get recommendations() { return FEATURE_PERSONALIZED_RECOMMENDATIONS; },
  get communityQa() { return FEATURE_COMMUNITY_QA; },
  get hardwareCompatibility() { return FEATURE_HARDWARE_COMPATIBILITY; },
};