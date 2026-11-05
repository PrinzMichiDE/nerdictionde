"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "nerdiction-cookie-consent";

export type ConsentStatus = "granted" | "denied" | null;

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "granted") return "granted";
  if (stored === "denied") return "denied";
  return null;
}

export function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const current = getConsentStatus();
    setStatus(current);
    if (current === null) {
      // Small delay to avoid layout shift on initial load
      setTimeout(() => setVisible(true), 500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "granted");
    setStatus("granted");
    setVisible(false);
    // Reload to trigger script loading
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, "denied");
    setStatus("denied");
    setVisible(false);
  };

  if (!visible || status !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Cookie-Einstellungen</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Wir verwenden Cookies und ähnliche Technologien, um die Nutzung unserer Website zu analysieren 
                  und unser Angebot zu verbessern. Mit Ihrer Einwilligung nutzen wir Google Analytics. 
                  Sie können Ihre Einwilligung jederzeit widerrufen.
                </p>
                <p className="text-xs text-muted-foreground">
                  Weitere Informationen finden Sie in unserer{" "}
                  <Link href="/datenschutz" className="text-primary hover:underline">
                    Datenschutzerklärung
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button onClick={handleAccept} size="sm" className="w-full sm:w-auto">
                  Alle akzeptieren
                </Button>
                <Button onClick={handleReject} variant="outline" size="sm" className="w-full sm:w-auto">
                  Nur notwendige Cookies
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={handleReject}
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
