"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, X, Check, ExternalLink, MessageSquare, Star, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNotifications, markNotificationsAsRead, getUnreadNotificationCount } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true&limit=1");
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=10");
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const handleMarkAsRead = async (ids: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await handleMarkAsRead(unreadIds);
  };

  const getNotificationLink = (notification: NotificationItem): string | null => {
    if (!notification.data) return null;
    const data = notification.data as Record<string, unknown>;
    if (data.followerId) return `/u/${data.followerUsername}`;
    return null;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <MessageSquare className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10"
          aria-label={`Benachrichtigungen${unreadCount > 0 ? `, ${unreadCount} ungelesen` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Benachrichtigungen</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Alle als gelesen
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
              <p>Keine Benachrichtigungen</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 hover:bg-accent transition-colors ${
                    !notification.readAt ? "bg-accent/50" : ""
                  }`}
                  onSelect={(e) => {
                    e.preventDefault();
                    const link = getNotificationLink(notification);
                    if (link) {
                      window.location.href = link;
                    }
                    if (!notification.readAt) {
                      handleMarkAsRead([notification.id]);
                    }
                  }}
                >
                  <div className="p-1.5 rounded-full bg-muted">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${!notification.readAt ? "font-semibold" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: de })}
                    </p>
                  </div>
                  {!notification.readAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkAsRead([notification.id]);
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}

          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            className="text-center text-primary hover:bg-accent"
            onSelect={(e) => {
              e.preventDefault();
              window.location.href = "/benachrichtigungen";
            }}
          >
            Alle Benachrichtigungen anzeigen
            <ExternalLink className="h-3 w-3 ml-1 inline" />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}