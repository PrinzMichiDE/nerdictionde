import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface AmazonAffiliateLinkProps {
  asin?: string | null;
  href?: string | null;
  label?: string;
  className?: string;
}

export function AmazonAffiliateLink({
  asin,
  href,
  label = "Bei Amazon kaufen",
  className,
}: AmazonAffiliateLinkProps) {
  const url = href || (asin ? `https://www.amazon.de/dp/${asin}/?tag=nerdiction-21` : null);

  if (!url) return null;

  return (
    <Link
      href={url}
      target="_blank"
      rel="nofollow sponsored"
      className={className}
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
        {label}
        <ExternalLink className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
