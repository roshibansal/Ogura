import { Product } from "@/types";

export interface DesignVM {
  slug: string;
  boutique: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  originalPrice?: number;
  fabric: string;
  colours: string[];
  sizes: string[];
  readyStock: string | null;
  shipsInDays: number;
  customisable: boolean;
  leadTimeDays: number;
  note: string;
  palette: { from: string; to: string; accent: string };
  image: string;
  rawProduct: Product;
}

export const CANONICAL_TAXONOMY = [
  "Lehengas",
  "Sarees",
  "Indo-Western",
  "Indian Co-ords",
  "Western Dresses",
  "Western Co-ords",
  "Tops",
  "Bottoms",
  "Jumpsuits",
  "Bags",
  "Shoes",
] as const;

export type CanonicalCategory = typeof CANONICAL_TAXONOMY[number];

export function mapCategoryToNewTaxonomy(rawCategory?: string): CanonicalCategory {
  const normalized = (rawCategory || "").toLowerCase().trim();
  
  if (normalized.includes("lehenga")) return "Lehengas";
  if (normalized.includes("saree") || normalized.includes("sari")) return "Sarees";
  if (normalized.includes("indo-western") || normalized.includes("indowestern") || normalized.includes("fusion")) return "Indo-Western";
  if (normalized.includes("indian co-ord") || normalized.includes("kurta set") || normalized.includes("ethnic set")) return "Indian Co-ords";
  if (normalized.includes("western co-ord")) return "Western Co-ords";
  if (normalized.includes("co-ord") || normalized.includes("coord")) return "Indian Co-ords";
  if (normalized.includes("jumpsuit")) return "Jumpsuits";
  if (normalized.includes("dress") || normalized.includes("gown") || normalized.includes("maxi")) return "Western Dresses";
  if (normalized.includes("top") || normalized.includes("shirt") || normalized.includes("blouse") || normalized.includes("tunic")) return "Tops";
  if (normalized.includes("bottom") || normalized.includes("pant") || normalized.includes("trouser") || normalized.includes("skirt")) return "Bottoms";
  if (normalized.includes("bag") || normalized.includes("clutch") || normalized.includes("potli") || normalized.includes("accessory")) return "Bags";
  if (normalized.includes("shoe") || normalized.includes("footwear") || normalized.includes("juttis") || normalized.includes("sandals") || normalized.includes("heels")) return "Shoes";
  
  // Default to Western Dresses if unmapped, preserving honest presentation
  return "Western Dresses";
}

const PALETTES = [
  { from: "#17130f", to: "#4a3e35", accent: "#b0512c" },
  { from: "#24402f", to: "#4a6352", accent: "#a3853f" },
  { from: "#42281d", to: "#8a5840", accent: "#d98a63" },
  { from: "#29243b", to: "#594f7c", accent: "#c59f60" },
  { from: "#5c2a2a", to: "#9c5252", accent: "#e2a76f" },
];

export function getUniformProductPrice(id: string): number {
  let hash = 0;
  const str = id || "ogura-piece";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  // Range: 1,200 to 12,000 (span: 10,800) in realistic steps of 50
  const steps = 216;
  const step = positive % (steps + 1);
  return 1200 + step * 50;
}

export interface ColorObject {
  name: string;
  hex: string;
}

export const COLOR_HEX_MAP: Record<string, string> = {
  black: "#111111",
  white: "#F8F8F8",
  red: "#B91C1C",
  blue: "#1D4ED8",
  green: "#15803D",
  pink: "#DB2777",
  yellow: "#EAB308",
  beige: "#D4C5B9",
  brown: "#78350F",
  navy: "#1E3A8A",
  maroon: "#881337",
  grey: "#6B7280",
  gray: "#6B7280",
  gold: "#C59F60",
  silver: "#9CA3AF",
  ivory: "#F5F0EA",
  emerald: "#047857",
  ruby: "#BE123C",
  sapphire: "#1D4ED8",
  teal: "#0F766E",
  terracotta: "#B85A3C",
  sage: "#84A98C",
  olive: "#556B2F",
  lavender: "#B4A7D6",
  peach: "#FDBA74",
  mustard: "#D97706",
  rust: "#B45309",
  charcoal: "#374151",
  cream: "#FFFDD0",
  indigo: "#3F51B5",
  copper: "#B87333",
  bronze: "#CD7F32",
  plum: "#8E4585",
  wine: "#722F37",
  coral: "#FF7F50",
  cyan: "#00BCD4",
  magenta: "#E91E63",
  turquoise: "#40E0D0",
};

