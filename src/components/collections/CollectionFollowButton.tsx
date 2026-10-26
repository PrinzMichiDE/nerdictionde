'use client';

import { useCollectionFollow } from '@/hooks/useCollectionFollow';
import { Heart, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CollectionFollowButtonProps {
  collectionId: string;
  slug: string;
  initialFollowing: boolean;
  initialCount: number;
  onChange?: (following: boolean, count: number) => void;
  className?: string;
}

export function CollectionFollowButton({
  collectionId,
  slug,
  initialFollowing,
  initialCount,
  onChange,
  className = '',
}: CollectionFollowButtonProps) {
  const router = useRouter();
  // Initialize isAuthenticated from cookie immediately (lazy init)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.cookie.includes('twitch_session');
    }
    return false;
  });
  const [mounted, setMounted] = useState(false);

  const {
    isFollowing,
    followersCount,
    isLoading,
    toggle,
  } = useCollectionFollow(collectionId, slug, initialFollowing, initialCount);

  // Set mounted after initial render
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Required for hydration-safe initialization
    setMounted(true);
    // Update auth state on mount
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Required for hydration-safe initialization
      setIsAuthenticated(document.cookie.includes('twitch_session'));
    }
  }, []);

  // onChange Callback für Parent-Komponenten
  useEffect(() => {
    if (onChange && mounted) {
      onChange(isFollowing, followersCount);
    }
  }, [isFollowing, followersCount, onChange, mounted]);

  const handleLoginRedirect = () => {
    const redirectUrl = `/auth/login?callbackUrl=/listen/${slug}`;
    router.push(redirectUrl);
  };

  const handleClick = async () => {
    if (!mounted) return;
    if (!isAuthenticated) {
      handleLoginRedirect();
      return;
    }
    await toggle();
  };

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-busy="true"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          bg-gray-100 text-gray-400 border border-gray-200 animate-pulse cursor-not-allowed
          ${className}
        `}
      >
        <Heart className="h-4 w-4" aria-hidden="true" />
        <span>Lädt…</span>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono bg-gray-100 text-gray-400">
          {initialCount}
        </span>
      </button>
    );
  }

  if (!isCollectionFollowEnabled()) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? 'Collection entfolgen' : 'Collection folgen'}
        aria-live="polite"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isFollowing
            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
          }
        `}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Heart
            className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
        )}
        <span className={isFollowing ? 'font-semibold' : ''}>
          {isFollowing ? 'Gefolgt' : 'Folgen'}
        </span>
        <span
          aria-hidden="true"
          className={`
            inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono
            ${isFollowing
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }
          `}
        >
          {followersCount}
        </span>
      </button>

      {!isAuthenticated && (
        <button
          type="button"
          onClick={handleLoginRedirect}
          className="text-xs text-muted-foreground hover:underline bg-transparent border-none p-0"
        >
          Einloggen
        </button>
      )}
    </div>
  );
}

/**
 * Prüft ob Collection Follow Feature aktiviert ist (Client-seitig)
 * Da Environment Variables nicht direkt im Client verfügbar sind,
 * prüfen wir über ein globales Flag oder geben true zurück (Server validiert)
 */
function isCollectionFollowEnabled(): boolean {
  // Im Client können wir das Feature-Flag nicht direkt prüfen
  // Die API gibt 404 zurück wenn deaktiviert
  return true;
}