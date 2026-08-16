import Image from "next/image";
import Link from "next/link";
import { Play, Youtube, ArrowRight } from "lucide-react";
import { Review } from "@/types/review";
import { SectionHeading } from "./SectionHeading";
import { ScrollReveal } from "./ScrollReveal";

interface VideoItem {
  id: string;
  key: string;
  title: string;
  slug: string;
  thumbnail: string;
}

function extractVideoId(urlOrId: string): string | null {
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function VideoGallery({ reviews }: { reviews: Review[] }) {
  const videos: VideoItem[] = [];
  const seen = new Set<string>();

  for (const review of reviews) {
    for (const raw of review.youtubeVideos ?? []) {
      const id = extractVideoId(raw);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      videos.push({
        id,
        key: `${review.id}-${id}`,
        title: review.title,
        slug: review.slug,
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      });
      if (videos.length >= 6) break;
    }
    if (videos.length >= 6) break;
  }

  if (videos.length === 0) return null;

  return (
    <section className="space-y-10 md:space-y-12">
      <SectionHeading
        kicker="Video-Reviews"
        title={
          <>
            Tests, die du <span className="text-gradient">ansehen</span> kannst
          </>
        }
        description="Zu ausgewählten Reviews gibt es begleitende Videos – praktisch, wenn du Details lieber siehst als liest."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, i) => (
          <ScrollReveal key={video.key} variant="up" delay={(i % 3) * 120} className="h-full">
            <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
              <Link href={`/reviews/${video.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="img-bw object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
                    aria-hidden="true"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex size-16 animate-pulse-glow items-center justify-center rounded-full border border-white/35 bg-white/15 text-white backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary/90">
                      <Play className="ml-0.5 size-7 fill-white" />
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-serif text-lg font-semibold leading-snug line-clamp-1 transition-colors group-hover:text-primary">
                    {video.title}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Zum Test
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>

              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Video zu „${video.title}“ auf YouTube öffnen`}
                className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-lg border border-white/15 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
              >
                <Youtube className="size-4" />
              </a>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
