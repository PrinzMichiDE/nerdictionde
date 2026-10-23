"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { QuickCreate } from "./components/QuickCreate";
import { BulkCreate } from "./components/BulkCreate";
import { ReviewList } from "./components/ReviewList";
import { MassReviewCreation } from "./components/MassReviewCreation";
import { ReleaseSyncButton } from "./components/ReleaseSyncButton";
import { ForumGenerator } from "./components/ForumGenerator";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Rocket, Database, ListVideo, List, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminReviews } from "./reviews-store";

interface TabDef {
  value: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { value: "quick", label: "Quick Create", shortLabel: "Quick", icon: <Rocket className="h-4 w-4" /> },
  { value: "bulk", label: "Massen-Erstellung", shortLabel: "Massen", icon: <Database className="h-4 w-4" /> },
  { value: "mass-200", label: "Massen-Jobs", shortLabel: "Jobs", icon: <ListVideo className="h-4 w-4" /> },
  { value: "list", label: "Alle Beiträge", shortLabel: "Liste", icon: <List className="h-4 w-4" /> },
  { value: "forum", label: "Forum", shortLabel: "Forum", icon: <MessageSquare className="h-4 w-4" /> },
];

function StatsBar() {
  const { counts, loading, error, reload } = useAdminReviews();

  if (error) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">Beiträge konnten nicht geladen werden.</p>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={reload} variant="outline" size="sm" className="mt-1 w-fit">
          Erneut laden
        </Button>
      </div>
    );
  }

  const items = [
    { label: "Gesamt", value: counts.total, tone: "text-foreground" },
    { label: "Veröffentlicht", value: counts.published, tone: "text-success" },
    { label: "Entwürfe", value: counts.drafts, tone: "text-warning" },
  ];

  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-card">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn("px-3 py-3 md:px-4 md:py-4", index > 0 && "border-l border-border")}
        >
          <div className={cn("text-xl font-semibold tabular-nums leading-tight md:text-2xl", item.tone)}>
            {loading ? (
              <span className="inline-block h-5 w-10 rounded bg-muted align-middle motion-safe:animate-pulse md:h-6 md:w-12" aria-hidden="true" />
            ) : (
              item.value
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function AdminTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Get tab parameter, ignoring empty values
  const tabParam = searchParams.get("tab");
  const tab = (tabParam && tabParam.trim() !== "") ? tabParam : "quick";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams();
    // Preserve all non-empty query parameters except 'tab'
    searchParams.forEach((value, key) => {
      if (key !== "tab" && value && value.trim() !== "") {
        params.set(key, value);
      }
    });
    // Add tab parameter if not "quick"
    if (value !== "quick") {
      params.set("tab", value);
    }
    const queryString = params.toString();
    router.push(queryString ? `/admin?${queryString}` : "/admin");
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4 md:space-y-6">
      <TabsList className="grid w-full grid-cols-2 gap-1 md:grid-cols-5">
        {TABS.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline-flex items-center gap-1.5">
              {t.icon}
              {t.label}
            </span>
            <span className="sm:hidden inline-flex items-center gap-1.5">
              {t.icon}
              {t.shortLabel}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="quick" className="space-y-4 mt-2">
        <QuickCreate />
      </TabsContent>
      <TabsContent value="bulk" className="space-y-4 mt-2">
        <BulkCreate />
      </TabsContent>
      <TabsContent value="mass-200" className="space-y-4 mt-2">
        <MassReviewCreation />
      </TabsContent>
      <TabsContent value="list" className="space-y-4 mt-2">
        <ReviewList />
      </TabsContent>
      <TabsContent value="forum" className="space-y-4 mt-2">
        <ForumGenerator />
      </TabsContent>
    </Tabs>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-4 pb-8 md:space-y-6 md:pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Redaktion</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Beiträge erstellen, prüfen und veröffentlichen.
        </p>
      </div>

      <Suspense fallback={<div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Laden</div>}>
        <StatsBar />
        <div className="space-y-4 md:space-y-6">
          <ReleaseSyncButton />
          <AdminTabs />
        </div>
      </Suspense>
    </div>
  );
}
