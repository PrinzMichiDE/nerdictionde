import prisma from "@/lib/prisma";
import { generateSlug } from "@/lib/review-generation";
import { GUIDE_TOPICS, type GuideTopic } from "@/lib/guide-sources";
import openai, { OPENAI_MODEL } from "@/lib/openai";

const GUIDE_MAX_PER_RUN = parseInt(process.env.GUIDE_MAX_PER_RUN || "10", 10) || 10;

function buildGuidePrompt(topic: GuideTopic): string {
  const isWiki = topic.type === "wiki";
  
  if (isWiki) {
    return `Du bist Lexikograf des Nerd-Magazins "Nerdiction". Schreibe einen prägnanten Wiki-Eintrag zum Begriff "${topic.title}".
Kategorie: ${topic.category}
Schlüsselwörter: ${topic.keywords.join(", ")}

Schreibe einen vollständigen Wiki-Eintrag auf DEUTSCH im Markdown-Format mit Definition, Erklärung und Anwendungsbeispiel. Länge ca. 200-400 Wörter.

Gib NUR reinen Text im folgenden Format zurück:
TITEL: ${topic.title}
EXCERPT: Kurze Zusammenfassung
INHALT: [vollständiger Markdown-Inhalt]`;
  }

  return `Du bist Redakteur des Nerd-Magazins "Nerdiction". Schreibe einen umfassenden Guide zum Thema "${topic.title}".
Beschreibung: ${topic.description}
Kategorie: ${topic.category}
Schlüsselwörter: ${topic.keywords.join(", ")}

Schreibe einen vollständigen HOW-TO Guide auf DEUTSCH im Markdown-Format mit Einleitung, Schritt-für-Schritt, Tipps, Fazit. Länge ca. 600-1000 Wörter.

Gib NUR reinen Text im folgenden Format zurück:
TITEL: ${topic.title}
EXCERPT: Kurze Zusammenfassung
INHALT: [vollständiger Markdown-Inhalt]`;
}

export async function syncGuidesFromTopics() {
  console.log("🔄 Starte Guide/Wiki-Sync...");
  
  let created = 0;
  let skipped = 0;
  let failed = 0;

  const topics = [...GUIDE_TOPICS].sort(() => Math.random() - 0.5).slice(0, GUIDE_MAX_PER_RUN);

  for (const topic of topics) {
    try {
      const existing = await prisma.guide.findFirst({
        where: {
          OR: [
            { title: topic.title },
            { slug: generateSlug(topic.title) },
          ],
        },
      });

      if (existing) {
        console.log(`⏭️  Überspringe (existiert): ${topic.title}`);
        skipped++;
        continue;
      }

      console.log(`✨ Generiere: ${topic.title} (${topic.type})`);
      
      try {
        const prompt = buildGuidePrompt(topic);
        const aiResponse = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
        });

        const content = aiResponse.choices[0]?.message?.content || "";
        const lines = content.split("\n");
        let title = topic.title;
        let excerpt = topic.description;
        let body = content;
        
        // Parse simple format
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("TITEL:")) {
            title = lines[i].replace("TITEL:", "").trim();
          } else if (lines[i].startsWith("EXCERPT:")) {
            excerpt = lines[i].replace("EXCERPT:", "").trim();
          } else if (lines[i].startsWith("INHALT:")) {
            body = lines.slice(i + 1).join("\n").trim();
            break;
          }
        }

        const slug = await generateSlug(title);
        const readingTime = Math.max(3, Math.ceil((body || "").split(/\s+/).length / 200));

        await prisma.guide.create({
          data: {
            title,
            title_en: title,
            slug,
            excerpt,
            excerpt_en: excerpt,
            content: body || content,
            content_en: body || content,
            type: topic.type,
            category: topic.category,
            tags: topic.keywords,
            difficulty: topic.type === "wiki" ? "beginner" : "beginner",
            readingTime,
            status: "published",
            featured: Math.random() < 0.2,
            metaDescription: excerpt.slice(0, 160),
            publishedAt: new Date(),
          },
        });

        created++;
        console.log(`✅ Erstellt: ${title}`);
      } catch (aiError) {
        // Fallback: create basic guide
        const slug = await generateSlug(topic.title);
        await prisma.guide.create({
          data: {
            title: topic.title,
            slug,
            excerpt: topic.description,
            content: `# ${topic.title}\n\n${topic.description}\n\n## Inhalt\n\nDieser Artikel wird gerade erstellt.`,
            type: topic.type,
            category: topic.category,
            tags: topic.keywords,
            difficulty: "beginner",
            readingTime: 5,
            status: "published",
            featured: false,
            metaDescription: topic.description.slice(0, 160),
            publishedAt: new Date(),
          },
        });
        created++;
        console.log(`✅ Erstellt (Fallback): ${topic.title}`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ Fehler bei "${topic.title}":`, error instanceof Error ? error.message : error);
    }
  }

  const result = { success: failed === 0, created, skipped, failed, total: topics.length };
  console.log("📊 Ergebnis:", result);
  return result;
}
