import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Impressum | Nerdiction",
  description: "Impressum und rechtliche Informationen zu Nerdiction",
};

export default function ImpressumPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/" aria-label="Zurück zur Startseite">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Impressum</h1>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        {/* Angaben gemäß § 5 TMG */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            Angaben gemäß § 5 TMG
          </h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              <strong className="text-foreground">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong>
              <br />
              Nerdiction
            </p>
            <p>
              <strong className="text-foreground">Anschrift:</strong>
              <br />
              [Ihre Adresse hier eintragen]
            </p>
            <p>
              <strong className="text-foreground">Kontakt:</strong>
              <br />
              E-Mail: <a href="mailto:kontakt@nerdiction.de" className="text-primary hover:underline">kontakt@nerdiction.de</a>
            </p>
          </div>
        </section>

        {/* Haftungsausschluss */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            Haftungsausschluss (Disclaimer)
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Haftung für Inhalte</h3>
              <p className="text-muted-foreground leading-relaxed">
                Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                Vollständigkeit und Aktualität der Inhalte kann ich jedoch keine Gewähr übernehmen. 
                Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten 
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich als 
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde 
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige 
                Tätigkeit hinweisen.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Haftung für Links</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen 
                Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. 
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber 
                der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung 
                auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der 
                Verlinkung nicht erkennbar.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Urheberrecht</h3>
              <p className="text-muted-foreground leading-relaxed">
                Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen 
                Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung 
                außerhalb der Grenzen des Urheberrechtes bedürfen meiner schriftlichen Zustimmung. 
                Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch 
                gestattet.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong className="text-foreground">Hinweis zum KI-Training:</strong> Die Nutzung der 
                Inhalte dieser Website zum Training von künstlicher Intelligenz oder Large Language 
                Models (LLMs) ist ausdrücklich untersagt.
              </p>
            </div>
          </div>
        </section>

        {/* Streitschlichtung */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            Streitschlichtung
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a 
              href="https://ec.europa.eu/consumers/odr/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Ich bin nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>

      {/* Back to Home */}
      <div className="pt-8 border-t">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="size-4 mr-2" />
            Zurück zur Startseite
          </Link>
        </Button>
      </div>
    </div>
  );
}

