import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `Newsletter-Anmeldung bestaetigen · Nerdiction`,
  };
}

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const subscription = await prisma.newsletterSubscription.findUnique({
    where: { confirmationToken: token },
  });

  if (!subscription) {
    notFound();
  }

  if (subscription.isActive && subscription.confirmedAt) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
          Bereits bestaetigt
        </h1>
        <p className="mt-3 text-muted-foreground">
          Dein Newsletter-Abonnement war bereits bestaetigt. Du erhaeltst
          weiterhin Neuigkeiten von Nerdiction.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Zur Startseite
        </a>
      </div>
    );
  }

  await prisma.newsletterSubscription.update({
    where: { id: subscription.id },
    data: { isActive: true, confirmedAt: new Date() },
  });

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
        Danke! Dein Abonnement ist bestaetigt.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Du erhaeltst ab jetzt Neuigkeiten von Nerdiction.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center gap-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        Zur Startseite
      </a>
    </div>
  );
}
