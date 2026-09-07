import { Product } from "@/types";

export interface DesignVM {
  slug: string;
  boutique: string;
  city: string;
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
  altImage: string;
  rating: number;
  reviewCount: number;
  replyTime: string;
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

export function mapCategoryToNewTaxonomy(rawCategory?: string): CanonicalCategory | null {
  const normalized = (rawCategory || "").toLowerCase().trim();
  
  if (normalized.includes("lehenga") || normalized.includes("ghagra")) return "Lehengas";
  if (normalized.includes("saree") || normalized.includes("sari")) return "Sarees";
  if (normalized.includes("indo-western") || normalized.includes("indowestern") || normalized.includes("fusion")) return "Indo-Western";
  if (normalized.includes("indian co-ord") || normalized.includes("kurta set") || normalized.includes("ethnic set") || normalized.includes("anarkali set")) return "Indian Co-ords";
  if (normalized.includes("western co-ord") || normalized.includes("pant suit")) return "Western Co-ords";
  if (normalized.includes("co-ord") || normalized.includes("coord")) return "Indian Co-ords";
  if (normalized.includes("jumpsuit") || normalized.includes("playsuit") || normalized.includes("romper")) return "Jumpsuits";
  if (normalized.includes("dress") || normalized.includes("gown") || normalized.includes("maxi") || normalized.includes("midi dress")) return "Western Dresses";
  if (normalized.includes("top") || normalized.includes("shirt") || normalized.includes("blouse") || normalized.includes("tunic") || normalized.includes("corset")) return "Tops";
  if (normalized.includes("bottom") || normalized.includes("pant") || normalized.includes("trouser") || normalized.includes("skirt") || normalized.includes("palazzo")) return "Bottoms";
  if (normalized.includes("bag") || normalized.includes("clutch") || normalized.includes("potli") || normalized.includes("tote") || normalized.includes("handbag")) return "Bags";
  if (normalized.includes("shoe") || normalized.includes("footwear") || normalized.includes("juttis") || normalized.includes("sandals") || normalized.includes("heels") || normalized.includes("mojri")) return "Shoes";
  
  // Anti-corruption: Do NOT map general "accessories" to "Bags", and do NOT default to "Western Dresses"
  return null;
}

const PALETTES = [
  { from: "#17130f", to: "#4a3e35", accent: "#b0512c" },
  { from: "#24402f", to: "#4a6352", accent: "#a3853f" },
  { from: "#42281d", to: "#8a5840", accent: "#d98a63" },
  { from: "#29243b", to: "#594f7c", accent: "#c59f60" },
  { from: "#5c2a2a", to: "#9c5252", accent: "#e2a76f" },
];


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

export const CATEGORY_IMAGE_MAP: Record<string, { primary: string; alt: string }> = {
  "Lehengas": { primary: "/mockup-assets/lengha-03.jpg", alt: "/mockup-assets/lengha-12.jpg" },
  "Sarees": { primary: "/mockup-assets/saree-02.jpg", alt: "/mockup-assets/saree-09.jpg" },
  "Indo-Western": { primary: "/mockup-assets/indowesteern-03.jpg", alt: "/mockup-assets/dresses-western-11.jpg" },
  "Indian Co-ords": { primary: "/mockup-assets/coord-indian-04.jpg", alt: "/mockup-assets/coord-western-02.jpg" },
  "Western Dresses": { primary: "/mockup-assets/dresses-western-04.jpg", alt: "/mockup-assets/dresses-western-19.jpg" },
  "Western Co-ords": { primary: "/mockup-assets/coord-western-02.jpg", alt: "/mockup-assets/coord-indian-04.jpg" },
  "Tops": { primary: "/mockup-assets/tops-western-09.jpg", alt: "/mockup-assets/tops-western-01.jpg" },
  "Bottoms": { primary: "/mockup-assets/bottoms-03.jpg", alt: "/mockup-assets/coord-western-02.jpg" },
  "Jumpsuits": { primary: "/mockup-assets/jumpsuits-02.jpg", alt: "/mockup-assets/dresses-western-25.jpg" },
  "Bags": { primary: "/mockup-assets/bags-14.jpg", alt: "/mockup-assets/bags-07.jpg" },
  "Shoes": { primary: "/mockup-assets/shoes-05.jpg", alt: "/mockup-assets/shoes-14.jpg" },
};

export function getAtelierCity(brandName?: string): string {
  const norm = (brandName || "").toLowerCase();
  if (norm.includes("naayra")) return "Delhi";
  if (norm.includes("riwaana")) return "Mumbai";
  if (norm.includes("navira")) return "Jaipur";
  if (norm.includes("vindhya")) return "Hyderabad";
  if (norm.includes("kamala")) return "Chennai";
  if (norm.includes("noor")) return "Lucknow";
  if (norm.includes("ruh")) return "Goa";
  if (norm.includes("thaila")) return "Jaipur";
  if (norm.includes("juti") || norm.includes("jutti")) return "Amritsar";
  if (norm.includes("saanjh")) return "Bengaluru";
  if (norm.includes("rangreza")) return "Jaipur";
  if (norm.includes("taant")) return "Kolkata";
  if (norm.includes("punit")) return "Jaipur";
  if (norm.includes("gauri")) return "Delhi";
  if (norm.includes("roshi")) return "Mumbai";
  return "Jaipur";
}

export function transformProductToDesignStrict(product: Product): DesignVM {
  const isReady = Boolean(product.inStock);
  const paletteIndex = Math.abs((product.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PALETTES.length;
  const palette = PALETTES[paletteIndex];
  
  // Authoritative DB price preservation: DB is sole commercial truth
  const price = typeof product.price === "number" && product.price > 0 ? product.price : 0;

  const normalizedColors = normalizeProductColors(product.colors);
  const normalizedSizes = normalizeProductSizes(product.sizes);
  const normalizedRaw = { ...product, price, colors: normalizedColors, sizes: normalizedSizes };

  const mappedCat = mapCategoryToNewTaxonomy(product.category) || (product.category as any) || "Lehengas";
  const catDefaults = CATEGORY_IMAGE_MAP[mappedCat] || CATEGORY_IMAGE_MAP["Lehengas"];

  const rawImages = Array.isArray(product.images) && product.images.length > 0 
    ? product.images.filter(Boolean) 
    : [];

  const primaryImage = (rawImages[0] && !rawImages[0].includes("placeholder")) 
    ? rawImages[0] 
    : catDefaults.primary;

  const altImage = (rawImages[1] && !rawImages[1].includes("placeholder"))
    ? rawImages[1]
    : catDefaults.alt;

  const boutique = product.brand || "OGURA Atelier";
  const city = getAtelierCity(boutique);

  return {
    slug: product.id,
    boutique,
    city,
    title: product.name,
    subtitle: product.description ? product.description.slice(0, 60) + (product.description.length > 60 ? "..." : "") : "",
    category: mappedCat,
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
    image: primaryImage,
    altImage,
    rating: product.rating || 4.8,
    reviewCount: product.reviews || 96,
    replyTime: "2h",
    rawProduct: normalizedRaw,
  };
}

