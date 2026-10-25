import { Metadata } from "next";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/seo";
import { ArrowLeft, Settings as SettingsIcon, Bell } from "lucide-react";
import Link from "next/link";
import { NotificationPreferencesClient } from "./NotificationPreferencesClient";
import { FEATURE_ENHANCED_NOTIFICATION_PREFS, FEATURE_PUSH_NOTIFICATIONS } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Benachrichtigungen - Nerdiction",
  description: "Verwalte deine Benachrichtigungs-Einstellungen: Typen, Kanäle, Frequenz und Stummschaltungen.",
  robots: { index: false, follow: false },
  alternates: { canonical: `${getSiteUrl()}/einstellungen/benachrichtigungen` },
};

export default async function NotificationSettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/einstellungen/benachrichtigungen");

  // Feature flag check
  if (!FEATURE_ENHANCED_NOTIFICATION_PREFS) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <Link
          href="/einstellungen"
          className="group -mt-1 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Zurück zu den Einstellungen
        </Link>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-semibold tracking-tight flex items-center gap-2">
            <SettingsIcon className="size-7 text-primary" />
            Benachrichtigungen
          </h1>
          <p className="text-sm text-muted-foreground">
            Dieses Feature ist aktuell nicht verfügbar.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
          Erweiterte Benachrichtigungs-Präferenzen sind deaktiviert.
          <br />
          Bitte wende dich an den Administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link
        href="/einstellungen"
        className="group -mt-1 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Zurück zu den Einstellungen
      </Link>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Bell className="size-7 text-primary" />
          Benachrichtigungen
        </h1>
        <p className="text-sm text-muted-foreground">
          Verwalte, wie und wann du über Aktivitäten auf Nerdiction informiert wirst.
          Wähle pro Benachrichtigungs-Typ die Kanäle (In-App, E-Mail, Push) und die Frequenz (Sofort, Täglich, Wöchentlich).
        </p>
      </div>

      <NotificationPreferencesClient
        userId={session.userId}
        pushEnabled={FEATURE_PUSH_NOTIFICATIONS}
      />
    </div>
  );
}