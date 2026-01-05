import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Users, TrendingUp, Eye, Mail, FileText, BarChart3, Smartphone, Monitor, Globe, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMediaStats, formatMediaNumber, getMonthlyTimeline } from "@/lib/mediadaten";
import { getTranslations, getLanguageFromRequest, formatDate, getLocale, supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import { redirect } from "next/navigation";

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
  };
}

export default async function MediadatenPage({ params }: MediadatenPageProps) {
  const resolvedParams = await params;
  const headersList = await headers();
  
  // Auto-detect browser language
  const detectedLang = getLanguageFromRequest(undefined, headersList);
  
  // Use lang from URL if provided, otherwise use detected language
  let lang = resolvedParams.lang || detectedLang;
  
  // If accessing /mediadaten/de and browser language is different, redirect
  if (resolvedParams.lang === "de" && detectedLang !== "de") {
    redirect(`/mediadaten/${detectedLang}`);
  }
  
  const t = getTranslations(lang);
  const stats = getMediaStats();
  const locale = getLocale(lang as SupportedLanguage);
  const timeline = getMonthlyTimeline(locale);
  
  // Find max values for chart scaling
  const maxVisitors = Math.max(...timeline.map(d => d.visitors), 1);
  const maxPageViews = Math.max(...timeline.map(d => d.pageViews), 1);
  
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8">
      {/* Language Selector */}
      <div className="flex justify-end gap-2 mb-4">
        {supportedLanguages.map((l) => (
          <Link
            key={l}
            href={`/mediadaten/${l}`}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              l === lang
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            {l.toUpperCase()}
          </Link>
        ))}
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label={t.header.backToHome}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight">{t.header.title}</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          {t.header.subtitle}
        </p>
      </div>

      {/* Important Notice */}
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
              <FileText className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                {t.notice.title}
              </h3>
              <p className="text-muted-foreground">
                {t.notice.description}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                {t.notice.futureNote}{" "}
                <Link href="/kooperationen" className="text-primary hover:underline font-medium">
                  {t.notice.cooperationLink}
                </Link>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Notice */}
      <Card className="border-2 border-primary/20 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <RefreshCw className="size-4 text-primary" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">{t.updateNotice.monthlyUpdate}</strong> {t.updateNotice.lastUpdated}{" "}
              <strong className="text-foreground">{stats.lastUpdated}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t.keyMetrics.title}</h2>
          <p className="text-muted-foreground">
            {t.keyMetrics.subtitle}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.keyMetrics.monthlyVisitors}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {formatMediaNumber(stats.monthlyVisitors, locale)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.keyMetrics.activeUsers}</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.keyMetrics.pageViews}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {formatMediaNumber(stats.monthlyPageViews, locale)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.keyMetrics.perMonth}</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.keyMetrics.sessionDuration}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.averageSessionDuration}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.keyMetrics.average}</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.keyMetrics.bounceRate}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.bounceRate}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.keyMetrics.lowBounceRate}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 12 Month Timeline */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t.timeline.title}</h2>
          <p className="text-muted-foreground">
            {t.timeline.subtitle}
          </p>
        </div>
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="space-y-8">
              {/* Visitors Chart */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    {t.timeline.monthlyVisitors}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {t.timeline.max} {formatMediaNumber(maxVisitors, locale)}
                  </span>
                </div>
                <div className="flex items-end gap-1.5 h-64 px-1">
                  {timeline.map((data, index) => {
                    const heightPercent = maxVisitors > 0 ? (data.visitors / maxVisitors) * 100 : 0;
                    const barHeight = Math.max(heightPercent, 1); // Minimum 1% height
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <div className="w-full relative" style={{ height: '100%' }}>
                          <div
                            className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 group-hover:scale-105 cursor-pointer absolute bottom-0 left-0 right-0"
                            style={{ 
                              height: `${barHeight}%`,
                              minHeight: '6px'
                            }}
                            title={`${data.month}: ${formatMediaNumber(data.visitors, locale)} ${t.timeline.monthlyVisitors}`}
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground transform -rotate-45 origin-top-left whitespace-nowrap w-full text-center h-8 flex items-start justify-center pt-1">
                          {data.month.split(" ")[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Page Views Chart */}
              <div className="pt-8 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="size-5 text-primary" />
                    {t.timeline.pageViews}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {t.timeline.max} {formatMediaNumber(maxPageViews, locale)}
                  </span>
                </div>
                <div className="flex items-end gap-1.5 h-64 px-1">
                  {timeline.map((data, index) => {
                    const heightPercent = maxPageViews > 0 ? (data.pageViews / maxPageViews) * 100 : 0;
                    const barHeight = Math.max(heightPercent, 1); // Minimum 1% height
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <div className="w-full relative" style={{ height: '100%' }}>
                          <div
                            className="w-full bg-primary/70 rounded-t transition-all hover:bg-primary/60 group-hover:scale-105 cursor-pointer absolute bottom-0 left-0 right-0"
                            style={{ 
                              height: `${barHeight}%`,
                              minHeight: '6px'
                            }}
                            title={`${data.month}: ${formatMediaNumber(data.pageViews, locale)} ${t.timeline.pageViews}`}
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground transform -rotate-45 origin-top-left whitespace-nowrap w-full text-center h-8 flex items-start justify-center pt-1">
                          {data.month.split(" ")[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="pt-4 border-t flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-primary rounded" />
                  <span className="text-muted-foreground">{t.timeline.monthlyVisitors}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-primary/70 rounded" />
                  <span className="text-muted-foreground">{t.timeline.pageViews}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Additional Metrics */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t.detailedMetrics.title}</h2>
          <p className="text-muted-foreground">
            {t.detailedMetrics.subtitle}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.detailedMetrics.pagesPerVisit}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.averagePagesPerVisit}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.detailedMetrics.average}</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.detailedMetrics.newVisitors}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.newVisitorsPercentage}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.detailedMetrics.firstTimeVisitors}</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.detailedMetrics.returningVisitors}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.returningVisitorsPercentage}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.detailedMetrics.loyalReadership}</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.detailedMetrics.reviewReadTime}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.averageReviewReadTime}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.detailedMetrics.average}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Device & Geography */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2">{t.deviceGeography.title}</h2>
          <p className="text-muted-foreground">
            {t.deviceGeography.subtitle}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Smartphone className="size-5 text-primary" />
                </div>
                {t.deviceGeography.mobileTraffic}
              </CardTitle>
              <CardDescription>{t.deviceGeography.smartphoneTablet}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                {stats.mobileTrafficPercentage}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${stats.mobileTrafficPercentage}%` }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Monitor className="size-5 text-primary" />
                </div>
                {t.deviceGeography.desktopTraffic}
              </CardTitle>
              <CardDescription>{t.deviceGeography.pcLaptop}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                {stats.desktopTrafficPercentage}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${stats.desktopTrafficPercentage}%` }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="size-5 text-primary" />
                </div>
                {t.deviceGeography.topCountry}
              </CardTitle>
              <CardDescription>{t.deviceGeography.mainOriginCountry}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {stats.topCountry}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t.deviceGeography.primaryAudience}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Target Audience */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">{t.targetAudience.title}</h2>
          <p className="text-muted-foreground text-lg">
            {t.targetAudience.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.targetAudience.demographics}</CardTitle>
              <CardDescription>{t.targetAudience.demographicsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.targetAudience.age} 18-24</span>
                  <span className="font-semibold text-foreground">~35%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "35%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.targetAudience.age} 25-34</span>
                  <span className="font-semibold text-foreground">~40%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "40%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.targetAudience.age} 35-44</span>
                  <span className="font-semibold text-foreground">~20%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "20%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.targetAudience.age} 45+</span>
                  <span className="font-semibold text-foreground">~5%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "5%" }} />
                </div>
              </div>
              <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
                <p>{t.targetAudience.genderDistribution} ~75% {t.targetAudience.male}, ~25% {t.targetAudience.female}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.targetAudience.interests}</CardTitle>
              <CardDescription>{t.targetAudience.interestsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Gaming & Entertainment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Hardware & Technologie</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Kaufberatung & Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Tech-News & Trends</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">{t.contact.title}</h2>
          <p className="text-muted-foreground text-lg">
            {t.contact.subtitle}
          </p>
        </div>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="size-5 text-primary" />
              </div>
              {t.contact.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">{t.contact.general}</p>
                <a 
                  href="mailto:editing@nerdiction.de" 
                  className="text-primary hover:underline font-medium inline-flex items-center gap-2 group/link"
                >
                  <Mail className="size-4 group-hover/link:scale-110 transition-transform" />
                  editing@nerdiction.de
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">{t.contact.forGames}</p>
                <a 
                  href="mailto:reviews.games@nerdiction.de" 
                  className="text-primary hover:underline font-medium inline-flex items-center gap-2 group/link"
                >
                  <Mail className="size-4 group-hover/link:scale-110 transition-transform" />
                  reviews.games@nerdiction.de
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">{t.contact.forHardware}</p>
                <a 
                  href="mailto:reviews.hardware@nerdiction.de" 
                  className="text-primary hover:underline font-medium inline-flex items-center gap-2 group/link"
                >
                  <Mail className="size-4 group-hover/link:scale-110 transition-transform" />
                  reviews.hardware@nerdiction.de
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">{t.contact.forMovies}</p>
                <a 
                  href="mailto:reviews.movies@nerdiction.de" 
                  className="text-primary hover:underline font-medium inline-flex items-center gap-2 group/link"
                >
                  <Mail className="size-4 group-hover/link:scale-110 transition-transform" />
                  reviews.movies@nerdiction.de
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Disclaimer */}
      <section className="pt-8 border-t">
        <p className="text-sm text-muted-foreground italic">
          {t.disclaimer.text}
        </p>
        <p className="text-sm text-muted-foreground italic mt-2">
          {t.disclaimer.lastUpdated} {formatDate(new Date(), locale)}
        </p>
      </section>

      {/* Back to Home */}
      <div className="pt-8">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="size-4 mr-2" />
            {t.header.backToHome}
          </Link>
        </Button>
      </div>
    </div>
  );
}

