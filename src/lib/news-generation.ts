import prisma from "@/lib/prisma";
import Parser from "rss-parser";
import { generateContent, generateSlug } from "@/lib/review-generation";
import { getTavilyClient, type TavilySearchResponse } from "@/lib/tavily";

const NEWS_RSS_FEED =
  process.env.NEWS_RSS_FEED ||
  "https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNREZ0ZHpFU0FtUmxLQUFQAQ?hl=de&gl=DE&ceid=DE:de";

const NEWS_MAX_PER_RUN = parseInt(process.env.NEWS_MAX_PER_RUN || "5", 10) || 5;

const VALID_CATEGORIES = [
  "Gaming",
  "Filme & Serien",
  "Hardware",
  "Technik",
  "Unterhaltung",
  "Wirtschaft",
] as const;

type NewsCategory = (typeof VALID_CATEGORIES)[number];

interface RssFeedItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  source?: string | { url?: string; name?: string; "#"?: string };
}

interface RssNewsItem {
  title: string;
  link: string;
  guid: string;
  pubDate?: string;
  snippet?: string;
  source?: string;
}

function buildNewsPrompt(
  item: RssNewsItem,
  contextLines: string[],
  isRetry: boolean
): string {
  const retryHint = isRetry
    ? "HINWEIS: Dein letzter Versuch war abgeschnitten oder ungültig. Halte dich an ca. 350-500 Wörter pro Sprache, damit das JSON vollständig bleibt."
    : "";

  return `
Du bist Chefredakteur des Nerd-Magazins "Nerdiction". Schreibe auf Basis der unten stehenden Headline einen KOMPLETT NEUEN, eigenständigen News-Beitrag – keine Übersetzung, kein bloßes Umschreiben der Meldung, sondern ein eigenständiger Artikel mit Einordnung, Hintergrund und Nerd-Perspektive.

${retryHint}

QUALITÄT & STRUKTUR:
1. Sprachen: Erstelle den Beitrag in DEUTSCH (de) UND ENGLISCH (en) mit identischer Struktur.
2. Länge: ca. 350-500 Wörter pro Sprache. Volle Absätze, keine Stichpunkte als Fließtext.
3. Titel: Aussagekräftig, max. 80 Zeichen, ohne "News:"-Präfix.
4. Einleitung: Packende Lead mit dem Kern der Meldung (1 Absatz).
5. Hauptteil: Mindestens 3 ausführliche Absätze mit Hintergrund, Kontext, Einordnung und ggf. Vergleichen.
6. Fazit/Ausblick: 1 Absatz mit Bedeutung für die Nerd-Community.
7. Kategorie: Wähle GENAU eine aus: ${VALID_CATEGORIES.join(", ")}.
8. Tags: 3-5 prägnante Schlagwörter (DE).
9. Tonfall: Begeistert, kompetent, objektiv – wie von einem erfahrenen Redakteur. Erwähne NIEMALS, dass der Text von einer KI oder automatisch generiert wurde.
10. FAKTENTREUE: Stütze dich auf die bereitgestellten Fakten. Erfinde keine konkreten Zahlen, Namen oder Zitate, die nicht belegt sind. Fehlen Details, formuliere bewusst allgemein.
11. Format: Antworte AUSSCHLIESSLICH mit gültigem JSON – kein Markdown-Codeblock, kein Text außerhalb.

JSON-Schema:
{
  "de": {
    "title": "Titel (max. 80 Zeichen)",
    "excerpt": "Ein Satz Teaser (max. 200 Zeichen)",
    "content": "Kompletter Markdown-Artikel (Lead, Hauptteil, Fazit)"
  },
  "en": {
    "title": "...",
    "excerpt": "...",
    "content": "..."
  },
  "category": "Gaming",
  "tags": ["...", "...", "...", "..."]
}

FAKTEN & KONTEXT (nur als Recherche-Basis):
${contextLines.join("\n")}
`.trim();
}

async function researchTopic(query: string): Promise<string[]> {
  try {
    const client = getTavilyClient();
    const response: TavilySearchResponse = await client.search(query, {
      search_depth: "basic",
      include_answer: true,
      include_images: false,
      include_raw_content: false,
      max_results: 5,
    });
    const lines: string[] = [];
    if (response.answer) lines.push(`Zusammenfassung: ${response.answer}`);
    for (const r of response.results?.slice(0, 5) || []) {
      const snippet = (r.content || "").substring(0, 600).trim();
      if (snippet) lines.push(`Quelle (${r.title}): ${snippet}`);
    }
    return lines;
  } catch (error) {
    console.warn(`⚠️  Tavily-Recherche für "${query}" fehlgeschlagen:`, error);
    return [];
  }
}

/**
 * Parse the Google News RSS feed and return normalized items.
 */
