"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Twitch } from "lucide-react";

interface ForumComment {
  id: string;
  text: string;
  author: string;
  userId: string | null;
  isAiGenerated: boolean;
  createdAt: string | Date;
}

interface ForumCommentSectionProps {
  threadId: string;
  initialComments: ForumComment[];
  isLoggedIn: boolean;
  displayName: string | null;
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "Gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  if (diffH < 24) return `vor ${diffH} Std.`;
  if (diffD < 30) return `vor ${diffD} Tagen`;
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function ForumCommentSection({
  threadId,
  initialComments,
  isLoggedIn,
  displayName: initialDisplayName,
}: ForumCommentSectionProps) {
  const [comments, setComments] = useState<ForumComment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [customName, setCustomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingComment, setPendingComment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const displayName = initialDisplayName || customName.trim() || "Besucher";

  const pollForApproval = useCallback(
    async (commentId: string, retries: number = 0) => {
      if (retries > 30) return;

      try {
        const res = await fetch(
          `/api/forum/threads/[slug]/comments?threadId=${threadId}&_poll=1`
        );
        if (!res.ok) return;

        const data = await res.json();
        const found = data.comments?.find((c: ForumComment) => c.id === commentId);

        if (found) {
          setComments((prev) => {
            if (prev.some((c) => c.id === commentId)) return prev;
            return [...prev, found];
          });
          setPendingComment(null);
          setSuccess("Kommentar freigegeben!");
          setTimeout(() => setSuccess(null), 3000);
          return;
        }

        setTimeout(() => pollForApproval(commentId, retries + 1), 2000);
      } catch {
        setTimeout(() => pollForApproval(commentId, retries + 1), 3000);
      }
    },
    [threadId]
  );

  const handleSubmit = async () => {
    const text = newComment.trim();
    if (!text || isSubmitting) return;

    if (!isLoggedIn && !customName.trim()) {
      setError("Bitte gib einen Namen ein.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/forum/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          text,
          displayName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kommentar konnte nicht gesendet werden.");
      }

      const data = await res.json();

      setNewComment("");
      setPendingComment(data.id);

      pollForApproval(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-8 border-t border-border mt-8">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-semibold tracking-tight">
          {comments.length} {comments.length === 1 ? "Antwort" : "Antworten"}
        </h3>
      </div>

      {isLoggedIn ? (
        <div className="space-y-3 bg-card border border-border p-5 rounded-md">
          <Textarea
            placeholder="Teile deine Meinung..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="rounded-sm h-24"
            disabled={isSubmitting || !!pendingComment}
          />
          {error && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              {success}
            </p>
          )}
          {pendingComment && (
            <p className="text-sm text-muted-foreground italic">
              Dein Kommentar wird geprüft...
            </p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting || !!pendingComment}
              className="rounded-sm"
            >
              {isSubmitting ? "Wird gesendet..." : "Kommentieren"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 bg-card border border-border p-5 rounded-md">
          <p className="text-sm text-muted-foreground">
            Melde dich an, um zu kommentieren.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Dein Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="rounded-sm flex-1"
              maxLength={30}
            />
            <a href="/api/auth/twitch/login">
              <Button variant="outline" className="rounded-sm w-full sm:w-auto">
                <Twitch className="mr-2 size-4" />
                Twitch Login
              </Button>
            </a>
          </div>
          <Textarea
            placeholder="Teile deine Meinung..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="rounded-sm h-24"
            disabled={isSubmitting || !!pendingComment}
          />
          {error && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              {success}
            </p>
          )}
          {pendingComment && (
            <p className="text-sm text-muted-foreground italic">
              Dein Kommentar wird geprüft...
            </p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting || !!pendingComment}
              className="rounded-sm"
            >
              {isSubmitting ? "Wird gesendet..." : "Kommentieren"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="h-9 w-9 border shrink-0">
                <AvatarFallback
                  className={`font-semibold text-xs ${getAvatarColor(comment.author)}`}
                >
                  {getInitials(comment.author)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{comment.author}</span>
                  <span aria-hidden="true" className="text-muted-foreground text-xs">
                    ·
                  </span>
                  <time
                    dateTime={new Date(comment.createdAt).toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {timeAgo(comment.createdAt)}
                  </time>
                </div>
                <div className="border border-border bg-card rounded-md px-4 py-2.5">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 italic text-muted-foreground text-sm">
            Noch keine Antworten. Sei der Erste!
          </div>
        )}
      </div>
    </div>
  );
}
