/**
 * Simple i18n utility for Mediadaten page
 */

import { mediadatenTranslations, type MediadatenTranslations } from "./translations/mediadaten-content";

export const supportedLanguages = [
  "de", "en", "zh", "hi", "es", "fr", "ar", "bn", "pt", "ru", "ja", "pa", "jv", "wuu", "id"
] as const;

export type SupportedLanguage = typeof supportedLanguages[number];

const defaultLanguage: SupportedLanguage = "de";

/**
 * Get translations for a specific language
 */
export function getTranslations(lang?: string): MediadatenTranslations {
  const language = (lang && supportedLanguages.includes(lang as SupportedLanguage))
    ? (lang as SupportedLanguage)
    : defaultLanguage;
  
  return mediadatenTranslations[language] || mediadatenTranslations[defaultLanguage];
}

/**
 * Get language from URL or headers
 */
export function getLanguageFromRequest(
  searchParams?: { lang?: string },
  headers?: Headers
): SupportedLanguage {
  // Check URL parameter first
  if (searchParams?.lang && supportedLanguages.includes(searchParams.lang as SupportedLanguage)) {
    return searchParams.lang as SupportedLanguage;
  }
  
  // Check Accept-Language header
  if (headers) {
    const acceptLanguage = headers.get("accept-language");
    if (acceptLanguage) {
      // Parse Accept-Language header (e.g., "en-US,en;q=0.9,de;q=0.8")
      const languages = acceptLanguage
        .split(",")
        .map(lang => lang.split(";")[0].trim().toLowerCase().split("-")[0]);
      
      for (const lang of languages) {
        if (supportedLanguages.includes(lang as SupportedLanguage)) {
          return lang as SupportedLanguage;
        }
      }
    }
  }
  
  return defaultLanguage;
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, locale: string): string {
  try {
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

/**
 * Get locale string for a language code
 */
export function getLocale(lang: SupportedLanguage): string {
  const localeMap: Record<SupportedLanguage, string> = {
    de: "de-DE",
    en: "en-US",
    zh: "zh-CN",
    hi: "hi-IN",
    es: "es-ES",
    fr: "fr-FR",
    ar: "ar-SA",
    bn: "bn-BD",
    pt: "pt-BR",
    ru: "ru-RU",
    ja: "ja-JP",
    pa: "pa-IN",
    jv: "jv-ID",
    wuu: "zh-CN",
    id: "id-ID",
  };
  
  return localeMap[lang] || "de-DE";
}

