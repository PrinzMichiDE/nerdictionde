"use client";

import { useState, useRef } from "react";
import { PCBuild } from "@/types/pc-build";
import { PCBuildList } from "./PCBuildList";
import { PCBuildEditor } from "./PCBuildEditor";
import { PCBuildGenerator } from "./PCBuildGenerator";
import { HardwareDealzFetcher } from "./HardwareDealzFetcher";

export function GamingPCManager() {
  const [view, setView] = useState<"list" | "edit" | "new">("list");
  const [currentBuild, setCurrentBuild] = useState<any>(null);
  const refreshListRef = useRef<(() => void) | null>(null);

  const handleEdit = (build: PCBuild) => {
    setCurrentBuild(build);
    setView("edit");
  };

  const handleNew = () => {
    setCurrentBuild({
      pricePoint: 0,
      title: "",
      slug: "",
      status: "published",
      totalPrice: 0,
      currency: "EUR",
      components: [
        { type: "CPU", name: "", price: 0, currency: "EUR", sortOrder: 0, image: "", description: "" },
        { type: "GPU", name: "", price: 0, currency: "EUR", sortOrder: 1, image: "", description: "" },
        { type: "Motherboard", name: "", price: 0, currency: "EUR", sortOrder: 2, image: "", description: "" },
        { type: "RAM", name: "", price: 0, currency: "EUR", sortOrder: 3, image: "", description: "" },
        { type: "SSD", name: "", price: 0, currency: "EUR", sortOrder: 4, image: "", description: "" },
        { type: "PSU", name: "", price: 0, currency: "EUR", sortOrder: 5, image: "", description: "" },
        { type: "Case", name: "", price: 0, currency: "EUR", sortOrder: 6, image: "", description: "" },
      ]
    });
    setView("new");
  };

  const handleSave = () => {
    setView("list");
    setCurrentBuild(null);
  };

  const handleCancel = () => {
    setView("list");
    setCurrentBuild(null);
  };

  const handleGenerationComplete = () => {
    // Refresh the list after successful generation
    if (refreshListRef.current) {
      refreshListRef.current();
    }
  };

  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <PCBuildGenerator onComplete={handleGenerationComplete} />
          <HardwareDealzFetcher onComplete={handleGenerationComplete} />
        </div>
        <PCBuildList 
          onEdit={handleEdit} 
          onNew={handleNew}
          refreshRef={refreshListRef}
        />
      </div>
    );
  }

  return (
    <PCBuildEditor 
      build={currentBuild} 
      onSave={handleSave} 
      onCancel={handleCancel} 
    />
  );
}