export function normalizeProductColors(rawColors: any): ColorObject[] {
  if (!rawColors || !Array.isArray(rawColors) || rawColors.length === 0) {
    return [
      { name: "Studio Original", hex: "#17130F" },
      { name: "Ivory Silk", hex: "#F5F0EA" },
      { name: "Terracotta", hex: "#B85A3C" },
    ];
  }

  const result: ColorObject[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < rawColors.length; i++) {
    const item = rawColors[i];
    let name = "";
    let hex = "";

    if (typeof item === "object" && item !== null) {
      name = String(item.name || `Option ${i + 1}`).trim();
      hex = item.hex ? String(item.hex).trim() : "";
    } else if (typeof item === "string") {
      name = item.trim();
    }

    if (!name) continue;

    const lower = name.toLowerCase();
    if (!hex) {
      hex = COLOR_HEX_MAP[lower] || "#2A2A2A";
    }

    const formattedName = name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    if (!seen.has(formattedName.toLowerCase())) {
      seen.add(formattedName.toLowerCase());
      result.push({ name: formattedName, hex });
    }
  }

  return result.length > 0
    ? result
    : [
        { name: "Studio Original", hex: "#17130F" },
        { name: "Ivory Silk", hex: "#F5F0EA" },
        { name: "Terracotta", hex: "#B85A3C" },
      ];
}

export function normalizeProductSizes(rawSizes: any): string[] {
  if (!rawSizes || !Array.isArray(rawSizes) || rawSizes.length === 0) {
    return ["XS", "S", "M", "L", "XL", "Free Size"];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const s of rawSizes) {
    let sizeStr = "";
    if (typeof s === "string") {
      sizeStr = s.trim();
    } else if (typeof s === "object" && s !== null) {
      sizeStr = String(s.size || s.name || s.label || "").trim();
    }

    if (sizeStr && !seen.has(sizeStr.toUpperCase())) {
      seen.add(sizeStr.toUpperCase());
      result.push(sizeStr);
    }
  }

  return result.length > 0 ? result : ["XS", "S", "M", "L", "XL", "Free Size"];
}

export function transformProductToDesignStrict(product: Product): DesignVM {
  const isReady = Boolean(product.inStock);
  const paletteIndex = Math.abs((product.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PALETTES.length;
  const palette = PALETTES[paletteIndex];
  const price = getUniformProductPrice(product.id || product.name);
  const normalizedColors = normalizeProductColors(product.colors);
  const normalizedSizes = normalizeProductSizes(product.sizes);
  const normalizedRaw = { ...product, price, colors: normalizedColors, sizes: normalizedSizes };

  return {
    slug: product.id,
    boutique: product.brand || "OGURA Atelier",
    title: product.name,
    subtitle: product.description ? product.description.slice(0, 60) + (product.description.length > 60 ? "..." : "") : "",
    category: mapCategoryToNewTaxonomy(product.category),
    price,
    originalPrice: product.originalPrice ? Math.round(price * 1.3) : undefined,
    fabric: product.material || "Artisanal Fabric",
    colours: normalizedColors.map((c) => c.name),
    sizes: normalizedSizes,
    readyStock: isReady ? "Studio Stock" : null,
    shipsInDays: 3,
    customisable: true,
    leadTimeDays: 10,
    note: product.description || "",
    palette,
    image: Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : "",
    rawProduct: normalizedRaw,
  };
}

