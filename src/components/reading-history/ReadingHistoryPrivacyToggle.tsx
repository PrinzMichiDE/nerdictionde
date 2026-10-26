'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { toast } from '@/components/ui/toast';

export function ReadingHistoryPrivacyToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/reading-history-preference');
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setBusy(true);
    try {
      const res = await fetch('/api/user/reading-history-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      toast.success(next ? 'Leseverlauf aktiviert' : 'Leseverlauf deaktiviert');
    } catch {
      setEnabled(enabled); // Rollback
      toast.error('Fehler beim Speichern der Einstellung');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Lädt…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Eye className="size-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-medium">Leseverlauf</h3>
            <p className="text-sm text-muted-foreground">
              Speichert, welche Reviews du wie lange liest (ab 50% Scroll-Tiefe oder 30 Sek. Verweildauer).
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
            enabled ? 'bg-primary' : 'bg-muted'
          }`}
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? 'Leseverlauf deaktivieren' : 'Leseverlauf aktivieren'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {!busy && enabled && <Check className="size-4 text-primary-foreground" />}
            {!busy && !enabled && <EyeOff className="size-4 text-muted-foreground" />}
          </span>
        </button>
      </div>

      <p className="text-sm text-muted-foreground ml-10">
        {enabled
          ? 'Dein Leseverlauf wird auf der Seite „/verlauf“ angezeigt. Du kannst einzelne Einträge oder den gesamten Verlauf jederzeit löschen. Daten werden nach 180 Tagen automatisch entfernt.'
          : 'Leseverlauf ist deaktiviert. Es werden keine Daten über dein Leseverhalten gespeichert. Du kannst dies jederzeit hier aktivieren.'}
      </p>

      <div className="pt-4 border-t border-border">
        <a
          href="/verlauf"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20M6.5 2a2.5 2.5 0 0 0 0 5H20" />
            <path d="M2 8h20" />
            <path d="M2 13h20" />
          </svg>
          Zum Leseverlauf
        </a>
      </div>
    </div>
  );
}