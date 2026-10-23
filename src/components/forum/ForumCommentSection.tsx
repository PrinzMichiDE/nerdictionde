"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Reply } from "lucide-react";
import { VoteButtons } from "@/components/shared/VoteButtons";

const avatarPalette = [
  "--avatar-1",
  "--avatar-2",
  "--avatar-3",
  "--avatar-4",
  "--avatar-5",
  "--avatar-6",
  "--avatar-7",
];

function getAvatarColor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % avatarPalette.length;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

interface ForumComment {
  id: string;
  text: string;
  author: string;
  userId: string | null;
  isAiGenerated: boolean;
  score?: number;
  createdAt: string | Date;
}

interface ForumCommentSectionProps {
  threadId: string;
  initialComments: ForumComment[];
  isLoggedIn: boolean;
  displayName: string | null;
}

export function ForumCommentSection({
  threadId,
  initialComments,
  isLoggedIn,
  displayName: initialDisplayName,
}: ForumCommentSectionProps) {
  const [comments, setComments] = useState<ForumComment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string; text: string } | null>(null);
  const [customName, setCustomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingComment, setPendingComment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          setReplyingTo(null);
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
    const text = (replyingTo ? replyingTo.text + "\n\n" : "") + newComment.trim();
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
          text: replyingTo ? newComment.trim() : text,
          displayName,
          ...(replyingTo ? { parentCommentId: replyingTo.id } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kommentar konnte nicht gesendet werden.");
      }

      const data = await res.json();
      setNewComment("");
      setReplyingTo(null);
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

      {/* Reply input */}
      <div className="space-y-3 bg-card border border-border p-5 rounded-md">
        {replyingTo && (
          <div className="flex items-start gap-3 pl-4 border-l-2 border-primary/30 mb-3 bg-muted/30 rounded-r-sm p-3">
            <div>
              <span className="text-sm font-semibold">{replyingTo.author}</span>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                &ldquo;{replyingTo.text}&rdquo;
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="ml-auto h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Antwort abbrechen"
            >
              ×
            </Button>
          </div>
        )}
        <Textarea
          placeholder={replyingTo ? "Antwort auf " + replyingTo.author + "…" : "Teile deine Meinung…"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="rounded-sm h-24 resize-none"
          disabled={isSubmitting || !!pendingComment}
        />
        {error && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
        {pendingComment && (
          <p className="text-sm text-muted-foreground italic">
            Dein Kommentar wird geprüft…
          </p>
        )}
        <div className="flex items-center justify-end gap-2">
          {!isLoggedIn && (
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Dein Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="rounded-sm flex-1 h-9"
                maxLength={30}
              />
              <a href="/api/auth/twitch/login" className="shrink-0">
                <Button variant="outline" size="sm" className="h-9 rounded-sm">
                  Twitch Login
                </Button>
              </a>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting || !!pendingComment}
            className="rounded-sm h-9"
          >
            {isSubmitting ? "Wird gesendet…" : replyingTo ? "Antworten" : "Kommentieren"}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const colorIdx = getAvatarColor(comment.author);
            return (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarFallback
                    className="font-semibold text-xs"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--${avatarPalette[colorIdx]}) 12%, transparent)`,
                      color: `var(--${avatarPalette[colorIdx]})`,
                    }}
                  >
                    {getInitials(comment.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{comment.author}</span>
                    {comment.isAiGenerated && (
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded-sm bg-muted/60 text-muted-foreground font-medium select-none">
                        AI
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs" aria-hidden="true">·</span>
                    <time
                      dateTime={new Date(comment.createdAt).toISOString()}
                      className="text-xs text-muted-foreground"
                    >
                      {timeAgo(comment.createdAt)}
                    </time>
                  </div>
                  <div className="border border-border bg-card rounded-md px-4 py-2.5">
                    <p className="text-sm leading-relaxed">{comment.text}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <VoteButtons
                      targetType="comment"
                      targetId={comment.id}
                      initialScore={comment.score ?? 0}
                    />
                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo?.id === comment.id
                            ? null
                            : { id: comment.id, author: comment.author, text: comment.text }
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      <Reply className="size-3" />
                      Antworten
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Noch keine Antworten. Sei der Erste!
          </div>
        )}
      </div>
    </div>
  );
}
