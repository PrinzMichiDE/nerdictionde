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
        <h1 className="text-3xl font-bold tracking-tight" style={{ overflowWrap: "break-word", minWidth: 0 }}>Datenschutzerklärung</h1>
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
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
            1. Verantwortliche Stelle
          </h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              <strong className="text-foreground">Verantwortlich für die Datenverarbeitung:</strong>
              <br />
              Michel Fritzsch
              <br />
              [Vollständige Postanschrift gemäß § 5 TMG eintragen]
              <br />
              Straße und Hausnummer
              <br />
              PLZ und Ort
              <br />
              Deutschland
              <br />
              E-Mail: <a href="mailto:michel@michelfritzsch.de" className="text-primary hover:underline">michel@michelfritzsch.de</a>
            </p>
          </div>
        </section>

        {/* Datenerfassung */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
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
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
            3. Cookies und Analyse-Tools
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Diese Website nutzt Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät 
            gespeichert werden. Einige Cookies sind technisch notwendig für den Betrieb der Website.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">3.1 Cookie-Consent</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wir verwenden ein Cookie-Consent-Management-System. Nur mit Ihrer ausdrücklichen Einwilligung 
                werden nicht-technisch notwendige Cookies gesetzt. Sie können Ihre Einwilligung jederzeit 
                über die Cookie-Einstellungen widerrufen, indem Sie die Seite neu laden und Ihre Wahl ändern.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3.2 Google Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diese Website nutzt Google Analytics, einen Webanalysedienst der Google Ireland Limited, 
                Gordon House, Barrow Street, Dublin 4, Irland ("Google"). Google Analytics verwendet Cookies, 
                die eine Analyse der Benutzung der Website durch Sie ermöglichen. 
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). 
                Die Einwilligung wird über unser Cookie-Consent-Banner eingeholt.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong className="text-foreground">IP-Anonymisierung:</strong> Wir haben die IP-Anonymisierung 
                aktiviert, sodass Ihre IP-Adresse von Google innerhalb von Mitgliedstaaten der Europäischen Union 
                oder in anderen Vertragsstaaten des Abkommens über den Europäischen Wirtschaftsraum zuvor gekürzt wird.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong className="text-foreground">Drittlandtransfer:</strong> Google kann Ihre Daten auch in die 
                USA übertragen. Google ist unter dem EU-US Data Privacy Framework zertifiziert.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Weitere Informationen finden Sie in der{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Datenschutzerklärung von Google
                </a>
                .
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3.3 Vercel Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wir nutzen Vercel Analytics der Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. 
                Vercel Analytics ist ein datenschutzfreundlicher Analysedienst, der ohne Cookies arbeitet und 
                keine personenbezogenen Daten speichert.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO 
                (berechtigtes Interesse an der Analyse und Verbesserung unserer Website).
              </p>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed mt-4">
            Sie können Ihre Cookie-Einstellungen jederzeit in Ihrem Browser anpassen. Bitte beachten 
            Sie, dass die Deaktivierung von Cookies die Funktionalität dieser Website beeinträchtigen kann.
          </p>
        </section>

        {/* Ihre Rechte */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
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

        {/* Hosting */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
            5. Hosting
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Diese Website wird gehostet. Beim Aufruf der Website werden automatisch Informationen 
            in Server-Log-Dateien erfasst, die Ihr Browser übermittelt (siehe 2.1). Der Hosting-Anbieter 
            verarbeitet diese Daten im Rahmen einer Auftragsverarbeitung.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong className="text-foreground">Hinweis:</strong> Bitte ergänzen Sie hier die Angaben 
            zu Ihrem Hosting-Anbieter (Name, Anschrift, Auftragsverarbeitungsvertrag).
          </p>
        </section>

        {/* Newsletter */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
            6. Newsletter
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Wenn Sie unseren Newsletter abonnieren, wird Ihre E-Mail-Adresse für den Versand des Newsletters 
            gespeichert. Die Anmeldung erfolgt im Double-Opt-In-Verfahren. Ihre Einwilligung können Sie 
            jederzeit mit Wirkung für die Zukunft widerrufen (Abmeldelink im Newsletter).
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
          </p>
        </section>

        {/* Datensicherheit */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
            7. Datensicherheit
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen 
            zufällige oder vorsätzliche Manipulationen, teilweisen oder vollständigen Verlust, 
            Zerstörung oder gegen den unbefugten Zugriff Dritter zu schützen. Unsere Sicherheitsmaßnahmen 
            werden entsprechend der technologischen Entwicklung fortlaufend verbessert.
          </p>
        </section>

        {/* Widerruf von Einwilligungen */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
            8. Widerruf von Einwilligungen
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. 
            Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der 
            bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Für Cookie-Einwilligungen können Sie diese über unser Cookie-Banner oder durch Löschen 
            des LocalStorage-Eintrags <code className="px-1 py-0.5 bg-muted rounded text-sm">nerdiction-cookie-consent</code> 
            in den Entwicklertools Ihres Browsers widerrufen.
          </p>
        </section>

        {/* Änderungen */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2" style={{ overflowWrap: "break-word", minWidth: 0 }}>
            9. Änderungen dieser Datenschutzerklärung
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

