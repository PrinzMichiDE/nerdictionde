import Link from "next/link";
import { Gamepad2, Mail, FileText, Cpu, ShoppingCart, Handshake, Shield, FileCheck } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const navigationLinks = [
    { href: "/", label: "Startseite", icon: null },
    { href: "/reviews", label: "Alle Reviews", icon: FileText },
  ];

  const categoryLinks = [
    { href: "/reviews?category=game", label: "Games", icon: Gamepad2 },
    { href: "/reviews?category=hardware", label: "Hardware", icon: Cpu },
    { href: "/reviews?category=amazon", label: "Amazon", icon: ShoppingCart },
  ];

  const legalLinks = [
    { href: "/impressum", label: "Impressum" },
    { href: "/datenschutz", label: "Datenschutz" },
  ];

  const businessLinks = [
    { href: "/kooperationen", label: "Kooperationen", icon: Handshake },
    { href: "/mediadaten", label: "Mediadaten", icon: FileCheck },
  ];

  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30 mt-auto">
      <div className="container px-4 md:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="space-y-4 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 group w-fit">
                <div className="relative">
                  <Gamepad2 className="size-6 text-primary transition-transform group-hover:rotate-12" />
                  <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Nerdiction
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Professionelle Game- und Hardware-Reviews für fundierte Kaufentscheidungen.
              </p>
              <div className="pt-2">
                <a
                  href="mailto:kontakt@nerdiction.de"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                >
                  <Mail className="size-4 group-hover/link:scale-110 transition-transform" />
                  <span>kontakt@nerdiction.de</span>
                </a>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                Navigation
              </h3>
              <nav className="flex flex-col gap-3" aria-label="Footer navigation">
                {navigationLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group/link flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                    >
                      {Icon && <Icon className="size-4 group-hover/link:translate-x-0.5 transition-transform" />}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                Kategorien
              </h3>
              <nav className="flex flex-col gap-3" aria-label="Footer categories">
                {categoryLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group/link flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                    >
                      {Icon && <Icon className="size-4 group-hover/link:translate-x-0.5 transition-transform" />}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Business & Legal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                Rechtliches & Business
              </h3>
              <nav className="flex flex-col gap-3" aria-label="Footer legal and business">
                {businessLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group/link flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                    >
                      {Icon && <Icon className="size-4 group-hover/link:translate-x-0.5 transition-transform" />}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group/link flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                  >
                    <Shield className="size-4 group-hover/link:translate-x-0.5 transition-transform" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              &copy; {currentYear} Nerdiction. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Made with</span>
              <span className="text-red-500 animate-pulse">♥</span>
              <span>for gamers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

