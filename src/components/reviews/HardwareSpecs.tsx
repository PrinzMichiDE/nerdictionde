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

  // Group specs by category for better organization
  const categorizeSpecs = (specs: Array<{ key: string; value: any }>) => {
    const categories: Record<string, Array<{ key: string; value: any }>> = {
      general: [],
      performance: [],
      display: [],
      connectivity: [],
      physical: [],
      other: [],
    };

    specs.forEach((spec) => {
      const key = spec.key.toLowerCase();
      if (key.includes("cpu") || key.includes("gpu") || key.includes("ram") || key.includes("memory") || key.includes("core") || key.includes("thread")) {
        categories.performance.push(spec);
      } else if (key.includes("display") || key.includes("resolution") || key.includes("refresh") || key.includes("panel") || key.includes("hdr")) {
        categories.display.push(spec);
      } else if (key.includes("port") || key.includes("connectivity") || key.includes("usb") || key.includes("hdmi") || key.includes("wifi") || key.includes("bluetooth")) {
        categories.connectivity.push(spec);
      } else if (key.includes("weight") || key.includes("dimension") || key.includes("size") || key.includes("height") || key.includes("width") || key.includes("depth")) {
        categories.physical.push(spec);
      } else if (key.includes("price") || key.includes("manufacturer") || key.includes("model") || key.includes("release") || key.includes("warranty")) {
        categories.general.push(spec);
      } else {
        categories.other.push(spec);
      }
    });

    return categories;
  };

  const categorizedSpecs = categorizeSpecs(flatSpecs);
  const hasMultipleCategories = Object.values(categorizedSpecs).filter(cat => cat.length > 0).length > 1;

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
        {hasMultipleCategories ? (
          <div className="space-y-6">
            {categorizedSpecs.general.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">{isEn ? "General" : "Allgemein"}</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%] font-bold">{isEn ? "Specification" : "Spezifikation"}</TableHead>
                        <TableHead className="font-bold">{isEn ? "Value" : "Wert"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorizedSpecs.general.map((spec, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{formatKey(spec.key)}</TableCell>
                          <TableCell className="text-foreground/80">{spec.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {categorizedSpecs.performance.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">{isEn ? "Performance" : "Leistung"}</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%] font-bold">{isEn ? "Specification" : "Spezifikation"}</TableHead>
                        <TableHead className="font-bold">{isEn ? "Value" : "Wert"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorizedSpecs.performance.map((spec, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{formatKey(spec.key)}</TableCell>
                          <TableCell className="text-foreground/80">{spec.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {categorizedSpecs.display.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">{isEn ? "Display" : "Display"}</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%] font-bold">{isEn ? "Specification" : "Spezifikation"}</TableHead>
                        <TableHead className="font-bold">{isEn ? "Value" : "Wert"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorizedSpecs.display.map((spec, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{formatKey(spec.key)}</TableCell>
                          <TableCell className="text-foreground/80">{spec.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {categorizedSpecs.connectivity.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">{isEn ? "Connectivity" : "Anschlüsse"}</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%] font-bold">{isEn ? "Specification" : "Spezifikation"}</TableHead>
                        <TableHead className="font-bold">{isEn ? "Value" : "Wert"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorizedSpecs.connectivity.map((spec, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{formatKey(spec.key)}</TableCell>
                          <TableCell className="text-foreground/80">{spec.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {categorizedSpecs.physical.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">{isEn ? "Physical" : "Abmessungen"}</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%] font-bold">{isEn ? "Specification" : "Spezifikation"}</TableHead>
                        <TableHead className="font-bold">{isEn ? "Value" : "Wert"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorizedSpecs.physical.map((spec, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{formatKey(spec.key)}</TableCell>
                          <TableCell className="text-foreground/80">{spec.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {categorizedSpecs.other.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">{isEn ? "Other" : "Sonstiges"}</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%] font-bold">{isEn ? "Specification" : "Spezifikation"}</TableHead>
                        <TableHead className="font-bold">{isEn ? "Value" : "Wert"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorizedSpecs.other.map((spec, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{formatKey(spec.key)}</TableCell>
                          <TableCell className="text-foreground/80">{spec.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
