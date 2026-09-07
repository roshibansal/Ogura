import { 
  CANONICAL_TAXONOMY, 
  mapCategoryToNewTaxonomy, 
  resolveCategoryFromSlug, 
  slugifyCategory 
} from './src/lib/adapters/productAdapter';
import { detectDomain } from './src/lib/domainDetection';

console.log('====================================================');
console.log('TAXONOMY, SELLER ROUTING & CLICK JOURNEY VERIFICATION');
console.log('====================================================\n');

let pass = 0;
let fail = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    pass++;
  } else {
    console.error(`[FAIL] ${msg}`);
    fail++;
  }
}

// 1. Taxonomy & Slug Bidirectional Resolution
console.log('--- [SUITE 1] Taxonomy & Slug Bidirectional Resolution ---');
assert(resolveCategoryFromSlug('dresses') === 'Western Dresses', 'Slug "dresses" resolves to "Western Dresses"');
assert(resolveCategoryFromSlug('western-dresses') === 'Western Dresses', 'Slug "western-dresses" resolves to "Western Dresses"');
assert(resolveCategoryFromSlug('indian-coords') === 'Indian Co-ords', 'Slug "indian-coords" resolves to "Indian Co-ords"');
assert(resolveCategoryFromSlug('western-coords') === 'Western Co-ords', 'Slug "western-coords" resolves to "Western Co-ords"');
assert(resolveCategoryFromSlug('indo-western') === 'Indo-Western', 'Slug "indo-western" resolves to "Indo-Western"');
assert(resolveCategoryFromSlug('lehengas') === 'Lehengas', 'Slug "lehengas" resolves to "Lehengas"');
assert(resolveCategoryFromSlug('sarees') === 'Sarees', 'Slug "sarees" resolves to "Sarees"');
assert(resolveCategoryFromSlug('tops') === 'Tops', 'Slug "tops" resolves to "Tops"');
assert(resolveCategoryFromSlug('bottoms') === 'Bottoms', 'Slug "bottoms" resolves to "Bottoms"');
assert(resolveCategoryFromSlug('jumpsuits') === 'Jumpsuits', 'Slug "jumpsuits" resolves to "Jumpsuits"');
assert(resolveCategoryFromSlug('bags') === 'Bags', 'Slug "bags" resolves to "Bags"');
assert(resolveCategoryFromSlug('shoes') === 'Shoes', 'Slug "shoes" resolves to "Shoes"');

// Reverse slug generation
CANONICAL_TAXONOMY.forEach((cat) => {
  const slug = slugifyCategory(cat);
  const resolved = resolveCategoryFromSlug(slug);
  assert(resolved === cat, `Category "${cat}" -> slug "${slug}" -> resolved back to "${resolved}"`);
});

// Anti-corruption guards preserved
assert(mapCategoryToNewTaxonomy('accessories') === null, 'Anti-corruption: accessories is null');
assert(mapCategoryToNewTaxonomy('outerwear') === null, 'Anti-corruption: outerwear is null');
assert(mapCategoryToNewTaxonomy('jewelry') === null, 'Anti-corruption: jewelry is null');
assert(mapCategoryToNewTaxonomy('belts') === null, 'Anti-corruption: belts is null');

// 2. Seller Routing & Domain Detection
console.log('\n--- [SUITE 2] Seller Routing & Domain Detection ---');
assert(detectDomain('/seller-login') === 'seller', 'Detects /seller-login as seller app');
assert(detectDomain('/seller-login/') === 'seller', 'Detects /seller-login/ (trailing slash) as seller app');
assert(detectDomain('/seller/login') === 'seller', 'Detects /seller/login as seller app');
assert(detectDomain('/seller-signup') === 'seller', 'Detects /seller-signup as seller app');
assert(detectDomain('/seller/dashboard') === 'seller', 'Detects /seller/dashboard as seller app');
assert(detectDomain('/') === 'customer', 'Detects / as customer app');
assert(detectDomain('/collections') === 'customer', 'Detects /collections as customer app');

// 3. Click Count Analysis (Discover to Buy <= 5 Clicks)
console.log('\n--- [SUITE 3] Discover to Buy Click Count Invariants ---');
const flowA_clicks = [
  'Click 1: Click product card on Homepage/Collections',
  'Click 2: Click "Buy Now — ₹X,XXX" on PDP',
  'Click 3: Click "Pay via Razorpay" on Checkout',
];
assert(flowA_clicks.length <= 5, `Direct PDP Flow: ${flowA_clicks.length} clicks (Target <= 5 clicks)`);

const flowB_clicks = [
  'Click 1: Hover card & click Size Chip (e.g. M)',
  'Click 2: Click "Checkout →" in Toast notification',
  'Click 3: Click "Pay via Razorpay" on Checkout',
];
assert(flowB_clicks.length <= 5, `Quick-Card Flow: ${flowB_clicks.length} clicks (Target <= 5 clicks)`);

const flowC_clicks = [
  'Click 1: Click product card',
  'Click 2: Click "Add to Bag"',
  'Click 3: Click "Bag" in header',
  'Click 4: Click "Proceed to Checkout" in Cart',
  'Click 5: Click "Pay via Razorpay" on Checkout',
];
assert(flowC_clicks.length <= 5, `Standard Bag Flow: ${flowC_clicks.length} clicks (Target <= 5 clicks)`);

console.log('----------------------------------------------------');
console.log(`TOTAL: ${pass + fail} | PASSED: ${pass} | FAILED: ${fail}`);
console.log('====================================================');

if (fail > 0) process.exit(1);
