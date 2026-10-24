'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getFollowers } from '@/lib/collections-follow';
import type { Follower, FollowersResponse } from '@/lib/collections-follow-schema';
import { isCollectionsFollowEnabled } from '@/lib/collections-follow-schema';

interface CollectionFollowerListModalProps {
  collectionId: string;
  collectionSlug: string;
  collectionTitle: string;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
}

export function CollectionFollowerListModal({
  collectionId,
  collectionSlug,
  collectionTitle,
  isOpen,
  onClose,
  isOwner,
}: CollectionFollowerListModalProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFollowers = useCallback(async (loadMore = false) => {
    if (!isCollectionsFollowEnabled()) return;
    
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setFollowers([]);
      setCursor(null);
    }
    setError(null);

    try {
      const result: FollowersResponse = await getFollowers(collectionId, loadMore ? cursor || undefined : undefined, 20);
      if (loadMore) {
        setFollowers((prev) => [...prev, ...result.followers]);
      } else {
        setFollowers(result.followers);
      }
      setCursor(result.nextCursor);
      setTotalCount(result.totalCount);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Laden der Follower';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [collectionId, cursor]);

  // Load initial followers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFollowers(false);
    }
  }, [isOpen, loadFollowers]);

  if (!isOwner || !isCollectionsFollowEnabled()) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Follower von „{collectionTitle}“</span>
            <span className="text-sm font-normal text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'Follower' : 'Follower'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-sm text-destructive">
              {error}
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Noch keine Follower für diese Liste.
            </div>
          ) : (
            <ul className="space-y-2" role="list" aria-label={`Follower von ${collectionTitle}`}>
              {followers.map((follower) => (
                <li key={follower.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={follower.profileImageUrl ?? undefined} alt={follower.displayName} />
                    <AvatarFallback>{follower.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{follower.displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">@{follower.username}</p>
                  </div>
                  <a
                    href={`/u/${follower.username}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Profil
                  </a>
                </li>
              ))}
            </ul>
          )}

          {cursor && !isLoadingMore && !error && followers.length < totalCount && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFollowers(true)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Mehr laden
                  </>
                )}
              </Button>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}