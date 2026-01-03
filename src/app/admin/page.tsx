"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickCreate } from "./components/QuickCreate";
import { BulkCreate } from "./components/BulkCreate";
import { BulkCreateHardware } from "./components/BulkCreateHardware";
import { ReviewList } from "./components/ReviewList";
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
    <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 max-w-4xl">
        <TabsTrigger value="quick" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Quick Create
        </TabsTrigger>
        <TabsTrigger value="bulk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Massen-Erstellung Games
        </TabsTrigger>
        <TabsTrigger value="bulk-hardware" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Massen-Erstellung Hardware
        </TabsTrigger>
        <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Alle Beiträge
        </TabsTrigger>
      </TabsList>
      <TabsContent value="quick" className="space-y-4 mt-6">
        <QuickCreate />
      </TabsContent>
      <TabsContent value="bulk" className="space-y-4 mt-6">
        <BulkCreate />
      </TabsContent>
      <TabsContent value="bulk-hardware" className="space-y-4 mt-6">
        <BulkCreateHardware />
      </TabsContent>
      <TabsContent value="list" className="space-y-4 mt-6">
        <ReviewList />
      </TabsContent>
    </Tabs>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Erstelle und verwalte deine Reviews professionell und effizient.
        </p>
      </div>

      <Suspense fallback={<div className="flex items-center justify-center py-16">Laden...</div>}>
        <AdminTabs />
      </Suspense>
    </div>
  );
}

