"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { PCBuild } from "@/types/pc-build";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Globe, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import Link from "next/link";

interface PCBuildListProps {
  onEdit: (build: PCBuild) => void;
  onNew: () => void;
  refreshRef?: React.MutableRefObject<(() => void) | null>;
}

export function PCBuildList({ onEdit, onNew, refreshRef }: PCBuildListProps) {
  const [builds, setBuilds] = useState<PCBuild[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuilds = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/gaming-pcs?status=all");
      setBuilds(response.data);
    } catch (error) {
      console.error("Fetch builds failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilds();
  }, []);

  // Expose refresh function via ref
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = fetchBuilds;
    }
  }, [refreshRef]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bist du sicher, dass du diesen PC-Build löschen möchtest?")) return;
    try {
      await axios.delete(`/api/gaming-pcs/${id}`);
      setBuilds(builds.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Delete build failed:", error);
      alert("Fehler beim Löschen.");
    }
  };

  if (loading) return <div className="py-8 text-center">Laden...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Gaming PC Konfigurationen</h2>
        <Button onClick={onNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Build
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preisklasse</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Komponenten</TableHead>
              <TableHead>Gesamtpreis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {builds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Keine Konfigurationen gefunden.
                </TableCell>
              </TableRow>
            ) : (
              builds.map((build) => (
                <TableRow key={build.id}>
                  <TableCell className="font-bold">{build.pricePoint}€</TableCell>
                  <TableCell>{build.title}</TableCell>
                  <TableCell>{build.components?.length || 0}</TableCell>
                  <TableCell>{build.totalPrice.toLocaleString("de-DE", { style: "currency", currency: build.currency })}</TableCell>
                  <TableCell>
                    <Badge variant={build.status === "published" ? "default" : "secondary"}>
                      {build.status === "published" ? "Veröffentlicht" : "Entwurf"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/gaming-pcs/${build.pricePoint}`} target="_blank">
                          <Globe className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(build)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(build.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

