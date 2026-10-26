import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `Newsletter-Abmeldung · Nerdiction`,
  };
}

export default async function UnsubscribePage({
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

  await prisma.newsletterSubscription.update({
    where: { id: subscription.id },
    data: { isActive: false, unsubscribedAt: new Date() },
  });

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
        Du wurdest abgemeldet
      </h1>
      <p className="mt-3 text-muted-foreground">
        Du erhaeltst keine Newsletter-E-Mails mehr von Nerdiction.
        Wenn du dich wieder anmelden moechtest, kannst du das jederzeit
        auf der Startseite tun.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
