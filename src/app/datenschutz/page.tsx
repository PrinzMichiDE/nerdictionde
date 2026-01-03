import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Nerdiction",
  description: "Datenschutzerklärung und Informationen zur Datenverarbeitung auf Nerdiction",
};

export default function DatenschutzPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/" aria-label="Zurück zur Startseite">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Datenschutzerklärung</h1>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        {/* Einleitung */}
        <section className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
            personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
            Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>
        </section>

        {/* Verantwortliche Stelle */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            1. Verantwortliche Stelle
          </h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              <strong className="text-foreground">Verantwortlich für die Datenverarbeitung:</strong>
              <br />
              Nerdiction
              <br />
              [Ihre Adresse hier eintragen]
              <br />
              E-Mail: <a href="mailto:kontakt@nerdiction.de" className="text-primary hover:underline">kontakt@nerdiction.de</a>
            </p>
          </div>
        </section>

        {/* Datenerfassung */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            2. Datenerfassung auf dieser Website
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">2.1 Server-Log-Dateien</h3>
              <p className="text-muted-foreground leading-relaxed">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten 
                Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. 
                Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. 
                Die Speicherung erfolgt für die Dauer von maximal 7 Tagen.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">2.2 Kontaktformular</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus 
                dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks 
                Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. 
                Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, 
                sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur 
                Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen 
                beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven 
                Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            3. Cookies
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Diese Website nutzt Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät 
            gespeichert werden. Einige Cookies sind notwendig für den Betrieb der Website, andere 
            helfen uns, die Website zu verbessern und die Nutzung zu analysieren.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Sie können Ihre Cookie-Einstellungen jederzeit in Ihrem Browser anpassen. Bitte beachten 
            Sie, dass die Deaktivierung von Cookies die Funktionalität dieser Website beeinträchtigen kann.
          </p>
        </section>

        {/* Ihre Rechte */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            4. Ihre Rechte
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Sie haben jederzeit das Recht:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
            <li>
              <strong className="text-foreground">Auskunft</strong> über Ihre bei uns gespeicherten 
              personenbezogenen Daten zu erhalten (Art. 15 DSGVO)
            </li>
            <li>
              <strong className="text-foreground">Berichtigung</strong> unrichtiger Daten zu verlangen 
              (Art. 16 DSGVO)
            </li>
            <li>
              <strong className="text-foreground">Löschung</strong> Ihrer bei uns gespeicherten Daten 
              zu verlangen (Art. 17 DSGVO)
            </li>
            <li>
              <strong className="text-foreground">Einschränkung</strong> der Datenverarbeitung zu 
              verlangen (Art. 18 DSGVO)
            </li>
            <li>
              <strong className="text-foreground">Widerspruch</strong> gegen die Verarbeitung Ihrer 
              Daten einzulegen (Art. 21 DSGVO)
            </li>
            <li>
              <strong className="text-foreground">Datenübertragbarkeit</strong> zu verlangen (Art. 20 DSGVO)
            </li>
            <li>
              <strong className="text-foreground">Beschwerde</strong> bei einer Aufsichtsbehörde 
              einzulegen (Art. 77 DSGVO)
            </li>
          </ul>
        </section>

        {/* Datensicherheit */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            5. Datensicherheit
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen 
            zufällige oder vorsätzliche Manipulationen, teilweisen oder vollständigen Verlust, 
            Zerstörung oder gegen den unbefugten Zugriff Dritter zu schützen. Unsere Sicherheitsmaßnahmen 
            werden entsprechend der technologischen Entwicklung fortlaufend verbessert.
          </p>
        </section>

        {/* Änderungen */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            6. Änderungen dieser Datenschutzerklärung
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen 
            rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der 
            Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die neue 
            Datenschutzerklärung.
          </p>
        </section>

        {/* Stand */}
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground italic">
            Stand: {new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
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

