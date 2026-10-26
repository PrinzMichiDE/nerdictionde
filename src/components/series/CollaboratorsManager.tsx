"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, UserPlus, UserCheck, Loader2, Trash2, Crown, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { UseUserSeriesCollaboratorsReturn } from "@/hooks/useUserSeries";

interface CollaboratorWithStringDates {
  userId: string;
  username: string;
  displayName: string;
  role: "OWNER" | "EDITOR";
  invitedAt: string;
  acceptedAt: string | null;
}

interface CollaboratorsManagerProps {
  collaborators: CollaboratorWithStringDates[];
  isOwner: boolean;
  currentUserId: string;
  onInvite: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, role: "OWNER" | "EDITOR") => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

interface UserSearchResult {
  id: string;
  username: string;
  displayName: string | null;
}

export function CollaboratorsManager({
  collaborators,
  isOwner,
  currentUserId,
  onInvite,
  onUpdateRole,
  onRemove,
  isLoading = false,
  className,
}: CollaboratorsManagerProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        // Filter out existing collaborators and self
        const existingIds = new Set([currentUserId, ...collaborators.map((c) => c.userId)]);
        const filtered = data.users.filter((u: UserSearchResult) => !existingIds.has(u.id));
        setSearchResults(filtered);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [collaborators, currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleInvite = async (user: UserSearchResult) => {
    setInvitingId(user.id);
    try {
      await onInvite(user.id);
      setSearchQuery("");
      setShowSearch(false);
      setSearchResults([]);
    } finally {
      setInvitingId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: "OWNER" | "EDITOR") => {
    if (!isOwner) return;
    try {
      await onUpdateRole(userId, role);
    } catch {
      // Error handled in hook
    }
  };

  const handleRemove = async (userId: string) => {
    if (!isOwner) return;
    if (!confirm("Diesen Kollaborator wirklich entfernen?")) return;
    try {
      await onRemove(userId);
    } catch {
      // Error handled in hook
    }
  };

  const getRoleBadge = (role: "OWNER" | "EDITOR") => (
    <Badge variant={role === "OWNER" ? "default" : "secondary"} className="gap-1">
      {role === "OWNER" && <Crown className="h-3 w-3" />}
      {role}
    </Badge>
  );

  const getStatusBadge = (acceptedAt: string | null) => {
    if (acceptedAt) return null;
    return (
      <Badge variant="outline" className="text-xs">
        Ausstehend
      </Badge>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kollaboratoren</h3>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(true)}
            disabled={isLoading}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Einladen
          </Button>
        )}
      </div>

      {showSearch && (
        <div className="space-y-2 p-4 border rounded-lg bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nutzername oder Anzeigename suchen..."
              className="pl-10"
              autoFocus
            />
          </div>
          {searchLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.displayName || user.username}</p>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInvite(user)}
                    disabled={invitingId === user.id}
                    className="gap-1"
                  >
                    {invitingId === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" />
                        Einladen
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Keine Nutzer gefunden</p>
          ) : null}
        </div>
      )}

      {collaborators.length === 0 && !showSearch && (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Keine Kollaboratoren. {isOwner ? "Lade andere ein, um gemeinsam an der Serie zu arbeiten." : "Du bist der einzige Kollaborator."}</p>
        </div>
      )}

      <div className="space-y-2" role="list" aria-label="Kollaboratoren">
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.userId}
            role="listitem"
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {collaborator.displayName?.[0] || collaborator.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{collaborator.displayName || collaborator.username}</p>
                <span className="text-sm text-muted-foreground">@{collaborator.username}</span>
                {collaborator.userId === currentUserId && (
                  <Badge variant="outline" className="text-xs">
                    Du
                  </Badge>
                )}
                {getStatusBadge(collaborator.acceptedAt)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge(collaborator.role)}
              {isOwner && collaborator.userId !== currentUserId && collaborator.acceptedAt && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Aktionen</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {collaborator.role === "EDITOR" && (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(collaborator.userId, "OWNER")}
                        className="flex items-center gap-2"
                        inset={false}
                      >
                        <Crown className="h-4 w-4" />
                        Owner machen
                      </DropdownMenuItem>
                    )}
                    {collaborator.role === "OWNER" && (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(collaborator.userId, "EDITOR")}
                        className="flex items-center gap-2"
                        inset={false}
                      >
                        <UserCheck className="h-4 w-4" />
                        Zu Editor machen
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleRemove(collaborator.userId)}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      inset={false}
                    >
                      <Trash2 className="h-4 w-4" />
                      Entfernen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}