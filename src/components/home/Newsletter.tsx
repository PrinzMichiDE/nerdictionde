"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send to your newsletter service
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <section className="space-y-8 py-16">
      <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:border-primary/30 transition-all duration-500 shadow-xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <CardContent className="p-8 md:p-12 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Content */}
              <div className="space-y-6 text-center md:text-left">
                <div className="inline-flex items-center justify-center md:justify-start p-3 rounded-2xl bg-primary/10 border border-primary/20 w-fit mx-auto md:mx-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Bleib auf dem Laufenden
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Erhalte die neuesten Reviews und exklusive Inhalte direkt in dein Postfach.
                    Kein Spam, nur relevante Updates.
                  </p>
                </div>

                {/* Benefits */}
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2 justify-center md:justify-start">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Wöchentliche Review-Zusammenfassungen</span>
                  </li>
                  <li className="flex items-center gap-2 justify-center md:justify-start">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Exklusive Early-Access Inhalte</span>
                  </li>
                  <li className="flex items-center gap-2 justify-center md:justify-start">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Kein Spam - jederzeit abmeldbar</span>
                  </li>
                </ul>
              </div>

              {/* Right Side - Form */}
              <div className="space-y-4">
                {isSubmitted ? (
                  <div className="p-8 rounded-2xl bg-green-500/10 border-2 border-green-500/30 text-center space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-green-500/20">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-semibold text-foreground">Erfolgreich angemeldet!</p>
                    <p className="text-sm text-muted-foreground">
                      Wir haben dir eine Bestätigungs-E-Mail gesendet.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="deine@email.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 text-base border-2 focus:border-primary"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 h-12 text-base group"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Newsletter abonnieren
                      </span>
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Mit der Anmeldung akzeptierst du unsere Datenschutzerklärung.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
