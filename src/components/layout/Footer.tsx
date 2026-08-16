import Link from "next/link";
import { Mail, Heart, FileText, BarChart3, Handshake, FileCheck } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { href: "/", label: "Startseite", icon: null },
    { href: "/reviews", label: "Alle Reviews", icon: FileText },
    { href: "/releases", label: "Release Kalender", icon: null },
    { href: "/analytics", label: "Statistik", icon: BarChart3 },
  ];

  const categoryLinks = [
    { href: "/reviews?category=game", label: "Games", icon: null },
    { href: "/reviews?category=movie", label: "Filme", icon: null },
    { href: "/reviews?category=series", label: "Serien", icon: null },
  ];

  const businessLinks = [
    { href: "/kooperationen", label: "Kooperationen", icon: Handshake },
    { href: "/mediadaten", label: "Mediadaten", icon: FileCheck },
    { href: "/impressum", label: "Impressum", icon: null },
    { href: "/datenschutz", label: "Datenschutz", icon: null },
  ];

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="py-14 md:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="flex items-baseline gap-2 w-fit" aria-label="Nerdiction Startseite">
                <span className="font-serif text-2xl font-semibold tracking-tight">
                  Nerdiction
                </span>
                <span className="kicker text-primary">Magazin</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Professionelle Game-, Film- und Serien-Reviews für fundierte
                Unterhaltungsentscheidungen. Unabhängig, ehrlich und mit System.
              </p>
              <a
                href="mailto:kontakt@nerdiction.de"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <Mail className="size-4" />
                kontakt@nerdiction.de
              </a>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <h3 className="kicker text-foreground">Navigation</h3>
              <nav className="flex flex-col gap-2.5" aria-label="Footer navigation">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Kategorien */}
            <div className="space-y-4">
              <h3 className="kicker text-foreground">Kategorien</h3>
              <nav className="flex flex-col gap-2.5" aria-label="Footer categories">
                {categoryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Business & Rechtliches */}
            <div className="space-y-4">
              <h3 className="kicker text-foreground">Business & Rechtliches</h3>
              <nav className="flex flex-col gap-2.5" aria-label="Footer legal and business">
                {businessLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Nerdiction. Alle Rechte vorbehalten.
            </p>
            <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
              Mit <Heart className="size-3.5 text-primary fill-current" /> für die Community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
