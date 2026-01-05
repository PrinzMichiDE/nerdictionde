"use client";

import { useState } from "react";
import { PCBuild } from "@/types/pc-build";
import { PCBuildList } from "./PCBuildList";
import { PCBuildEditor } from "./PCBuildEditor";

export function GamingPCManager() {
  const [view, setView] = useState<"list" | "edit" | "new">("list");
  const [currentBuild, setCurrentBuild] = useState<any>(null);

  const handleEdit = (build: PCBuild) => {
    setCurrentBuild(build);
    setView("edit");
  };

  const handleNew = () => {
    setCurrentBuild({
      pricePoint: 0,
      title: "",
      slug: "",
      status: "draft",
      totalPrice: 0,
      currency: "EUR",
      components: [
        { type: "CPU", name: "", price: 0, currency: "EUR", sortOrder: 0 },
        { type: "GPU", name: "", price: 0, currency: "EUR", sortOrder: 1 },
        { type: "Motherboard", name: "", price: 0, currency: "EUR", sortOrder: 2 },
        { type: "RAM", name: "", price: 0, currency: "EUR", sortOrder: 3 },
        { type: "SSD", name: "", price: 0, currency: "EUR", sortOrder: 4 },
        { type: "PSU", name: "", price: 0, currency: "EUR", sortOrder: 5 },
        { type: "Case", name: "", price: 0, currency: "EUR", sortOrder: 6 },
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

  if (view === "list") {
    return <PCBuildList onEdit={handleEdit} onNew={handleNew} />;
  }

  return (
    <PCBuildEditor 
      build={currentBuild} 
      onSave={handleSave} 
      onCancel={handleCancel} 
    />
  );
}

