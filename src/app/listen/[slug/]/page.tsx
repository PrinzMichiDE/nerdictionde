import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionWithItems, getCollectionBySlug } from "@/lib/collections";
import { getFollowStatus } from "@/lib/collection-follow";
import { isCollectionFollowEnabled } from "@/lib/schemas/collection-follow-schema";
import { CollectionItems } from "@/components/collections/CollectionItems";
import { CollectionFollowButton } from "@/components/collections/CollectionFollowButton";
import { getCategoryColor } from "@/lib/utils";
import { generateCollectionMetadata } from "@/lib/share-meta";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { EmbedModal } from "@/components/embed/EmbedModal";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { cursor } = await searchParams;
  const collection = await getCollectionWithItems({
    slug,
    cursor: cursor ? parseInt(cursor) : 0,
    limit: 1,
  });

  if (!collection) {
    return { title: "Liste nicht gefunden - Nerdiction" };
  }

  return generateCollectionMetadata({
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    owner: collection.owner,
    items: collection.items,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  });
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

export default async function ListenDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { cursor } = await searchParams;

  const collection = await getCollectionWithItems({
    slug,
    cursor: cursor ? parseInt(cursor) : 0,
    limit: 12,
  });

  if (!collection) {
    notFound();
  }

  // Follow-Status für SSR laden (falls Feature aktiviert)
  let followStatus = { isFollowing: false, followersCount: 0 };
  if (isCollectionFollowEnabled()) {
    followStatus = await getFollowStatus(undefined, collection.id);
  }

  const isOwner = false; // Will be determined by client component via session

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <article>
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
                {collection.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  Von <a href={`/u/${collection.owner.username}`} className="font-medium hover:text-primary transition-colors">
                    {collection.owner.displayName}
                  </a>
                </span>
                <span className="flex items-center gap-1">
                  {collection.itemCount} Review{collection.itemCount !== 1 ? "s" : ""}
                </span>
                {isCollectionFollowEnabled() && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {followStatus.followersCount} Follower
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-xs font-medium border"
                  style={{ borderColor: collection.isPublic ? "var(--primary)" : "var(--muted-foreground)" }}>
                  {collection.isPublic ? "Öffentlich" : "Privat"}
                </span>
              </div>
              {collection.description && (
                <p className="mt-4 text-muted-foreground whitespace-pre-wrap">{collection.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ShareButtons
                contentType="collection"
                contentId={collection.id}
                title={collection.title}
                description={collection.description || undefined}
                url={`/listen/${collection.slug}`}
                image={collection.items?.[0]?.review?.images?.[0]}
                author={collection.owner.displayName}
                variant="inline"
              />
              <EmbedModal
                type="collection"
                slug={collection.slug}
                title={collection.title}
                coverImage={collection.items?.[0]?.review?.images?.[0] ?? null}
              />
              {isCollectionFollowEnabled() && (
                <CollectionFollowButton
                  collectionId={collection.id}
                  slug={collection.slug}
                  initialFollowing={followStatus.isFollowing}
                  initialCount={followStatus.followersCount}
                />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
            <span className="flex items-center gap-1">
              Erstellt: {new Date(collection.createdAt).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              Aktualisiert: {new Date(collection.updatedAt).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
            </span>
          </div>
        </header>

        {/* Items */}
        <CollectionItems
          initialItems={collection.items}
          initialCursor={collection.nextCursor}
          slug={collection.slug}
          isOwner={isOwner}
        />
      </article>
    </div>
  );
}