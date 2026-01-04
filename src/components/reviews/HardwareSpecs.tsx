"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HardwareSpecsProps {
  specs: Record<string, any>;
  isEn?: boolean;
}

export function HardwareSpecs({ specs, isEn }: HardwareSpecsProps) {
  if (!specs || Object.keys(specs).length === 0) {
    return null;
  }

  // Flatten nested specs object
  const flattenSpecs = (obj: any, prefix = ""): Array<{ key: string; value: any }> => {
    const result: Array<{ key: string; value: any }> = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        continue;
      }
      
      if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively flatten nested objects
        result.push(...flattenSpecs(value, fullKey));
      } else if (Array.isArray(value)) {
        // Handle arrays
        result.push({ key: fullKey, value: value.join(", ") });
      } else {
        result.push({ key: fullKey, value: String(value) });
      }
    }
    
    return result;
  };

  const flatSpecs = flattenSpecs(specs);

  if (flatSpecs.length === 0) {
    return null;
  }

  // Format key names (convert camelCase to Title Case, handle special cases)
  const formatKey = (key: string): string => {
    // Remove prefix if exists
    const cleanKey = key.includes(".") ? key.split(".").pop() || key : key;
    
    // Convert camelCase to Title Case
    const formatted = cleanKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
    
    // Common translations
    const translations: Record<string, { de: string; en: string }> = {
      "Cpu": { de: "Prozessor", en: "CPU" },
      "Gpu": { de: "Grafikkarte", en: "GPU" },
      "Ram": { de: "Arbeitsspeicher", en: "RAM" },
      "Storage": { de: "Speicher", en: "Storage" },
      "Display": { de: "Display", en: "Display" },
      "Resolution": { de: "Auflösung", en: "Resolution" },
      "Refresh Rate": { de: "Bildwiederholfrequenz", en: "Refresh Rate" },
      "Connectivity": { de: "Anschlüsse", en: "Connectivity" },
      "Weight": { de: "Gewicht", en: "Weight" },
      "Dimensions": { de: "Abmessungen", en: "Dimensions" },
      "Power Consumption": { de: "Leistungsaufnahme", en: "Power Consumption" },
      "Warranty": { de: "Garantie", en: "Warranty" },
      "Release Date": { de: "Erscheinungsdatum", en: "Release Date" },
      "Price": { de: "Preis", en: "Price" },
      "Manufacturer": { de: "Hersteller", en: "Manufacturer" },
      "Model": { de: "Modell", en: "Model" },
    };

    const translation = translations[formatted];
    if (translation) {
      return isEn ? translation.en : translation.de;
    }

    return formatted;
  };

  return (
    <Card className="mt-12 border-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEn ? "Technical Specifications" : "Technische Spezifikationen"}
        </CardTitle>
        <CardDescription>
          {isEn 
            ? "Complete technical details and specifications" 
            : "Vollständige technische Details und Spezifikationen"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] font-bold">
                  {isEn ? "Specification" : "Spezifikation"}
                </TableHead>
                <TableHead className="font-bold">
                  {isEn ? "Value" : "Wert"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatSpecs.map((spec, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {formatKey(spec.key)}
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {spec.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
