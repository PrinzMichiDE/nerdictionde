import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { Bookmark, Star, ArrowLeft, User } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Mein Profil - Nerdiction",
  description: "Deine Bewertungen, gespeicherten Reviews und Beiträge.",
  alternates: { canonical: `${getSiteUrl()}/profil` },
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/profil");

  const [user, ratings, bookmarks] = await Promise.all([
    prisma.twitchUser.findUnique({
      where: { id: session.userId },
      select: {
        displayName: true,
        username: true,
        profileImageUrl: true,
        broadcasterType: true,
        createdAt: true,
      },
    }),
    prisma.userRating.findMany({
      where: { userId: session.userId },
      include: {
        review: { select: { id: true, title: true, slug: true, category: true, score: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bookmark.findMany({
      where: { userId: session.userId },
      include: {
        review: { select: { id: true, title: true, slug: true, category: true, score: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  const categoryColors: Record<string, string> = {
    game: "text-purple-500",
    movie: "text-amber-500",
    series: "text-sky-500",
    hardware: "text-emerald-500",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link
        href="/"
        className="group -mt-1 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Zurück zur Startseite
      </Link>

      {/* Profile Header */}
      <div className="flex items-center gap-6 p-6 rounded-md border border-border bg-card">
        {user.profileImageUrl ? (
          <Image
            src={user.profileImageUrl}
            alt={user.displayName}
            width={80}
            height={80}
            className="rounded-full border-2 border-border"
            unoptimized
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
            <User className="size-8 text-muted-foreground" />
          </div>
        )}
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {user.displayName}
          </h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="text-xs text-muted-foreground">
            Mitglied seit {user.createdAt.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/einstellungen"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4 rotate-180" />
          Einstellungen & Push
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-border bg-card text-center">
          <p className="text-2xl font-bold">{ratings.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Bewertungen</p>
        </div>
        <div className="p-4 rounded-md border border-border bg-card text-center">
          <p className="text-2xl font-bold">{bookmarks.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Gespeichert</p>
        </div>
        <div className="p-4 rounded-md border border-border bg-card text-center">
          <p className="text-2xl font-bold">
            {ratings.length > 0
              ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Ø Bewertung</p>
        </div>
      </div>

      {/* My Ratings */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold tracking-tight flex items-center gap-2">
          <Star className="size-5 text-yellow-500" />
          Meine Bewertungen
        </h2>
        {ratings.length > 0 ? (
          <div className="space-y-3">
            {ratings.map((rating) => (
              <Link
                key={rating.id}
                href={`/reviews/${rating.review.slug}`}
                className="flex items-center gap-4 p-4 rounded-md border border-border bg-card hover:border-muted-foreground/30 transition-all"
              >
                <div className="w-12 h-12 rounded bg-muted shrink-0 flex items-center justify-center">
                  {rating.review.images?.[0] ? (
                    <Image
                      src={rating.review.images[0]}
                      alt={rating.review.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover rounded"
                      unoptimized
                    />
                  ) : (
                    <Star className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{rating.review.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    <span className={categoryColors[rating.review.category] ?? ""}>
                      {rating.review.category}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{rating.score}/10</p>
                  <p className="text-xs text-muted-foreground">Editor: {rating.review.score}/100</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center border border-border rounded-md">
            Noch keine Bewertungen abgegeben.
          </p>
        )}
      </section>

      {/* Bookmarks */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold tracking-tight flex items-center gap-2">
          <Bookmark className="size-5 text-primary" />
          Gespeicherte Reviews
        </h2>
        {bookmarks.length > 0 ? (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <Link
                key={bookmark.id}
                href={`/reviews/${bookmark.review.slug}`}
                className="flex items-center gap-4 p-4 rounded-md border border-border bg-card hover:border-muted-foreground/30 transition-all"
              >
                <div className="w-12 h-12 rounded bg-muted shrink-0 flex items-center justify-center">
                  {bookmark.review.images?.[0] ? (
                    <Image
                      src={bookmark.review.images[0]}
                      alt={bookmark.review.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover rounded"
                      unoptimized
                    />
                  ) : (
                    <Bookmark className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{bookmark.review.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    <span className={categoryColors[bookmark.review.category] ?? ""}>
                      {bookmark.review.category}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{bookmark.review.score}/100</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center border border-border rounded-md">
            Noch keine Reviews gespeichert.
          </p>
        )}
      </section>
    </div>
  );
}
