"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, ExternalLink, Copy, Check, Plus } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  message: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

export default function DonationTrackerTool() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [userId, setUserId] = useState("");
  const [donor, setDonor] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [overlayUrl, setOverlayUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/streaming/donations");
    if (res.ok) {
      const d = await res.json();
      setDonations(d.donations);
      setUserId(d.userId);
      if (d.userId) {
        setOverlayUrl(`${window.location.origin}/api/streaming/donations/overlay/${d.userId}`);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Gültigen Betrag eingeben.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/streaming/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: donor || "Anonym",
          amount: amt,
          message: message || null,
        }),
      });
      if (!res.ok) throw new Error();
      setAmount("");
      setMessage("");
      setDonor("");
      await load();
      toast.success("Spende hinzugefügt.");
    } catch {
      toast.error("Fehler.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!overlayUrl) return;
    await navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <Link
        href="/streaming-tools"
        className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Zurück zu Streaming-Tools
      </Link>

      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Heart className="size-7 text-rose-500" /> Donation-Tracker
        </h1>
        <p className="text-sm text-muted-foreground">
          Spenden-Box für OBS, die sich alle 8 s live aktualisiert.
        </p>
      </div>

      {overlayUrl && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="mb-1 text-xs font-semibold text-emerald-400">OBS-Browser-Quelle:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
              {overlayUrl}
            </code>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "OK" : "Kopieren"}
            </button>
            <a
              href={overlayUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Add test donation */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Test-Spende hinzufügen</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={donor}
            onChange={(e) => setDonor(e.target.value)}
            placeholder="Name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Betrag"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nachricht"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={add}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> Spende speichern
        </button>
      </div>

      {/* Recent */}
      <div className="space-y-2">
        <h2 className="font-semibold">Letzte Spenden</h2>
        {donations.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Noch keine Spenden. Füge oben eine Test-Spende hinzu.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {donations.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3">
                <span className="font-semibold text-rose-500">
                  {d.amount.toFixed(2)} {d.currency}
                </span>
                <span className="flex-1 truncate text-sm text-muted-foreground">
                  {d.isAnonymous ? "Anonym" : d.donorName}
                  {d.message ? ` – „${d.message}“` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
