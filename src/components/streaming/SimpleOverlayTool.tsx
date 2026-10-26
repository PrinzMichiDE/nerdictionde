"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Save, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface Props {
  template: "alert" | "countdown";
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  defaultTitle: string;
  defaultSubtitle: string;
}

export function SimpleOverlayTool({
  template,
  backHref,
  backLabel,
  title,
  description,
  defaultTitle,
  defaultSubtitle,
}: Props) {
  const [name, setName] = useState(`${title} Overlay`);
  const [t, setT] = useState(defaultTitle);
  const [sub, setSub] = useState(defaultSubtitle);
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
        title: t,
        subtitle: sub,
        color1,
        color2,
        targetDate: template === "countdown" ? targetDate : undefined,
      }),
    });
    if (res.ok) setPreviewHtml(await res.text());
  }, [template, t, sub, color1, color2, targetDate]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/overlay-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          template,
          title: t,
          subtitle: sub,
          color1,
          color2,
          targetDate: template === "countdown" ? targetDate : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      const url = `${window.location.origin}/api/overlay/${data.id}`;
      setSavedUrl(url);
      toast.success("Overlay gespeichert!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Fehler");
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
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <Link
        href={backHref}
        className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        {backLabel}
      </Link>

      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Titel
              </span>
              <input
                value={t}
                onChange={(e) => setT(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Untertitel
              </span>
              <input
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          {template === "countdown" && (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Zielzeit
              </span>
              <input
                type="datetime-local"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Farbe 1
              </span>
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
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Farbe 2
              </span>
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
            </label>
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
              <p className="mb-1 text-xs font-semibold text-emerald-400">OBS-URL:</p>
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

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Live-Vorschau</p>
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
            {previewHtml ? (
              <iframe
                title="Vorschau"
                srcDoc={previewHtml}
                className="h-full w-full border-0"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Klicke „Vorschau&quot;.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
