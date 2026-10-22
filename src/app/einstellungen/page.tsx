import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { PushNotificationManager } from "@/components/pwa/PushNotificationManager";

export const metadata: Metadata = {
  title: "Einstellungen - Nerdiction",
  description: "Push-Benachrichtigungen und App-Einstellungen verwalten.",
  robots: { index: false, follow: false },
  alternates: { canonical: `${getSiteUrl()}/einstellungen` },
};

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/einstellungen");

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Link
        href="/profil"
        className="group -mt-1 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Zurück zum Profil
      </Link>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight flex items-center gap-2">
          <SettingsIcon className="size-7 text-primary" />
          Einstellungen
        </h1>
        <p className="text-sm text-muted-foreground">
          Verwalte deine Push-Benachrichtigungen für die Nerdiction-App.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 font-serif text-xl font-semibold">Push-Benachrichtigungen</h2>
        <PushNotificationManager />
      </section>
    </div>
  );
}
