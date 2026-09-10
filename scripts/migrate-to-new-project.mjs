/**
 * Imports the exported catalogue into a fresh Supabase project and re-uploads
 * every product image, so Ogura no longer depends on a database it cannot
 * administer.
 *
 * Prerequisites
 *   1. A new project exists in YOUR Supabase account (region: Mumbai).
 *   2. The schema is applied — run every file in supabase/migrations in order
 *      via the SQL editor, or `supabase db push` once the CLI is linked.
 *   3. .env.local contains, for the NEW project:
 *        NEW_SUPABASE_URL=https://<ref>.supabase.co
 *        NEW_SUPABASE_SERVICE_ROLE_KEY=<service role key>
 *      The service key bypasses RLS, which the import needs. It is a real
 *      secret: keep it in .env.local, which is gitignored.
 *
 * Usage
 *   node scripts/migrate-to-new-project.mjs --dry     inspect, write nothing
 *   node scripts/migrate-to-new-project.mjs           import data
 *   node scripts/migrate-to-new-project.mjs --images  also re-upload images
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const DO_IMAGES = process.argv.includes("--images");

const env = Object.fromEntries(
  (existsSync(join(root, ".env.local")) ? readFileSync(join(root, ".env.local"), "utf8") : "")
    .split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);

const URL = env.NEW_SUPABASE_URL;
const KEY = env.NEW_SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEW_SUPABASE_URL / NEW_SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
console.log(`Target: ${URL}\n`);
const db = createClient(URL, KEY, { auth: { persistSession: false } });

// Order matters: parents before children.
const TABLES = ["categories", "designers", "sellers", "products", "product_variants"];

const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

const importTable = async (name) => {
  const path = join(root, "export", `${name}.json`);
  if (!existsSync(path)) return console.log(`  ${name.padEnd(18)} no export file, skipped`);
  const rows = JSON.parse(readFileSync(path, "utf8"));
  if (!rows.length) return console.log(`  ${name.padEnd(18)} 0 rows`);
  if (DRY) return console.log(`  ${name.padEnd(18)} would insert ${rows.length}`);

  let done = 0, failed = 0;
  for (const batch of chunk(rows, 500)) {
    const { error } = await db.from(name).upsert(batch, { onConflict: "id" });
    if (error) { failed += batch.length; console.log(`    ! ${name}: ${error.message}`); }
    else done += batch.length;
  }
  console.log(`  ${name.padEnd(18)} ${done} imported${failed ? `, ${failed} failed` : ""}`);
};

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const uploadImages = async () => {
  const base = join(root, "export", "images");
  if (!existsSync(base)) return console.log("  no images/ directory, skipped");
  const files = walk(base);
  console.log(`\nImages: ${files.length} files`);
  if (DRY) return;

  // Keep the same object keys, so exported product rows keep working after we
  // rewrite only the hostname.
  let ok = 0, bad = 0;
  for (const f of files) {
    const key = relative(base, f);
    const { error } = await db.storage.from("product-images")
      .upload(key, readFileSync(f), { upsert: true, contentType: "image/jpeg" });
    if (error) { bad++; if (bad < 4) console.log(`    ! ${key}: ${error.message}`); }
    else { ok++; if (ok % 50 === 0) process.stdout.write(`    ${ok}/${files.length}\r`); }
  }
  console.log(`  uploaded ${ok}/${files.length}${bad ? `, ${bad} failed` : ""}`);
};

console.log(DRY ? "DRY RUN — nothing will be written\n" : "Importing…\n");
for (const t of TABLES) await importTable(t);
if (DO_IMAGES) await uploadImages();
console.log("\nDone. Next: point VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY at the new project in Vercel, redeploy, and verify before retiring the old one.");
