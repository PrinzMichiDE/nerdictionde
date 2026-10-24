import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import { getFollowedCollections } from '@/lib/collection-follow';
import { isCollectionFollowEnabled } from '@/lib/schemas/collection-follow-schema';
import { FollowedCollectionsClient } from '@/components/collections/FollowedCollectionsClient';

export const metadata: Metadata = {
  title: 'Gefolgte Listen - Einstellungen - Nerdiction',
  description: 'Verwalte deine gefolgten Review-Listen und entdecke neue kuratierte Inhalte.',
};

interface Props {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function GefolgteListenPage({ searchParams }: Props) {
  if (!isCollectionFollowEnabled()) {
    notFound();
  }

  const session = await getServerSession();
  if (!session) {
    redirect('/auth/login?callbackUrl=/einstellungen/gefolgte-listen');
  }

  const { cursor } = await searchParams;

  const result = await getFollowedCollections(session.userId, cursor, 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
          Gefolgte Listen
        </h1>
        <p className="mt-2 text-muted-foreground">
          Hier siehst du alle Listen, denen du folgst. Du wirst über Updates benachrichtigt.
        </p>
      </div>

      <FollowedCollectionsClient
        initialCollections={result.collections}
        initialCursor={result.nextCursor}
        userId={session.userId}
      />
    </div>
  );
}