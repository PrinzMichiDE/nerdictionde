/**
 * Curated catalog of popular hardware products for automatic review generation.
 * Used by the generate-product-reviews cron as a fallback data source when the
 * Hardware database table is empty. Products are matched/upserted by (name + manufacturer).
 */

export interface HardwareCatalogItem {
  name: string;
  manufacturer: string;
  model?: string;
  type: string; // gpu | cpu | motherboard | ram | storage | psu | case | cooler | monitor | keyboard | mouse | headset | controller | console
  msrp?: number;
  releaseDate?: string; // ISO date
  specs?: Record<string, any>;
}

export const HARDWARE_CATALOG: HardwareCatalogItem[] = [
  // GPUs
  { name: "NVIDIA GeForce RTX 4090", manufacturer: "NVIDIA", model: "RTX 4090", type: "gpu", msrp: 1799, releaseDate: "2022-10-12", specs: { vram: "24 GB GDDR6X", tdp: "450 W" } },
  { name: "NVIDIA GeForce RTX 4080 Super", manufacturer: "NVIDIA", model: "RTX 4080 Super", type: "gpu", msrp: 999, releaseDate: "2024-01-31", specs: { vram: "16 GB GDDR6X", tdp: "320 W" } },
  { name: "NVIDIA GeForce RTX 4070", manufacturer: "NVIDIA", model: "RTX 4070", type: "gpu", msrp: 599, releaseDate: "2023-04-13", specs: { vram: "12 GB GDDR6X", tdp: "200 W" } },
  { name: "AMD Radeon RX 7900 XTX", manufacturer: "AMD", model: "RX 7900 XTX", type: "gpu", msrp: 999, releaseDate: "2022-12-13", specs: { vram: "24 GB GDDR6", tdp: "355 W" } },
  { name: "AMD Radeon RX 7800 XT", manufacturer: "AMD", model: "RX 7800 XT", type: "gpu", msrp: 499, releaseDate: "2023-09-06", specs: { vram: "16 GB GDDR6", tdp: "263 W" } },

  // CPUs
  { name: "AMD Ryzen 9 7950X", manufacturer: "AMD", model: "Ryzen 9 7950X", type: "cpu", msrp: 699, releaseDate: "2022-09-27", specs: { cores: 16, threads: 32, tdp: "170 W" } },
  { name: "AMD Ryzen 7 7800X3D", manufacturer: "AMD", model: "Ryzen 7 7800X3D", type: "cpu", msrp: 449, releaseDate: "2023-04-06", specs: { cores: 8, threads: 16, tdp: "120 W" } },
  { name: "Intel Core i9-14900K", manufacturer: "Intel", model: "Core i9-14900K", type: "cpu", msrp: 589, releaseDate: "2023-10-17", specs: { cores: 24, threads: 32, tdp: "253 W" } },
  { name: "Intel Core i5-14600K", manufacturer: "Intel", model: "Core i5-14600K", type: "cpu", msrp: 319, releaseDate: "2023-10-17", specs: { cores: 14, threads: 20, tdp: "181 W" } },

  // Monitors
  { name: "Samsung Odyssey OLED G8", manufacturer: "Samsung", model: "G85SB", type: "monitor", msrp: 1299, releaseDate: "2022-09-01", specs: { resolution: "3840x2160", refreshRate: "175 Hz" } },
  { name: "LG UltraGear 27GR95QE", manufacturer: "LG", model: "27GR95QE-B", type: "monitor", msrp: 999, releaseDate: "2022-12-01", specs: { resolution: "2560x1440", refreshRate: "240 Hz" } },

  // Keyboards
  { name: "Logitech G Pro X TKL", manufacturer: "Logitech", model: "G Pro X TKL", type: "keyboard", msrp: 199, releaseDate: "2023-09-01", specs: { switches: "Mechanical" } },
  { name: "Razer Huntsman V3 Pro", manufacturer: "Razer", model: "Huntsman V3 Pro", type: "keyboard", msrp: 249, releaseDate: "2023-10-01", specs: { switches: "Optical" } },

  // Mice
  { name: "Logitech G502 X Plus", manufacturer: "Logitech", model: "G502 X Plus", type: "mouse", msrp: 159, releaseDate: "2022-09-01", specs: { dpi: "25600" } },
  { name: "Razer Viper V3 Pro", manufacturer: "Razer", model: "Viper V3 Pro", type: "mouse", msrp: 159, releaseDate: "2024-04-01", specs: { dpi: "35000" } },

  // Headsets
  { name: "SteelSeries Arctis Nova Pro", manufacturer: "SteelSeries", model: "Arctis Nova Pro", type: "headset", msrp: 249, releaseDate: "2022-05-01", specs: { connection: "Wireless" } },
  { name: "HyperX Cloud III", manufacturer: "HyperX", model: "Cloud III", type: "headset", msrp: 99, releaseDate: "2023-06-01", specs: { connection: "Wired" } },

  // Storage
  { name: "Samsung 990 Pro", manufacturer: "Samsung", model: "990 Pro", type: "storage", msrp: 169, releaseDate: "2022-11-01", specs: { capacity: "2 TB", interface: "PCIe 4.0" } },
  { name: "WD Black SN850X", manufacturer: "Western Digital", model: "SN850X", type: "storage", msrp: 159, releaseDate: "2022-08-01", specs: { capacity: "2 TB", interface: "PCIe 4.0" } },

  // RAM
  { name: "Corsair Vengeance DDR5", manufacturer: "Corsair", model: "CMK32GX5M2B6000", type: "ram", msrp: 129, releaseDate: "2022-11-01", specs: { capacity: "32 GB", speed: "6000 MHz" } },

  // PSU
  { name: "Corsair RM850x", manufacturer: "Corsair", model: "RM850x", type: "psu", msrp: 139, releaseDate: "2021-01-01", specs: { wattage: "850 W", rating: "80+ Gold" } },

  // Console
  { name: "PlayStation 5", manufacturer: "Sony", model: "CFI-1216A", type: "console", msrp: 499, releaseDate: "2020-11-19", specs: { storage: "825 GB SSD" } },
  { name: "Xbox Series X", manufacturer: "Microsoft", model: "RRT-00009", type: "console", msrp: 499, releaseDate: "2020-11-10", specs: { storage: "1 TB SSD" } },
];