export async function fetchNewsRss(): Promise<RssNewsItem[]> {
  const parser = new Parser({ timeout: 15000 });

  const feed = await parser.parseURL(NEWS_RSS_FEED);
  const items: RssNewsItem[] = [];

  for (const entry of feed.items as RssFeedItem[]) {
    const title = (entry.title || "").trim();
    if (!title) continue;

    const link = entry.link || "";
    const guid = entry.guid || link || title;
    const rawSource = entry.source;
    const sourceName =
      typeof rawSource === "string" ? rawSource : rawSource?.name || rawSource?.["#"];

    items.push({
      title,
      link,
      guid,
      pubDate: entry.pubDate,
      snippet: (entry.contentSnippet || entry.content || "").replace(/\s+/g, " ").trim().substring(0, 800),
      source: sourceName,
    });
  }

  return items;
}

/**
 * Generate a single NewsArticle from an RSS item using the AI.
 */
export async function generateNewsArticle(
  item: RssNewsItem,
  retryCount = 0
): Promise<{
  title: string;
  title_en: string;
  excerpt: string;
  excerpt_en: string;
  content: string;
  content_en: string;
  category: string;
  tags: string[];
}> {
  const isRetry = retryCount > 0;

  const contextLines: string[] = [
    `Headline: ${item.title}`,
    item.snippet ? `Meldung (Auszug): ${item.snippet}` : "",
    item.source ? `Quelle: ${item.source}` : "",
    item.pubDate ? `Veröffentlicht: ${item.pubDate}` : "",
  ].filter(Boolean);

  // Best-effort factual research (non-blocking)
  try {
    const research = await researchTopic(item.title);
    contextLines.push(...research);
  } catch {
    // Non-blocking
  }

  const result = await generateContent(buildNewsPrompt(item, contextLines, isRetry), item.title, retryCount);

  const categoryInput: string = (result.category as string) || "Gaming";
  const category: NewsCategory = (VALID_CATEGORIES as readonly string[]).includes(categoryInput)
    ? (categoryInput as NewsCategory)
    : "Gaming";

  const tags: string[] = Array.isArray(result.tags)
    ? result.tags.slice(0, 6).map((t: string) => String(t).trim()).filter(Boolean)
    : [];

  return {
    title: result.de.title || item.title,
    title_en: result.en?.title || result.de.title || item.title,
    excerpt: result.de.excerpt || item.snippet?.substring(0, 200) || "",
    excerpt_en: result.en?.excerpt || result.de.excerpt || "",
    content: result.de.content,
    content_en: result.en?.content || result.de.content,
    category,
    tags,
  };
}

/**
 * Sync the RSS feed into the database: fetch, dedupe by rssGuid, generate new
 * articles (up to NEWS_MAX_PER_RUN per run) and store them as "published".
 */
export async function syncNewsFromRss(): Promise<{
  success: boolean;
  checked: number;
  created: number;
  skipped: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let checked = 0;
  let created = 0;
  let skipped = 0;

  try {
    const items = await fetchNewsRss();
    checked = items.length;

    // Newest first
    const sorted = [...items].sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    });

    // Determine which items are new
    const existing = await prisma.newsArticle.findMany({
      where: { rssGuid: { in: sorted.map((i) => i.guid) } },
      select: { rssGuid: true },
    });
    const existingGuids = new Set(existing.map((e) => e.rssGuid));

    const newItems = sorted.filter((i) => !existingGuids.has(i.guid));

    for (const item of newItems.slice(0, NEWS_MAX_PER_RUN)) {
      try {
        const article = await generateNewsArticle(item, 0);

        let slug = generateSlug(article.title);
        let attempt = 0;
        while (await prisma.newsArticle.findUnique({ where: { slug } })) {
          attempt++;
          if (attempt > 10) {
            slug = `${generateSlug(article.title)}-${Date.now().toString(36)}`;
            break;
          }
          slug = `${generateSlug(article.title)}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const metaDescription = article.excerpt?.substring(0, 160);
        const metaKeywords = article.tags.join(", ");

        await prisma.newsArticle.create({
          data: {
            title: article.title,
            title_en: article.title_en,
            slug,
            excerpt: article.excerpt,
            excerpt_en: article.excerpt_en,
            content: article.content,
            content_en: article.content_en,
            category: article.category,
            tags: article.tags,
            sourceUrl: item.link || null,
            sourceName: item.source || null,
            rssGuid: item.guid,
            status: "published",
            metaDescription: metaDescription || null,
            metaKeywords: metaKeywords || null,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          },
        });

        created++;
        console.log(`✅ News erstellt: ${article.title} (${article.category})`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unbekannter Fehler";
        errors.push(`Fehler bei "${item.title}": ${message}`);
        console.error(`❌ News-Generierung fehlgeschlagen für "${item.title}":`, error);
      }
    }

    skipped = newItems.length - created;
    if (newItems.length > NEWS_MAX_PER_RUN) {
      skipped += newItems.length - NEWS_MAX_PER_RUN;
    }

    return { success: true, checked, created, skipped, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("❌ Fehler beim News-Sync:", error);
    return { success: false, checked, created, skipped, errors: [message] };
  }
}
