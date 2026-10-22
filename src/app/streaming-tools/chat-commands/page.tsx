"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface Command {
  id: string;
  command: string;
  response: string;
  cooldown: number;
  userLevel: string;
  enabled: boolean;
  usageCount: number;
}

export default function ChatCommandsTool() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/streaming/chat-commands");
    if (res.ok) {
      const d = await res.json();
      setCommands(d.commands);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!command.trim() || !response.trim()) {
      toast.error("Befehl und Antwort nötig.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/streaming/chat-commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, response, cooldown }),
      });
      if (!res.ok) throw new Error();
      setCommand("");
      setResponse("");
      setCooldown(0);
      await load();
      toast.success("Command gespeichert.");
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/streaming/chat-commands/${id}`, { method: "DELETE" });
    setCommands((c) => c.filter((x) => x.id !== id));
  };

  const exportText = commands.map((c) => `${c.command} -> ${c.response}`).join("\n");

  const copyAll = async () => {
    await navigator.clipboard.writeText(exportText);
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
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Chat-Commands</h1>
        <p className="text-sm text-muted-foreground">
          Definiere !Befehle für deinen Chatbot. Die Liste kannst du als Text exportieren.
        </p>
      </div>

      {/* Add form */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="!social"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Folge mir auf twitch.tv/..."
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Cooldown (s):
            <input
              type="number"
              min={0}
              value={cooldown}
              onChange={(e) => setCooldown(Number(e.target.value))}
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
          <button
            onClick={add}
            disabled={busy}
            className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> Hinzufügen
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {loading ? "Lädt…" : `${commands.length} Befehle`}
          </h2>
          {commands.length > 0 && (
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Kopiert!" : "Alle kopieren"}
            </button>
          )}
        </div>
        {commands.length === 0 && !loading && (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Noch keine Commands. Lege oben deinen ersten an.
          </p>
        )}
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {commands.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <code className="rounded bg-muted px-2 py-1 text-sm font-semibold text-primary">
                {c.command}
              </code>
              <span className="flex-1 truncate text-sm text-muted-foreground">
                {c.response}
              </span>
              <span className="text-xs text-muted-foreground">{c.usageCount}×</span>
              <button
                onClick={() => remove(c.id)}
                aria-label="Löschen"
                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
