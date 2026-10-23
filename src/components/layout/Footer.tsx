import Link from "next/link";
import { Heart, FileText, BarChart3, Handshake, FileCheck, Users } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";
import { NewsletterSignup } from "@/components/shared/NewsletterSignup";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { href: "/", label: "Startseite", icon: null },
    { href: "/reviews", label: "Alle Reviews", icon: FileText },
    { href: "/forum", label: "Forum", icon: null },
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
              <Link href="/" className="flex items-center gap-2 w-fit" aria-label="Nerdiction Startseite">
                <BrandMark className="size-7 shrink-0" />
                <span className="font-serif text-2xl font-semibold tracking-tight">
                  Nerdiction
                </span>
                <span className="kicker text-primary">Magazin</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Professionelle Game-, Film- und Serien-Reviews für fundierte
                Unterhaltungsentscheidungen. Unabhängig, ehrlich und mit System.
              </p>
              <NewsletterSignup source="footer" className="mt-6 max-w-xs" />
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

        {/* Social Proof + Bottom bar */}
        <div className="border-t border-border py-8 md:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Users className="size-4 text-primary fill-current" aria-hidden="true" />
              <span>
                Unabhängige Tests für die Community — {currentYear} Nerdiction.
                Alle Rechte vorbehalten.
              </span>
            </div>
            <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5 md:order-first">
              Mit <Heart className="size-3.5 text-primary fill-current" /> für die
              Community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
