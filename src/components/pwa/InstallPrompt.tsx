"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Download, Smartphone } from "lucide-react";

// Shows an install prompt for the Nerdiction PWA once the browser fires
// the beforeinstallprompt event. Stores dismissal in localStorage.
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }, [deferred]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-popover/95 p-4 shadow-2xl backdrop-blur">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Smartphone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Nerdiction als App installieren</p>
          <p className="truncate text-xs text-muted-foreground">
            Schneller Zugriff, offline lesen & Push-Alerts.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={install}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="size-3.5" />
            Installieren
          </button>
          <button
            onClick={dismiss}
            aria-label="Schließen"
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
