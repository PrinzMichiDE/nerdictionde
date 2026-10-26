"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, LogIn } from "lucide-react";

export function ProfileLink() {
  const [user, setUser] = useState<{ displayName: string; profileImageUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/twitch/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className="size-9"
        aria-hidden="true"
      />
    );
  }

  if (user) {
    return (
      <Link
        href="/profil"
        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        title={user.displayName}
        aria-label={user.displayName}
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user.displayName}
            className="size-6 rounded-full"
          />
        ) : (
          <User className="size-4" />
        )}
        <span className="hidden lg:inline text-xs font-medium truncate max-w-[100px]">
          {user.displayName}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <LogIn className="size-4" />
      <span className="hidden lg:inline text-xs font-medium">Anmelden</span>
    </Link>
  );
}
