"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string | Date;
  parentId: string | null;
  score: number;
  children?: Comment[];
  userVote?: number | null;
}

interface CommentSectionProps {
  reviewId: string;
  initialComments: Comment[];
}

export function CommentSection({ reviewId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Antwort-Formular Zustand
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Voting Zustand: Map von commentId zu userVote (+1, -1 oder null)
  const [userVotes, setUserVotes] = useState<Map<string, number | null>>(new Map());
  const [isVoting, setIsVoting] = useState<Set<string>>(new Set());
  const [voteError, setVoteError] = useState<string | null>(null);

  // Kommentare in Map umwandeln für schnellen Zugriff auf Kinder
  const commentMap = useMemo(() => {
    const map = new Map<string, Comment & { children: Comment[] }>();
    comments.forEach((c) => {
      map.set(c.id, { ...c, children: [] });
    });
    return map;
  }, [comments]);

  const topLevelComments = useMemo(() => {
    comments.forEach((c) => {
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId)!.children.push(c);
      }
    });
    return comments.filter((c) => !c.parentId || !commentMap.has(c.parentId));
  }, [comments, commentMap]);

  const formatDate = (dateString: string | Date) =>
    new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleSubmit = async () => {
    const text = newComment.trim();
    if (!text || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const author = authorName.trim() || "Besucher";
    const savedAuthorName = authorName;

    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      text,
      author,
      createdAt: new Date().toISOString(),
      parentId: null,
      score: 0,
      userVote: null,
    };
    setComments((prev) => [optimistic, ...prev]);
    setNewComment("");
    setAuthorName("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          text,
          author: author !== "Besucher" ? author : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kommentar konnte nicht gespeichert werden.");
      }

      const comment = (await res.json()) as Comment;
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? comment : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ein Fehler ist aufgetreten.");
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setNewComment(text);
      setAuthorName(savedAuthorName);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = useCallback(async () => {
    const text = replyText.trim();
    if (!text || isReplying || !replyingTo) return;

    setReplyError(null);
    setIsReplying(true);

    const author = replyAuthor.trim() || "Besucher";
    const savedAuthorName = replyAuthor;

    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      text,
      author,
      createdAt: new Date().toISOString(),
      parentId: replyingTo,
      score: 0,
      userVote: null,
      children: [],
    };
    setComments((prev) => [...prev, optimistic]);
    setReplyText("");
    setReplyAuthor("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          text,
          author: author !== "Besucher" ? author : undefined,
          parentId: replyingTo,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Antwort konnte nicht gespeichert werden.");
      }

      const comment = (await res.json()) as Comment;
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? comment : c))
      );
      setReplyingTo(null);
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : "Ein Fehler ist aufgetreten.");
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setReplyText(text);
      setReplyAuthor(savedAuthorName);
    } finally {
      setIsReplying(false);
    }
  }, [replyText, replyingTo, isReplying, replyAuthor, reviewId]);

  const sendVote = useCallback(async (commentId: string, value: number) => {
    setIsVoting((prev) => new Set(prev).add(commentId));
    setVoteError(null);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "comment",
          targetId: commentId,
          value,
        }),
      });

      if (res.status === 401) {
        setVoteError("Bitte logge dich ein, um zu voten.");
        setUserVotes((prev) => {
          const next = new Map(prev);
          next.delete(commentId);
          return next;
        });
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Voting konnte nicht gespeichert werden.");
      }

      const result = await res.json();
      if (result.data?.userVote !== undefined) {
        setUserVotes((prev) => {
          const next = new Map(prev);
          next.set(commentId, result.data.userVote);
          return next;
        });
      }
    } catch (e) {
      setVoteError(e instanceof Error ? e.message : "Ein Fehler ist aufgetreten.");
      setUserVotes((prev) => {
        const next = new Map(prev);
        next.delete(commentId);
        return next;
      });
    } finally {
      setIsVoting((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  }, []);

  const handleVote = useCallback(
    async (commentId: string, value: 1 | -1) => {
      const currentVote = userVotes.get(commentId);

      // Bereits abgestimmt mit gleichem Wert -> entfernen (Toggle)
      if (currentVote === value) {
        setUserVotes((prev) => {
          const next = new Map(prev);
          next.delete(commentId);
          return next;
        });
        updateCommentScore(commentId, -value);
        return;
      }

      // Neue Stimme oder Änderung
      setUserVotes((prev) => {
        const next = new Map(prev);
        next.set(commentId, value);
        return next;
      });
      updateCommentScore(commentId, value - (currentVote ?? 0));
      await sendVote(commentId, value);
    },
    [userVotes, sendVote]
  );

  const updateCommentScore = (commentId: string, delta: number) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, score: c.score + delta };
        }
        if (c.children && c.children.length > 0) {
          return {
            ...c,
            children: c.children.map((child) => {
              if (child.id === commentId) {
                return { ...child, score: child.score + delta };
              }
              return child;
            }),
          };
        }
        return c;
      })
    );
  };

  const renderComment = useCallback(
    (comment: Comment, depth = 0) => {
      const node = commentMap.get(comment.id);
      const children = node?.children ?? [];
      const userVote = userVotes.get(comment.id) ?? comment.userVote ?? null;
      const isUpvoted = userVote === 1;
      const isDownvoted = userVote === -1;

      return (
        <div
          key={comment.id}
          className="flex space-x-4"
          style={{ marginLeft: depth * 16 }}
        >
          <div className="flex flex-col items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleVote(comment.id, 1)}
              disabled={isVoting.has(comment.id) || isUpvoted}
              aria-label={isUpvoted ? "Upvote entfernen" : "Hilfreichen Kommentar bewerten"}
              className={`${
                isUpvoted ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <ThumbsUp size={16} />
            </Button>
            <span className="text-xs font-mono font-semibold text-foreground">
              {comment.score}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleVote(comment.id, -1)}
              disabled={isVoting.has(comment.id) || isDownvoted}
              aria-label={isDownvoted ? "Downvote entfernen" : "Nicht hilfreichen Kommentar bewerten"}
              className={`${
                isDownvoted ? "text-destructive" : "text-muted-foreground hover:text-destructive"
              }`}
            >
              <ThumbsDown size={16} />
            </Button>
            {voteError && (
              <p className="text-[10px] text-destructive text-center leading-none">
                {voteError}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{comment.author}</span>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
              <time
                dateTime={new Date(comment.createdAt).toISOString()}
                className="text-xs text-muted-foreground uppercase tracking-wider"
              >
                {formatDate(comment.createdAt)}
              </time>
            </div>
            <div className="border border-border bg-card rounded-md px-4 py-3">
              <p className="text-sm text-foreground/80 leading-relaxed">{comment.text}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => setReplyingTo(comment.id)}
                className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                aria-label={`Auf Kommentar von ${comment.author} antworten`}
              >
                Antworten
              </Button>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2 pl-6 border-l-2 border-primary/20">
                <Textarea
                  placeholder="Schreibe deine Antwort..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="rounded-sm h-20"
                  disabled={isReplying}
                />
                <Input
                  placeholder="Name (optional)"
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  className="rounded-sm"
                  disabled={isReplying}
                  maxLength={100}
                />
                {replyError && (
                  <p className="text-sm text-destructive font-medium" role="alert">
                    {replyError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                      setReplyAuthor("");
                      setReplyError(null);
                    }}
                    disabled={isReplying}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim() || isReplying}
                    className="rounded-sm"
                  >
                    {isReplying ? "Wird gesendet…" : "Antwort senden"}
                  </Button>
                </div>
              </div>
            )}

            {children.length > 0 && (
              <div className="mt-4 pl-4 space-y-3 border-l-2 border-primary/10">
                {children.map((child) => renderComment(child, depth + 1))}
              </div>
            )}
          </div>
        </div>
      );
    },
    [
      commentMap,
      replyingTo,
      replyText,
      replyAuthor,
      replyError,
      isReplying,
      handleReplySubmit,
      userVotes,
      isVoting,
      voteError,
      handleVote,
    ]
  );

  return (
    <div className="space-y-8 pt-12 border-t border-border mt-12">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <span className="kicker text-primary">Community</span>
          <h3 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            Diskussion
          </h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {comments.length} {comments.length === 1 ? "Kommentar" : "Kommentare"}
        </span>
      </div>

      <div className="space-y-4 bg-card border border-border p-6 rounded-md">
        <Textarea
          placeholder="Teile deine Meinung zu diesem Test..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="rounded-sm h-24"
          disabled={isSubmitting}
        />
        <Input
          placeholder="Name (optional)"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="rounded-sm"
          disabled={isSubmitting}
          maxLength={100}
        />
        {error && (
          <p className="text-sm text-destructive font-medium" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="rounded-sm"
          >
            {isSubmitting ? "Wird gesendet…" : "Kommentieren"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {topLevelComments.length > 0 ? (
          topLevelComments.map((comment) => renderComment(comment))
        ) : (
          <div className="text-center py-12 italic text-muted-foreground text-sm">
            Noch keine Kommentare. Sei der Erste!
          </div>
        )}
      </div>
    </div>
  );
}
