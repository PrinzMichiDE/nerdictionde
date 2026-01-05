"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PCBuildCard } from "@/components/gaming-pcs/PCBuildCard";
import { PCBuild } from "@/types/pc-build";

interface GamingPCsTabsProps {
  desktops: PCBuild[];
  laptops: PCBuild[];
}

export function GamingPCsTabs({ desktops, laptops }: GamingPCsTabsProps) {
  const [activeTab, setActiveTab] = useState("desktop");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
      <div className="flex justify-center">
        <TabsList className="bg-muted/50 p-1 h-14 rounded-2xl border">
          <TabsTrigger value="desktop" className="px-8 rounded-xl font-black uppercase tracking-tight text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Gaming PCs
          </TabsTrigger>
          <TabsTrigger value="laptop" className="px-8 rounded-xl font-black uppercase tracking-tight text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Gaming Laptops
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="desktop">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {desktops.length > 0 ? (
            desktops.map((build) => (
              <PCBuildCard key={build.id} build={build as any} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <h2 className="text-2xl font-bold">Noch keine PC-Builds veröffentlicht.</h2>
              <p className="text-muted-foreground">Schau bald wieder vorbei!</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="laptop">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {laptops.length > 0 ? (
            laptops.map((build) => (
              <PCBuildCard key={build.id} build={build as any} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <h2 className="text-2xl font-bold">Noch keine Laptop-Empfehlungen veröffentlicht.</h2>
              <p className="text-muted-foreground">Schau bald wieder vorbei!</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

