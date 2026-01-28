"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string | Date;
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

  return (
    <div className="space-y-8 pt-12 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold tracking-tight">Community Feedback</h3>
        <span className="text-sm text-muted-foreground">{comments.length} Kommentare</span>
      </div>

      <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border">
        <Textarea
          placeholder="Teile deine Meinung zu diesem Test..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary h-24"
          disabled={isSubmitting}
        />
        <Input
          placeholder="Name (optional)"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary"
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
            className="rounded-full px-8 font-bold"
          >
            {isSubmitting ? "Wird gesendet…" : "Kommentieren"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4">
              <Avatar className="h-10 w-10 border">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {(comment.author || "?")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">{comment.author}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Card className="rounded-2xl rounded-tl-none bg-muted/30 border-none shadow-none">
                  <CardContent className="p-4 py-3">
                    <p className="text-sm text-foreground/80 leading-relaxed">{comment.text}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 italic text-muted-foreground text-sm">
            Noch keine Kommentare. Sei der Erste!
          </div>
        )}
      </div>
    </div>
  );
}
