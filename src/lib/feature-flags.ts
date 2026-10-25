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
export const FEATURE_REVIEW_TEMPLATES = process.env.FEATURE_REVIEW_TEMPLATES === 'true';
export const FEATURE_SOCIAL_SHARING = process.env.FEATURE_SOCIAL_SHARING !== 'false';
export const FEATURE_SHARE_TRACKING = process.env.FEATURE_SHARE_TRACKING !== 'false';
export const FEATURE_USER_SERIES = process.env.FEATURE_USER_SERIES !== 'false';
export const FEATURE_ENHANCED_NOTIFICATION_PREFS = process.env.FEATURE_ENHANCED_NOTIFICATION_PREFS !== 'false';
export const FEATURE_NOTIFICATION_DIGEST = process.env.FEATURE_NOTIFICATION_DIGEST !== 'false';
export const FEATURE_PUSH_NOTIFICATIONS = process.env.FEATURE_PUSH_NOTIFICATIONS === 'true';
export const FEATURE_NOTIFICATION_MUTES = process.env.FEATURE_NOTIFICATION_MUTES !== 'false';

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
  get reviewTemplates() { return FEATURE_REVIEW_TEMPLATES; },
  get socialSharing() { return FEATURE_SOCIAL_SHARING; },
  get shareTracking() { return FEATURE_SHARE_TRACKING; },
  get userSeries() { return FEATURE_USER_SERIES; },
  get enhancedNotificationPrefs() { return FEATURE_ENHANCED_NOTIFICATION_PREFS; },
  get notificationDigest() { return FEATURE_NOTIFICATION_DIGEST; },
  get pushNotifications() { return FEATURE_PUSH_NOTIFICATIONS; },
  get notificationMutes() { return FEATURE_NOTIFICATION_MUTES; },
};