export type PCComponentType = 
  | "CPU" 
  | "GPU" 
  | "Motherboard" 
  | "RAM" 
  | "SSD" 
  | "PSU" 
  | "Case" 
  | "Cooler" 
  | "Monitor" 
  | "Keyboard" 
  | "Mouse" 
  | "Headset" 
  | "Other";

export interface PCComponent {
  id: string;
  pcBuildId: string;
  type: PCComponentType;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  image?: string | null;
  description?: string | null;
  description_en?: string | null;
  price?: number | null;
  currency: string;
  affiliateLink?: string | null;
  reviewId?: string | null;
  specs?: any | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PCBuild {
  id: string;
  pricePoint: number;
  title: string;
  title_en?: string | null;
  slug: string;
  description?: string | null;
  description_en?: string | null;
  totalPrice: number;
  currency: string;
  status: "draft" | "published";
  affiliateLink?: string | null;
  metadata?: any | null;
  createdAt: Date;
  updatedAt: Date;
  components?: PCComponent[];
}

export interface CreatePCBuildInput {
  pricePoint: number;
  title: string;
  title_en?: string;
  slug: string;
  description?: string;
  description_en?: string;
  totalPrice: number;
  currency?: string;
  status?: "draft" | "published";
  affiliateLink?: string;
  metadata?: any;
  components: Omit<PCComponent, "id" | "pcBuildId" | "createdAt" | "updatedAt">[];
}

