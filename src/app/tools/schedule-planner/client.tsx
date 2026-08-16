"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Calendar, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  id: string;
  title: string;
  game: string | null;
  startTime: string;
  endTime: string | null;
  timezone: string;
  isRecurring: boolean;
  recurrence: string | null;
  tags: string[];
}

function Toast({ toast }: { toast: { id: string; title?: string; description?: string; variant?: string } }) {
  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border z-50 ${
        toast.variant === "destructive"
          ? "bg-destructive text-destructive-foreground"
          : "bg-background border-border"
      }`}
    >
      {toast.title && <div className="font-semibold">{toast.title}</div>}
      {toast.description && <div className="text-sm">{toast.description}</div>}
    </div>
  );
}

export default function SchedulePlannerClient() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    startTime: "",
    endTime: "",
    timezone: "Europe/Berlin",
    isRecurring: false,
    recurrence: "",
    tags: "",
  });
  const { toast, toasts } = useToast();

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await fetch("/api/tools/schedule");
      const data = await response.json();
      if (data.success) {
        setSchedules(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/tools/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Erfolg",
          description: "Stream wurde geplant",
        });
        setShowForm(false);
        setFormData({
          title: "",
          game: "",
          startTime: "",
          endTime: "",
          timezone: "Europe/Berlin",
          isRecurring: false,
          recurrence: "",
          tags: "",
        });
        loadSchedules();
      } else {
        toast({
          title: "Fehler",
          description: data.error || "Fehler beim Speichern",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Möchtest du diesen Stream wirklich löschen?")) return;

    try {
      const response = await fetch(`/api/tools/schedule/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Erfolg",
          description: "Stream wurde gelöscht",
        });
        loadSchedules();
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Stream Schedule Planner</h1>
            <p className="text-muted-foreground">
              Plane und verwalte deine Stream-Termine
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Stream
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Neuen Stream planen</CardTitle>
              <CardDescription>
                Erstelle einen neuen Stream-Termin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="game">Game/Kategorie</Label>
                    <Input
                      id="game"
                      value={formData.game}
                      onChange={(e) =>
                        setFormData({ ...formData, game: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Startzeit *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      required
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Endzeit</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (kommagetrennt)</Label>
                  <Input
                    id="tags"
                    placeholder="z.B. gaming, ranked, chill"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Speichere...
                      </>
                    ) : (
                      "Speichern"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{schedule.title}</CardTitle>
                    {schedule.game && (
                      <CardDescription className="mt-1">
                        {schedule.game}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(schedule.startTime).toLocaleString("de-DE")}
                    </span>
                  </div>
                  {schedule.endTime && (
                    <div className="text-muted-foreground">
                      Bis: {new Date(schedule.endTime).toLocaleString("de-DE")}
                    </div>
                  )}
                  {schedule.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {schedule.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-muted rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {schedules.length === 0 && !showForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Noch keine Streams geplant. Erstelle deinen ersten Stream!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
