"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Star, Wrench, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/profil", label: "Profil", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  "hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("size-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
