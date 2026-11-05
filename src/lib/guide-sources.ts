// Guide-Quellen für den automatischen Guide/ Wiki-Sync

export const GUIDE_CATEGORIES = [
  "gaming",
  "hardware", 
  "film-serie",
  "streaming",
] as const;

export const WIKI_CATEGORIES = [
  "gaming-begriffe",
  "hardware-terminologie",
  "plattformen",
  "genres",
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];
export type WikiCategory = (typeof WIKI_CATEGORIES)[number];

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  gaming: "Gaming Guides",
  hardware: "Hardware Guides",
  "film-serie": "Film & Serie",
  streaming: "Streaming & Content",
};

export const WIKI_CATEGORY_LABELS: Record<WikiCategory, string> = {
  "gaming-begriffe": "Gaming-Begriffe",
  "hardware-terminologie": "Hardware-Terminologie",
  plattformen: "Plattformen",
  genres: "Genres",
};

export interface GuideTopic {
  title: string;
  category: GuideCategory | WikiCategory;
  type: "guide" | "wiki";
  keywords: string[];
  description: string;
}

// Vordefinierte Themen für automatische Generierung
export const GUIDE_TOPICS: GuideTopic[] = [
  // Gaming Guides
  {
    title: "Gaming-PC kaufen 2025: Der ultimative Guide",
    category: "gaming",
    type: "guide",
    keywords: ["Gaming-PC", "Kaufberatung", "Budget", "Komponenten"],
    description: "So findest du den perfekten Gaming-PC für dein Budget",
  },
  {
    title: "Steam Deck Tipps & Tricks",
    category: "gaming",
    type: "guide",
    keywords: ["Steam Deck", "Tipps", "Tricks", "Optimierung"],
    description: "Das Beste aus deinem Steam Deck herausholen",
  },
  {
    title: "PC Gaming Optimierung: FPS steigern",
    category: "gaming",
    type: "guide",
    keywords: ["FPS", "Optimierung", "Performance", "Grafikeinstellungen"],
    description: "So holst du mehr FPS aus deinem PC",
  },
  {
    title: "Emulation auf dem Steam Deck",
    category: "gaming",
    type: "guide",
    keywords: ["Emulation", "Retro", "Steam Deck", "ROMs"],
    description: "Retro-Games auf dem Steam Deck spielen",
  },
  // Hardware Guides
  {
    title: "Monitor kaufen: IPS, OLED oder Mini-LED?",
    category: "hardware",
    type: "guide",
    keywords: ["Monitor", "IPS", "OLED", "Mini-LED", "Kaufberatung"],
    description: "Welcher Display-Typ passt zu dir?",
  },
  {
    title: "Grafikkarte kaufen 2025: Kaufberatung",
    category: "hardware",
    type: "guide",
    keywords: ["Grafikkarte", "GPU", "Kaufberatung", "NVIDIA", "AMD"],
    description: "Die beste Grafikkarte für dein Budget",
  },
  {
    title: "RAM kaufen: DDR4 vs DDR5",
    category: "hardware",
    type: "guide",
    keywords: ["RAM", "DDR4", "DDR5", "Arbeitsspeicher"],
    description: "Alles was du über RAM wissen musst",
  },
  {
    title: "PC-Netzteil richtig wählen",
    category: "hardware",
    type: "guide",
    keywords: ["Netzteil", "PSU", "Watt", "Effizienz"],
    description: "So wählst du das richtige Netzteil",
  },
  // Wiki entries
  {
    title: "FPS (Frames per Second)",
    category: "gaming-begriffe",
    type: "wiki",
    keywords: ["FPS", "Framerate", "Bildrate"],
    description: "Definition und Erklärung von FPS",
  },
  {
    title: "Raytracing",
    category: "gaming-begriffe",
    type: "wiki",
    keywords: ["Raytracing", "RTX", "Beleuchtung"],
    description: "Was ist Raytracing und wie funktioniert es?",
  },
  {
    title: "DLSS vs FSR",
    category: "gaming-begriffe",
    type: "wiki",
    keywords: ["DLSS", "FSR", "Upscaling"],
    description: "Unterschied zwischen DLSS und FSR",
  },
  {
    title: "CPU vs GPU",
    category: "gaming-begriffe",
    type: "wiki",
    keywords: ["CPU", "GPU", "Prozessor", "Grafikkarte"],
    description: "Unterschied zwischen CPU und GPU",
  },
  {
    title: "PCIe",
    category: "hardware-terminologie",
    type: "wiki",
    keywords: ["PCIe", "PCI Express", "Bus"],
    description: "Was ist PCI Express?",
  },
  {
    title: "VRAM",
    category: "hardware-terminologie",
    type: "wiki",
    keywords: ["VRAM", "Videospeicher", "Grafikspeicher"],
    description: "Videospeicher für Grafikkarten erklärt",
  },
];