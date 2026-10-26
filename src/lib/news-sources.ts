// News-Quellen für den automatischen News-Sync. Jeder Feed liefert Headlines
// für einen Beat; daraus schreibt news-generation.ts eigenständige, komplett
// neue Artikel.

export const NEWS_CATEGORIES = [
  "Gaming",
  "Filme & Serien",
  "Hardware",
  "Technik",
  "Unterhaltung",
  "Wirtschaft",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface NewsFeed {
  url: string;
  /** Kategorie-Hinweis für die KI und Fallback, wenn das Modell keine gültige Kategorie liefert. */
  category: NewsCategory;
  /** Max. Anzahl von Meldungen aus diesem Feed pro Lauf. */
  maxItems: number;
}

const GOOGLE_NEWS = "https://news.google.com/rss";
const GOOGLE_NEWS_PARAMS = "?hl=de&gl=DE&ceid=DE:de";

// Direkte Feeds mit Bot-Schutz (GameStar, MeinMMO, PC Games, Chip, t3n,
// Moviepilot, kino.de, tvtipps) liefern kein nutzbares RSS — die Beats werden
// stattdessen über Google-News-Search-Feeds abgedeckt.
export const NEWS_FEEDS: NewsFeed[] = [
  { url: "https://www.4players.de/rss/", category: "Gaming", maxItems: 3 },
  {
    // Google-News-Topic-Feed (Gaming), bisheriger Default aus .env/Code.
    url: `${GOOGLE_NEWS}/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNREZ0ZHpFU0FtUmxLQUFQAQ${GOOGLE_NEWS_PARAMS}`,
    category: "Gaming",
    maxItems: 2,
  },
  { url: "https://www.heise.de/rss/heise-atom.xml", category: "Technik", maxItems: 2 },
  { url: "https://rss.golem.de/rss.php?feed=RSS2.0", category: "Hardware", maxItems: 2 },
  {
    url: `${GOOGLE_NEWS}/search?q=Film+Kino+Serien${GOOGLE_NEWS_PARAMS}`,
    category: "Filme & Serien",
    maxItems: 2,
  },
  {
    // "Unterhaltung" allein liefert die frischesten Treffer; die
    // TV/Streaming-Variante war im Probebetrieb fast immer veraltet.
    url: `${GOOGLE_NEWS}/search?q=Unterhaltung${GOOGLE_NEWS_PARAMS}`,
    category: "Unterhaltung",
    maxItems: 1,
  },
  {
    url: `${GOOGLE_NEWS}/search?q=Wirtschaft+Technologie+Märkte${GOOGLE_NEWS_PARAMS}`,
    category: "Wirtschaft",
    maxItems: 1,
  },
];
