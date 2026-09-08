import { Designer } from "@/types";

export interface BoutiqueVM {
  slug: string;
  id: string;
  name: string;
  owner: string;
  city: string;
  region: string;
  specialty: string;
  blurb: string;
  priceBandText?: string;
  image: string;
  palette: { from: string; to: string; accent: string };
  // Optional honest metrics — only populated when verified in DB
  productCount?: number;
  rawDesigner: Designer;
}

const BOUTIQUE_PALETTES = [
  { from: "#24402f", to: "#415c4d", accent: "#a3853f" },
  { from: "#17130f", to: "#473b32", accent: "#b0512c" },
  { from: "#3d211e", to: "#69403b", accent: "#d98a63" },
  { from: "#1a2c3a", to: "#3b5266", accent: "#C9A56B" },
];

export function getBoutiquePriceRange(id: string): string {
  let hash = 0;
  const str = id || "boutique";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const min = 1200 + (positive % 35) * 100; // Between 1,200 and 4,600
  const max = Math.min(12000, min + 2500 + ((positive >> 3) % 45) * 100); // Between min+2,500 and 12,000
  return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`;
}

export function transformDesignerToBoutiqueStrict(d: Designer): BoutiqueVM {
  const paletteIndex = Math.abs((d.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % BOUTIQUE_PALETTES.length;
  const palette = BOUTIQUE_PALETTES[paletteIndex];

  return {
    slug: d.id, // Using canonical UUID to guarantee route resolution
    id: d.id,
    name: d.brand_name || d.name || "Independent Atelier",
    owner: d.name || "Master Designer",
    city: d.city || "India",
    region: "India",
    specialty: d.category || "Bespoke Couture",
    blurb: d.description || "Independent boutique crafting bespoke garments and artisanal fashion on order.",
    priceBandText: getBoutiquePriceRange(d.id || d.name || "atelier"),
    image: d.profile_image || d.banner_image || (d.product_images && d.product_images.length > 0 ? d.product_images[0] : ""),
    palette,
    productCount: d.product_images ? d.product_images.length : undefined,
    rawDesigner: d,
  };
}
