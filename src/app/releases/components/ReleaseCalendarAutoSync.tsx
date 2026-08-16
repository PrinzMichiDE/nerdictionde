"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type SyncState =
  | { status: "idle" }
  | { status: "syncing" }
  | { status: "done"; created: number }
  | { status: "error"; message: string };

export function ReleaseCalendarAutoSync() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        setState({ status: "syncing" });
        const res = await fetch("/api/releases/sync");
        const data = await res.json();
        if (cancelled) return;

        if (data?.skipped) {
          setState({ status: "idle" });
          return;
        }

        if (data?.success) {
          setState({ status: "done", created: data.stats?.created ?? 0 });
          hideTimer = setTimeout(() => {
            if (!cancelled) router.refresh();
          }, 1500);
        } else {
          setState({
            status: "error",
            message: data?.error || "Aktualisierung fehlgeschlagen.",
          });
          hideTimer = setTimeout(() => {
            if (!cancelled) setState({ status: "idle" });
          }, 8000);
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Aktualisierung fehlgeschlagen." });
          hideTimer = setTimeout(() => {
            if (!cancelled) setState({ status: "idle" });
          }, 8000);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [router]);

  if (state.status === "idle") return null;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm w-fit">
      {state.status === "syncing" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-muted-foreground">
            Release-Kalender wird aktualisiert…
          </span>
        </>
      )}
      {state.status === "done" && (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-green-700">
            Kalender aktualisiert
            {state.created > 0
              ? ` – ${state.created} neue Releases hinzugefügt`
              : ""}
          </span>
        </>
      )}
      {state.status === "error" && (
        <>
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600">{state.message}</span>
        </>
      )}
    </div>
  );
}
