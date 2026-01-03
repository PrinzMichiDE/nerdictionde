import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Gamepad2, 
  Globe, 
  Layout, 
  Calendar, 
  Users, 
  Eye, 
  Zap, 
  Star,
  ShieldCheck
} from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";

interface GameMetadataProps {
  metadata: {
    developers?: string[];
    publishers?: string[];
    platforms?: string[];
    genres?: string[];
    gameModes?: string[];
    perspectives?: string[];
    engines?: string[];
    releaseDate?: number;
    igdbScore?: number;
    criticScore?: number;
  };
  nerdictionScore: number;
  isEn?: boolean;
}

export function GameMetadata({ metadata, nerdictionScore, isEn }: GameMetadataProps) {
  if (!metadata) return null;

  const formattedDate = metadata.releaseDate 
    ? new Date(metadata.releaseDate * 1000).toLocaleDateString(isEn ? "en-US" : "de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="space-y-8">
      {/* Info-Panel & Tech-Check */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info-Panel */}
        <Card className="border-primary/10 bg-muted/20 shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
              <Gamepad2 className="h-4 w-4 mr-2 text-primary" />
              {isEn ? "General Info" : "Info-Panel"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-[100px_1fr] items-start gap-2 text-sm">
              <span className="text-muted-foreground font-medium flex items-center">
                <Building2 className="h-3.5 w-3.5 mr-1.5" /> {isEn ? "Developer" : "Entwickler"}:
              </span>
              <span className="font-semibold">{metadata.developers?.join(", ") || "N/A"}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-start gap-2 text-sm">
              <span className="text-muted-foreground font-medium flex items-center">
                <Globe className="h-3.5 w-3.5 mr-1.5" /> Publisher:
              </span>
              <span className="font-semibold">{metadata.publishers?.join(", ") || "N/A"}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-start gap-2 text-sm">
              <span className="text-muted-foreground font-medium flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Release:
              </span>
              <span className="font-semibold">{formattedDate}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-start gap-2 text-sm">
              <span className="text-muted-foreground font-medium flex items-center">
                <Layout className="h-3.5 w-3.5 mr-1.5" /> Platforms:
              </span>
              <div className="flex flex-wrap gap-1">
                {metadata.platforms?.map((p) => (
                  <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {p}
                  </Badge>
                )) || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech-Check */}
        <Card className="border-primary/10 bg-muted/20 shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
              {isEn ? "Technical Specs" : "Tech-Check"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-[100px_1fr] items-start gap-2 text-sm">
              <span className="text-muted-foreground font-medium flex items-center">
                <Eye className="h-3.5 w-3.5 mr-1.5" /> Perspective:
              </span>
              <span className="font-semibold">{metadata.perspectives?.join(", ") || "N/A"}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-start gap-2 text-sm">
              <span className="text-muted-foreground font-medium flex items-center">
                <Users className="h-3.5 w-3.5 mr-1.5" /> {isEn ? "Modes" : "Modi"}:
              </span>
              <span className="font-semibold">{metadata.gameModes?.join(", ") || "N/A"}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-start gap-2 text-sm">
              <span className="text-muted-foreground font-medium flex items-center">
                <Zap className="h-3.5 w-3.5 mr-1.5" /> Engine:
              </span>
              <span className="font-semibold">{metadata.engines?.join(", ") || "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating-Vergleich */}
      <Card className="border-primary/20 bg-primary/5 shadow-md overflow-hidden">
        <CardHeader className="bg-primary/10 pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-center">
            {isEn ? "Rating Comparison" : "Rating-Vergleich"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="grid grid-cols-3 gap-4 items-center max-w-2xl mx-auto">
            <div className="flex flex-col items-center space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Nerdiction</span>
              <ScoreBadge score={nerdictionScore} className="h-16 w-16 text-2xl shadow-lg border-2 border-background" />
              <span className="text-[10px] font-bold text-primary">{isEn ? "Expert Review" : "Experten-Test"}</span>
            </div>
            
            <div className="flex flex-col items-center space-y-3 opacity-80">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Community</span>
              <ScoreBadge score={Math.round(metadata.igdbScore || 0)} className="h-14 w-14 text-xl bg-muted grayscale border-none" />
              <span className="text-[10px] font-bold text-muted-foreground">{isEn ? "IGDB Users" : "IGDB Spieler"}</span>
            </div>

            <div className="flex flex-col items-center space-y-3 opacity-80">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{isEn ? "Critics" : "Kritiker"}</span>
              <ScoreBadge score={Math.round(metadata.criticScore || 0)} className="h-14 w-14 text-xl bg-muted grayscale border-none" />
              <span className="text-[10px] font-bold text-muted-foreground">{isEn ? "Average" : "Durchschnitt"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

