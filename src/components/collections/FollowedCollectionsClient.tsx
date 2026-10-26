'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2, X } from 'lucide-react';
import { useCollectionFollow } from '@/hooks/useCollectionFollow';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FollowedCollectionItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  owner: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  };
  itemCount: number;
  followersCount: number;
  updatedAt: Date | string;
  isFollowing: true;
}

interface FollowedCollectionsClientProps {
  initialCollections: FollowedCollectionItem[];
  initialCursor: string | null;
  userId: string;
}

export function FollowedCollectionsClient({
  initialCollections,
  initialCursor,
  userId,
}: FollowedCollectionsClientProps) {
  const [collections, setCollections] = useState<FollowedCollectionItem[]>(initialCollections);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialCursor);

  const handleUnfollow = async (collectionId: string, slug: string) => {
    // Optimistisches Update
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));

    try {
      const res = await fetch(`/api/listen/${slug}/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Entfolgen');
      }

      toast.success('Liste entfolgt');
    } catch (err) {
      // Rollback: Seite neu laden oder Collection wieder hinzufügen
      toast.error(err instanceof Error ? err.message : 'Fehler beim Entfolgen');
      // Einfacher Rollback: Seite neu laden
      window.location.reload();
    }
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !cursor) return;

    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set('cursor', cursor);
      params.set('limit', '20');

      const res = await fetch(`/api/me/followed-collections?${params.toString()}`);
      if (!res.ok) throw new Error('Fehler beim Laden');

      const data = await res.json();
      setCollections((prev) => [...prev, ...data.collections]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (collections.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">Du folgst noch keinen Listen</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Entdecke kuratierte Listen anderer Nutzer und folge ihnen, um über neue Reviews informiert zu werden.
        </p>
        <Link
          href="/listen"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Listen entdecken
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {collections.map((collection) => (
          <article
            key={collection.id}
            className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
          >
            <div className="relative aspect-video bg-muted overflow-hidden">
              {collection.coverImage ? (
                <img
                  src={collection.coverImage}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                  <Heart className="h-12 w-12" aria-hidden="true" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => handleUnfollow(collection.id, collection.slug)}
                  className="p-1.5 rounded-full bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={`"${collection.title}" entfolgen`}
                  title={`"${collection.title}" entfolgen`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col p-4">
              <Link href={`/listen/${collection.slug}`} className="block">
                <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {collection.title}
                </h3>
              </Link>

              {collection.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {collection.description}
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Link
                  href={`/u/${collection.owner.username}`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span className="font-medium">{collection.owner.displayName}</span>
                </Link>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" aria-hidden="true" />
                  {collection.followersCount}
                </span>
                <span className="flex items-center gap-1">
                  {collection.itemCount} Review{collection.itemCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-muted rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Lädt…
              </>
            ) : (
              'Weitere Listen laden'
            )}
          </button>
        </div>
      )}
    </div>
  );
}