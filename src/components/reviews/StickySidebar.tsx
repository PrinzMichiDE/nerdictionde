"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ScoreBadge } from "./ScoreBadge";
import { ShareButtons } from "./ShareButtons";
import { CheckCircle2, XCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickySidebarProps {
  score: number;
  pros: string[];
  cons: string[];
  affiliateLink?: string | null;
  title: string;
  url: string;
  isEn?: boolean;
}

export function StickySidebar({
  score,
  pros,
  cons,
  affiliateLink,
  title,
  url,
  isEn = false,
}: StickySidebarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Hide sidebar when near bottom of page
      setIsVisible(scrollPosition < documentHeight - windowHeight - 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getScoreLabel = () => {
    if (score >= 90) return isEn ? "Phenomenal" : "Phänomenal";
    if (score >= 80) return isEn ? "Excellent" : "Hervorragend";
    if (score >= 70) return isEn ? "Good" : "Gut";
    return isEn ? "Satisfactory" : "Befriedigend";
  };

  return (
    <aside
      className={cn(
        "space-y-8 transition-opacity duration-300",
        !isVisible && "opacity-50"
      )}
    >
      {/* Score Card */}
      <div className="p-8 border-2 border-primary/20 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center text-center space-y-6 shadow-xl sticky top-24 backdrop-blur-sm">
        <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {isEn ? "Nerdiction Score" : "Nerdiction Wertung"}
        </h3>
        <ScoreBadge
          score={score}
          className="h-28 w-28 text-4xl border-4 border-background shadow-2xl"
          aria-label={`Bewertung: ${score} von 100`}
        />
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          {getScoreLabel()}
        </p>

        {/* Pros & Cons */}
        <div className="w-full pt-4 space-y-6 border-t border-primary/20">
          {/* Pros */}
          {pros.length > 0 && (
            <div className="text-left space-y-3">
              <h4
                className="font-bold flex items-center text-green-500 dark:text-green-400 uppercase text-xs tracking-widest"
                aria-label={isEn ? "Pros" : "Vorteile"}
              >
                <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
                {isEn ? "Pros" : "Pro"}
              </h4>
              <ul className="space-y-2.5" role="list">
                {pros.map((pro, i) => (
                  <li
                    key={i}
                    className="flex items-start text-sm leading-relaxed"
                  >
                    <CheckCircle2
                      className="text-green-500 dark:text-green-400 mr-2.5 mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="flex-1">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {cons.length > 0 && (
            <div className="text-left space-y-3">
              <h4
                className="font-bold flex items-center text-red-500 dark:text-red-400 uppercase text-xs tracking-widest"
                aria-label={isEn ? "Cons" : "Nachteile"}
              >
                <XCircle className="mr-2 size-4" aria-hidden="true" />
                {isEn ? "Cons" : "Contra"}
              </h4>
              <ul className="space-y-2.5" role="list">
                {cons.map((con, i) => (
                  <li
                    key={i}
                    className="flex items-start text-sm leading-relaxed"
                  >
                    <XCircle
                      className="text-red-500 dark:text-red-400 mr-2.5 mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="flex-1">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Share Section */}
        <div className="w-full pt-4 border-t border-primary/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-center">
            {isEn ? "Share Review" : "Review teilen"}
          </p>
          <ShareButtons title={title} url={url} />
        </div>

        {/* Affiliate Link */}
        {affiliateLink && (
          <div className="w-full pt-6 border-t border-primary/20">
            <a
              href={affiliateLink}
              target="_blank"
              rel="nofollow sponsored"
              className="flex items-center justify-center w-full bg-[#FF9900] hover:bg-[#E68A00] text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={isEn ? "View on Amazon" : "Auf Amazon ansehen"}
            >
              <ShoppingCart className="mr-2 size-5" aria-hidden="true" />
              <span>{isEn ? "View on Amazon" : "Auf Amazon ansehen"}</span>
              <span className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
