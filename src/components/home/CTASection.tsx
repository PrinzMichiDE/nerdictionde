"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollReveal } from "./ScrollReveal";

export function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 4000);
  };

  return (
    <section className="pb-4">
      <ScrollReveal variant="zoom">
        <div className="gradient-border relative overflow-hidden rounded-[2rem] bg-card px-6 py-14 md:px-14 md:py-20 shadow-2xl shadow-primary/10">
          {/* Hintergrund-Effekte */}
          <div className="absolute inset-0 bg-mesh opacity-70" aria-hidden="true" />
          <div
            className="absolute -top-24 -right-24 size-80 rounded-full blur-[100px] animate-aurora"
            style={{ background: "color-mix(in oklab, var(--primary) 30%, transparent)" }}
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-32 -left-20 size-96 rounded-full blur-[110px] animate-aurora"
            style={{
              background: "color-mix(in oklab, oklch(0.6 0.15 210) 22%, transparent)",
              animationDelay: "-8s",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 noise opacity-[0.04] pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
            <span className="kicker inline-flex items-center gap-2 text-primary">
              <Sparkles className="size-4 animate-pulse" />
              Newsletter
            </span>

            <h2 className="mt-5 font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
              Bereit für <span className="text-gradient-animate">ehrliche</span> Reviews?
            </h2>

            <p className="mt-5 max-w-xl text-muted-foreground text-base md:text-lg leading-relaxed">
              Erhalte die neuesten Tests und exklusive Inhalte direkt in dein Postfach.
              Kein Spam – nur relevante Updates, jederzeit abmeldbar.
            </p>

            {submitted ? (
              <div className="mt-9 flex w-full max-w-md items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 animate-scale-in">
                <CheckCircle2 className="size-6 text-emerald-500" />
                <p className="font-semibold text-foreground">
                  Erfolgreich angemeldet – willkommen an Bord!
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Mail
                    className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="deine@email.de"
                    aria-label="E-Mail-Adresse"
                    className="h-13 rounded-full border-2 border-border bg-background/70 pl-11 text-base backdrop-blur-sm transition-colors focus:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="shine group relative h-13 shrink-0 rounded-full px-7 font-semibold shadow-xl shadow-primary/25"
                >
                  <span className="relative z-[2] inline-flex items-center gap-2">
                    Abonnieren
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </form>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Kein Spam
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" />
                Jederzeit abmeldbar
              </span>
              <Link href="/datenschutz" className="link-underline text-foreground/80">
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
