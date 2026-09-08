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
}

export const HERO_LOOKS: HeroLook[] = [
  {
    id: "look-1",
    image: "/mockup-assets/lengha-03.jpg",
    alt: "Handloom Embroidered Bridal Lehenga",
    label: "LOOK 01 | HANDLOOM HERITAGE",
    boutique: "Atelier Vindhya",
    city: "Hyderabad",
    title: "Gulaab Handloom Lehenga",
    price: 4799,
    originalPrice: 6299,
    slug: "gulaab-lehenga",
  },
  {
    id: "look-2",
    image: "/mockup-assets/saree-15.jpg",
    alt: "Kanjeevaram Temple Border Silk Saree",
    label: "LOOK 02 | PURE MULBERRY SILK",
    boutique: "Kamala House",
    city: "Chennai",
    title: "Temple Border Pure Silk Saree",
    price: 4599,
    originalPrice: 5999,
    slug: "temple-border-saree",
  },
  {
    id: "look-3",
    image: "/mockup-assets/dresses-western-25.jpg",
    alt: "Contemporary Draped Evening Gown",
    label: "LOOK 03 | SCULPTURAL SILHOUETTE",
    boutique: "Ruh Studio",
    city: "Goa",
    title: "Draped Asymmetric Satin Gown",
    price: 2799,
    originalPrice: 3699,
    slug: "draped-asymmetric-gown",
  },
  {
    id: "look-4",
    image: "/mockup-assets/bags-14.jpg",
    alt: "Sculpted Handcrafted Bag",
    label: "LOOK 04 | ARTISANAL LEATHER & SILK",
    boutique: "Thaila Co.",
    city: "Jaipur",
    title: "Sculpted Silk Envelope Bag",
    price: 1999,
    originalPrice: 2699,
    slug: "sculpted-envelope-bag",
  },
];

export const EDITORIAL_PRODUCTS_MAP: Record<string, Product> = {
  "gulaab-lehenga": {
    id: "gulaab-lehenga",
    name: "Gulaab Handloom Lehenga",
    brand: "Atelier Vindhya",
    price: 4799,
    originalPrice: 6299,
    category: "dresses",
    images: ["/mockup-assets/lengha-03.jpg", "/mockup-assets/lengha-30.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Rose Gulal", hex: "#DB2777" },
      { name: "Ivory Silk", hex: "#F5F0EA" },
      { name: "Gold Zari", hex: "#C9A56B" },
    ],
    description: "Handloom embroidered bridal lehenga crafted with heritage zari by Master Artisans in Hyderabad.",
    material: "Raw Silk & Zardozi",
    inStock: true,
    tags: ["Bridal", "Handloom", "Heritage"],
    occasions: ["Wedding", "Festive"],
    rating: 4.9,
    reviews: 142,
  },
  "temple-border-saree": {
    id: "temple-border-saree",
    name: "Temple Border Pure Silk Saree",
    brand: "Kamala House",
    price: 4599,
    originalPrice: 5999,
    category: "dresses",
    images: ["/mockup-assets/saree-15.jpg", "/mockup-assets/saree-10.jpg"],
    sizes: ["Free Size"],
    colors: [
      { name: "Crimson Gold", hex: "#B91C1C" },
      { name: "Temple Ochre", hex: "#C9A56B" },
    ],
    description: "Kanjeevaram pure mulberry silk saree with authentic Korvai temple borders woven in Chennai.",
    material: "Mulberry Silk & Gold Zari",
    inStock: true,
    tags: ["Silk", "Temple Border", "Heirloom"],
    occasions: ["Wedding", "Puja"],
    rating: 5.0,
    reviews: 98,
  },
  "draped-asymmetric-gown": {
    id: "draped-asymmetric-gown",
    name: "Draped Asymmetric Satin Gown",
    brand: "Ruh Studio",
    price: 2799,
    originalPrice: 3699,
    category: "dresses",
    images: ["/mockup-assets/dresses-western-25.jpg", "/mockup-assets/dresses-western-09.jpg"],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Onyx Black", hex: "#111111" },
      { name: "Champagne", hex: "#F5F0EA" },
    ],
    description: "Sculptural evening gown featuring contemporary bias drape and tailored cowl silhouette from Goa.",
    material: "Silk Satin",
    inStock: true,
    tags: ["Evening Wear", "Sculptural", "Contemporary"],
    occasions: ["Cocktail", "Reception"],
    rating: 4.8,
    reviews: 64,
  },
  "sculpted-envelope-bag": {
    id: "sculpted-envelope-bag",
    name: "Sculpted Silk Envelope Bag",
    brand: "Thaila Co.",
    price: 1999,
    originalPrice: 2699,
    category: "bags",
    images: ["/mockup-assets/bags-14.jpg", "/mockup-assets/bags-08.jpg"],
    sizes: ["One Size"],
    colors: [
      { name: "Terracotta", hex: "#B85A3C" },
      { name: "Olive Leaf", hex: "#556B2F" },
    ],
    description: "Artisanal hand-stitched envelope bag in vegetable-dyed silk and brass closure hardware.",
    material: "Vegetable Dyed Silk & Brass",
    inStock: true,
    tags: ["Handmade", "Bags", "Artisanal"],
    occasions: ["Festive", "Casual Luxury"],
    rating: 4.9,
    reviews: 52,
  },
};

export function getEditorialProduct(idOrSlug?: string): Product | null {
  if (!idOrSlug) return null;
  const key = idOrSlug.toLowerCase().trim();
  return EDITORIAL_PRODUCTS_MAP[key] || null;
}
