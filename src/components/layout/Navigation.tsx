"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [
  { href: "/", label: "Home" },
  { href: "/reviews", label: "Reviews" },
  { href: "/news", label: "News" },
  { href: "/forum", label: "Forum" },
  { href: "/releases", label: "Releases" },
  { href: "/tools", label: "Tools" },
];

export function Navigation() {
  const pathname = usePathname();

  const isActive = (link: (typeof links)[number]) =>
    pathname === link.href ||
    (link.href !== "/" && pathname.startsWith(link.href));

  return (
    <nav
      className="hidden md:flex items-center gap-0 container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 h-11 relative"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const active = isActive(link);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="nav-link"
            data-active={active ? "true" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-spotlight" aria-hidden="true" />
            <span className="nav-link-bar" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
