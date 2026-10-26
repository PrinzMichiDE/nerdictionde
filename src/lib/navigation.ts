export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/reviews", label: "Reviews" },
  { href: "/suche", label: "Suche" },
  { href: "/news", label: "News" },
  { href: "/forum", label: "Forum" },
  { href: "/releases", label: "Releases" },
  { href: "/tools", label: "Tools" },
] as const;

export function isActive(linkHref: string, pathname: string) {
  return (
    pathname === linkHref ||
    (linkHref !== "/" && pathname.startsWith(linkHref))
  );
}
