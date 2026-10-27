import openai, { OPENAI_MODEL } from "@/lib/openai";
import prisma from "@/lib/prisma";
import { generateFakeName } from "@/lib/fake-names";

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 8;
const MIN_ANSWERS_PER_QUESTION = 2;
const MAX_ANSWERS_PER_QUESTION = 5;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function generateBotUserData(index: number) {
  const name = generateFakeName();
  const username = `bot_${name.toLowerCase().replace(/[^a-z0-9]/g, "")}_${index}_${Date.now().toString(36)}`;
  return {
    twitchId: `bot_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 8)}`,
    username,
    displayName: name,
    accessToken: `bot_token_${Math.random().toString(36)}`,
    profileImageUrl: null,
  };
}

async function ensureBotUsers(count: number) {
  // Try to get existing bot users
  const existingBots = await prisma.twitchUser.findMany({
    where: {
      username: { startsWith: "bot_" },
    },
    take: count + 10,
  });

  if (existingBots.length >= count) {
    return existingBots.slice(0, count);
  }

  // Create new bot users
  const botsToCreate = count - existingBots.length;
  const newBots = [];
  for (let i = 0; i < botsToCreate; i++) {
    try {
      const botData = generateBotUserData(i);
      const bot = await prisma.twitchUser.create({
        data: botData,
      });
      newBots.push(bot);
    } catch (error) {
      // Try again with different data if unique constraint fails
      try {
        const botData = generateBotUserData(i + 1000);
        const bot = await prisma.twitchUser.create({
          data: botData,
        });
        newBots.push(bot);
      } catch (e) {
        console.warn("Failed to create bot user:", e);
      }
    }
  }

  return [...existingBots, ...newBots];
}

export interface GenerateQAInput {
  reviewTitle: string;
  reviewContent?: string;
  score: number;
  pros: string[];
  cons: string[];
  category?: string;
}

function buildQAPrompt(input: GenerateQAInput): string {
  return `Erstelle realistische Fragen & Antworten (Q&A) für eine Community zu folgender Review auf Deutsch.

Review-Titel: ${input.reviewTitle}
Kategorie: ${input.category || "Produkt"}
Bewertung (Score 0–100): ${input.score}

Pro-Punkte: ${input.pros.length ? input.pros.slice(0, 5).join("; ") : "–"}
Contra-Punkte: ${input.cons.length ? input.cons.slice(0, 5).join("; ") : "–"}

Anforderungen:
- Erstelle zwischen 4 und 6 Fragen, die echte Kaufinteressenten stellen würden.
- Zu jeder Frage erstelle 2-4 hilfreiche Antworten aus unterschiedlichen Perspektiven.
- Fragen sollen natürlich klingen (z.B. "Lohnt sich das für...", "Wie ist die Akkulaufzeit...", "Vergleich mit...").
- Antworten sollen konkret, hilfreich und authentisch sein.
- Mindestens eine Antwort pro Frage sollte besonders hilfreich wirken.
- Verwende verschiedene Tonfälle (erfahrener Nutzer, Einsteiger, etc.).
- Keine Werbung, keine Links, keine beleidigenden Inhalte.
- Antworte NUR mit einem JSON-Objekt im Format:
{
  "questions": [
    {
      "title": "Frage in natürlicher Sprache",
      "body": "Optionaler Kontext zur Frage",
      "answers": [
        "Antwort 1",
        "Antwort 2",
        "..."
      ]
    }
  ]
}

Keine Autorennamen, keine Bewertungen.`;
}

export async function generateAndSaveQAForReview(
  reviewId: string,
  input: GenerateQAInput
): Promise<void> {
  try {
    // Check if Q&A already exists
    const existingCount = await prisma.reviewQA.count({
      where: { reviewId, deletedAt: null },
    });
    if (existingCount > 0) {
      console.log(`Q&A already exists for review ${reviewId}, skipping generation`);
      return;
    }

    const prompt = buildQAPrompt(input);

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const str = match ? match[0] : cleaned;
    
    let parsed: any;
    try {
      parsed = JSON.parse(str);
    } catch (error) {
      console.error("Failed to parse Q&A JSON:", error);
      return;
    }

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      console.log("No questions generated for review");
      return;
    }

    // Need bot users for authors
    const totalAnswers = parsed.questions.reduce(
      (sum: number, q: any) => sum + (Array.isArray(q.answers) ? q.answers.length : 0),
      0
    );
    const botUsers = await ensureBotUsers(Math.max(parsed.questions.length, Math.ceil(totalAnswers / 2)) + 5);

    if (botUsers.length === 0) {
      console.error("No bot users available for Q&A generation");
      return;
    }

    // Create questions and answers
    for (let qi = 0; qi < parsed.questions.length; qi++) {
      const q = parsed.questions[qi];
      if (!q.title || typeof q.title !== "string") continue;

      const questionAuthor = botUsers[qi % botUsers.length];
      
      try {
        const question = await prisma.reviewQA.create({
          data: {
            reviewId,
            authorId: questionAuthor.id,
            title: q.title.slice(0, 120),
            body: q.body && typeof q.body === "string" ? q.body.slice(0, 1000) : null,
            status: "RESOLVED", // Mark as resolved since we have answers
            score: randomInt(1, 15),
            answerCount: Array.isArray(q.answers) ? q.answers.length : 0,
          },
        });

        // Create answers
        if (Array.isArray(q.answers)) {
          for (let ai = 0; ai < q.answers.length; ai++) {
            const answerText = q.answers[ai];
            if (!answerText || typeof answerText !== "string") continue;

            const answerAuthor = botUsers[(qi + ai + 1) % botUsers.length];
            const isAccepted = ai === 0 && q.answers.length > 0; // Accept first answer

            const answer = await prisma.qAAnswer.create({
              data: {
                questionId: question.id,
                authorId: answerAuthor.id,
                body: answerText,
                score: isAccepted ? randomInt(10, 30) : randomInt(0, 10),
                isAccepted,
              },
            });

            if (isAccepted) {
              await prisma.reviewQA.update({
                where: { id: question.id },
                data: {
                  acceptedAnswerId: answer.id,
                  status: "RESOLVED",
                },
              });
            }
          }
        }
      } catch (error) {
        console.error(`Failed to create Q&A for question ${qi}:`, error);
      }
    }

    console.log(`✅ Generated Q&A for review ${reviewId}`);
  } catch (error) {
    console.error("Q&A generation failed:", error);
  }
}
