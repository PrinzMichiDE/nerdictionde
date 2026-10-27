import openai, { OPENAI_MODEL } from "@/lib/openai";
import { generateFakeName } from "@/lib/fake-names";
import prisma from "@/lib/prisma";
import { humanizeText } from "@/lib/humanizer";

const THREADS_PER_CATEGORY = 5;
const COMMENTS_PER_THREAD_MIN = 8;
const COMMENTS_PER_THREAD_MAX = 15;

const FORUM_USERNAMES = [
  "GamerJörg92",
  "PixelQueen",
  "CineMax",
  "SerienFan2000",
  "xX_DarkPhoenix_Xx",
  "NerdLight",
  "CouchPotato42",
  "RetroKing",
  "Konsolenkind",
  "PCMasterRace88",
  "FilmNerdBerlin",
  "RageQuitter",
  "LootGoblin",
  "NoobSlayer69",
  "CtrlAltElite",
  "BackseatGamer",
  "StorymodeMain",
  "HardcoreCasual",
  "SpoilerAlert",
  "MidnightMarauder",
  "ByteBrawler",
  "DungeonDad",
  "JRPGVet",
  "CoD_Chris",
  "AnimeOtaku23",
  "TaktikTobi",
  "BingeWatcher",
  "NetflixNinja",
  "VHS_Viking",
  "OldschoolOlli",
  "L3G3ND4RY",
  "pwnage_pro",
  "FragMaster",
  "KinoKid",
  "SerieSüchtig",
  "GameOverGuy",
  "AchievementHunter",
];

function generateForumUsername(): string {
  if (Math.random() < 0.7) {
    return FORUM_USERNAMES[Math.floor(Math.random() * FORUM_USERNAMES.length)];
  }
  // Mix with real names sometimes for variety
  return generateFakeName().replace(/\s+/g, "");
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomDateInPast(daysBack: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - randomInt(1, daysBack) * 24 * 60 * 60 * 1000);
  past.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59), randomInt(0, 999));
  return past;
}

function generateViewCount(): number {
  const roll = Math.random();
  if (roll < 0.5) return randomInt(12, 80);
  if (roll < 0.8) return randomInt(80, 250);
  if (roll < 0.95) return randomInt(250, 800);
  return randomInt(800, 2500);
}

export async function bumpViewCounts(): Promise<number> {
  try {
    const threads = await prisma.forumThread.findMany({
      select: { id: true, viewCount: true, commentCount: true },
    });

    let updated = 0;
    for (const thread of threads) {
      const base = thread.commentCount * randomInt(3, 8);
      const noise = randomInt(5, 40);
      const newViews = thread.viewCount + base + noise;

      await prisma.forumThread.update({
        where: { id: thread.id },
        data: { viewCount: newViews },
      });
      updated++;
    }
    return updated;
  } catch {
    return 0;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "gaming":
      return "Gaming";
    case "movies":
      return "Filme";
    case "series":
      return "Serien";
    default:
      return category;
  }
}

interface GeneratedThread {
  title: string;
  content: string;
  excerpt: string;
  author: string;
}

interface GeneratedForumComment {
  text: string;
  author: string;
}

