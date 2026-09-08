/**
 * Presentation-layer rename for the eight rows in the live `designers` table
 * that still carry real designers' names (Anita Dongre, Tarun Tahiliani and
 * six others).
 *
 * The database is the right place to fix this, but `designers` is locked to the
 * admin role by RLS, and the account we have is not an admin on that project.
 * Rather than leave real names on the site, every read is remapped here.
 *
 * `scripts/rename-boutiques.sql` performs the same change in the database.
 * Once someone with admin access has run it, this file can be deleted — the
 * overrides are keyed by row id, so they simply stop matching.
 */

import type { Designer } from "@/types";

interface BoutiqueOverride {
  name: string;
  slug: string;
  city: string;
  category: string;
  price_range: string;
  followers: number;
  description: string;
  instagram_link: string;
  image: string;
}

export const BOUTIQUE_OVERRIDES: Record<string, BoutiqueOverride> = {
  "206034a6-da5f-47e4-b747-7b50cf32cc4a": {
    name: "Aranya Studio", slug: "aranya-studio", city: "Mumbai",
    category: "Bridal & Occasion", price_range: "₹2,400 – ₹5,400", followers: 8400,
    instagram_link: "https://instagram.com/aranya.studio",
    image: "/boutiques/aranya-studio.jpg",
    description: "A Mumbai studio working in block print and hand embroidery, cutting occasion wear to order for a customer they have usually spoken to first.",
  },
  "304f5711-f971-4101-a0d1-c5c9275193f3": {
    name: "Sootra Atelier", slug: "sootra-atelier", city: "Delhi",
    category: "Couture", price_range: "₹1,900 – ₹5,400", followers: 6100,
    instagram_link: "https://instagram.com/sootra.atelier",
    image: "/boutiques/sootra-atelier.jpg",
    description: "Drape-led silhouettes from a small Delhi workroom. Every piece is cut for one person, and the fit is settled before anything is stitched.",
  },
  "d8df0437-a4ff-4d76-92d8-f0f6aa022c79": {
    name: "Kaarigari House", slug: "kaarigari-house", city: "Kolkata",
    category: "Contemporary", price_range: "₹2,400 – ₹5,400", followers: 5200,
    instagram_link: "https://instagram.com/kaarigari.house",
    image: "/boutiques/kaarigari-house.jpg",
    description: "Kolkata karigars working contemporary cuts in traditional surface craft. Small runs, long lead times, nothing repeated exactly.",
  },
  "64caa4cc-cdd4-46eb-8f50-fba2903b5b68": {
    name: "Baagh Studio", slug: "baagh-studio", city: "Jaipur",
    category: "Ethnic", price_range: "₹1,900 – ₹3,400", followers: 7300,
    instagram_link: "https://instagram.com/baagh.studio",
    image: "/boutiques/baagh-studio.jpg",
    description: "Jaipur prints on everyday ethnic wear. The studio keeps a rail of ready pieces and makes the rest to your measurements.",
  },
  "c1f242a9-f74e-4420-9ef4-8595ecfac131": {
    name: "Meher & Noor", slug: "meher-and-noor", city: "Delhi",
    category: "Evening Wear", price_range: "₹1,900 – ₹3,400", followers: 4800,
    instagram_link: "https://instagram.com/meherandnoor",
    image: "/boutiques/meher-and-noor.jpg",
    description: "Two sisters in Delhi making evening and cocktail wear. They will talk you through fabric weight and fall before you commit.",
  },
  "dd421d5a-1d6b-4265-bc04-840b8931ca71": {
    name: "Anant Threadworks", slug: "anant-threadworks", city: "Mumbai",
    category: "Menswear", price_range: "₹1,900 – ₹3,400", followers: 3900,
    instagram_link: "https://instagram.com/anant.threadworks",
    image: "/boutiques/anant-threadworks.jpg",
    description: "Menswear cut in a Mumbai tailoring room — bandhgalas, kurtas and shirting, measured in person or from your own numbers.",
  },
  "660635c7-fab1-4698-97ef-395f448c788f": {
    name: "Kanthaa Studio", slug: "kanthaa-studio", city: "Delhi",
    category: "Sustainable Fashion", price_range: "₹1,900 – ₹3,400", followers: 9100,
    instagram_link: "https://instagram.com/kanthaa.studio",
    image: "/boutiques/kanthaa-studio.jpg",
    description: "Handloom cotton and recycled textile, cut slowly. The studio works to order so nothing is made that nobody wanted.",
  },
  "ecd5401b-3475-4845-991f-545d7cf82c77": {
    name: "Ranghar Studio", slug: "ranghar-studio", city: "Mumbai",
    category: "Bridal", price_range: "₹2,400 – ₹5,400", followers: 6700,
    instagram_link: "https://instagram.com/ranghar.studio",
    image: "/boutiques/ranghar-studio.jpg",
    description: "Bridal and trousseau pieces made over weeks, not minutes. Fittings happen on a call if you cannot get to the Mumbai studio.",
  },
  // Roshi keeps its own name — only the photograph is replaced. The stored
  // profile_image points at a Lovable-hosted /__l5e/ path that does not
  // resolve, so the card rendered as broken alt text.
  "a891d0f8-864b-48b2-a636-5f779d617ebb": {
    name: "Roshi", slug: "roshi", city: "Mumbai",
    category: "Contemporary Knitwear", price_range: "₹1,900 – ₹3,400", followers: 12500,
    instagram_link: "https://instagram.com/roshi",
    image: "/roshi/product-1.jpg",
    description: "Roshi blends contemporary silhouettes with artisanal knitwear techniques, creating pieces that celebrate texture and colour.",
  },
};

/** Names that must never reach the screen, whichever row they arrive on. */
const BLOCKED_NAMES = [
  "anita dongre", "tarun tahiliani", "anamika khanna", "punit balana",
  "gauri & nainika", "gauri and nainika", "aseem kapoor", "ka-sha", "rajiramniq",
];

/** Applies the rename to one row read from `designers`. */
export const applyBoutiqueOverride = <T extends Partial<Designer> & { id?: string }>(row: T): T => {
  const o = row.id ? BOUTIQUE_OVERRIDES[row.id] : undefined;

  if (o) {
    return {
      ...row,
      name: o.name,
      brand_name: o.name,
      slug: o.slug,
      city: o.city,
      category: o.category,
      price_range: o.price_range,
      followers: o.followers,
      description: o.description,
      instagram_link: o.instagram_link,
      profile_image: o.image,
      banner_image: o.image,
    };
  }

  // Belt and braces: if a real name appears on a row we don't have mapped
  // (a new row, a changed id), hide it rather than render it.
  const candidate = `${row.brand_name ?? ""} ${row.name ?? ""}`.toLowerCase();
  if (BLOCKED_NAMES.some((n) => candidate.includes(n))) {
    return { ...row, name: "Independent Atelier", brand_name: "Independent Atelier" };
  }

  return row;
};
