"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  totalReviews: number;
  categoryDistribution: Array<{ name: string; value: number }>;
  scoreDistribution: Array<{ label: string; value: number }>;
  averageScore: number;
  scoreTrends: Array<{ month: string; count: number; avgScore: number }>;
  topByComments: Array<{ id: string; title: string; slug: string; category: string; commentCount: number }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  game: "hsl(var(--chart-1))",
  hardware: "hsl(var(--chart-2))",
  product: "hsl(var(--chart-3))",
  amazon: "hsl(var(--chart-4))",
  movie: "hsl(var(--chart-5))",
  series: "hsl(var(--chart-1))",
};

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-8 h-64" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-8 text-center text-muted-foreground">
          {error ?? "Keine Daten geladen."}
        </CardContent>
      </Card>
    );
  }

  const categoryLabels: Record<string, string> = {
    game: "Games",
    movie: "Filme",
    series: "Serien",
    hardware: "Hardware",
    product: "Produkte",
    amazon: "Amazon",
  };

  return (
    <div className="space-y-12">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviews gesamt</p>
                <p className="text-3xl font-bold">{data.totalReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durchschnittlicher Score</p>
                <p className="text-3xl font-bold">{data.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <PieChartIcon className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Kategorie-Verteilung</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution.map((d) => ({
                      name: categoryLabels[d.name] ?? d.name,
                      value: d.value,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.categoryDistribution.map((d, i) => (
                      <Cell
                        key={d.name}
                        fill={CATEGORY_COLORS[d.name] ?? `hsl(var(--primary))`}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Score-Verteilung</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.scoreDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.scoreTrends.length > 0 && (
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Score-Trends (Monat)</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scoreTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2} name="Ø Score" />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--muted-foreground))" strokeWidth={1} name="Anzahl" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {data.topByComments.length > 0 && (
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Meist kommentierte Reviews</h3>
            <ul className="space-y-2">
              {data.topByComments.map((r) => (
                <li key={r.id}>
                  <Link href={`/reviews/${r.slug}`} className="text-primary hover:underline font-medium">
                    {r.title}
                  </Link>
                  <span className="text-muted-foreground text-sm ml-2">
                    {r.commentCount} Kommentare · {categoryLabels[r.category] ?? r.category}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
