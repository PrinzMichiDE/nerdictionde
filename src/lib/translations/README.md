# Übersetzungen für Mediadaten

Diese Datei enthält Übersetzungen für den Begriff "Mediadaten" in den Top 15 Sprachen der Welt (nach Gesamtsprecherzahl).

## Verwendung

```typescript
import { 
  mediadatenTranslations, 
  getMediadatenTranslation, 
  getMediadatenTranslationsMap,
  getMediadatenRoutePath 
} from "@/lib/translations/mediadaten";

// Alle Übersetzungen abrufen
const allTranslations = mediadatenTranslations;

// Übersetzung für eine bestimmte Sprache
const englishTranslation = getMediadatenTranslation("en");
// { language: "en", nativeName: "English", translation: "Media Kit", routePath: "media-kit" }

// Übersetzungen als Map
const translationsMap = getMediadatenTranslationsMap();
// { en: "Media Kit", de: "Mediadaten", ... }

// Route-Pfad für eine Sprache
const routePath = getMediadatenRoutePath("en");
// "media-kit"
```

## Verfügbare Sprachen

1. **English (en)** - Media Kit
2. **中文 (zh)** - 媒体数据
3. **हिन्दी (hi)** - मीडिया डेटा
4. **Español (es)** - Kit de Medios
5. **Français (fr)** - Kit Média
6. **العربية (ar)** - بيانات الوسائط
7. **বাংলা (bn)** - মিডিয়া ডেটা
8. **Português (pt)** - Kit de Mídia
9. **Русский (ru)** - Медиаданные
10. **日本語 (ja)** - メディアデータ
11. **ਪੰਜਾਬੀ (pa)** - ਮੀਡੀਆ ਡੇਟਾ
12. **Deutsch (de)** - Mediadaten
13. **Basa Jawa (jv)** - Data Media
14. **吴语 (wuu)** - 媒体数据
15. **Bahasa Indonesia (id)** - Data Media

## Integration in Next.js

Für die Verwendung in Next.js-Routen können Sie die `routePath`-Eigenschaft verwenden:

```typescript
// Beispiel: Dynamische Route-Generierung
const routes = mediadatenTranslations.map((t) => ({
  locale: t.language,
  path: `/${t.routePath}`,
  label: t.translation,
}));
```

## Zukünftige i18n-Integration

Diese Übersetzungen können als Grundlage für eine vollständige Internationalisierung (i18n) verwendet werden, z.B. mit:
- `next-intl`
- `react-i18next`
- `next-i18next`

