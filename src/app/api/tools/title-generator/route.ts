import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { z } from "zod";

const titleGeneratorSchema = z.object({
  game: z.string().optional(),
  theme: z.string().optional(),
  mood: z.string().optional(),
});

/**
 * POST /api/tools/title-generator
 * Generates optimized stream titles using AI
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireTwitchAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const body = await req.json();
    const { game, theme, mood } = titleGeneratorSchema.parse(body);

    if (!game && !theme) {
      return NextResponse.json(
        { error: "Game or theme is required" },
        { status: 400 }
      );
    }

    // Generate titles using OpenAI
    const prompt = `Erstelle 5 optimierte Twitch Stream-Titel für einen deutschen Streamer.

Game/Kategorie: ${game || "Nicht angegeben"}
Thema/Inhalt: ${theme || "Nicht angegeben"}
Stimmung: ${mood || "Nicht angegeben"}

Die Titel sollten:
- Ansprechend und einladend sein
- Emojis enthalten (max. 2 pro Titel)
- Zwischen 30-60 Zeichen lang sein
- Auf Deutsch sein
- Verschiedene Stile haben (ernst, witzig, actionreich, etc.)

Antworte nur mit den 5 Titeln, jeweils in einer neuen Zeile, ohne Nummerierung oder Bullet Points.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte für Twitch Stream-Titel. Erstelle ansprechende, optimierte Titel die Viewer anziehen.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const generatedText = completion.choices[0]?.message?.content || "";
    const titles = generatedText
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: { titles },
    });
  } catch (error) {
    console.error("Title generator error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate titles" },
      { status: 500 }
    );
  }
}
