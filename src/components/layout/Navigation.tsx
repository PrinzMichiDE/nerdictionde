"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/reviews", label: "Reviews" },
  { href: "/forum", label: "Forum" },
  { href: "/releases", label: "Releases" },
  { href: "/tools", label: "Tools" },
];

export function Navigation() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [pillStyle, setPillStyle] = useState<{ x: number; w: number; visible: boolean }>({
    x: 0,
    w: 0,
    visible: false,
  });
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  const activeHref = links.find(
    (l) =>
      pathname === l.href ||
      (l.href !== "/" && pathname.startsWith(l.href))
  )?.href ?? null;

  const updatePill = useCallback(
    (target: "active" | "hover" | "none") => {
      const nav = navRef.current;
      if (!nav) return;

      let el: HTMLAnchorElement | undefined;

      if (target === "active" && activeHref) {
        el = linkRefs.current.get(activeHref);
      } else if (target === "hover" && hoveredLink) {
        el = linkRefs.current.get(hoveredLink);
      }

      if (el) {
        const navRect = nav.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setPillStyle({
          x: elRect.left - navRect.left,
          w: elRect.width,
          visible: true,
        });
      } else {
        setPillStyle((prev) => ({ ...prev, visible: false }));
      }
    },
    [activeHref, hoveredLink]
  );

  useEffect(() => {
    if (hoveredLink) {
      updatePill("hover");
    } else {
      updatePill("active");
    }
  }, [hoveredLink, activeHref, updatePill]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const nav = navRef.current;
      if (!nav) return;
      const navRect = nav.getBoundingClientRect();
      setSpotlight({
        x: e.clientX - navRect.left,
        y: e.clientY - navRect.top,
      });
    },
    []
  );

  return (
    <nav
      ref={navRef}
      className="hidden md:flex items-center gap-0 container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 h-11 relative"
      aria-label="Main navigation"
      onMouseLeave={() => setHoveredLink(null)}
    >
      {/* Animated Pill */}
      <div
        className="nav-pill"
        data-visible={pillStyle.visible}
        style={{
          ["--pill-x" as string]: `${pillStyle.x}px`,
          ["--pill-w" as string]: `${pillStyle.w}px`,
          transform: `translateX(${pillStyle.x}px)`,
          width: pillStyle.w,
        }}
        aria-hidden="true"
      />

      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            ref={(el) => {
              if (el) linkRefs.current.set(link.href, el);
            }}
            href={link.href}
            className={cn("nav-link")}
            data-active={isActive}
            aria-current={isActive ? "page" : undefined}
            onMouseEnter={() => {
              setHoveredLink(link.href);
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredLink(null)}
          >
            {/* Spotlight radial following cursor */}
            <span
              className="nav-spotlight"
              style={{
                background: `radial-gradient(340px circle at ${spotlight.x}px ${spotlight.y}px, color-mix(in oklab, var(--primary) 7%, transparent), transparent 60%)`,
              }}
              aria-hidden="true"
            />
            <span className="relative z-10">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
