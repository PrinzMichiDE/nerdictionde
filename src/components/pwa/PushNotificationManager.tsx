"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff, Loader2, Check } from "lucide-react";
import { toast } from "@/components/ui/toast";

type Channel = "games" | "movies" | "series" | "hardware" | "deals" | "forum";

const CHANNEL_LABELS: Record<Channel, string> = {
  games: "Games",
  movies: "Filme",
  series: "Serien",
  hardware: "Hardware",
  deals: "Deals",
  forum: "Forum",
};

export function PushNotificationManager() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<Record<Channel, boolean>>({
    games: true,
    movies: true,
    series: true,
    hardware: true,
    deals: true,
    forum: true,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/push/subscribe");
      const data = await res.json();
      if (res.ok) {
        setPublicKey(data.publicKey);
        setConfigured(data.configured);
        setSubscribed(data.subscribed);
      }
      const prefsRes = await fetch("/api/push/preferences");
      if (prefsRes.ok) {
        const d = await prefsRes.json();
        setPrefs(d.preferences);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subscribe = useCallback(async () => {
    if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push wird von diesem Browser nicht unterstützt.");
      return;
    }
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });
      const raw = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: raw.endpoint,
          p256dh: raw.keys?.p256dh,
          auth: raw.keys?.auth,
        }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setSubscribed(true);
      toast.success("Push aktiviert – du erhältst jetzt Alerts.");
    } catch {
      toast.error("Aktivierung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }, [publicKey]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/push/subscribe", { method: "DELETE" });
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      } catch {
        /* ignore */
      }
      setSubscribed(false);
      toast.success("Push deaktiviert.");
    } finally {
      setBusy(false);
    }
  }, []);

  const togglePref = useCallback(async (channel: Channel) => {
    const next = { ...prefs, [channel]: !prefs[channel] };
    setPrefs(next);
    await fetch("/api/push/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [channel]: next[channel] }),
    }).catch(() => {});
  }, [prefs]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Lädt…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Push-Benachrichtigungen sind auf dem Server noch nicht konfiguriert
        (VAPID-Keys fehlen). Die Einstellungen werden trotzdem lokal gespeichert.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {subscribed ? (
          <button
            onClick={unsubscribe}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <BellOff className="size-4" />
            Push deaktivieren
          </button>
        ) : (
          <button
            onClick={subscribe}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
            Push aktivieren
          </button>
        )}
        {subscribed && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-500">
            <Check className="size-4" /> Aktiv
          </span>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Benachrichtigungs-Kanäle</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(CHANNEL_LABELS) as Channel[]).map((ch) => (
            <label
              key={ch}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={prefs[ch]}
                onChange={() => togglePref(ch)}
                className="size-4 accent-primary"
                disabled={!subscribed}
              />
              {CHANNEL_LABELS[ch]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
