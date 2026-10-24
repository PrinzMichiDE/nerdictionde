import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { PushNotificationManager } from "@/components/pwa/PushNotificationManager";
import { ReadingHistoryPrivacyToggle } from "@/components/reading-history/ReadingHistoryPrivacyToggle";
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Einstellungen - Nerdiction",
  description: "Push-Benachrichtigungen, Datenschutz und App-Einstellungen verwalten.",
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
          Verwalte deine Push-Benachrichtigungen, Datenschutz-Einstellungen und App-Präferenzen.
        </p>
      </div>

      {FEATURE_CATEGORY_SUBSCRIPTIONS && (
        <Link
          href="/einstellungen/kategorien"
          className="rounded-lg border border-border bg-card p-6 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold">Kategorie-Abos</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Wähle Kategorien, für die du bei neuen Reviews benachrichtigt werden möchtest.
              </p>
            </div>
            <span className="text-muted-foreground">→</span>
          </div>
        </Link>
      )}

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 font-serif text-xl font-semibold">Push-Benachrichtigungen</h2>
        <PushNotificationManager />
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 font-serif text-xl font-semibold">Datenschutz</h2>
        <ReadingHistoryPrivacyToggle />
      </section>
    </div>
  );
}
