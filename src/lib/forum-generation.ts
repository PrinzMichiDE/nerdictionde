import openai, { OPENAI_MODEL } from "@/lib/openai";
import { generateFakeName } from "@/lib/fake-names";
import prisma from "@/lib/prisma";

const THREADS_PER_CATEGORY = 5;
const COMMENTS_PER_THREAD_MIN = 8;
const COMMENTS_PER_THREAD_MAX = 15;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
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

  const prompt = `Erstelle genau ${count} realistische, untereinander unterschiedliche Forum-Diskussionsthemen zum Bereich "${categoryLabel}".

Jedes Thema soll eine naturally klingende Diskussion anregen – wie in einem echten Gaming/Film/Serien-Forum.

Anforderungen:
- Themen aktuell und relevant (2026)
- Verschiedene Subthemen: Rankings, Meinungen, Empfehlungen, Vergleiche, News, Fragen
- Verschiedene Tönungen: enthusiastisch, kritisch, neugierig, diskussionswürdig
- Titel sind prägnant und klickwürdig (wie in echten Foren)
- Alle ${count} Themen inhaltlich klar voneinander abgrenzen
- Keine Beleidigungen, keine Markennamen erfinden

Für jedes Thema:
1. Einen prägnanten Titel (max 80 Zeichen)
2. Einen kurzen Einleitungstext als Thread-Start (3-8 Sätze), der das Thema erläutert
3. Eine Kurzbeschreibung (1-2 Sätze, max 160 Zeichen)
4. Einen fiktiven Autor-Namen

Antworte NUR mit einem JSON-Objekt im Format:
{
  "threads": [
    {
      "title": "Titel des Threads",
      "content": "Einleitungstext als Markdown...",
      "excerpt": "Kurzbeschreibung",
      "author": "Fiktiver Name"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : cleaned);

  return Array.isArray(parsed.threads) ? parsed.threads.slice(0, count) : [];
}

async function generateCommentsForThread(
  threadTitle: string,
  threadContent: string,
  category: string,
  count: number
): Promise<GeneratedForumComment[]> {
  const categoryLabel = getCategoryLabel(category);

  const prompt = `Erstelle genau ${count} realistische, untereinander unterschiedliche Forum-Kommentare zu folgendem Diskussionsthema im Bereich "${categoryLabel}".

Thema: ${threadTitle}
Startbeitrag: ${threadContent.substring(0, 500)}

Anforderungen:
- Jeder Kommentar 1-5 Sätze, natürlich und authentisch
- Verschiedene Perspektiven: zustimmend, kritisch, neutral, ergänzend, persönliche Erfahrung
- Verschiedene Stile: kurz bestätigend, ausführlich, Frage, Tip, Gegenmeinung
- Alle Kommentare inhaltlich klar voneinander abgrenzen
- Keine Sätze oder Formulierungen wiederholen
- Keine Beleidigungen
- Autorennamen sollen wie echte Forum-Usernamen klingen (keine echten Namen, sondern Usernicks wie "GamerJörg92", "PixelQueen", "CineMax", "SerienFan2000" etc.)

Antworte NUR mit einem JSON-Objekt im Format:
{
  "comments": [
    { "text": "Kommentartext...", "author": "Username123" }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : cleaned);

  if (!Array.isArray(parsed.comments)) return [];

  return parsed.comments
    .slice(0, count)
    .map((c: { text?: unknown; author?: unknown }) => ({
      text: String(c.text || "").trim(),
      author: String(c.author || "").trim() || generateFakeName(),
    }))
    .filter((c: GeneratedForumComment) => c.text.length > 0);
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

        const saved = await prisma.forumThread.create({
          data: {
            title: thread.title,
            slug,
            category,
            content: thread.content,
            excerpt: thread.excerpt,
            author: thread.author,
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
          await prisma.forumComment.createMany({
            data: comments.map((c) => ({
              threadId: saved.id,
              text: c.text,
              author: c.author,
              isAiGenerated: true,
              status: "approved",
            })),
          });

          await prisma.forumThread.update({
            where: { id: saved.id },
            data: { commentCount: comments.length },
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

    await prisma.forumComment.createMany({
      data: comments.map((c) => ({
        threadId: thread.id,
        text: c.text,
        author: c.author,
        isAiGenerated: true,
        status: "approved",
      })),
    });

    await prisma.forumThread.update({
      where: { id: thread.id },
      data: {
        commentCount: { increment: comments.length },
        lastActivityAt: new Date(),
      },
    });

    return { created: comments.length };
  } catch (e) {
    return { created: 0, error: e instanceof Error ? e.message : String(e) };
  }
}
