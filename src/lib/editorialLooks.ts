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
    image: "/hero/handloom-dupatta.jpg",
    alt: "Handwoven striped dupatta held open in a field",
    label: "LOOK 01 | HANDWOVEN ON THE PIT LOOM",
    boutique: "Kanthaa Studio",
    city: "Delhi",
    title: "Striped Handloom Dupatta Set",
    price: 3199,
    originalPrice: 4199,
    slug: "striped-handloom-set",
    focus: "62% 38%",
  },
  {
    id: "look-2",
    image: "/hero/striped-kurta-set.jpg",
    alt: "Seated in a striped kurta set with the dupatta caught mid-air",
    label: "LOOK 02 | KOTA STRIPE & MIRROR",
    boutique: "Baagh Studio",
    city: "Jaipur",
    title: "Kota Stripe Kurta Set",
    price: 2999,
    originalPrice: 3899,
    slug: "kota-stripe-set",
    focus: "55% 55%",
  },
  {
    id: "look-3",
    image: "/hero/yellow-coord-set.jpg",
    alt: "Embroidered butter-yellow shirt and trouser co-ord",
    label: "LOOK 03 | HAND EMBROIDERED",
    boutique: "Sootra Atelier",
    city: "Delhi",
    title: "Butter Yellow Embroidered Co-ord",
    price: 3399,
    originalPrice: 4399,
    slug: "butter-yellow-coord",
    focus: "58% 40%",
  },
  {
    id: "look-4",
    image: "/hero/wrap-skirt-look.jpg",
    alt: "Magenta tie-dye wrap skirt with a plum tee in a colonnaded doorway",
    label: "LOOK 04 | BANDHANI & TIE DYE",
    boutique: "Kaarigari House",
    city: "Kolkata",
    title: "Tie-Dye Wrap Skirt Set",
    price: 2899,
    originalPrice: 3799,
    slug: "tie-dye-wrap-set",
    focus: "60% 45%",
  },
  {
    id: "look-5",
    image: "/hero/slip-and-flares.jpg",
    alt: "Cream slip dress layered over marigold flared trousers",
    label: "LOOK 05 | LAYERED & MADE TO ORDER",
    boutique: "Ranghar Studio",
    city: "Mumbai",
    title: "Slip Dress & Flared Trousers",
    price: 3199,
    originalPrice: 4199,
    slug: "slip-and-flares",
    focus: "55% 42%",
  },
];

export const EDITORIAL_PRODUCTS_MAP: Record<string, Product> = {
  "striped-handloom-set": {
    id: "striped-handloom-set",
    name: "Striped Handloom Dupatta Set",
    brand: "Kanthaa Studio",
    price: 3199,
    originalPrice: 4199,
    category: "dresses",
    images: ["/hero/handloom-dupatta.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Fuchsia", hex: "#C2185B" },
      { name: "Sea Green", hex: "#5F9E8F" },
      { name: "Ivory", hex: "#F5F0EA" },
    ],
    description: "A pit-loom stripe woven in Delhi, cut as a kurta set with a dupatta wide enough to hold open in both hands. Woven to order, so allow a little longer on this one.",
    material: "Handwoven cotton",
    inStock: true,
    tags: ["Handloom", "Stripe"],
    occasions: ["Day", "Festive"],
    rating: 5,
    reviews: 0,
  },
  "kota-stripe-set": {
    id: "kota-stripe-set",
    name: "Kota Stripe Kurta Set",
    brand: "Baagh Studio",
    price: 2999,
    originalPrice: 3899,
    category: "dresses",
    images: ["/hero/striped-kurta-set.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Rose", hex: "#D98CA3" },
      { name: "Ivory", hex: "#F5F0EA" },
      { name: "Green", hex: "#6B8E5A" },
    ],
    description: "Kota stripe with small mirror detail at the cuff and hem, worn with a matching sharara and dupatta. Cut to your measurements in Jaipur.",
    material: "Kota cotton with mirrorwork",
    inStock: true,
    tags: ["Kota", "Mirrorwork"],
    occasions: ["Festive", "Wedding"],
    rating: 5,
    reviews: 0,
  },
  "butter-yellow-coord": {
    id: "butter-yellow-coord",
    name: "Butter Yellow Embroidered Co-ord",
    brand: "Sootra Atelier",
    price: 3399,
    originalPrice: 4399,
    category: "dresses",
    images: ["/hero/yellow-coord-set.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Butter Yellow", hex: "#F0DFA0" },
      { name: "Rust", hex: "#B85A3C" },
    ],
    description: "Palms, pineapples and small suns embroidered by hand across a butter-yellow shirt and trouser set. Roughly four days of embroidery per piece.",
    material: "Cotton silk with thread embroidery",
    inStock: true,
    tags: ["Embroidery", "Resort"],
    occasions: ["Day", "Resort"],
    rating: 5,
    reviews: 0,
  },
  "tie-dye-wrap-set": {
    id: "tie-dye-wrap-set",
    name: "Tie-Dye Wrap Skirt Set",
    brand: "Kaarigari House",
    price: 2899,
    originalPrice: 3799,
    category: "dresses",
    images: ["/hero/wrap-skirt-look.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Magenta", hex: "#B0246B" },
      { name: "Plum", hex: "#6D2E46" },
      { name: "Marigold", hex: "#E8A33D" },
    ],
    description: "A wrap skirt tied at the waist in bandhani-dyed modal, worn with a plum tee. The dye pattern is never twice the same.",
    material: "Tie-dyed modal",
    inStock: true,
    tags: ["Tie Dye", "Bandhani"],
    occasions: ["Day", "Evening"],
    rating: 5,
    reviews: 0,
  },
  "slip-and-flares": {
    id: "slip-and-flares",
    name: "Slip Dress & Flared Trousers",
    brand: "Ranghar Studio",
    price: 3199,
    originalPrice: 4199,
    category: "tops",
    images: ["/hero/slip-and-flares.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Oatmeal", hex: "#E3DCCD" },
      { name: "Marigold", hex: "#E8A33D" },
    ],
    description: "An oatmeal linen slip with hand-stitched shell detail, layered over marigold flares. Both pieces are cut separately so you can size each to yourself.",
    material: "Linen and cotton twill",
    inStock: true,
    tags: ["Layering", "Linen"],
    occasions: ["Day", "Resort"],
    rating: 5,
    reviews: 0,
  },
};


export function getEditorialProduct(idOrSlug?: string): Product | null {
  if (!idOrSlug) return null;
  const key = idOrSlug.toLowerCase().trim();
  return EDITORIAL_PRODUCTS_MAP[key] || null;
}
