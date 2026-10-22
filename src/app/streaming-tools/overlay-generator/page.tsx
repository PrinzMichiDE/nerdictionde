"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wand2,
  Copy,
  Check,
  Eye,
  Save,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";

const TEMPLATES = [
  { value: "brb", label: "Be Right Back" },
  { value: "starting", label: "Starting Soon" },
  { value: "alert", label: "Alert-Box (Follower/Sub)" },
  { value: "countdown", label: "Countdown" },
  { value: "chatbox", label: "Chatbox" },
] as const;

export default function OverlayGenerator() {
  const router = useRouter();
  const [template, setTemplate] = useState<string>("brb");
  const [name, setName] = useState("Mein BRB-Overlay");
  const [title, setTitle] = useState("BE RIGHT BACK");
  const [subtitle, setSubtitle] = useState("Bin gleich wieder da");
  const [color1, setColor1] = useState("#3b82f6");
  const [color2, setColor2] = useState("#8b5cf6");
  const [targetDate, setTargetDate] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedUrl, setSavedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const updatePreview = useCallback(async () => {
    const res = await fetch("/api/overlay-generator/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template,
        title,
        subtitle,
        color1,
        color2,
        targetDate: template === "countdown" ? targetDate : undefined,
      }),
    });
    if (res.ok) setPreviewHtml(await res.text());
  }, [template, title, subtitle, color1, color2, targetDate]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/overlay-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          template,
          title,
          subtitle,
          color1,
          color2,
          targetDate: template === "countdown" ? targetDate : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      const url = `${window.location.origin}/api/overlay/${data.id}`;
      setSavedUrl(url);
      toast.success("Overlay gespeichert! OBS-URL kopieren bereit.");
    } catch (e: any) {
      toast.error(e.message || "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!savedUrl) return;
    await navigator.clipboard.writeText(savedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <Link
        href="/streaming-tools"
        className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Zurück zu Streaming-Tools
      </Link>

      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Wand2 className="size-7 text-primary" /> Overlay-Generator
        </h1>
        <p className="text-sm text-muted-foreground">
          Erstelle lizenzfreie OBS-Overlays (transparent, self-contained) in Sekunden.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <Field label="Name (für deine Liste)">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Vorlage">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Titel">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Untertitel">
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>

          {template === "countdown" && (
            <Field label="Zielzeit (für Countdown)">
              <input
                type="datetime-local"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Farbe 1 (Primär)">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="h-9 w-12 rounded border border-border bg-background"
                />
                <input
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                />
              </div>
            </Field>
            <Field label="Farbe 2 (Akzent)">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  className="h-9 w-12 rounded border border-border bg-background"
                />
                <input
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                />
              </div>
            </Field>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={updatePreview}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <Eye className="size-4" /> Vorschau
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Save className="size-4" /> Speichern & OBS-URL
            </button>
          </div>

          {savedUrl && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="mb-1 text-xs font-semibold text-emerald-400">
                OBS-Browser-Quelle:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
                  {savedUrl}
                </code>
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "OK" : "Kopieren"}
                </button>
                <a
                  href={savedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Live-Vorschau</p>
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
            {previewHtml ? (
              <iframe
                title="Overlay Vorschau"
                srcDoc={previewHtml}
                className="h-full w-full border-0"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Klicke „Vorschau&quot;, um dein Overlay zu sehen.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
