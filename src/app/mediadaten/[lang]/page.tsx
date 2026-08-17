import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowLeft, Users, TrendingUp, Eye, Mail, FileText, BarChart3,
  Smartphone, Monitor, Globe, Clock, RefreshCw, ChevronRight,
  Gamepad2, Cpu, Film, Zap, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMediaStats, formatMediaNumber, getMonthlyTimeline } from "@/lib/mediadaten";
import { getTranslations, getLanguageFromRequest, formatDate, getLocale, supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/seo";

interface MediadatenPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params }: MediadatenPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const headersList = await headers();
  const lang = resolvedParams.lang || getLanguageFromRequest(undefined, headersList);
  const t = getTranslations(lang);

  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `${getSiteUrl()}/mediadaten/${lang}`,
      languages: {
        de: `${getSiteUrl()}/mediadaten/de`,
        en: `${getSiteUrl()}/mediadaten/en`,
      },
    },
  };
}

const ACCENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export default async function MediadatenPage({ params }: MediadatenPageProps) {
  const resolvedParams = await params;
  const headersList = await headers();

  const detectedLang = getLanguageFromRequest(undefined, headersList);
  const lang = resolvedParams.lang || detectedLang;

  if (resolvedParams.lang === "de" && detectedLang !== "de") {
    redirect(`/mediadaten/${detectedLang}`);
  }

  const t = getTranslations(lang);
  const stats = getMediaStats();
  const locale = getLocale(lang as SupportedLanguage);
  const timeline = getMonthlyTimeline(locale);

  const maxVisitors = Math.max(...timeline.map(d => d.visitors), 1);
  const maxPageViews = Math.max(...timeline.map(d => d.pageViews), 1);

  const keyMetricCards = [
    { label: t.keyMetrics.monthlyVisitors, value: formatMediaNumber(stats.monthlyVisitors, locale), sub: t.keyMetrics.activeUsers, icon: Users, accent: ACCENT_COLORS[0], growth: stats.visitorGrowth },
    { label: t.keyMetrics.pageViews, value: formatMediaNumber(stats.monthlyPageViews, locale), sub: t.keyMetrics.perMonth, icon: Eye, accent: ACCENT_COLORS[1], growth: stats.pageViewGrowth },
    { label: t.keyMetrics.sessionDuration, value: stats.averageSessionDuration, sub: t.keyMetrics.average, icon: TrendingUp, accent: ACCENT_COLORS[2] },
    { label: t.keyMetrics.bounceRate, value: stats.bounceRate, sub: t.keyMetrics.lowBounceRate, icon: BarChart3, accent: ACCENT_COLORS[3] },
  ];

  const detailMetricCards = [
    { label: t.detailedMetrics.pagesPerVisit, value: stats.averagePagesPerVisit, sub: t.detailedMetrics.average, icon: FileText },
    { label: t.detailedMetrics.newVisitors, value: stats.newVisitorsPercentage, sub: t.detailedMetrics.firstTimeVisitors, icon: Users },
    { label: t.detailedMetrics.returningVisitors, value: stats.returningVisitorsPercentage, sub: t.detailedMetrics.loyalReadership, icon: TrendingUp },
    { label: t.detailedMetrics.reviewReadTime, value: stats.averageReviewReadTime, sub: t.detailedMetrics.average, icon: Clock },
  ];

  const interests = [
    { label: "Gaming & Entertainment", icon: Gamepad2 },
    { label: "Hardware & Technologie", icon: Cpu },
    { label: "Kaufberatung & Reviews", icon: Zap },
    { label: "Tech-News & Trends", icon: TrendingUp },
    { label: "Film & Serien", icon: Film },
  ];

  const contactEntries = [
    { label: t.contact.general, email: "editing@nerdiction.de" },
    { label: t.contact.forGames, email: "reviews.games@nerdiction.de" },
    { label: t.contact.forHardware, email: "reviews.hardware@nerdiction.de" },
    { label: t.contact.forMovies, email: "reviews.movies@nerdiction.de" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-8 md:p-12">
        <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          {/* Language Selector */}
          <div className="flex justify-end gap-1 mb-8">
            {supportedLanguages.map((l) => (
              <Link
                key={l}
                href={`/mediadaten/${l}`}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all duration-200 ${
                  l === lang
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25"
                    : "bg-background/60 hover:bg-muted border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>

          {/* Header Content */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" asChild className="size-8 -ml-1">
              <Link href="/" aria-label={t.header.backToHome}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <span className="kicker text-primary">{t.header.title}</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 text-gradient">
            {t.header.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            {t.header.subtitle}
          </p>
          <div className="hero-rule mt-8" />
        </div>
      </section>

      {/* Important Notice */}
      <section className="reveal-view">
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <FileText className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {t.notice.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.notice.description}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  {t.notice.futureNote}{" "}
                  <Link href="/kooperationen" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    {t.notice.cooperationLink}
                    <ChevronRight className="size-3" />
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Update Notice */}
      <section className="reveal-view">
        <div className="flex items-center gap-3 text-sm px-1">
          <RefreshCw className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">
            <strong className="text-foreground">{t.updateNotice.monthlyUpdate}</strong>{" "}
            {t.updateNotice.lastUpdated}{" "}
            <strong className="text-foreground">{stats.lastUpdated}</strong>
          </span>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="reveal-view-section">
        <div className="mb-8">
          <span className="kicker text-primary mb-2 block">Kennzahlen</span>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">{t.keyMetrics.title}</h2>
          <p className="text-muted-foreground">{t.keyMetrics.subtitle}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {keyMetricCards.map((card, i) => (
            <Card key={i} className="shine group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <div className="p-2 rounded-lg transition-colors duration-300" style={{ backgroundColor: `color-mix(in oklab, ${card.accent} 12%, transparent)` }}>
                  <card.icon className="size-4" style={{ color: card.accent }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight" style={{ color: card.accent }}>
                    {card.value}
                  </span>
                  {card.growth && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                      <ArrowUpRight className="size-3" />
                      {card.growth}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 12 Month Timeline */}
      <section className="reveal-view-section">
        <div className="mb-8">
          <span className="kicker text-primary mb-2 block">Verlauf</span>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">{t.timeline.title}</h2>
          <p className="text-muted-foreground">{t.timeline.subtitle}</p>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-10">
              {/* Visitors Chart */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md" style={{ backgroundColor: "color-mix(in oklab, var(--chart-1) 12%, transparent)" }}>
                      <Users className="size-4" style={{ color: "var(--chart-1)" }} />
                    </div>
                    {t.timeline.monthlyVisitors}
                  </h3>
                  <span className="text-sm text-muted-foreground font-medium">
                    {t.timeline.max} {formatMediaNumber(maxVisitors, locale)}
                  </span>
                </div>
                {/* Gridlines + Bars */}
                <div className="relative">
                  {/* Horizontal gridlines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-t border-border/50" />
                    ))}
                  </div>
                  <div className="relative flex items-end gap-1 md:gap-1.5 h-56 md:h-64 px-1">
                    {timeline.map((data, index) => {
                      const heightPercent = maxVisitors > 0 ? (data.visitors / maxVisitors) * 100 : 0;
                      const barHeight = Math.max(heightPercent, 2);
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group/bar relative">
                          {/* Hover tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-md bg-foreground text-background text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                            {formatMediaNumber(data.visitors, locale)}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 rounded-[1px]" />
                          </div>
                          <div
                            className="w-full rounded-t-sm transition-all duration-300 ease-out group-hover/bar:brightness-110 group-hover/bar:shadow-lg group-hover/bar:shadow-primary/20 cursor-pointer"
                            style={{
                              height: `${barHeight}%`,
                              minHeight: '4px',
                              background: `linear-gradient(to top, color-mix(in oklab, var(--chart-1) 70%, transparent), var(--chart-1))`,
                            }}
                          />
                          <div className="mt-2 text-[10px] md:text-xs text-muted-foreground whitespace-nowrap font-medium">
                            {data.month.split(" ")[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Page Views Chart */}
              <div className="pt-8 border-t">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md" style={{ backgroundColor: "color-mix(in oklab, var(--chart-2) 12%, transparent)" }}>
                      <Eye className="size-4" style={{ color: "var(--chart-2)" }} />
                    </div>
                    {t.timeline.pageViews}
                  </h3>
                  <span className="text-sm text-muted-foreground font-medium">
                    {t.timeline.max} {formatMediaNumber(maxPageViews, locale)}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-t border-border/50" />
                    ))}
                  </div>
                  <div className="relative flex items-end gap-1 md:gap-1.5 h-56 md:h-64 px-1">
                    {timeline.map((data, index) => {
                      const heightPercent = maxPageViews > 0 ? (data.pageViews / maxPageViews) * 100 : 0;
                      const barHeight = Math.max(heightPercent, 2);
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group/bar relative">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-md bg-foreground text-background text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                            {formatMediaNumber(data.pageViews, locale)}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 rounded-[1px]" />
                          </div>
                          <div
                            className="w-full rounded-t-sm transition-all duration-300 ease-out group-hover/bar:brightness-110 group-hover/bar:shadow-lg group-hover/bar:shadow-primary/20 cursor-pointer"
                            style={{
                              height: `${barHeight}%`,
                              minHeight: '4px',
                              background: `linear-gradient(to top, color-mix(in oklab, var(--chart-2) 70%, transparent), var(--chart-2))`,
                            }}
                          />
                          <div className="mt-2 text-[10px] md:text-xs text-muted-foreground whitespace-nowrap font-medium">
                            {data.month.split(" ")[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="pt-5 border-t flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-sm" style={{ backgroundColor: "var(--chart-1)" }} />
                  <span className="text-muted-foreground">{t.timeline.monthlyVisitors}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-sm" style={{ backgroundColor: "var(--chart-2)" }} />
                  <span className="text-muted-foreground">{t.timeline.pageViews}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Additional Metrics */}
      <section className="reveal-view-section">
        <div className="mb-8">
          <span className="kicker text-primary mb-2 block">Detaillierte Kennzahlen</span>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">{t.detailedMetrics.title}</h2>
          <p className="text-muted-foreground">{t.detailedMetrics.subtitle}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {detailMetricCards.map((card, i) => (
            <Card key={i} className="stat-chip group cursor-default">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <div className="p-2 rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors duration-300">
                  <card.icon className="size-4 text-primary/70 group-hover:text-primary transition-colors duration-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Device & Geography */}
      <section className="reveal-view-section">
        <div className="mb-8">
          <span className="kicker text-primary mb-2 block">Geräte & Geografie</span>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">{t.deviceGeography.title}</h2>
          <p className="text-muted-foreground">{t.deviceGeography.subtitle}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Mobile */}
          <Card className="group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors">
                  <Smartphone className="size-5 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                {t.deviceGeography.mobileTraffic}
              </CardTitle>
              <CardDescription>{t.deviceGeography.smartphoneTablet}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {stats.mobileTrafficPercentage}
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${stats.mobileTrafficPercentage}%`,
                    background: "linear-gradient(90deg, var(--chart-1), color-mix(in oklab, var(--chart-1) 60%, var(--chart-2)))",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Desktop */}
          <Card className="group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors">
                  <Monitor className="size-5 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                {t.deviceGeography.desktopTraffic}
              </CardTitle>
              <CardDescription>{t.deviceGeography.pcLaptop}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {stats.desktopTrafficPercentage}
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${stats.desktopTrafficPercentage}%`,
                    background: "linear-gradient(90deg, var(--chart-3), color-mix(in oklab, var(--chart-3) 60%, var(--chart-4)))",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Top Country */}
          <Card className="group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors">
                  <Globe className="size-5 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                {t.deviceGeography.topCountry}
              </CardTitle>
              <CardDescription>{t.deviceGeography.mainOriginCountry}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
                {stats.topCountry}
              </div>
              <p className="text-sm text-muted-foreground">
                {t.deviceGeography.primaryAudience}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Target Audience */}
      <section className="reveal-view-section space-y-8">
        <div>
          <span className="kicker text-primary mb-2 block">Zielgruppe</span>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">{t.targetAudience.title}</h2>
          <p className="text-muted-foreground">{t.targetAudience.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Demographics */}
          <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <CardHeader>
              <CardTitle className="font-serif text-lg">{t.targetAudience.demographics}</CardTitle>
              <CardDescription>{t.targetAudience.demographicsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { age: "18-24", pct: "35", width: "35%" },
                { age: "25-34", pct: "40", width: "40%" },
                { age: "35-44", pct: "20", width: "20%" },
                { age: "45+", pct: "5", width: "5%" },
              ].map((row) => (
                <div key={row.age} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t.targetAudience.age} {row.age}</span>
                    <span className="font-bold text-foreground tabular-nums">~{row.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: row.width,
                        background: `linear-gradient(90deg, var(--chart-1), color-mix(in oklab, var(--chart-1) 50%, var(--chart-2)))`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  {t.targetAudience.genderDistribution}{" "}
                  <span className="font-semibold text-foreground">~75% {t.targetAudience.male}</span>,{" "}
                  <span className="font-semibold text-foreground">~25% {t.targetAudience.female}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <CardHeader>
              <CardTitle className="font-serif text-lg">{t.targetAudience.interests}</CardTitle>
              <CardDescription>{t.targetAudience.interestsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {interests.map((item) => (
                  <div
                    key={item.label}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary/8 border border-primary/10 text-sm font-medium text-foreground transition-all duration-200 hover:bg-primary/15 hover:border-primary/20 hover:shadow-sm cursor-default"
                  >
                    <item.icon className="size-3.5 text-primary" />
                    {item.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section className="reveal-view-section space-y-8">
        <div>
          <span className="kicker text-primary mb-2 block">Kontakt</span>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">{t.contact.title}</h2>
          <p className="text-muted-foreground">{t.contact.subtitle}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {contactEntries.map((entry) => (
            <a
              key={entry.email}
              href={`mailto:${entry.email}`}
              className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="p-2.5 rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors shrink-0">
                <Mail className="size-5 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                <p className="text-sm text-primary font-medium truncate">{entry.email}</p>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pt-8 border-t reveal-view">
        <p className="text-sm text-muted-foreground/80 italic leading-relaxed">
          {t.disclaimer.text}
        </p>
        <p className="text-sm text-muted-foreground/60 italic mt-2">
          {t.disclaimer.lastUpdated} {formatDate(new Date(), locale)}
        </p>
      </section>

      {/* Back to Home */}
      <div className="pt-4 pb-8">
        <Button variant="outline" asChild className="group">
          <Link href="/">
            <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
            {t.header.backToHome}
          </Link>
        </Button>
      </div>
    </div>
  );
}
