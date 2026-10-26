import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * Server Component: Follower Count Badge (SSR)
 * Zeigt den Follower-Count direkt im HTML (SEO-freundlich)
 * Client-seitige Hydration via useCollectionFollow Hook
 */

export async function getFollowerCountSSR(slug: string): Promise<number> {
  const collection = await prisma.reviewCollection.findUnique({
    where: { slug },
    select: { followersCount: true },
  });
  return collection?.followersCount ?? 0;
}

// Cached version for multiple calls
export const getFollowerCountCached = unstable_cache(
  async (slug: string): Promise<number> => {
    const collection = await prisma.reviewCollection.findUnique({
      where: { slug },
      select: { followersCount: true },
    });
    return collection?.followersCount ?? 0;
  },
  ['collection-follower-count'],
  { tags: ['collection-follower-count'], revalidate: 30 }
);

/**
 * Client Component: Follower Count Badge mit Client-Hydration
 * Zeigt SSR-Count initial, dann Updates via useCollectionFollow Hook
 */
'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface CollectionFollowerCountProps {
  slug: string;
  initialCount: number;
  className?: string;
  showLabel?: boolean;
}

export function CollectionFollowerCount({
  slug,
  initialCount,
  className = '',
  showLabel = true,
}: CollectionFollowerCountProps) {
  const [count, setCount] = useState(initialCount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update count from parent (via useCollectionFollow onChange)
  useEffect(() => {
    if (mounted) {
      setCount(initialCount);
    }
  }, [initialCount, mounted]);

  if (!mounted) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`} aria-busy="true">
        <Heart className="h-4 w-4 text-gray-300 animate-pulse" aria-hidden="true" />
        <span className="text-sm font-medium text-gray-300">—</span>
        {showLabel && <span className="text-xs text-gray-400">Follower</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Heart className="h-4 w-4 text-red-500 fill-current" aria-hidden="true" />
      <span className="text-sm font-medium tabular-nums">{count}</span>
      {showLabel && <span className="text-xs text-muted-foreground">Follower</span>}
    </span>
  );
}