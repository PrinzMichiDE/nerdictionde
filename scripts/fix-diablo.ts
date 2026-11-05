import prisma from "../src/lib/prisma";
import openai, { OPENAI_MODEL } from "../src/lib/openai";
import { generateSEOMetadata } from "../src/lib/seo-generation";

async function main() {
  const slug = "diablo-4-mw31rtsf";
  const review = await prisma.review.findUnique({ where: { slug: slug } });
  if (!review) {
    console.log("not found");
    return;
  }

  const prompt = `Du bist ein erfahrener Redakteur für Nerdiction.de. Schreibe eine vollständige, professionelle Review für "Diablo 4" auf Deutsch.\n\nAnforderungen:\n- Mindestens 4500 Zeichen\n- Struktur mit Inhaltsverzeichnis, H2/H3 mit Ankern {#...}\n- Abschnitte: Einleitung, Story & Kampagne, Gameplay & Klassen, Open World & Endgame, Grafik & Technik, Sound & Atmosphäre, Progression & Loot, Multiplayer, Vor- und Nachteile (genau 5 Pros, 5 Cons), Fazit\n- Objektiver Ton, keine KI-Erwähnung\n- Fließtext\n- Score 0-100\n\nAntworte NUR mit validem JSON im exakten Format: {"title":"Diablo 4","content":"...","pros":["p1","p2","p3","p4","p5"],"cons":["c1","c2","c3","c4","c5"],"score":85}`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 6000,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  console.log("RAW LEN:", raw.length);
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const generated = JSON.parse(cleaned);
    console.log("PARSED OK, content len:", generated.content?.length);

    let seoMeta = null;
    try {
      seoMeta = await generateSEOMetadata(generated.title, generated.content, "game");
    } catch (e) {
      // ignore
    }

    await prisma.review.update({
      where: { id: review.id },
      data: {
        content: generated.content,
        content_en: generated.content,
        title: generated.title,
        score: generated.score,
        pros: generated.pros,
        cons: generated.cons,
        metaDescription: seoMeta ? seoMeta.metaDescription : review.metaDescription,
        metaKeywords: seoMeta ? seoMeta.metaKeywords : review.metaKeywords,
      },
    });

    console.log("done");
  } catch (e) {
    console.error("PARSE ERR:", e.message);
    console.log(raw.substring(0, 100));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
