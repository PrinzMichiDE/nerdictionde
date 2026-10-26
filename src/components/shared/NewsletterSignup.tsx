"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NewsletterSignupProps {
  source?: string;
  className?: string;
}

export function NewsletterSignup({
  source,
  className,
}: NewsletterSignupProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmationToken, setConfirmationToken] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = (formData.get("email") as string) || "";
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Die Anmeldung ist fehlgeschlagen.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Danke! Bestaetige deine Anmeldung ueber den Link.");
      setConfirmationToken(data.confirmationToken || "");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Die Anmeldung ist fehlgeschlagen. Bitte versuche es später erneut.");
    }
  }

  const Icon = status === "success" ? CheckCircle2 : status === "error" ? AlertCircle : Mail;

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card p-6 md:p-8 text-center space-y-4",
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex-1 min-w-[180px]">
          <Input
            type="email"
            name="email"
            placeholder="Deine E-Mail-Adresse"
            required
            className="w-full"
            aria-label="E-Mail-Adresse für Newsletter"
            disabled={status === "loading"}
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0"
        >
          {status === "loading" ? "Anmelden…" : "Anmelden"}
        </Button>
      </form>

      {status !== "idle" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              status === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-destructive",
            )}
          >
            <Icon className="size-4" />
            {message}
          </div>
        </div>
      )}

      {status === "success" && confirmationToken && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4 text-left">
          <span className="text-xs text-muted-foreground font-medium">
            Bestaetigungs-Link:
          </span>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs text-muted-foreground bg-muted px-2 py-1.5 rounded-sm">
              {`${typeof window !== "undefined" ? window.location.origin : ""}/newsletter/confirm/${confirmationToken}`}
            </code>
            <a
              href={`/newsletter/confirm/${confirmationToken}`}
              className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
            Bestaetigen
            </a>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Kein Spam. Du kannst dich jederzeit wieder abmelden.
      </p>
    </section>
  );
}
