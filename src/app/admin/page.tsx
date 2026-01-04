"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickCreate } from "./components/QuickCreate";
import { BulkCreate } from "./components/BulkCreate";
import { ReviewList } from "./components/ReviewList";
import { HardwareRSSFetcher } from "./components/HardwareRSSFetcher";
import { GameReviewMassCreation } from "./components/GameReviewMassCreation";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function AdminTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "quick";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "quick") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4 md:space-y-6">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 max-w-4xl">
        <TabsTrigger 
          value="quick" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-4"
        >
          <span className="hidden sm:inline">Quick Create</span>
          <span className="sm:hidden">Quick</span>
        </TabsTrigger>
        <TabsTrigger 
          value="bulk" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-4"
        >
          <span className="hidden sm:inline">Massen-Erstellung</span>
          <span className="sm:hidden">Massen</span>
        </TabsTrigger>
        <TabsTrigger 
          value="mass-200" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-4"
        >
          <span className="hidden lg:inline">200 Games</span>
          <span className="lg:hidden">200</span>
        </TabsTrigger>
        <TabsTrigger 
          value="hardware-rss" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-4"
        >
          <span className="hidden md:inline">Hardware RSS</span>
          <span className="md:hidden">RSS</span>
        </TabsTrigger>
        <TabsTrigger 
          value="list" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-4"
        >
          <span className="hidden sm:inline">Alle Beiträge</span>
          <span className="sm:hidden">Liste</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="quick" className="space-y-4 mt-6">
        <QuickCreate />
      </TabsContent>
      <TabsContent value="bulk" className="space-y-4 mt-6">
        <BulkCreate />
      </TabsContent>
      <TabsContent value="mass-200" className="space-y-4 mt-6">
        <GameReviewMassCreation />
      </TabsContent>
      <TabsContent value="hardware-rss" className="space-y-4 mt-6">
        <HardwareRSSFetcher />
      </TabsContent>
      <TabsContent value="list" className="space-y-4 mt-6">
        <ReviewList />
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
        <AdminTabs />
      </Suspense>
    </div>
  );
}

