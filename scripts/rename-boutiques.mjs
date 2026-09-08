/**
 * Replaces the eight real designers' names in the live `designers` table with
 * invented boutique names, and points each row at a real boutique photograph.
 *
 *   node scripts/rename-boutiques.mjs           # apply
 *   node scripts/rename-boutiques.mjs --revert  # restore backups/designers-backup-2026-09-08.json
 *   node scripts/rename-boutiques.mjs --dry     # print what would change, write nothing
 *
 * Roshi's row is never touched.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const REVERT = process.argv.includes("--revert");
const DRY = process.argv.includes("--dry");

// The same invented names already used in src/data/menuData.ts, so the whole
// site refers to each boutique consistently.
const RENAMES = [
  {
    id: "206034a6-da5f-47e4-b747-7b50cf32cc4a",
    was: "Anita Dongre",
    name: "Aranya Studio", slug: "aranya-studio", city: "Mumbai",
    category: "Bridal & Occasion", price_range: "₹4,000 – ₹12,000", followers: 8400,
    image: "/boutiques/aranya-studio.jpg", collection_name: "Enchanted Garden",
    instagram_link: "https://instagram.com/aranya.studio",
    description: "A Mumbai studio working in block print and hand embroidery, cutting occasion wear to order for a customer they have usually spoken to first.",
  },
  {
    id: "304f5711-f971-4101-a0d1-c5c9275193f3",
    was: "Tarun Tahiliani",
    name: "Sootra Atelier", slug: "sootra-atelier", city: "Delhi",
    category: "Couture", price_range: "₹5,500 – ₹12,000", followers: 6100,
    image: "/boutiques/sootra-atelier.jpg", collection_name: "India Modern",
    instagram_link: "https://instagram.com/sootra.atelier",
    description: "Drape-led silhouettes from a small Delhi workroom. Every piece is cut for one person, and the fit is settled before anything is stitched.",
  },
  {
    id: "d8df0437-a4ff-4d76-92d8-f0f6aa022c79",
    was: "Anamika Khanna",
    name: "Kaarigari House", slug: "kaarigari-house", city: "Kolkata",
    category: "Contemporary", price_range: "₹3,800 – ₹11,500", followers: 5200,
    image: "/boutiques/kaarigari-house.jpg", collection_name: "Modern Heritage",
    instagram_link: "https://instagram.com/kaarigari.house",
    description: "Kolkata karigars working contemporary cuts in traditional surface craft. Small runs, long lead times, nothing repeated exactly.",
  },
  {
    id: "64caa4cc-cdd4-46eb-8f50-fba2903b5b68",
    was: "Punit Balana",
    name: "Baagh Studio", slug: "baagh-studio", city: "Jaipur",
    category: "Ethnic", price_range: "₹2,900 – ₹9,800", followers: 7300,
    image: "/boutiques/baagh-studio.jpg", collection_name: "Heritage Redux",
    instagram_link: "https://instagram.com/baagh.studio",
    description: "Jaipur prints on everyday ethnic wear. The studio keeps a rail of ready pieces and makes the rest to your measurements.",
  },
  {
    id: "c1f242a9-f74e-4420-9ef4-8595ecfac131",
    was: "Gauri & Nainika",
    name: "Meher & Noor", slug: "meher-and-noor", city: "Delhi",
    category: "Evening Wear", price_range: "₹4,200 – ₹12,000", followers: 4800,
    image: "/boutiques/meher-and-noor.jpg", collection_name: "Midnight Glamour",
    instagram_link: "https://instagram.com/meherandnoor",
    description: "Two sisters in Delhi making evening and cocktail wear. They will talk you through fabric weight and fall before you commit.",
  },
  {
    id: "dd421d5a-1d6b-4265-bc04-840b8931ca71",
    was: "Aseem Kapoor",
    name: "Anant Threadworks", slug: "anant-threadworks", city: "Mumbai",
    category: "Menswear", price_range: "₹3,400 – ₹11,000", followers: 3900,
    image: "/boutiques/anant-threadworks.jpg", collection_name: "The Gentleman Edit",
    instagram_link: "https://instagram.com/anant.threadworks",
    description: "Menswear cut in a Mumbai tailoring room — bandhgalas, kurtas and shirting, measured in person or from your own numbers.",
  },
  {
    id: "660635c7-fab1-4698-97ef-395f448c788f",
    was: "KA-Sha",
    name: "Kanthaa Studio", slug: "kanthaa-studio", city: "Delhi",
    category: "Sustainable Fashion", price_range: "₹2,400 – ₹8,600", followers: 9100,
    image: "/boutiques/kanthaa-studio.jpg", collection_name: "Conscious Craft",
    instagram_link: "https://instagram.com/kanthaa.studio",
    description: "Handloom cotton and recycled textile, cut slowly. The studio works to order so nothing is made that nobody wanted.",
  },
  {
    id: "ecd5401b-3475-4845-991f-545d7cf82c77",
    was: "Rajiramniq",
    name: "Ranghar Studio", slug: "ranghar-studio", city: "Mumbai",
    category: "Bridal", price_range: "₹5,000 – ₹12,000", followers: 6700,
    image: "/boutiques/ranghar-studio.jpg", collection_name: "Eternal Bride 2024",
    instagram_link: "https://instagram.com/ranghar.studio",
    description: "Bridal and trousseau pieces made over weeks, not minutes. Fittings happen on a call if you cannot get to the Mumbai studio.",
  },
];

const run = async () => {
  if (REVERT) {
    const backup = JSON.parse(
      readFileSync(join(root, "backups/designers-backup-2026-09-08.json"), "utf8"),
    );
    for (const row of backup) {
      const { id, ...rest } = row;
      if (DRY) { console.log(`would restore ${id} -> ${rest.name}`); continue; }
      const { error } = await supabase.from("designers").update(rest).eq("id", id);
      console.log(error ? `FAILED ${rest.name}: ${error.message}` : `restored  ${rest.name}`);
    }
    return;
  }

  let ok = 0;
  for (const r of RENAMES) {
    const patch = {
      name: r.name,
      brand_name: r.name,
      slug: r.slug,
      city: r.city,
      category: r.category,
      price_range: r.price_range,
      followers: r.followers,
      description: r.description,
      instagram_link: r.instagram_link,
      collection_name: r.collection_name,
      profile_image: r.image,
      banner_image: r.image,
      updated_at: new Date().toISOString(),
    };

    if (DRY) { console.log(`would rename  ${r.was.padEnd(18)} -> ${r.name}  (${r.image})`); continue; }

    const { data, error } = await supabase
      .from("designers").update(patch).eq("id", r.id).select("id, name");
    if (error) { console.log(`FAILED  ${r.was} -> ${r.name}: ${error.message}`); continue; }
    if (!data?.length) { console.log(`NO ROW WRITTEN  ${r.was} (row-level security is blocking the update)`); continue; }
    console.log(`renamed  ${r.was.padEnd(18)} -> ${r.name}`);
    ok++;
  }
  if (!DRY) console.log(`\n${ok} of ${RENAMES.length} rows updated.`);
};

run();
