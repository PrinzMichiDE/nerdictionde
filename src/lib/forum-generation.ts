import openai, { OPENAI_MODEL } from "@/lib/openai";
import { generateFakeName } from "@/lib/fake-names";
import prisma from "@/lib/prisma";

const THREADS_PER_CATEGORY = 5;
const COMMENTS_PER_THREAD_MIN = 8;
const COMMENTS_PER_THREAD_MAX = 15;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
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

  const prompt = `Erstelle genau ${count} realistische Forum-Diskussionsthemen zum Bereich "${categoryLabel}".

Stell dir vor du liest echte Beiträge auf Reddit, GamePro oder MyFilme. So sollen die Titel und Einleitungen klingen.

STRENG VERBOTEN:
- Keine Prefixe wie "Tipp:", "Neue Indie-Perlen:", "Empfehlung:", "Fragen an", "Diskussion:"
- Keine werblichen oder journalistischen Formulierungen
- Keine Überschriften die nach Magazin-Artikel klingen
- Keine Ausrufezeichen am Ende von Titeln
- Keine Doppelpunkt-Strukturen wie "Topic: Text" oder "Frage: Text"

SO SOLL ES KLINGEN:
- Normale Leute die diskutieren wollen
- Titel wie man sie in echten Foren sieht: kurze Frage, Meinung, Vergleich, oder坛系
- Einleitung klingt wie jemand der seine Meinung schreibt, nicht wie ein Journalist

Beispiele für GUTE Titel:
- "Ist Elden Ring wirklich so gut wie alle sagen?"
- "Welche Serie habt ihr dieses Jahr abgebrochen?"
- "Spider-Man 3 oder Batman Begins – was war euer Film des Jahres?"
- "Warum spielt keiner mehr mit mir Online?"

Beispiele für SCHLECHTE Titel (NIE so):
- "Tipp: Die besten Indie-Spiele 2026"
- "Neue Indie-Perlen: Diese Spiele dürft ihr nicht verpassen"
- "Die Top 10 Gaming-Highlights des Monats"

Anforderungen:
- Themen aktuell und relevant (2026)
- Verschiedene Subthemen: Rankings, Meinungen, Empfehlungen, Vergleiche, Fragen
- Titel 5-80 Zeichen, klingen wie ein normaler Foren-User
- Einleitung 3-8 Sätze, schreibt wie ein Mensch der diskutieren will
- Kurzbeschreibung 1-2 Sätze, max 160 Zeichen
- Autor ist ein Fake-Name wie "RetroGamer88", "MovieBuff2026"

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

  const raw = response.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : cleaned);

  return Array.isArray(parsed.threads) ? parsed.threads.slice(0, count) : [];
}

async function generateCommentsForThread(
  threadTitle: string,
  threadContent: string,
  _category: string,
  count: number
): Promise<GeneratedForumComment[]> {

  const prompt = `Erstelle genau ${count} Forum-Kommentare zu folgendem Thema.

Thema: ${threadTitle}
Startbeitrag: ${threadContent.substring(0, 500)}

STRENG VERBOTEN:
- Keine formellen oder journalistischen Formulierungen
- Keineperfekten Grammatik-Sätze (das klingt nach KI!)
- Keine Wiederholungen wie "Ich finde das super toll und großartig"
- Keine Floskeln wie "Insgesamt lässt sich sagen", "Zusammenfassend"

SO SOLL ES KLINGEN:
- Wie echte User die auf ihrem Handy tippen
- Umgangssprache ist erlaubt: "geht gar nicht", "ist echt krass", "verstehe ich null"
- Kurze Sätze, manchmal nur ein Satz
- Emojis sind okay aber sparsam: 😂 👍 🤔
- Rechtschreibfehler passieren (aber nicht übertreiben)
- Manche kommentieren kurz "same" oder "bin da完全"
- Persönliche Anekdote: "hab das letzte Jahr gespielt und..."
- Frage am Ende: "jemand das gleiche Problem?"
- Vergleiche: "ist besser als X tbh"
- Kritik ohne auszuschweifen: "nichts besonderes ehrlich gesagt"

Autorennamen sollen wie echte Foren-User klingen:
- GamerJörg92, PixelQueen, CineMax, SerienFan2000
- xX_DarkPhoenix_Xx, NerdLight, CouchPotato42, RetroKing
- Konsolenkind, PCMasterRace88, FilmNerdBerlin

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
            viewCount: generateViewCount(),
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
