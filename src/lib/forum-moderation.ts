import openai, { OPENAI_MODEL } from "@/lib/openai";

export interface ModerationResult {
  approved: boolean;
  reason: string;
}

/**
 * Moderates a forum comment using AI.
 * Returns whether the comment should be approved or rejected, with a reason.
 */
export async function moderateForumComment(text: string): Promise<ModerationResult> {
  const prompt = `Du bist ein Forum-Moderator für eine Gaming-, Film- und Serien-Community. 
Prüfe den folgenden Kommentar auf Verstöße gegen Community-Regeln.

Kommentar: "${text}"

Bewerte ob der Kommentar:
- Hassrede, Diskriminierung oder Beleidigungen enthält
- Spam oder Werbung ist
- Extrem toxisch oder giftig ist
- Against the rules of a friendly community discussion is
- Sexuell explizit oder unangemessen ist
- Persönliche Daten von Dritten preisgibt
- Offensichtlich trollt oder provoziert

Antworte NUR mit einem JSON-Objekt:
{
  "approved": true oder false,
  "reason": "Kurze Begründung auf Deutsch (max 100 Zeichen)"
}

Sei dabei fair und Community-freundlich. Normale Kritik, auch scharfe Wortwahl, ist erlaubt. Nur echte Verstöße sollen abgelehnt werden.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.1,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : cleaned);

    return {
      approved: Boolean(parsed.approved),
      reason: String(parsed.reason || "").trim() || (parsed.approved ? "Freigegeben" : "Abgelehnt"),
    };
  } catch (error) {
    console.error("Moderation failed, defaulting to approved:", error);
    return {
      approved: true,
      reason: "Automatisch freigegeben",
    };
  }
}
