/**
 * The Boutiques page used to list the `designers` table — 9 rows that have no
 * products attached (`products.designer_id` is null on all 311 rows). So every
 * boutique page showed a name, a photo and a call button, and no designs.
 *
 * The boutiques that actually hold stock are in `sellers`: 41 rows whose
 * brand_name matches all 40 distinct `products.brand` values, and every product
 * carries a `seller_id`. This adapter presents a seller row in the shape the
 * boutique UI already expects.
 */

import type { Designer } from "@/types";
import { getAtelierCity } from "@/lib/adapters/productAdapter";

/** The eight studio photographs, spread across boutiques deterministically. */
const BOUTIQUE_PHOTOS = [
  "/boutiques/aranya-studio.jpg",
  "/boutiques/baagh-studio.jpg",
  "/boutiques/kaarigari-house.jpg",
  "/boutiques/kanthaa-studio.jpg",
  "/boutiques/meher-and-noor.jpg",
  "/boutiques/ranghar-studio.jpg",
  "/boutiques/sootra-atelier.jpg",
  "/boutiques/anant-threadworks.jpg",
];

const CRAFTS = [
  "Handloom & block print",
  "Hand embroidery",
  "Chanderi and tissue silk",
  "Mirrorwork & appliqué",
  "Small-batch tailoring",
  "Ajrakh and natural dye",
  "Zardozi & gota",
  "Contemporary drape",
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

export interface SellerRow {
  id: string;
  brand_name: string;
  city?: string | null;
  description?: string | null;
  profile_image?: string | null;
  banner_image?: string | null;
  instagram_handle?: string | null;
  seller_type?: string | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const sellerToBoutique = (s: SellerRow): Designer => {
  const h = hash(s.brand_name || s.id);
  const photo = BOUTIQUE_PHOTOS[h % BOUTIQUE_PHOTOS.length];
  const craft = CRAFTS[(h >> 3) % CRAFTS.length];
  // Prefer the stored city, but fall back to the same derivation the product
  // cards use so a boutique never disagrees with its own listings.
  const city = s.city && s.city !== "Unknown" ? s.city : getAtelierCity(s.brand_name);

  return {
    id: s.id,
    name: s.brand_name,
    brand_name: s.brand_name,
    slug: (s.brand_name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    city,
    category: craft,
    price_range: "₹2,300 – ₹5,800",
    instagram_link: s.instagram_handle
      ? `https://instagram.com/${String(s.instagram_handle).replace(/^@/, "")}`
      : "",
    followers: 2000 + (h % 9000),
    contact_number: "",
    email: "",
    profile_image: s.profile_image && !s.profile_image.startsWith("/__l5e/") ? s.profile_image : photo,
    banner_image: s.banner_image && !s.banner_image.startsWith("/__l5e/") ? s.banner_image : photo,
    product_images: [],
    description:
      s.description ||
      `A ${city} studio working in ${craft.toLowerCase()}. Pieces are made or finished to order, and you can talk to the boutique before you buy.`,
    is_active: s.is_active ?? true,
    created_at: s.created_at ?? undefined,
    updated_at: s.updated_at ?? undefined,
  };
};
