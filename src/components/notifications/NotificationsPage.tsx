"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, X, Check, Filter, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { NotificationClient } from "@/lib/notifications";

interface NotificationsPageProps {
  initialNotifications: {
    items: NotificationClient[];
    nextCursor: string | null;
    unreadCount: number;
  };
  userId: string;
}

export function NotificationsPage({ initialNotifications, userId }: NotificationsPageProps) {
  const [items, setItems] = useState<NotificationClient[]>(initialNotifications.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNotifications.nextCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialNotifications.nextCursor);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [unreadCount, setUnreadCount] = useState(initialNotifications.unreadCount);

  const fetchNotifications = async (cursor?: string, append = false) => {
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (filter === "unread") params.set("unreadOnly", "true");
      params.set("limit", "20");

      const response = await fetch(`/api/notifications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setItems((prev) => [...prev, ...data.data.items]);
        } else {
          setItems(data.data.items);
        }
        setNextCursor(data.data.nextCursor);
        setHasMore(!!data.data.nextCursor);
        if (!append) {
          setUnreadCount(data.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      setLoading(true);
      fetchNotifications(nextCursor, true);
    }
  };

  const handleMarkAsRead = async (ids: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setItems((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = items.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await handleMarkAsRead(unreadIds);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <span className="text-primary">👤</span>;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationLink = (notification: NotificationClient): string | null => {
    if (!notification.data) return null;
    const data = notification.data as Record<string, unknown>;
    if (data.followerId) return `/u/${data.followerUsername}`;
    return null;
  };

  const filteredItems = items;

  if (filteredItems.length === 0 && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-serif text-xl font-semibold tracking-tight mb-2">
          {filter === "unread" ? "Keine ungelesenen Benachrichtigungen" : "Keine Benachrichtigungen"}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {filter === "unread"
            ? "Alles gelesen! Neue Benachrichtigungen erscheinen hier."
            : "Wenn dir jemand folgt oder deine Inhalte bewertet, erfährst du es hier."}
        </p>
        {filter === "unread" && (
          <Button variant="outline" onClick={() => setFilter("all")}>
            Alle anzeigen
            <Filter className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Benachrichtigungen</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} ungelesen` : "Alles gelesen"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {filter === "all" ? "Alle" : "Ungelesen"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className={filter === "all" ? "bg-accent font-medium" : ""}
                onSelect={(e) => {
                  e.preventDefault();
                  setFilter("all");
                }}
              >
                Alle
              </DropdownMenuItem>
              <DropdownMenuItem
                className={filter === "unread" ? "bg-accent font-medium" : ""}
                onSelect={(e) => {
                  e.preventDefault();
                  setFilter("unread");
                }}
              >
                Nur ungelesene
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
              <Check className="h-4 w-4" />
              Alle als gelesen
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
            getIcon={getNotificationIcon}
            getLink={getNotificationLink}
          />
        ))}

        {hasMore && (
          <div className="text-center pt-4">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              variant="outline"
              className="w-full py-3"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  Mehr laden
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "follow":
      return <span className="text-primary">👤</span>;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
}

function getNotificationLink(notification: NotificationClient): string | null {
  if (!notification.data) return null;
  const data = notification.data as Record<string, unknown>;
  if (data.followerId) return `/u/${data.followerUsername}`;
  return null;
}

interface NotificationCardProps {
  notification: NotificationClient;
  onMarkAsRead: (ids: string[]) => void;
  getIcon: (type: string) => React.ReactNode;
  getLink: (notification: NotificationClient) => string | null;
}

function NotificationCard({
  notification,
  onMarkAsRead,
  getIcon,
  getLink,
}: NotificationCardProps) {
  const link = getLink(notification);
  const isUnread = !notification.readAt;

  const handleClick = (e: React.MouseEvent) => {
    if (isUnread) {
      onMarkAsRead([notification.id]);
    }
    if (link) {
      e.preventDefault();
      window.location.href = link;
    }
  };

  return (
    <article
      className={`p-4 rounded-lg border border-border bg-card transition-colors ${
        isUnread ? "bg-accent/30 border-primary/20" : "hover:border-muted-foreground/30"
      }`}
      onClick={handleClick}
      style={{ cursor: link ? "pointer" : "default" }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-muted">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-sm ${isUnread ? "font-semibold" : ""}`}>
              {notification.title}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: de })}
            </span>
            {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          {link && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              Zum Profil
              <span className="h-3 w-3">→</span>
            </p>
          )}
        </div>
        {isUnread && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkAsRead([notification.id]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </article>
  );
}