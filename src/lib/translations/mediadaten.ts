/**
 * Translations for "Mediadaten" (Media Data/Media Kit) in the top 15 languages by total speakers
 * Based on Ethnologue 2024 data
 */

export interface MediadatenTranslation {
  language: string;
  nativeName: string;
  translation: string;
  routePath?: string; // URL-friendly path
}

export const mediadatenTranslations: MediadatenTranslation[] = [
  {
    language: "en",
    nativeName: "English",
    translation: "Media Kit",
    routePath: "media-kit",
  },
  {
    language: "zh",
    nativeName: "中文",
    translation: "媒体数据",
    routePath: "meiti-shuju",
  },
  {
    language: "hi",
    nativeName: "हिन्दी",
    translation: "मीडिया डेटा",
    routePath: "media-data",
  },
  {
    language: "es",
    nativeName: "Español",
    translation: "Kit de Medios",
    routePath: "kit-de-medios",
  },
  {
    language: "fr",
    nativeName: "Français",
    translation: "Kit Média",
    routePath: "kit-media",
  },
  {
    language: "ar",
    nativeName: "العربية",
    translation: "بيانات الوسائط",
    routePath: "bayinat-alwasayit",
  },
  {
    language: "bn",
    nativeName: "বাংলা",
    translation: "মিডিয়া ডেটা",
    routePath: "media-data",
  },
  {
    language: "pt",
    nativeName: "Português",
    translation: "Kit de Mídia",
    routePath: "kit-de-midia",
  },
  {
    language: "ru",
    nativeName: "Русский",
    translation: "Медиаданные",
    routePath: "mediadannye",
  },
  {
    language: "ja",
    nativeName: "日本語",
    translation: "メディアデータ",
    routePath: "media-data",
  },
  {
    language: "pa",
    nativeName: "ਪੰਜਾਬੀ",
    translation: "ਮੀਡੀਆ ਡੇਟਾ",
    routePath: "media-data",
  },
  {
    language: "de",
    nativeName: "Deutsch",
    translation: "Mediadaten",
    routePath: "mediadaten",
  },
  {
    language: "jv",
    nativeName: "Basa Jawa",
    translation: "Data Media",
    routePath: "data-media",
  },
  {
    language: "wuu",
    nativeName: "吴语",
    translation: "媒体数据",
    routePath: "meiti-shuju",
  },
  {
    language: "id",
    nativeName: "Bahasa Indonesia",
    translation: "Data Media",
    routePath: "data-media",
  },
];

/**
 * Get translation by language code
 */
export function getMediadatenTranslation(langCode: string): MediadatenTranslation | undefined {
  return mediadatenTranslations.find((t) => t.language === langCode);
}

/**
 * Get all translations as a map
 */
export function getMediadatenTranslationsMap(): Record<string, string> {
  return mediadatenTranslations.reduce(
    (acc, translation) => {
      acc[translation.language] = translation.translation;
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Get route path by language code
 */
export function getMediadatenRoutePath(langCode: string): string {
  const translation = getMediadatenTranslation(langCode);
  return translation?.routePath || "mediadaten";
}

