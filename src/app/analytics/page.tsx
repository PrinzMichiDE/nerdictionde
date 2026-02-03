import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Statistik & Analytics | Nerdiction",
  description: "Übersicht über Reviews, Scores und Kategorien.",
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Statistik & Analytics
        </h1>
        <p className="text-lg text-muted-foreground">
          Score-Verteilung, Kategorien und Trends.
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
