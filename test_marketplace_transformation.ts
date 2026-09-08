import {
  mapCategoryToNewTaxonomy,
  CANONICAL_TAXONOMY,
  normalizeProductColors,
  normalizeProductSizes,
  transformProductToDesignStrict,
} from "./src/lib/adapters/productAdapter.ts";
import { createClient } from "@supabase/supabase-js";

async function runVerification() {
  console.log("=================================================");
  console.log("OGURA MARKETPLACE TRANSFORMATION VERIFICATION");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. CANONICAL TAXONOMY EXACT ORDER
  const expectedTaxonomy = [
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
  ];
  assert(
    JSON.stringify(CANONICAL_TAXONOMY) === JSON.stringify(expectedTaxonomy),
    "Canonical taxonomy matches exact 11-category specified contract and order"
  );

  // 2. CONSERVATIVE TAXONOMY MAPPING & ANTI-CORRUPTION
  assert(mapCategoryToNewTaxonomy("Bridal Lehenga") === "Lehengas", "Maps 'Bridal Lehenga' -> Lehengas");
  assert(mapCategoryToNewTaxonomy("Kanjeevaram Saree") === "Sarees", "Maps 'Kanjeevaram Saree' -> Sarees");
  assert(mapCategoryToNewTaxonomy("Silk Sari") === "Sarees", "Maps 'Silk Sari' -> Sarees");
  assert(mapCategoryToNewTaxonomy("Indo-Western Gown") === "Indo-Western", "Maps 'Indo-Western Gown' -> Indo-Western");
  assert(mapCategoryToNewTaxonomy("Indian Co-ord Sets") === "Indian Co-ords", "Maps 'Indian Co-ord Sets' -> Indian Co-ords");
  assert(mapCategoryToNewTaxonomy("Western Co-ord Sets") === "Western Co-ords", "Maps 'Western Co-ord Sets' -> Western Co-ords");
  assert(mapCategoryToNewTaxonomy("Peplum Tops") === "Tops", "Maps 'Peplum Tops' -> Tops");
  assert(mapCategoryToNewTaxonomy("Flared Pants") === "Bottoms", "Maps 'Flared Pants' -> Bottoms");
  assert(mapCategoryToNewTaxonomy("Jumpsuits") === "Jumpsuits", "Maps 'Jumpsuits' -> Jumpsuits");
  assert(mapCategoryToNewTaxonomy("Envelope Belt Bag") === "Bags", "Maps 'Envelope Belt Bag' -> Bags");
  assert(mapCategoryToNewTaxonomy("Embroidered Juttis") === "Shoes", "Maps 'Embroidered Juttis' -> Shoes");

  // ANTI-CORRUPTION ASSERTIONS: Ambiguous / unknown categories must NOT map to Bags or Western Dresses
  assert(mapCategoryToNewTaxonomy("accessories") === null, "Anti-corruption: 'accessories' does NOT map to Bags");
  assert(mapCategoryToNewTaxonomy("outerwear") === null, "Anti-corruption: 'outerwear' does NOT map to Western Dresses");
  assert(mapCategoryToNewTaxonomy("jewelry") === null, "Anti-corruption: 'jewelry' does NOT map to Bags");
  assert(mapCategoryToNewTaxonomy("belts") === null, "Anti-corruption: 'belts' does NOT map to Bags");
  assert(mapCategoryToNewTaxonomy("unknown_category") === null, "Anti-corruption: 'unknown_category' returns null");

  // 3. AUTHORITATIVE PRICE PRESERVATION
  const productWithAuthoritativePrice = {
    id: "prod-1",
    name: "Pure Silk Saree",
    brand: "Riwaana",
    price: 8450,
    category: "sarees" as any,
    images: ["/test.jpg"],
    sizes: ["Free Size"],
    colors: ["Gold"],
    description: "Handwoven",
    material: "Silk",
    inStock: true,
    tags: [],
    rating: 5,
    reviews: 10,
  };
  const designVM = transformProductToDesignStrict(productWithAuthoritativePrice);
  assert(designVM.price >= 1200 && designVM.price <= 12000, `Preserves bounded catalog price (₹${designVM.price} is in [₹1,200, ₹12,000])`);
  assert(designVM.boutique === "Riwaana", "Preserves atelier brand name 'Riwaana'");
  assert(designVM.category === "Sarees", "Categorizes as 'Sarees'");

  // 4. DATABASE CONNECTIVITY & ATELIER INTEGRATION
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://yudzgkrjsstqbfrrrrly.supabase.co";
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZHpna3Jqc3N0cWJmcnJycmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjI2ODUsImV4cCI6MjA3NzIzODY4NX0.6bqOVgCGyE3UlVcFoHdMQJ3hGhCj-XKtDG2AqC3yp3g";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: dbProducts, error: pErr } = await supabase
    .from("products")
    .select("id, title, brand, price, category, status, is_available")
    .in("status", ["live", "submitted"])
    .eq("is_available", true);

  assert(!pErr && Array.isArray(dbProducts) && dbProducts.length > 0, `Successfully queried live database products (count: ${dbProducts?.length || 0})`);

  const distinctBrands = new Set((dbProducts || []).map((p) => p.brand).filter(Boolean));
  assert(distinctBrands.size >= 20, `Multi-seller diversity confirmed: ${distinctBrands.size} distinct ateliers in catalog`);

  console.log("-------------------------------------------------");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
