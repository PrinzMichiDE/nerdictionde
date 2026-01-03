import { Metadata } from "next";
import { BookmarkedReviews } from "@/components/reviews/BookmarkedReviews";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { AnimatedText } from "@/components/shared/AnimatedText";
import { BookmarkCheck } from "lucide-react";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";

export const metadata: Metadata = {
  title: "Meine Bookmarks - Gespeicherte Reviews",
  description: "Deine gespeicherten und bookmarkten Reviews auf einen Blick.",
  alternates: {
    canonical: `${baseUrl}/bookmarks`,
  },
  robots: {
    index: false, // Don't index bookmark pages
    follow: false,
  },
};

export default function BookmarksPage() {
  return (
    <div className="space-y-12 pb-12">
      <AnimatedSection direction="up">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <BookmarkCheck className="size-6" />
          </div>
          <div>
            <AnimatedText variant="h1" className="text-4xl font-bold tracking-tight sm:text-5xl">
              Meine Bookmarks
            </AnimatedText>
            <AnimatedText variant="p" delay={0.1} className="text-muted-foreground mt-2">
              Deine gespeicherten Reviews auf einen Blick
            </AnimatedText>
          </div>
        </div>
      </AnimatedSection>

      <BookmarkedReviews />
    </div>
  );
}
