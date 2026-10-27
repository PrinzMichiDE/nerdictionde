import Link from "next/link";
import { Users, Github, Twitter, Rss, Mail } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";
import { NewsletterSignup } from "@/components/shared/NewsletterSignup";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { href: "/", label: "Startseite" },
    { href: "/reviews", label: "Alle Reviews" },
    { href: "/forum", label: "Forum" },
    { href: "/releases", label: "Release Kalender" },
    { href: "/analytics", label: "Statistik" },
  ];

  const categoryLinks = [
    { href: "/reviews?category=game", label: "Games" },
    { href: "/reviews?category=movie", label: "Filme" },
    { href: "/reviews?category=series", label: "Serien" },
    { href: "/reviews?category=hardware", label: "Hardware" },
  ];

  const businessLinks = [
    { href: "/kooperationen", label: "Kooperationen" },
    { href: "/mediadaten", label: "Mediadaten" },
    { href: "/impressum", label: "Impressum" },
    { href: "/datenschutz", label: "Datenschutz" },
  ];

  const socialLinks = [
    { href: "https://github.com/nerdiction", label: "GitHub", icon: Github },
    { href: "https://twitter.com/nerdiction", label: "Twitter", icon: Twitter },
    { href: "/rss.xml", label: "RSS Feed", icon: Rss },
    { href: "mailto:hello@nerdiction.de", label: "Kontakt", icon: Mail },
  ];

  return (
    <footer className="magazine-footer" role="contentinfo">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="magazine-footer-main">
          {/* Brand */}
          <div className="magazine-footer-brand">
            <Link href="/" className="magazine-footer-logo" aria-label="Nerdiction Startseite">
              <BrandMark className="size-6 shrink-0" />
              <span>Nerdiction</span>
            </Link>
            <p className="magazine-footer-tagline">
              Professionelle Game-, Film- und Serien-Reviews für fundierte
              Unterhaltungsentscheidungen. Unabhängig, ehrlich und mit System.
            </p>
            <NewsletterSignup source="footer" className="mt-4 max-w-xs" />
          </div>

          {/* Navigation */}
          <nav className="magazine-footer-column" aria-label="Navigation">
            <h3 className="magazine-footer-column-title">Navigation</h3>
            {navigationLinks.map((link) => (
              <Link key={link.href} href={link.href} className="magazine-footer-link">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Kategorien */}
          <nav className="magazine-footer-column" aria-label="Kategorien">
            <h3 className="magazine-footer-column-title">Kategorien</h3>
            {categoryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="magazine-footer-link">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Community & Mehr */}
          <nav className="magazine-footer-column" aria-label="Community & Mehr">
            <h3 className="magazine-footer-column-title">Community</h3>
            <Link href="/forum" className="magazine-footer-link">Forum</Link>
            <Link href="/community/guides" className="magazine-footer-link">Guides & Wiki</Link>
            <Link href="/community/lists" className="magazine-footer-link">Listen</Link>
            <Link href="/empfehlungen" className="magazine-footer-link">Empfehlungen</Link>
          </nav>

          {/* Business & Rechtliches */}
          <nav className="magazine-footer-column" aria-label="Business & Rechtliches">
            <h3 className="magazine-footer-column-title">Business & Rechtliches</h3>
            {businessLinks.map((link) => (
              <Link key={link.href} href={link.href} className="magazine-footer-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="magazine-footer-bottom">
          <div className="magazine-footer-copyright">
            <Users className="size-4 text-primary fill-current" aria-hidden="true" />
            <span>
              Unabhängige Tests für die Community — {currentYear} Nerdiction.
              Alle Rechte vorbehalten.
            </span>
          </div>
          <nav className="magazine-footer-social" aria-label="Social Media">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="magazine-footer-social-link"
                aria-label={link.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <link.icon className="size-4" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}