async function generateThreadsForCategory(
  category: string,
  count: number
): Promise<GeneratedThread[]> {
  const categoryLabel = getCategoryLabel(category);

  const prompt = `Erstelle genau ${count} extrem realistische Forum-Diskussionsthemen zum Bereich "${categoryLabel}".

Stell dir vor, du bist ein echter deutscher Foren-Nutzer aus den 2000er/2010er Forenkultur, der auf nerdfiction.de postet. Schreibe wie echte Menschen in deutschen Gaming-/Film-/Serienforen.

STRENG VERBOTEN:
- Keine Prefixe wie "Tipp:", "Neue Indie-Perlen:", "Empfehlung:", "Fragen an", "Diskussion:"
- Keine werblichen oder journalistischen Formulierungen
- Keine Überschriften die nach Magazin-Artikel klingen
- Keine Ausrufezeichen am Ende von Titeln
- Keine Doppelpunkt-Strukturen wie "Topic: Text" oder "Frage: Text"
- Keine KI-typischen Phrasen wie "Insgesamt lässt sich sagen", "Zusammenfassend"
- Keine übertriebene Höflichkeit

SO SOLL ES KLINGEN:
- Authentisch deutsch, wie echte Foren-Posts
- Natürliche Umgangssprache, teilweise Slang
- Kleine Rechtschreibfehler sind okay (z.B. "vllt", "nix", "hab's")
- Titel kurz und knackig wie echte User
- Einleitung schreibt wie jemand der wirklich diskutieren will, nicht belehren
- Oft spekulativ, fragend oder leicht provokant
- Persönlich ohne übertrieben zu wirken

Beispiele für GUTE Titel:
- "Ist Elden Ring wirklich so gut wie alle sagen?"
- "Welche Serie habt ihr dieses Jahr abgebrochen?"
- "Warum wird Andor so gehyped aber kaum jemand redet drüber?"
- "GTA 6 - zu viel Hype oder berechtigt?"
- "Hat noch jemand Probleme mit dem neuen Patch?"

Beispiele für SCHLECHTE Titel (NIE so):
- "Tipp: Die besten Indie-Spiele 2026"
- "Neue Indie-Perlen: Diese Spiele dürft ihr nicht verpassen"
- "Die Top 10 Gaming-Highlights des Monats"

Anforderungen:
- Themen aktuell und relevant für 2024-2026
- Verschiedene Subthemen: Meinungen, Vergleiche, Frustration, Nostalgie, Fragen, Empfehlungen zwischen Usern
- Titel 4-60 Zeichen, klingen wie ein echter Foren-User
- Einleitung 2-6 Sätze, natürlich, leicht umgangssprachlich
- Kurzbeschreibung 1-2 Sätze, max 140 Zeichen
- Autor ist ein echter Foren-Username (z.B. "GamerJörg92", "xX_DarkPhoenix_Xx", "LootGoblin", "RetroKing")
- Verwende keine generischen "User123" Namen

Antworte NUR mit einem JSON-Objekt im Format:
{
  "threads": [
    {
      "title": "Titel des Threads",
      "content": "Einleitungstext...",
      "excerpt": "Kurzbeschreibung",
      "author": "Username"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const msg: any = response.choices[0]?.message;
  let raw = msg?.content;
  if (typeof raw !== "string" || (!raw.trim().startsWith("{") && !raw.trim().startsWith("["))) {
    raw = msg?.reasoning ?? msg?.content ?? "{}";
  }
  if (typeof raw !== "string") raw = "{}";
  console.log("RAW START:", raw.substring(0, 50));
  let cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  // Remove thinking tags if present
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  if (!cleaned.trim().startsWith("{") && !cleaned.trim().startsWith("[")) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
  }
  console.log("CLEANED START:", cleaned.substring(0, 50));
  // Try to find JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  let threads: GeneratedThread[] = [];
  try {
    let jsonToParse = match ? match[0] : cleaned;
    console.log("JSON LEN:", jsonToParse.length);
    try {
      const parsed = JSON.parse(jsonToParse);
      threads = Array.isArray(parsed.threads) ? parsed.threads.slice(0, count) : [];
    } catch (e) {
      throw e;
    }
  } catch (e) {
    console.error("JSON parse error for threads:", e);
    // Try one more time - maybe the JSON is concatenated
    try {
      // Look for threads array specifically
      const threadsMatch = cleaned.match(/"threads"\s*:\s*(\[[\s\S]*\])/);
      if (threadsMatch) {
        let jsonStr = threadsMatch[1];
        let openBrackets = (jsonStr.match(/\[/g)||[]).length;
        let closeBrackets = (jsonStr.match(/\]/g)||[]).length;
        while (closeBrackets < openBrackets) {
          jsonStr += ']';
          closeBrackets++;
        }
        // Also count braces
        let openBraces = (jsonStr.match(/\{/g)||[]).length;
        let closeBraces = (jsonStr.match(/\}/g)||[]).length;
        while (closeBraces < openBraces) {
          jsonStr += '}';
          closeBraces++;
        }
        const threadsArr = JSON.parse(jsonStr);
        threads = Array.isArray(threadsArr) ? threadsArr.slice(0, count) : [];
      } else {
        return [];
      }
    } catch (e2) {
      console.error("Second parse attempt failed:", e2);
      return [];
    }
  }
  
  // Humanize all thread content
  const humanizedThreads = threads.map(thread => ({
    title: thread.title,
    content: thread.content,
    excerpt: thread.excerpt,
    author: thread.author,
  }));
  
  return humanizedThreads;
}

async function generateCommentsForThread(
  threadTitle: string,
  threadContent: string,
  _category: string,
  count: number
): Promise<GeneratedForumComment[]> {

  const prompt = `Erstelle genau ${count} sehr kurze, realistische Forum-Kommentare zu folgendem Thema.

Thema: ${threadTitle}
Startbeitrag: ${threadContent.substring(0, 150)}

Halte JEDEN Kommentar maximal 1-2 Sätze, max 25 Wörter. Sei extrem knapp und natürlich wie in deutschen Foren.
Verwende Umgangssprache: "ja", "nee", "find ich auch", "same", "+1", etc.
Kleine Rechtschreibfehler ok.

Mix aus: zustimmen, widersprechen, kurze Frage, ironisch.

Autorennamen: GamerJörg92, PixelQueen, CineMax, SerienFan2000, xX_DarkPhoenix_Xx, NerdLight, CouchPotato42, RetroKing, Konsolenkind, PCMasterRace88, FilmNerdBerlin, LootGoblin, FragMaster, BackseatGamer, StorymodeMain

Antworte NUR mit einem JSON-Objekt im Format:
{
  "comments": [
    { "text": "Kommentartext...", "author": "Username" }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });

  const msg: any = response.choices[0]?.message;
  let raw = msg?.content;
  // If content is null/undefined or doesn't look like JSON, try reasoning
  if (typeof raw !== "string" || !raw.trim().startsWith("{") && !raw.trim().startsWith("[")) {
    raw = msg?.reasoning ?? msg?.content ?? "{}";
  }
  if (typeof raw !== "string") raw = "{}";
  let cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  // If still doesn't look like JSON, look for JSON object in the text
  if (!cleaned.trim().startsWith("{") && !cleaned.trim().startsWith("[")) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
  }
  let parsed: any;
  try {
    const match = cleaned.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : cleaned);
  } catch (e) {
    console.error("JSON parse error for comments:", e);
    try {
      const commentsMatch = cleaned.match(/"comments"\s*:\s*(\[[\s\S]*\])/);
      if (commentsMatch) {
        let jsonStr = commentsMatch[1];
        // Try to fix truncated JSON
        // Count brackets
        let openBrackets = (jsonStr.match(/\[/g)||[]).length;
        let closeBrackets = (jsonStr.match(/\]/g)||[]).length;
        while (closeBrackets < openBrackets) {
          jsonStr += ']';
          closeBrackets++;
        }
        parsed = { comments: JSON.parse(jsonStr) };
      } else {
        return [];
      }
    } catch (e2) {
      console.error("Second parse attempt failed:", e2);
      return [];
    }
  }

  if (!Array.isArray(parsed.comments)) return [];

  const comments = parsed.comments
    .slice(0, count)
    .map((c: { text?: unknown; author?: unknown }) => ({
      text: String(c.text || "").trim(),
      author: String(c.author || "").trim() || generateForumUsername(),
    }))
    .filter((c: GeneratedForumComment) => c.text.length > 0);

  return comments;
}

