import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

const subscribeSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse an."),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Ungültige Eingabe." },
        { status: 400 },
      );
    }

    const { email, source } = parsed.data;

    // Bestätigungs-Token generieren; Abonnement erst inaktiv,
    // bis der Nutzer den Bestätigungs-Link aufgerufen hat (Double-Optin).
    const confirmationToken = randomUUID();

    // Idempotent: Bestehendes Abonnement reaktivieren, sonst neu anlegen.
    const subscription = await prisma.newsletterSubscription.upsert({
      where: { email },
      update: {
        isActive: false,
        confirmationToken,
        unsubscribedAt: null,
        ...(source ? { source } : {}),
      },
      create: {
        email,
        source,
        isActive: false,
        confirmationToken,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Danke! Bitte bestaetige deine Anmeldung ueber den Bestätigungs-Link, den du erhalten hast.",
      data: {
        id: subscription.id,
        email: subscription.email,
        // MVP ohne E-Mail-Versand: Token sichtbar machen, damit bestaetigt werden kann.
        confirmationToken,
      },
    });
  } catch (error: any) {
    // Unique-Verstoss auf E-Mail defensiv abfangen (Race-Condition).
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits angemeldet." },
        { status: 409 },
      );
    }
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Die Anmeldung ist fehlgeschlagen. Bitte versuche es später erneut." },
      { status: 500 },
    );
  }
}
