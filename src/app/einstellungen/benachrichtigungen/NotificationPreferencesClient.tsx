"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Bell,
  Mail,
  Smartphone,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  VolumeX,
  Volume2,
  CalendarDays,
  Calendar,
  Zap,
  Save,
  RotateCcw,
  TestTube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { NotificationType, NotificationChannel, NotificationFrequency, MuteTargetType } from "@prisma/client";

// ============================================
// Types
// ============================================

interface NotificationPreference {
  type: NotificationType;
  channels: Array<{
    channel: NotificationChannel;
    frequency: NotificationFrequency;
    enabled: boolean;
  }>;
}

interface UserMute {
  id: string;
  targetType: MuteTargetType;
  targetId: string;
  createdAt: string;
  targetTitle: string;
  targetSlug: string;
  targetUrl: string;
}

interface NotificationPreferencesClientProps {
  userId: string;
  pushEnabled: boolean;
}

type Tab = "types" | "frequency" | "mutes";

// ============================================
// Constants
// ============================================

const NOTIFICATION_TYPES: Array<{ value: NotificationType; label: string; description: string }> = [
  { value: "follow", label: "Neue Follower", description: "Jemand folgt dir" },
  { value: "review_comment", label: "Kommentare zu meinen Reviews", description: "Jemand kommentiert dein Review" },
  { value: "review_reaction", label: "Reaktionen auf meine Reviews", description: "Emoji-Reaktionen auf deine Reviews" },
  { value: "review_published", label: "Neue Reviews veröffentlichen", description: "Wenn du ein Review veröffentlichst" },
  { value: "qa_new_question", label: "Neue Fragen zu meinen Reviews", description: "Jemand stellt eine Frage zu deinem Review" },
  { value: "qa_answer_added", label: "Antworten auf meine Fragen", description: "Jemand antwortet auf deine Frage" },
  { value: "qa_answer_accepted", label: "Meine Antwort wurde als Lösung markiert", description: "Deine Antwort wurde akzeptiert" },
  { value: "collection_update", label: "Listen-Updates", description: "Neue Einträge in gefolgten Listen" },
  { value: "category_new_review", label: "Neue Reviews in abonnierten Kategorien", description: "Neue Reviews in deinen Kategorie-Abos" },
  { value: "user_series_update", label: "Updates zu gefolgten Serien", description: "Neue Teile in gefolgten Nutzer-Serien" },
  { value: "user_series_invite", label: "Einladungen zur Serien-Kollaboration", description: "Jemand lädt dich zur Zusammenarbeit ein" },
  { value: "mention", label: "Erwähnungen", description: "Du wurdest in einem Kommentar erwähnt" },
];

const CHANNELS: Array<{ value: NotificationChannel; label: string; icon: React.ReactNode; description: string }> = [
  { value: "IN_APP", label: "In-App", icon: <Bell className="h-4 w-4" />, description: "Benachrichtigungen im Feed" },
  { value: "EMAIL", label: "E-Mail", icon: <Mail className="h-4 w-4" />, description: "E-Mail an deine Adresse" },
  { value: "PUSH", label: "Push", icon: <Smartphone className="h-4 w-4" />, description: "Browser-Push-Benachrichtigungen" },
];