/**
 * Generates forum threads with initial comments for a given category.
 * Saves everything to the database.
 */
export async function generateForumThreads(
  category: string,
  count: number = THREADS_PER_CATEGORY
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  try {
    const threads = await generateThreadsForCategory(category, count);

    for (const thread of threads) {
      try {
        const slug = slugify(thread.title);

        const existing = await prisma.forumThread.findUnique({ where: { slug } });
        if (existing) {
          errors.push(`Thread "${thread.title}" existiert bereits`);
          continue;
        }

        const createdAt = randomDateInPast(randomInt(7, 120)); // 1 week to ~4 months ago
        const lastActivityAt = new Date(createdAt.getTime() + randomInt(0, 30) * 24 * 60 * 60 * 1000);
        if (lastActivityAt > new Date()) lastActivityAt.setTime(new Date().getTime());

        const saved = await prisma.forumThread.create({
          data: {
            title: thread.title,
            slug,
            category,
            content: thread.content,
            excerpt: thread.excerpt,
            author: thread.author || generateForumUsername(),
            viewCount: generateViewCount(),
            score: randomInt(-2, 15), // mostly positive, some neutral/negative
            createdAt,
            lastActivityAt,
          },
        });

        const commentCount = randomInt(COMMENTS_PER_THREAD_MIN, COMMENTS_PER_THREAD_MAX);
        const comments = await generateCommentsForThread(
          thread.title,
          thread.content,
          category,
          commentCount
        );

        if (comments.length > 0) {
          const baseTime = saved.createdAt.getTime();
          const now = Date.now();
          await prisma.forumComment.createMany({
            data: comments.map((c, idx) => {
              // Spread comments over time after thread creation
              const hoursAfter = randomInt(0, 72) + idx * randomInt(1, 12); // some spread
              let commentTime = new Date(baseTime + hoursAfter * 60 * 60 * 1000);
              if (commentTime.getTime() > now) commentTime = new Date(now - randomInt(0, 7) * 24 * 60 * 60 * 1000);
              return {
                threadId: saved.id,
                text: c.text,
                author: c.author || generateForumUsername(),
                isAiGenerated: true,
                status: "approved",
                createdAt: commentTime,
                score: randomInt(-1, 12),
              };
            }),
          });

          // Update last activity to most recent comment
          const mostRecent = new Date(baseTime + randomInt(24, 96) * 60 * 60 * 1000);
          if (mostRecent > new Date()) mostRecent.setTime(new Date().getTime() - randomInt(0, 48) * 60 * 60 * 1000);

          await prisma.forumThread.update({
            where: { id: saved.id },
            data: { 
              commentCount: comments.length,
              lastActivityAt: mostRecent,
            },
          });
        }

        created++;
      } catch (e) {
        errors.push(`Fehler bei Thread "${thread.title}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`Thread-Generierung fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { created, errors };
}

/**
 * Generates AI comments for an existing forum thread.
 */
export async function generateForumCommentsForThread(
  threadId: string,
  count: number = 10
): Promise<{ created: number; error?: string }> {
  try {
    const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return { created: 0, error: "Thread nicht gefunden" };
    }

    const comments = await generateCommentsForThread(
      thread.title,
      thread.content,
      thread.category,
      count
    );

    if (comments.length === 0) {
      return { created: 0, error: "Keine Kommentare generiert" };
    }

    const now = Date.now();
    await prisma.forumComment.createMany({
      data: comments.map((c, idx) => {
        const hoursAgo = randomInt(0, 48) + idx * randomInt(0, 6);
        const commentTime = new Date(now - hoursAgo * 60 * 60 * 1000);
        return {
          threadId: thread.id,
          text: c.text,
          author: c.author || generateForumUsername(),
          isAiGenerated: true,
          status: "approved",
          createdAt: commentTime,
          score: randomInt(-1, 10),
        };
      }),
    });

    await prisma.forumThread.update({
      where: { id: thread.id },
      data: {
        commentCount: { increment: comments.length },
        lastActivityAt: new Date(now - randomInt(0, 12) * 60 * 60 * 1000),
      },
    });

    return { created: comments.length };
  } catch (e) {
    return { created: 0, error: e instanceof Error ? e.message : String(e) };
  }
}
