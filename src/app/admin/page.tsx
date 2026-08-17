"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickCreate } from "./components/QuickCreate";
import { BulkCreate } from "./components/BulkCreate";
import { ReviewList } from "./components/ReviewList";
import { MassReviewCreation } from "./components/MassReviewCreation";
import { ReleaseSyncButton } from "./components/ReleaseSyncButton";
import { ForumGenerator } from "./components/ForumGenerator";
import { Toaster } from "@/components/ui/toaster";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Rocket, Database, ListVideo, List, Loader2, FileCheck, FilePen, FolderOpen, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [stats, setStats] = useState<{ total: number; published: number; drafts: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews?all=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setStats({
          total: data.length,
          published: data.filter((r) => r.status === "published").length,
          drafts: data.filter((r) => r.status === "draft").length,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { label: "Gesamt", value: stats?.total, icon: FolderOpen, color: "text-foreground", bg: "bg-muted" },
    { label: "Veröffentlicht", value: stats?.published, icon: FileCheck, color: "text-green-600", bg: "bg-green-500/10" },
    { label: "Entwürfe", value: stats?.drafts, icon: FilePen, color: "text-yellow-600", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {items.map((item) => (
        <div key={item.label} className={cn("rounded-xl border p-3 md:p-4 flex items-center gap-2 md:gap-3", item.bg)}>
          <item.icon className={cn("h-4 w-4 md:h-5 md:w-5 shrink-0", item.color)} />
          <div className="min-w-0">
            <div className="text-lg md:text-2xl font-bold leading-tight">
              {stats ? item.value : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground truncate">{item.label}</div>
          </div>
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
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 max-w-5xl">
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
      <TabsContent value="quick" className="space-y-4 mt-6">
        <QuickCreate />
      </TabsContent>
      <TabsContent value="bulk" className="space-y-4 mt-6">
        <BulkCreate />
      </TabsContent>
      <TabsContent value="mass-200" className="space-y-4 mt-6">
        <MassReviewCreation />
      </TabsContent>
      <TabsContent value="list" className="space-y-4 mt-6">
        <ReviewList />
      </TabsContent>
      <TabsContent value="forum" className="space-y-4 mt-6">
        <ForumGenerator />
      </TabsContent>
    </Tabs>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-4 md:space-y-8 pb-8 md:pb-12 animate-fade-in px-4 md:px-0">
      <div className="flex flex-col space-y-2 md:space-y-3">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
          Erstelle und verwalte deine Reviews professionell und effizient.
        </p>
      </div>

      <Suspense fallback={<div className="flex items-center justify-center py-16">Laden...</div>}>
        <StatsBar />
        <ReleaseSyncButton />
        <AdminTabs />
      </Suspense>

      <Toaster />
    </div>
  );
}