const FREQUENCIES: Array<{ value: NotificationFrequency; label: string; description: string; icon: React.ReactNode }> = [
  { value: "IMMEDIATE", label: "Sofort", description: "Echtzeit-Zustellung", icon: <Zap className="h-3.5 w-3.5" /> },
  { value: "DAILY", label: "Täglich (08:00)", description: "Täglicher Digest um 08:00 UTC", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { value: "WEEKLY", label: "Wöchentlich (Mo 08:00)", description: "Wöchentlicher Digest montags", icon: <Calendar className="h-3.5 w-3.5" /> },
];

const MUTE_TARGET_LABELS: Record<MuteTargetType, string> = {
  REVIEW: "Review",
  COLLECTION: "Liste",
  SERIES: "Serie",
  USER: "Nutzer",
};

const MUTE_TARGET_ICONS: Record<MuteTargetType, string> = {
  REVIEW: "📝",
  COLLECTION: "📋",
  SERIES: "📚",
  USER: "👤",
};

// ============================================
// Helper Functions
// ============================================

function getDefaultPreferences(): NotificationPreference[] {
  return NOTIFICATION_TYPES.map((nt) => ({
    type: nt.value,
    channels: [
      { channel: "IN_APP", frequency: "IMMEDIATE", enabled: true },
      { channel: "EMAIL", frequency: "IMMEDIATE", enabled: false },
      { channel: "PUSH", frequency: "IMMEDIATE", enabled: false },
    ],
  }));
}

function getChannelForType(prefs: NotificationPreference[], type: NotificationType, channel: NotificationChannel) {
  const typePref = prefs.find((p) => p.type === type);
  return typePref?.channels.find((c) => c.channel === channel);
}

// ============================================
// Main Component
// ============================================

export function NotificationPreferencesClient({ userId, pushEnabled }: NotificationPreferencesClientProps) {
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [mutes, setMutes] = useState<UserMute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("types");
  const [testLoading, setTestLoading] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrefs, setOriginalPrefs] = useState<NotificationPreference[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prefsRes, mutesRes] = await Promise.all([
        fetch("/api/user/notification-preferences"),
        fetch("/api/user/notification-mutes"),
      ]);

      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setPrefs(data.preferences || getDefaultPreferences());
        setOriginalPrefs(JSON.parse(JSON.stringify(data.preferences || getDefaultPreferences())));
      } else {
        setPrefs(getDefaultPreferences());
        setOriginalPrefs(getDefaultPreferences());
      }

      if (mutesRes.ok) {
        const data = await mutesRes.json();
        setMutes(data.mutes || []);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
      toast.error("Fehler beim Laden der Einstellungen");
      setPrefs(getDefaultPreferences());
      setOriginalPrefs(getDefaultPreferences());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(prefs) !== JSON.stringify(originalPrefs);
    setHasChanges(changed);
  }, [prefs, originalPrefs]);

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = prefs.flatMap((p) =>
        p.channels.map((c) => ({
          type: p.type,
          channel: c.channel,
          frequency: c.frequency,
          enabled: c.enabled,
        }))
      );

      const res = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: updates }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Speichern fehlgeschlagen");
      }

      setOriginalPrefs(JSON.parse(JSON.stringify(prefs)));
      setHasChanges(false);
      toast.success("Einstellungen gespeichert");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(error instanceof Error ? error.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  // Reset to saved
  const handleReset = () => {
    setPrefs(JSON.parse(JSON.stringify(originalPrefs)));
    setHasChanges(false);
  };

  // Toggle enabled
  const toggleEnabled = (type: NotificationType, channel: NotificationChannel) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.type === type
          ? {
              ...p,
              channels: p.channels.map((c) =>
                c.channel === channel ? { ...c, enabled: !c.enabled } : c
              ),
            }
          : p
      )
    );
  };

  // Change frequency
  const changeFrequency = (type: NotificationType, channel: NotificationChannel, frequency: NotificationFrequency) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.type === type
          ? {
              ...p,
              channels: p.channels.map((c) =>
                c.channel === channel ? { ...c, frequency } : c
              ),
            }
          : p
      )
    );
  };

  // Remove mute
  const handleRemoveMute = async (muteId: string) => {
    try {
      const res = await fetch(`/api/user/notification-mutes/${muteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Entstummen fehlgeschlagen");

      setMutes((prev) => prev.filter((m) => m.id !== muteId));
      toast.success("Stummschaltung aufgehoben");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Entstummen fehlgeschlagen");
    }
  };

  // Send test notification
  const handleTestNotification = async (channel: NotificationChannel) => {
    setTestLoading(channel);
    try {
      const res = await fetch("/api/user/notification-preferences/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });

      if (!res.ok) throw new Error("Test fehlgeschlagen");

      toast.success(`Test-${channel === "IN_APP" ? "In-App" : channel === "EMAIL" ? "E-Mail" : "Push"}-Benachrichtigung gesendet`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test fehlgeschlagen");
    } finally {
      setTestLoading(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="types">
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Typen & Kanäle
              </span>
            </TabsTrigger>
            <TabsTrigger value="frequency">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Frequenz
              </span>
            </TabsTrigger>
            <TabsTrigger value="mutes">
              <span className="flex items-center gap-2">
                <VolumeX className="h-4 w-4" />
                Stummschaltungen
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Typen & Kanäle - Matrix View */}
          <TabsContent value="types" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Konfiguriere für jeden Benachrichtigungs-Typ, über welche Kanäle du informiert werden möchtest.
                In-App ist immer sofort. Für E-Mail und Push kannst du die Frequenz wählen.
              </p>

              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                      <TableHead className="w-64 font-medium">Benachrichtigungs-Typ</TableHead>
                      {CHANNELS.map((channel) => (
                        <TableHead key={channel.value} className="text-center w-48">
                          <div className="flex items-center justify-center gap-1">
                            {channel.icon}
                            <span className="hidden sm:inline">{channel.label}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {NOTIFICATION_TYPES.map((nt) => (
                      <TableRow key={nt.value}>
                        <TableCell className="font-medium">
                          <div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-2 cursor-help">
                                  {nt.label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" align="start">
                                <p>{nt.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        {CHANNELS.map((channel) => {
                          const pref = getChannelForType(prefs, nt.value, channel.value);
                          const isEnabled = pref?.enabled ?? (channel.value === "IN_APP");
                          const frequency = pref?.frequency ?? "IMMEDIATE";

                          return (
                            <TableCell key={channel.value} className="text-center p-2">
                              {channel.value === "IN_APP" ? (
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={() => toggleEnabled(nt.value, channel.value)}
                                  disabled={saving}
                                  aria-label={`${nt.label} In-App`}
                                />
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={() => toggleEnabled(nt.value, channel.value)}
                                    disabled={saving || !pushEnabled && channel.value === "PUSH"}
                                    aria-label={`${nt.label} ${channel.label}`}
                                  />
                                  {isEnabled && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Select
                                          value={frequency}
                                          onValueChange={(v) => changeFrequency(nt.value, channel.value, v as NotificationFrequency)}
                                          disabled={saving || !pushEnabled && channel.value === "PUSH"}
                                        >
                                          <SelectTrigger className="w-[140px] h-8 text-xs">
                                            <SelectValue placeholder="Frequenz" />
                                          </SelectTrigger>
                                          <SelectContent side="bottom" align="end">
                                            {FREQUENCIES.map((f) => (
                                              <SelectItem key={f.value} value={f.value}>
                                                <div className="flex items-center gap-2">
                                                  {f.icon}
                                                  <span>{f.label}</span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" align="end">
                                        <p>Wie oft Benachrichtigungen zugestellt werden</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                              {!pushEnabled && channel.value === "PUSH" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-muted-foreground" style={{ cursor: "help" }}>
                                      Push deaktiviert
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Web Push benötigt VAPID-Keys in der Server-Konfiguration</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Tab 2: Frequenz - Card View */}
          <TabsContent value="frequency" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Alternative Ansicht: Globale Frequenz pro Kanal einstellen.
                Die Einstellungen hier überschreiben die individuellen Frequenzen in Tab "Typen & Kanäle".
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {/* In-App Card */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">In-App</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    In-App-Benachrichtigungen werden immer sofort im Feed angezeigt.
                    Eine Frequenz-Auswahl ist hier nicht nötig.
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="inapp-frequency"
                        value="IMMEDIATE"
                        checked
                        disabled
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="font-medium">Immer sofort</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Email Card */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">E-Mail</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Wähle, wie oft du E-Mail-Benachrichtigungen erhalten möchtest.
                  </p>
                  <div className="space-y-2" role="radiogroup" aria-label="E-Mail Frequenz">
                    {FREQUENCIES.map((f) => (
                      <label
                        key={f.value}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer",
                          "hover:bg-accent"
                        )}
                      >
                        <input
                          type="radio"
                          name="email-frequency"
                          value={f.value}
                          onChange={(e) => {
                            // Apply to all email preferences
                            setPrefs((prev) =>
                              prev.map((p) => ({
                                ...p,
                                channels: p.channels.map((c) =>
                                  c.channel === "EMAIL" ? { ...c, frequency: e.target.value as NotificationFrequency } : c
                                ),
                              }))
                            );
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {f.icon}
                          <span>{f.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Push Card */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Push</h3>
                    {!pushEnabled && <Badge variant="secondary" className="ml-2 text-xs">Deaktiviert</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Wähle, wie oft du Push-Benachrichtigungen erhalten möchtest.
                    Erfordert Browser-Permission.
                  </p>
                  {pushEnabled ? (
                    <div className="space-y-2" role="radiogroup" aria-label="Push Frequenz">
                      {FREQUENCIES.map((f) => (
                        <label
                          key={f.value}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer",
                            "hover:bg-accent"
                          )}
                        >
                          <input
                            type="radio"
                            name="push-frequency"
                            value={f.value}
                            onChange={(e) => {
                              setPrefs((prev) =>
                                prev.map((p) => ({
                                  ...p,
                                  channels: p.channels.map((c) =>
                                    c.channel === "PUSH" ? { ...c, frequency: e.target.value as NotificationFrequency } : c
                                  ),
                                }))
                              );
                            }}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            {f.icon}
                            <span>{f.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      Push-Benachrichtigungen sind auf dem Server nicht konfiguriert (VAPID-Keys fehlen).
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Stummschaltungen */}
          <TabsContent value="mutes" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Hier siehst du alle Objekte, die du stummgeschaltet hast. Benachrichtigungen von diesen Objekten
                werden in keinem Kanal (In-App, E-Mail, Push) zugestellt.
              </p>

              {mutes.length === 0 ? (
                <div className="text-center py-12">
                  <VolumeX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-1">Keine Stummschaltungen</h3>
                  <p className="text-sm text-muted-foreground">
                    Du hast noch keine Objekte stummgeschaltet.
                    Nutze den "Stummschalten"-Button auf Reviews, Listen, Serien oder Profilen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3" role="list" aria-label="Stummschaltungen">
                  {mutes.map((mute) => (
                    <div
                      key={mute.id}
                      role="listitem"
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                          <span className="text-lg">{MUTE_TARGET_ICONS[mute.targetType]}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={mute.targetUrl}
                            className="font-medium truncate hover:text-primary transition-colors"
                          >
                            {mute.targetTitle}
                          </a>
                          <Badge variant="secondary" className="text-xs">
                            {MUTE_TARGET_LABELS[mute.targetType]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Stummgeschaltet am {new Date(mute.createdAt).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMute(mute.id)}
                        aria-label={`${MUTE_TARGET_LABELS[mute.targetType]} "${mute.targetTitle}" entstummen`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="sr-only">Entstummen</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset} disabled={saving} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Zurücksetzen
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleTestNotification("IN_APP")}
              disabled={saving || testLoading === "IN_APP"}
              className="gap-2"
            >
              <TestTube className="h-4 w-4" />
              {testLoading === "IN_APP" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test In-App"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTestNotification("EMAIL")}
              disabled={saving || testLoading === "EMAIL" || !process.env.SMTP_HOST}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              {testLoading === "EMAIL" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test E-Mail"}
            </Button>
            {pushEnabled && (
              <Button
                variant="outline"
                onClick={() => handleTestNotification("PUSH")}
                disabled={saving || testLoading === "PUSH"}
                className="gap-2"
              >
                <Smartphone className="h-4 w-4" />
                {testLoading === "PUSH" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Push"}
              </Button>
            )}
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}