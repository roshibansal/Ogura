import type { Product } from "@/types";

export interface HeroLook {
  id: string;
  image: string;
  alt: string;
  label: string;
  boutique: string;
  city: string;
  title: string;
  price: number;
  originalPrice: number;
  slug: string;
  /** object-position for this frame: keeps the subject clear of the headline. */
  focus: string;
}

export const HERO_LOOKS: HeroLook[] = [
  {
    id: "look-1",
    image: "/hero/blush-organza-set.jpg",
    alt: "Blush kurta set with a hand-painted organza dupatta caught in the air",
    label: "LOOK 01 | HAND-PAINTED ORGANZA",
    boutique: "Sootra Atelier",
    city: "Delhi",
    title: "Blush Kurta & Painted Organza Dupatta",
    price: 3599,
    originalPrice: 4699,
    slug: "blush-organza-set",
    focus: "50% 34%",
  },
  {
    id: "look-2",
    image: "/hero/ikat-chanderi-set.jpg",
    alt: "Indigo and olive ikat kurta with a chanderi dupatta sweeping overhead",
    label: "LOOK 02 | IKAT & CHANDERI",
    boutique: "Kaarigari House",
    city: "Kolkata",
    title: "Indigo Ikat Kurta Set",
    price: 3399,
    originalPrice: 4399,
    slug: "ikat-chanderi-set",
    focus: "44% 40%",
  },
  {
    id: "look-3",
    image: "/hero/slip-and-flares.jpg",
    alt: "Linen slip dress with shell detail layered over marigold flared trousers",
    label: "LOOK 03 | LAYERED & MADE TO ORDER",
    boutique: "Ranghar Studio",
    city: "Mumbai",
    title: "Linen Slip & Marigold Flares",
    price: 3799,
    originalPrice: 4899,
    slug: "slip-and-flares",
    focus: "52% 58%",
  },
  {
    id: "look-4",
    image: "/hero/butter-yellow-set.jpg",
    alt: "Butter yellow embroidered kurta and palazzo with a blush organza dupatta",
    label: "LOOK 04 | HAND EMBROIDERED",
    boutique: "Baagh Studio",
    city: "Jaipur",
    title: "Butter Yellow Embroidered Set",
    price: 3299,
    originalPrice: 4299,
    slug: "butter-yellow-set",
    focus: "46% 34%",
  },
];

export const EDITORIAL_PRODUCTS_MAP: Record<string, Product> = {
  "blush-organza-set": {
    id: "blush-organza-set",
    name: "Blush Kurta & Painted Organza Dupatta",
    brand: "Sootra Atelier",
    price: 3599,
    originalPrice: 4699,
    category: "dresses",
    images: ["/hero/blush-organza-set.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Blush", hex: "#EBD9D1" },
      { name: "Ivory", hex: "#F5F0EA" },
    ],
    description: "A blush silk kurta and straight pant, worn with an organza dupatta hand-painted in coral and indigo. The painting is done panel by panel, so no two dupattas match.",
    material: "Silk with hand-painted organza",
    inStock: true,
    tags: ["Hand Painted", "Organza"],
    occasions: ["Festive", "Evening"],
    rating: 5,
    reviews: 0,
  },
  "ikat-chanderi-set": {
    id: "ikat-chanderi-set",
    name: "Indigo Ikat Kurta Set",
    brand: "Kaarigari House",
    price: 3399,
    originalPrice: 4399,
    category: "dresses",
    images: ["/hero/ikat-chanderi-set.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Indigo", hex: "#28356B" },
      { name: "Olive", hex: "#7E8B3A" },
      { name: "Ivory", hex: "#F5F0EA" },
    ],
    description: "Indigo and olive ikat cut as a straight kurta, worn with block-printed palazzos and a fine chanderi dupatta.",
    material: "Ikat cotton with chanderi dupatta",
    inStock: true,
    tags: ["Ikat", "Chanderi"],
    occasions: ["Day", "Festive"],
    rating: 5,
    reviews: 0,
  },
  "slip-and-flares": {
    id: "slip-and-flares",
    name: "Linen Slip & Marigold Flares",
    brand: "Ranghar Studio",
    price: 3799,
    originalPrice: 4899,
    category: "dresses",
    images: ["/hero/slip-and-flares.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Oatmeal", hex: "#E3DCCD" },
      { name: "Marigold", hex: "#E8A33D" },
    ],
    description: "An oatmeal linen slip with hand-stitched shell detail, layered over marigold flares. The two pieces are cut separately, so each can be sized to you.",
    material: "Linen and cotton twill",
    inStock: true,
    tags: ["Layering", "Linen"],
    occasions: ["Day", "Resort"],
    rating: 5,
    reviews: 0,
  },
  "butter-yellow-set": {
    id: "butter-yellow-set",
    name: "Butter Yellow Embroidered Set",
    brand: "Baagh Studio",
    price: 3299,
    originalPrice: 4299,
    category: "dresses",
    images: ["/hero/butter-yellow-set.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Butter Yellow", hex: "#F0DFA0" },
      { name: "Blush", hex: "#EBD9D1" },
    ],
    description: "Butter yellow kurta with floral embroidery at the neck and hem, cut with matching palazzos and a blush organza dupatta.",
    material: "Cotton silk with thread embroidery",
    inStock: true,
    tags: ["Embroidery", "Summer"],
    occasions: ["Day", "Festive"],
    rating: 5,
    reviews: 0,
  },
};



export function getEditorialProduct(idOrSlug?: string): Product | null {
  if (!idOrSlug) return null;
  const key = idOrSlug.toLowerCase().trim();
  return EDITORIAL_PRODUCTS_MAP[key] || null;
}
