"use client";

import { MessageSquareText, LogIn } from "lucide-react";
import { CreateThreadDialog } from "./CreateThreadDialog";
import { Button } from "@/components/ui/button";

interface ForumHeaderProps {
  isLoggedIn: boolean;
  displayName: string | null;
}

export function ForumHeader({ isLoggedIn, displayName }: ForumHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquareText className="size-8 text-primary" />
          <div>
            <span className="kicker text-primary">Community</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
              Forum
            </h1>
          </div>
        </div>

        <div className="shrink-0">
          {isLoggedIn ? (
            <CreateThreadDialog isLoggedIn={isLoggedIn} displayName={displayName} />
          ) : (
            <a href="/api/auth/twitch/login">
              <Button variant="outline">
                <LogIn className="mr-2 h-4 w-4" />
                Anmelden
              </Button>
            </a>
          )}
        </div>
      </div>

      <p className="text-muted-foreground max-w-2xl">
        Diskutiere über Gaming, Filme und Serien. Teile deine Meinung,
        stelle Fragen und tausche dich mit der Community aus.
      </p>
    </header>
  );
}
