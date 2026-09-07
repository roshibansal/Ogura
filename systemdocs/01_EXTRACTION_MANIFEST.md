# 01 — EXTRACTION MANIFEST
### OGURA — Forensic File & System Inventory

**Method:** Static extraction from source tree (`/tmp/extract/files.txt`), live DB introspection (`/tmp/extract/db.txt`), and call-site grep (`/tmp/extract/code.txt`), cross-checked against actual file reads. `structure.md` (repo root) was read and used only as lowest-priority, possibly-stale evidence; disagreements are flagged `[CONFLICT]`.

**Project:** Vite/React SPA named `vite_react_shadcn_ts` in `package.json` (`[OBSERVED]` — the internal package name does not say "ogura", confirming this is a generic Lovable/shadcn scaffold customized for the OGURA brand). Supabase/Lovable Cloud project ref `yudzgkrjsstqbfrrrrly` (`supabase/config.toml`) — `[CONFLICT]`: `structure.md` claims live product data comes from `https://pyesltzkemtranachpne.supabase.co/functions/v1/products`, a **different** project ref than the one configured in this repo (`yudzgkrjsstqbfrrrrly`). This is either a stale doc reference or a second, undocumented backend project — flagged `[SECURITY-SENSITIVE]` / `[CONFLICT]` for follow-up.

Total files inventoried: **393** (`find`-based count from `/tmp/extract/files.txt`, includes node_modules-excluded project tree).

---

## GROUP 1 — Application Source (root/bootstrap)

| Path | Type | Purpose | Layer | Imports | Imported by | Exports | Routes | DB objects | Edge fns | External | Env vars | Sec-sensitive | Prod-critical | Dead? | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `src/main.tsx` | TS entry | React root mount (`createRoot`) | frontend | `App.tsx`, `index.css` | `index.html` | none (side-effect) | all | — | — | — | — | No | Yes | No | CONFIRMED |
| `src/App.tsx` | TS component | Top-level provider stack + domain router (`detectDomain()` → `CustomerApp`/`SellerApp`/`AdminApp`) | frontend | contexts (Auth/Location/Cart/Filter/Wishlist), `apps/*`, `lib/domainDetection` | `main.tsx` | `App` (default) | all | — | — | — | — | No | Yes | No | CONFIRMED |
| `src/apps/CustomerApp.tsx` | TS component | All 30+ consumer marketplace routes | frontend | `pages/*`, layouts, `ProtectedRoute` | `App.tsx` (conditionally) | `CustomerApp` | see Group 4 | — | — | — | — | No | Yes | No | CONFIRMED |
| `src/apps/SellerApp.tsx` | TS component | Seller portal routes (public + authed dashboard) | frontend | `pages/seller/*`, `SellerAuthRoute`, layouts | `App.tsx` | `SellerApp` | `/seller*` | — | — | — | — | No | Yes | No | CONFIRMED |
| `src/apps/AdminApp.tsx` | TS component | Admin routes, role-gated | frontend | `pages/admin/*`, `RoleProtectedRoute`, `AdminDashboardLayout` | `App.tsx` | `AdminApp` | `/admin*` | `user_roles` (via `has_role`) | — | — | — | Yes | Yes | No | CONFIRMED |
| `src/App.css`, `src/index.css` | CSS | Global styles, OGURA design tokens/brand colors, "museum" cinematic utility classes | frontend/asset | Tailwind | all components | — | — | — | — | — | — | No | Yes | No | CONFIRMED |
| `index.html` | HTML | SPA shell, SEO/OpenGraph meta | config/asset | `main.tsx` (script tag) | browser | — | — | — | — | — | — | No | Yes | No | CONFIRMED |

## GROUP 2 — Components (`src/components/**`, excl. `ui/`)

~95 files. Notable groupings and flags (full path list in file tree; each is a presentational/feature React component, layer=frontend):

- **Marketplace UI**: `Header.tsx`, `LuxuryHeader.tsx`, `Footer.tsx`, `LuxuryFooter.tsx`, `MegaMenu.tsx`, `MegaMenuMobile.tsx`, `NykaaStyleMegaMenu.tsx`, `Hero.tsx`, `LuxuryHero.tsx`, `CinematicHeroBanner.tsx`, `FullScreenHeroCarousel.tsx`, `HeroCarousels.tsx` — `[OBSERVED]` **duplicate/parallel header & hero implementations** (see "Duplicate Implementations" below). Imported by `pages/Index.tsx`, `layouts/CustomerLayout.tsx`.
- **Category/PLP**: `CategoryShowcase.tsx`, `PLPFilterSidebar.tsx`, `PLPProductCard.tsx`, `PLPProductGrid.tsx`, `PLPSortDropdown.tsx`, `Premium3DCategorySection.tsx`, `RoundCategoryCard.tsx`, `RoundCategorySection.tsx`, `ShopByCategory.tsx`. Consumed on `Collections.tsx`, `CategoryPage.tsx`.
- **Designer/Brand**: `DesignerCard.tsx`, `DesignerFilters.tsx`, `DesignerGallery.tsx`, `DesignerProductCard.tsx`, `DesignerProductFilters.tsx`, `DesignerProductGrid.tsx`, `DesignersSpotlight.tsx`, `AzaDesignerCard.tsx`, `AzaDesignerCarousel.tsx`, `FeaturedBrands.tsx`, `LuxuryBrands.tsx`. DB: `designers`, `products` tables via hooks.
- **Made-to-Order** (`src/components/made-to-order/*`, 7 files + `index.ts`): MTO wizard steps; state via `MadeToOrderContext`; no DB persistence found (`[OBSERVED]` — appears UI-only / not wired to a table; no matching migration for MTO orders).
- **Search / Algolia** (`src/components/search/*`, 10 files + `index.ts`): wraps `react-instantsearch`; external service Algolia; config in `src/lib/algoliaClient.ts`. `[SECURITY-SENSITIVE]`: Algolia **search key** is expected client-side (not confirmed present in repo grep of `.env`; the admin key is server-side only in `sync-algolia` edge function — correct separation `[CONFIRMED]`).
- **Seller dashboard "shadow" components** (`src/components/seller-dashboard/**`: `DashboardSidebar.tsx`, `DashboardHeader.tsx`, `SellerDashboardShowcase.tsx`, and 14 files under `pages/` — `DashboardAddProduct/Analytics/Collections/Content/Customers/Discounts/GiftCards/Home/Inventory/Marketing/Markets/Orders/Products/Settings/Transfers.tsx`): **`[OBSERVED]` CONFIRMED ORPHANED** — `rg` for these paths outside their own folder returns **zero references** from any route file (`App.tsx`, `apps/SellerApp.tsx`, `apps/AdminApp.tsx`) or any other page. The routed seller dashboard actually used in production is `src/pages/seller/*` (Group 3). This entire subtree is dead code, contains hardcoded `DEV_SELLER_ID` (see Security section), and duplicates the live seller dashboard's purpose. Flagged **[SECURITY-SENSITIVE]** and **dead: Yes**.
- **Try-on / AI**: `VirtualTryOn.tsx`, `VirtualTryOnDialog.tsx`, `TryOnHistory.tsx`, `TryOnResult.tsx`, `ModelGallery.tsx`, `ModelPresetSelector.tsx`, `ModelSearchFilter.tsx`, `ImageUploadZone.tsx`, `ImageSearchDialog.tsx`. Calls edge fn `virtual-tryon`; writes `tryon_history` table; storage bucket `tryon-images`.
- **Pinterest**: `ConnectPinterestButton.tsx`, `PinterestBoardModal.tsx`, `UserPinterestBoards.tsx`, `SaveToPinterestButton.tsx`, `PinterestInspiredSection.tsx`. Uses `src/data/pinterestMockData.ts` (`[OBSERVED]` mock data file, not live Pinterest API data for board contents) + edge fn `pinterest-token-exchange`. `localStorage` token storage `[SECURITY-SENSITIVE]` (OAuth token kept client-side in plain localStorage, not httpOnly).
- **Location**: `HeaderLocationIndicator.tsx`, `LocationPermissionModal.tsx`, `ManualLocationSelector.tsx`, `DeliveryChecker.tsx`, `StoreLocator.tsx`, `LuxuryStoreLocator.tsx`. Uses `LocationContext`, edge fns `ip-geolocation`, `pincode-lookup`, table `delivery_zones`.
- **Auth** (`src/components/auth/*`): `GoogleSignInButton.tsx`, `ProtectedRoute.tsx`, `RoleProtectedRoute.tsx`, `SellerAuthRoute.tsx`, `UserMenu.tsx` — route guards, layer=frontend/auth, security-sensitive: Yes, production-critical: Yes.
- **Misc marketing/CMS-style sections**: `AIStylistCTA`, `CertificateSection`, `FeaturedCollections`, `FreshDrops`, `FullWidthImageSection`, `GameSpot`, `GiftCardSection`, `HiddenGemsSection`, `HoliDhamakaSale`, `InstagramModelsBanner`, `LoveOguraSection`, `LuxuryGiftCard`, `LuxuryTrustBadges`, `PinterestInspiredSection`, `RewardCard`, `RewardGame`, `SizeGuideModal`, `SocialShareButtons`, `Spline3DBackground`, `Welcome.tsx` — mostly static/marketing components with hardcoded copy, images, and several hardcoded external URLs (see "Hardcoded URLs").
- **join-us / launch-studio / category / made-to-order / luxury3d subfolders**: themed component groups for `/join`, `/seller-program` (LaunchStudio), category pages, and 3D parallax/tilt effects (`ParallaxLayer.tsx`, `Tilt3D.tsx`).
- `LaunchStudio.tsx` (root of components) vs `src/components/launch-studio/*` (5 files: `LaunchStudioCTA/Features/Hero/Testimonials/Timeline.tsx`) — **possible duplicate/legacy naming overlap** `[OBSERVED]`, needs confirmation which is live on `/seller-program` (`BrandWaitlist.tsx` page).

## GROUP 2b — shadcn/ui primitives (`src/components/ui/*`) — grouped entry

**~46 files**, all vendor-generated shadcn/Radix wrapper components, layer=frontend, imported project-wide, production-critical (foundational), not dead, confidence CONFIRMED:
`accordion.tsx, alert-dialog.tsx, alert.tsx, aspect-ratio.tsx, avatar.tsx, badge.tsx, breadcrumb.tsx, button.tsx, calendar.tsx, card.tsx, carousel.tsx, chart.tsx, checkbox.tsx, collapsible.tsx, command.tsx, context-menu.tsx, dialog.tsx, drawer.tsx, dropdown-menu.tsx, form.tsx, hover-card.tsx, input-otp.tsx, input.tsx, label.tsx, menubar.tsx, navigation-menu.tsx, pagination.tsx, popover.tsx, progress.tsx, radio-group.tsx, resizable.tsx, scroll-area.tsx, select.tsx, separator.tsx, sheet.tsx, sidebar.tsx, skeleton.tsx, slider.tsx, sonner.tsx, switch.tsx, table.tsx, tabs.tsx, textarea.tsx, toast.tsx, toaster.tsx, toggle-group.tsx, toggle.tsx, tooltip.tsx, use-toast.ts`.
No DB/edge-fn/env references. Not customized beyond shadcn defaults (spot-checked `button.tsx`, `sidebar.tsx`). Non-security-sensitive.

## GROUP 3 — Pages (`src/pages/**`)

~45 page files. Layer=frontend, each maps 1:1 to a route in Group 4. Selected notable entries:

| Path | Purpose | DB objects | Edge fns | Sec-sensitive | Confidence |
|---|---|---|---|---|---|
| `src/pages/Index.tsx` | Home page, composes ~15 marketing sections | `designers`, `products` (via child components) | — | No | CONFIRMED |
| `src/pages/Login.tsx` | Email/password + Google OAuth login | `auth.users` | — | Yes | CONFIRMED |
| `src/pages/Checkout.tsx` (504 lines per structure.md) | Cart→payment flow, Razorpay | `orders`, `order_items`, `user_addresses` | `razorpay-create-order`, `razorpay-verify-payment` | **Yes (payment)** | CONFIRMED |
| `src/pages/OrderConfirmation.tsx` | Post-payment confirmation | `orders` | — | No | CONFIRMED |
| `src/pages/ProductDetail.tsx` (681 lines) | PDP: gallery, variants, try-on, recommendations | `products`, `product_variants` | `ai-recommendations`, `virtual-tryon` | No | CONFIRMED |
| `src/pages/JoinUs.tsx` | Seller application intake (gated) | `seller_applications` | storage `product-images` | Yes (PII: phone/email) | CONFIRMED |
| `src/pages/SellerApply.tsx` | Standalone seller application form | `seller_applications` | storage `product-images` | Yes (PII) | CONFIRMED |
| `src/pages/BrandWaitlist.tsx` | "seller-program" waitlist / Launch Studio landing | `brand_waitlist_applications` | — | Yes (PII: phone) | CONFIRMED |
| `src/pages/OAuthConsent.tsx` | `/.lovable/oauth/consent` — MCP OAuth 2.1 consent screen | `auth.users`/session | uses `supabase.auth.oauth` (beta API, type-cast `as unknown`) | **Yes** | CONFIRMED — `[SECURITY-SENSITIVE]` beta/undocumented Supabase auth surface |
| `src/pages/PinterestCallback.tsx` | `/auth/pinterest/callback` | — | `pinterest-token-exchange` | Yes (stores token in localStorage) | CONFIRMED |
| `src/pages/admin/AdminLogin.tsx` | Admin login (path `/admin`, `/admin/login`) | `auth.users`, `user_roles` | — | **Yes** | CONFIRMED |
| `src/pages/admin/AdminApprovals.tsx` | Approve/reject seller applications & products | `seller_applications`, `sellers`, `products` | — | Yes | CONFIRMED |
| `src/pages/admin/AdminProducts.tsx`, `AdminSellers.tsx`, `AdminSettings.tsx`, `AdminDashboardHome.tsx` | Admin CRUD/oversight screens | `products`, `sellers`, `vendors` | — | Yes | CONFIRMED |
| `src/pages/seller/SellerAddProduct.tsx` | **Live** product-creation form (routed) | `products` insert, storage `product-images` upload | — | Yes (own-data) | CONFIRMED |
| `src/pages/seller/SellerProducts.tsx`, `SellerOrders.tsx`, `SellerSettings.tsx`, `SellerDashboardHome.tsx`, `SellerLanding.tsx`, `SellerLogin.tsx`, `SellerSignup.tsx` | Live seller portal pages | `sellers`, `products`, `orders` | — | Yes | CONFIRMED |
| `src/pages/Careers.tsx` (931 lines) | Static careers content + apply form (mailto `careers@ogura.in`) | none (form likely local/mailto, no `supabase.from` call found) | — | No | CONFIRMED — `[OBSERVED]` no backend persistence for careers applications, likely mailto-only |
| `src/pages/Contact.tsx`, `PrivacyPolicy.tsx`, `TermsOfUse.tsx` | Static legal/marketing content | — | — | No | CONFIRMED |
| `src/pages/NotFound.tsx` | Catch-all 404 | — | — | No | CONFIRMED |
| `src/pages/Onboarding.tsx`, `Dashboard.tsx`, `Profile.tsx`, `Wishlist.tsx`, `Cart.tsx` | Protected customer account pages | `profiles`, `user_addresses` | — | Yes | CONFIRMED |
| `src/pages/Designers.tsx`, `DesignerDetail.tsx`, `DesignerProfilePage.tsx` | Designer discovery/profile | `designers`, `products` (realtime subscription per structure.md) | — | No | CONFIRMED |
| `src/pages/Brands.tsx`, `BrandDetail.tsx`, `BrandStore.tsx` | Brand/vendor discovery | `vendors` | — | No | CONFIRMED |
| `src/pages/Collections.tsx`, `CategoryPage.tsx`, `Occasions.tsx`, `OccasionDetail.tsx`, `Search.tsx`, `Stores.tsx` | Catalog browse/search | `products`, `categories`, Algolia index (external) | — | No | CONFIRMED |
| `src/pages/MadeToOrderPage.tsx` | MTO wizard host | none confirmed | — | No | CONFIRMED |

## GROUP 4 — Routes

Total distinct routes discovered: **CustomerApp 30**, **SellerApp 11** (2 paths overlap with CustomerApp: `/join`), **AdminApp 7**. Grand total unique route entries: **~47** (some are redirects/aliases). Full list machine-extracted from `src/apps/*.tsx`:

- CustomerApp: `/`, `/login`, `/collections`, `/collections/:category`, `/product/:id`, `/brands`, `/store/:slug`, `/brand/:slug`, `/brands/:brandId`, `/designers`, `/designers/:designerId`, `/designer/:slug`, `/occasions`, `/occasions/:occasionId`, `/stores`, `/search`, `/category/:slug`, `/join`, `/join/apply`, `/privacy`, `/terms`, `/contact`, `/careers`, `/seller-program`, `/waitlist`→redirect `/seller-program`, `/apply-to-join`→redirect `/seller-program`, `/auth/pinterest/callback`, `/.lovable/oauth/consent`, `/dashboard` (protected), `/onboarding` (protected), `/profile` (protected), `/wishlist` (protected), `/cart` (protected), `/checkout` (protected), `/order-confirmation` (protected), `*`→`NotFound`.
- SellerApp: `/join`, `/seller`, `/seller/join`, `/seller-login`, `/seller-signup`, `/seller/login`, `/seller/dashboard` (auth), `/seller/products` (auth), `/seller/products/new` (auth), `/seller/orders` (auth), `/seller/settings` (auth), `/seller/*`→`SellerLanding` fallback.
- AdminApp: `/admin`, `/admin/login`, `/admin/dashboard` (role=admin), `/admin/approvals` (role=admin), `/admin/products` (role=admin), `/admin/sellers` (role=admin), `/admin/settings` (role=admin), `/admin/*`→`AdminLogin` fallback.

**Which app renders depends on `detectDomain()`** (`src/lib/domainDetection.ts`), evaluated once per page load in `App.tsx` — see Architecture doc for full flow. `[OBSERVED]`: because only one of the three `*App.tsx` route trees is ever mounted per request, the **customer-domain build never mounts `/admin` or `/seller/*` routes** and vice-versa — i.e., hitting `ogura.in/admin` in production (no `admin.` subdomain) falls through to `CustomerApp`'s catch-all `NotFound`, not `AdminLogin`. This is `[INFERRED]` from code; only true if hosting is actually split by subdomain in production (unverifiable from repo alone) → `[UNKNOWN]` for production DNS/hosting config.

**Hidden/undocumented routes**: `/.lovable/oauth/consent` (MCP OAuth consent screen, not linked from any nav) — `[OBSERVED]` hidden route. `/waitlist` and `/apply-to-join` are silent redirects to `/seller-program` — legacy URL compatibility shims (`[OBSERVED]`).

**Hidden admin routes**: none beyond the documented `/admin/*` set found; no separate "super admin" or debug route detected in `AdminApp.tsx`.

## GROUP 5 — Hooks (`src/hooks/*`)

| File | Purpose | DB/external | Prod-critical | Dead? |
|---|---|---|---|---|
| `use-mobile.tsx` | Responsive breakpoint detection | — | Yes | No |
| `use-toast.ts` | Toast state (shadcn pattern, duplicate of `components/ui/use-toast.ts`) | — | Yes | No — `[OBSERVED]` **near-identical duplicate** of `src/components/ui/use-toast.ts` (standard shadcn re-export pattern, not a bug) |
| `useBrandStores.ts` | Fetch brand/store list | `vendors`/`stores` data | Medium | No |
| `useDesignerBySlug.ts` | Fetch single designer by slug | `designers` | Yes | No |
| `useDesignerProducts.ts` | Fetch products for a designer | `products` | Yes | No |
| `useDesigners.ts` | List/search designers, realtime | `designers` (Supabase realtime channel per structure.md) | Yes | No |
| `useGsapReveal.ts`, `useScrollAnimation.ts`, `useLenis.ts` | Animation/scroll utilities (GSAP/Lenis) | — | Cosmetic | No |
| `useRecommendations.ts` | Wraps `recommendationService` for AI recs | edge fn `ai-recommendations`/`image-analysis` | Medium | No |
| `useUserRole.ts` | Reads current user's role | `user_roles` table via `has_role`/select | **Yes (authz)** | No |
| `useVirtualTryOn.ts` | Orchestrates try-on upload+generation | storage `tryon-images`, edge fn `virtual-tryon` | Medium | No |

## GROUP 6 — Utilities (`src/lib/*`, `src/data/*`, `src/types/*`)

- `src/lib/utils.ts` — `cn()` classnames helper. Frontend, no external deps beyond `clsx`/`tailwind-merge`.
- `src/lib/domainDetection.ts` — hostname/path → app-surface routing logic (core to multi-tenant architecture). **Production-critical**, security-relevant (drives which route tree — and therefore which auth guards — are active).
- `src/lib/brandStores.ts` — static/derived brand→store mapping; contains at least one hardcoded external URL.
- `src/lib/algoliaClient.ts` — Algolia client init; external service Algolia; expects a public search-only API key via config (needs confirmation of key exposure — see Security).
- `src/lib/mcp/index.ts`, `src/lib/mcp/supabase.ts`, `src/lib/mcp/tools/{get-product,list-my-orders,search-products}.ts` — **Model Context Protocol (MCP) server tool definitions** exposed via edge function `supabase/functions/mcp/index.ts`; lets an external AI/LLM client query products/orders through defined tools. Uses `VITE_SUPABASE_PROJECT_ID` env var. `[SECURITY-SENSITIVE]` — exposes DB-backed tools to external MCP clients; scope of `list-my-orders` depends on RLS + auth passthrough (needs verification it can't leak cross-user orders).
- `src/data/*.ts` (9 files: `brands.ts`, `indianLocations.ts`, `menuData.ts`, `modelPresets.ts`, `occasions.ts`, `oguraCategories.ts`, `pinterestMockData.ts`, `products.ts`, `stores.ts`) — **static/mock seed data compiled into the frontend bundle**, not fetched from DB. `oguraCategories.ts` and `products.ts` contain many hardcoded `https://` image URLs (likely Unsplash/CDN placeholders). `pinterestMockData.ts` is explicit mock data (`mock_access_token_xyz` string found in code, see below). `[OBSERVED]` risk: any of these could be stale/placeholder content shipped to production if not fully replaced by live DB-backed calls in `Index.tsx`/`Collections.tsx`.
- `src/types/index.ts` — shared TS types (frontend-only, not DB-generated).
- `src/integrations/supabase/types.ts` — **auto-generated Supabase types** (Do-not-edit banner expected), source of truth for DB shape as seen by the frontend.
- `src/integrations/supabase/previewAuthStorage.ts` — custom `storage` adapter for `supabase.auth`: brokers session via `postMessage` to a parent frame when running inside the Lovable preview iframe, else falls back to `localStorage`. Contains hardcoded `https://`/`http://` origin checks. **Security-sensitive** (session token bridging across frame boundary — must trust `event.origin`; needs confirmation origin is validated, not just presence-checked).
- `src/integrations/lovable/index.ts` — thin wrapper around `@lovable.dev/cloud-auth-js` OAuth (`signInWithOAuth`) that calls `supabase.auth.setSession()`.

## GROUP 7 — Services (`src/services/*`)

| File | Purpose | Edge fns invoked | Prod-critical |
|---|---|---|---|
| `src/services/recommendationService.ts` | Client wrapper calling `ai-recommendations` (4 call sites: e.g. trending/personalized/similar) and `image-analysis` | `ai-recommendations`, `image-analysis` | Medium |
| `src/services/socialPostService.ts` | Invokes `social-post-webhook` edge fn | `social-post-webhook` | Low/Medium — feeds external Make.com webhook |

## GROUP 8 — API / Server Functions

No custom Node/Express API server exists in this repo — `[CONFIRMED]` (no `api/`, `server/` dir in tree). All server-side logic lives in **Supabase Edge Functions** (Group 9) and Postgres functions (Group 11).

## GROUP 9 — Edge Functions (`supabase/functions/*`, Deno runtime)

| Function | Lines | Purpose | Auth (verify_jwt) | Secrets used | External calls | Prod-critical | Sec-sensitive |
|---|---|---|---|---|---|---|---|
| `ai-recommendations` | 172 | Generates product recommendations via LLM | `false` (public) | `LOVABLE_API_KEY` | Lovable AI gateway | Medium | Yes (API key server-side, correct) |
| `generate-banner-image` | 87 | AI-generates marketing banner images | `false` (public) | `LOVABLE_API_KEY` | Lovable AI gateway | Low | Yes |
| `image-analysis` | 189 | Analyzes uploaded image (style/keyword extraction) | `false` (public) | `LOVABLE_API_KEY` | Lovable AI gateway | Medium | Yes |
| `ip-geolocation` | 86 | IP→location lookup for `LocationContext` | not in verify_jwt list → default (likely `true`, i.e. JWT required) — `[UNKNOWN]`, not explicitly listed in `config.toml`, confirm default policy | none listed | external geo-IP API (unspecified) | Medium | No |
| `mcp` | 167 | MCP protocol endpoint exposing `get-product`/`list-my-orders`/`search-products` tools to external AI clients | not listed → default | Supabase service creds (implicit via client) | none external | Medium | **Yes** — exposes order data via tool interface |
| `pincode-lookup` | 96 | India pincode → city/state/deliverability | `false` (public) | none listed | none/DB `delivery_zones` | Medium | No |
| `pinterest-token-exchange` | 74 | OAuth code→token exchange for Pinterest | not listed → default | `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET` | Pinterest OAuth API | Low | **Yes** (OAuth secret) |
| `razorpay-create-order` | 88 | Creates Razorpay payment order | `false` (public) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay API | **Yes (payments)** | **Yes** |
| `razorpay-verify-payment` | 173 | Verifies Razorpay payment signature, writes order | `false` (public) | `RAZORPAY_KEY_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Razorpay API, own DB (service role) | **Yes (payments)** | **Yes — uses service-role key, bypasses RLS** |
| `send-otp` | 114 | Sends phone OTP | not listed → default | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | SMS provider (unspecified), `otp_verifications` table (service role) | Medium | **Yes — service role** |
| `social-post-webhook` | 143 | Forwards social post events to Make.com | not listed → default | `MAKE_WEBHOOK_URL` | Make.com webhook | Low | Yes (webhook URL) |
| `sync-algolia` | 749 (largest fn) | Syncs `products`/`designers` etc. into Algolia index | `false` (public) | `ALGOLIA_ADMIN_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Algolia Admin API, own DB (service role) | **Yes (search)** | **Yes — Algolia admin key + service role** |
| `verify-otp` | 249 | Verifies phone OTP | not listed → default | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `otp_verifications` (service role) | Medium | **Yes — service role** |
| `virtual-tryon` | 186 | AI virtual try-on image generation | `false` (public) | `HUGGINGFACE_API_TOKEN` | HuggingFace inference API | Medium | Yes |

**Total edge functions: 14.** Functions explicitly set `verify_jwt = false` in `supabase/config.toml` for 9 of 14 — `[SECURITY-SENSITIVE]`: these are callable **without a valid Supabase JWT**, relying entirely on function-internal logic (and, for payment/OTP/algolia-sync functions, on the service-role key) for authorization. This is a broad public-invoke surface that should be reviewed; `[CONFLICT]` risk if any of these were intended to be authenticated-only. `otp_verifications`, `send-otp`, `verify-otp`, `mcp`, `pinterest-token-exchange`, `ip-geolocation` are **not listed** in `config.toml` at all, meaning they use the Supabase default (`[UNKNOWN]` whether that default is enforce-JWT or not without reading full config.toml, which was fully captured above and shows no other functions — so absence = platform default, typically `verify_jwt = true`).

## GROUP 10 — Database Migrations (`supabase/migrations/*.sql`)

**22 migration files**, timestamped `20251029` through `20260825` (naming suggests a mix of real dates and possibly synthetic/future-dated Lovable migration IDs — `[OBSERVED]`, not confirmed abnormal for this tooling). Full list:
`20251029101910`, `20251108170146`, `20251108171434`, `20251211092040`, `20251211092119`, `20251212075100`, `20251212124604`, `20251217071727`, `20251217075745`, `20251217080535`, `20260121042744`, `20260121081121`, `20260121083507`, `20260202040833`, `20260302172357`, `20260308082844`, `20260308084904`, `20260312041856`, `20260312043128`, `20260312043705`, `20260312045754`, `20260410080906`, `20260611080139`, `20260825124543` (24 files by filename count; grouped here as one manifest entry per naming convention — exact per-file diff content not individually re-read; schema below is the **resulting live state**, source of truth per instructions).

## GROUP 11 — SQL / DB Functions

`has_role(auth.uid(), 'admin'::app_role)` — Postgres function used pervasively across RLS policies (`designers`, `products`, `sellers`, `vendors`, `seller_applications`, `brand_waitlist_applications`, `influencer_videos`, `user_roles`). `[CONFIRMED]` used, `[INFERRED]` implementation (likely `SECURITY DEFINER` function checking `user_roles` table — standard Lovable/Supabase pattern) — not independently re-verified by reading function body in this pass; flag `[UNKNOWN]` for exact SQL body/search_path hardening.

## GROUP 12 — Auth

- **Provider:** Supabase Auth (`auth.users`), email/password + Google OAuth (via `@lovable.dev/cloud-auth-js` / `GoogleSignInButton.tsx`).
- **Session storage:** custom `brokeredPreviewStorage()` (localStorage + preview-iframe postMessage bridge) — see Group 6.
- **Role model:** separate `user_roles` table with `USER-DEFINED` (`app_role` enum) column, unique `(user_id, role)`; NOT embedded in `profiles`. Roles referenced in code: `admin` (`RoleProtectedRoute requiredRole="admin"`); seller identity uses a **separate `sellers` table** keyed by `user_id`, not a role — i.e., "seller" is a business record, not an `app_role` value `[OBSERVED]`, `[CONFIRMED]` from schema (`sellers.user_id` FK) + `AdminApp.tsx` (`requiredRole="admin"` only).
- **Guards:** `ProtectedRoute.tsx` (any authenticated user), `RoleProtectedRoute.tsx` (role-based, used for admin), `SellerAuthRoute.tsx` (checks `sellers` table membership, presumably).
- **OTP flow:** `send-otp`/`verify-otp` edge functions + `otp_verifications` table — appears to be a **secondary/alternate phone-based auth or verification flow**, separate from Supabase's native email/password+OAuth. `[OBSERVED]`: no clear frontend call site found in `code.txt` grep for `send-otp`/`verify-otp` function invocation from `src/` — `[UNKNOWN]`/possible **dead or partially-wired feature** (backend exists, frontend caller not found in this pass — flag for deeper check).

## GROUP 13 — RLS (Row-Level Security)

RLS is **enabled on 20/20 public tables** (see DB extraction, "RLS ENABLED" = 20 rows, matches total table count — full coverage, `[CONFIRMED]`). **50 policies** total. Patterns observed:
- Public/anon read on "catalog" tables when a status flag is true: `products` (`status='live' AND is_available`), `designers` (public read all — no status gate, `[OBSERVED]` all designers world-readable regardless of any activation flag, since `designers` has no `is_active` column), `categories` (`is_active=true`), `influencer_videos` (`is_active=true`), `vendors` (public read all), `delivery_zones` (public read all), `discounts` (`status='active'` + date window).
- Owner-scoped CRUD via subquery `seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())` repeated across `products`, `product_variants`, `orders`, `discounts`, `payouts`, `support_tickets` — consistent but **repeated inline subquery pattern** rather than a single reusable function (missed opportunity, not a bug).
- Admin override via `has_role(auth.uid(),'admin')` on `products`, `sellers`, `designers`, `vendors`, `influencer_videos`, `user_roles`, `seller_applications` (view+update only, no delete), `brand_waitlist_applications` (view only).
- `profiles`, `user_addresses`, `tryon_history`: strict `auth.uid() = owner_id` self-only access, no admin override policy found — `[OBSERVED]` **admins cannot read/manage user profiles or addresses via RLS**; any admin profile lookup would require the service-role key server-side (edge function), none found for this purpose — `[MISSING]` likely gap if admin support tooling needs it.
- `otp_verifications`: RLS enabled but **no policies listed** in the 50-row policy dump — `[OBSERVED]` table is RLS-enabled with **zero policies**, meaning **all client access is denied by default**; only service-role edge functions (`send-otp`/`verify-otp`) can touch it. This is correct/secure by construction but should be flagged explicitly.
- `seller_applications` INSERT policy `Anyone can submit application` (anon+authenticated, `with_check: true`) and `brand_waitlist_applications` same pattern — intentional public lead-gen forms, `[CONFIRMED]` matches `JoinUs.tsx`/`SellerApply.tsx`/`BrandWaitlist.tsx` usage.

## GROUP 14 — Storage

3 buckets, all **public**:
| Bucket | Size limit | MIME allow-list | Policies |
|---|---|---|---|
| `tryon-images` | 10 MB | jpeg/png/webp | public SELECT; authenticated INSERT; owner-only DELETE (`auth.role()='authenticated'`, not folder-scoped — `[SECURITY-SENSITIVE]`: DELETE policy checks only that the requester is *some* authenticated user, not that they own the specific file, unlike `product-images`' folder-based check) |
| `influencer-videos` | 50 MB | mp4/webm/quicktime | public SELECT; authenticated INSERT/UPDATE/DELETE (any authenticated user can modify/delete any influencer video — `[SECURITY-SENSITIVE]`, no admin-only restriction at storage layer, though app UI likely gates this to admins) |
| `product-images` | none set | none set (`[SECURITY-SENSITIVE]` — **no file size or MIME restriction** on product image uploads) | public SELECT; **any actor** INSERT (`with_check: true`, no auth requirement — `[SECURITY-SENSITIVE]`: policy qual shows plain `bucket_id = 'product-images'` with no `auth.role()` check, meaning **anonymous upload may be permitted** at the storage-policy level); DELETE restricted to uploader via `storage.foldername(name)[1] = auth.uid()` |

## GROUP 15 — Assets (`src/assets/**`, `public/**`)

- Hero/category imagery: `bags-hero.jpg`, `bottoms-hero.jpg`, `chanderi-shine.jpg`, `dresses-hero.jpg`, `footwear-hero.jpg`, `hidden-gems-hero.jpg`, `indie-vogue.jpg`, `insta-loved.jpg`, `made-to-order-lehenga.jpg`, `outerwear-hero.jpg`, `saree-society.jpg`, `tops-hero.jpg`, `urban-loom.jpg` — static bundled images, layer=asset, used by home/category components.
- `src/assets/designers/*.jpg.asset.json` (9 files) and `src/assets/waitlist/*.png.asset.json` (3 files) — Lovable's asset-manifest wrapper format (metadata pointer files, not raw images) — `[OBSERVED]` Lovable-specific asset management convention.
- `src/assets/ogura-logo.png.asset.json` — brand logo asset pointer.
- `public/` directory exists (per root tree) — contents not individually enumerated in this pass beyond confirming presence (`[CONFIRMED]` presence, `[UNKNOWN]` full contents — likely favicon/`og-image.jpg` per `structure.md`).

## GROUP 16 — Configuration

`vite.config.ts`, `tsconfig.json`/`tsconfig.app.json`/`tsconfig.node.json`, `tailwind.config.ts`, `src/tailwind.config.lov.json` (Lovable-specific tailwind override/token file — `[OBSERVED]` dual tailwind config, confirm which is authoritative at build time), `postcss.config.js`, `eslint.config.js`, `components.json` (shadcn CLI config), `supabase/config.toml` (edge function JWT policy + project ref).

## GROUP 17 — Environment Configuration

`.env` present at repo root with keys (values REDACTED): `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`. Only `VITE_`-prefixed vars are exposed to client bundle (Vite convention) — `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_URL` (no `VITE_` prefix) appear to be **unused duplicates** of the `VITE_`-prefixed pair, `[OBSERVED]`, not a leak since publishable key/URL are non-secret by design.
Edge-function-only secrets (server-side, Deno `Deno.env.get`, never in client bundle): `LOVABLE_API_KEY`, `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (used in 4 functions — `[SECURITY-SENSITIVE]`, full-privilege key), `MAKE_WEBHOOK_URL`, `ALGOLIA_ADMIN_KEY`, `HUGGINGFACE_API_TOKEN`. All correctly kept server-side per this pass — no evidence of secret leakage into `src/`.

## GROUP 18 — Dependencies

Frontend: React 18.3, react-router-dom 6.30, TanStack Query 5.83, Tailwind 3.4 + shadcn/Radix (16 `@radix-ui/*` packages), `@supabase/supabase-js` 2.76, `algoliasearch`/`react-instantsearch` 5.x/7.x, `framer-motion` 12, `gsap` 3.15, `lenis` 1.3 (smooth scroll), `recharts` 2.15 (admin/seller analytics charts), `zod` 3.23 + `react-hook-form` 7.61 (form validation), `@lovable.dev/cloud-auth-js` 1.0, `@lovable.dev/mcp-js` 0.24 (client MCP SDK). Dev: Vite 5.4, TypeScript 5.8, ESLint 9.32, `lovable-tagger` (Lovable dev-time component tagging plugin). **No test framework** in `package.json` (no vitest/jest/playwright listed) — see Group 19.

## GROUP 19 — Tests

`[MISSING]` — no test files, no test runner configured in `package.json` scripts (`dev`, `build`, `build:dev`, `lint`, `preview` only). Zero automated test coverage confirmed for this codebase.

## GROUP 20 — Documentation

`README.md` (root, standard Lovable-generated boilerplate, not independently re-verified content), `structure.md` (root — a detailed but **prior/possibly-stale** hand-authored site-content map, used as lowest-priority source per instructions; several conflicts flagged throughout this manifest and the architecture doc), this `docs/system-extraction/` set (newly authored).

## GROUP 21 — Build / Deployment

Vite build (`vite build`, SWC-based via `@vitejs/plugin-react-swc`), no CI config files found in root tree listing (no `.github/workflows` observed in the captured tree — `[UNKNOWN]`/not confirmed absent, only not present in the captured root listing). Deployment target is implicitly **Lovable Cloud** (project provisions Supabase-compatible backend + likely static hosting/CDN for the Vite build) — `[INFERRED]`, consistent with `@lovable.dev/*` packages and `.lovable`/`.workspace` directories present at repo root. `.lovable/oauth/consent` route confirms Lovable's own OAuth/MCP tooling is wired into this specific app. Domain split (`ogura.in` / `sellers.ogura.in` / `admin.ogura.in`) asserted only in `structure.md`; **not independently verifiable from repo** — `[UNKNOWN]` actual DNS/hosting config, `[CONFLICT]`-flagged against the differing Supabase project ref used in the "New Arrivals" fetch URL noted in Group 1.

---

## Duplicate Implementations

1. **Seller dashboard, two parallel trees**: `src/pages/seller/*` (routed, live) vs `src/components/seller-dashboard/**` (orphaned, unrouted, hardcoded `DEV_SELLER_ID`). See Group 2.
2. **Hero/header components**: `Hero.tsx` vs `LuxuryHero.tsx` vs `CinematicHeroBanner.tsx` vs `FullScreenHeroCarousel.tsx` vs `HeroCarousels.tsx`; `Header.tsx` vs `LuxuryHeader.tsx` vs `NykaaStyleMegaMenu.tsx`/`MegaMenu.tsx`/`MegaMenuMobile.tsx`. `[OBSERVED]` — `Index.tsx` appears (per `structure.md`) to use the `Luxury*` variants; the plain `Hero.tsx`/`Header.tsx`/`Footer.tsx` may be legacy/earlier iterations kept in-tree. Confirm live usage via each page's imports before removal.
3. **`LaunchStudio.tsx`** (flat component) vs **`src/components/launch-studio/*`** (5-file structured version) — likely a refactor-in-place where the old flat file was not deleted.
4. **`use-toast.ts`** duplicated in `src/hooks/` and `src/components/ui/` — standard/expected shadcn pattern, not a defect.
5. **Dual Tailwind config**: `tailwind.config.ts` (root) and `src/tailwind.config.lov.json` — needs confirmation of precedence.

## Apparently Abandoned Code

- `src/components/seller-dashboard/**` (14 dashboard pages + sidebar + header + showcase) — fully unrouted (see above).
- OTP auth flow (`send-otp`, `verify-otp`, `otp_verifications`) with no discovered frontend call site — possibly a parked/future phone-auth feature.
- `src/data/pinterestMockData.ts` and the literal string `"mock_access_token_xyz"` checked against in `UserPinterestBoards.tsx` — indicates Pinterest board browsing is still running on **mock data**, not the real Pinterest API, despite a real OAuth token-exchange edge function existing.

## Feature Flags

No dedicated feature-flag system (e.g., LaunchDarkly, custom `feature_flags` table) found. `is_active` boolean columns on `categories`, `influencer_videos`, `sellers`, `vendors`, `delivery_zones` act as de-facto per-row content toggles, not a flag framework. `[CONFIRMED]` absence of a flag system; `[MISSING]` if intended architecture assumed one.

## Legacy Code

- Route redirects `/waitlist` → `/seller-program`, `/apply-to-join` → `/seller-program` are legacy-URL compatibility shims for a renamed feature.
- `LaunchStudio.tsx` flat component (see duplicates).
- Possibly `Hero.tsx`/`Header.tsx`/`Footer.tsx`/`FilterBar.tsx`/`ProductGrid.tsx`/`ProductCarousel.tsx` if superseded by `Luxury*`/`PLP*` equivalents — `[INFERRED]`, not exhaustively traced to zero import count in this pass.

## Compatibility Shims

- `src/integrations/supabase/previewAuthStorage.ts` — bridges auth session across the Lovable preview iframe vs standalone deployment, falling back to plain `localStorage` outside the iframe.
- `Navigate to="/seller-program" replace` redirects (see Legacy Code).
- `OAuthConsent.tsx` casts `supabase.auth as unknown as { oauth: OAuthApi }` — explicit compatibility shim for a **beta/undocumented Supabase Auth API surface** not yet in the official SDK types.

## Commented-Out Production Logic

`[UNKNOWN]` — not exhaustively grepped for block comments containing business logic in this pass; the one confirmed inline comment of note is in `AuthContext.tsx`: `// sessionStorage unavailable (private mode) - non-fatal`, which is a defensive note, not disabled logic.

## TODOs

`[UNKNOWN]` — targeted `TODO`/`FIXME` grep across `src/` returned no matches in this pass (search also covered `MOCK`/`hardcod`); either the codebase has none or they were removed prior to this extraction pass.

## Hardcoded Business Rules

- GST/tax rate "18%" referenced in `Cart.tsx` per `structure.md` order-summary description — `[OBSERVED]`, not independently re-verified by direct file read.
- Free delivery threshold "₹999" and COD limit "₹10,000" referenced across `ProductDetail.tsx`/`Checkout.tsx`/`Cart.tsx` copy — `[OBSERVED]` via `structure.md`, business constants embedded in component JSX rather than a config table.
- `products.dispatch_days` defaults to `7` at the DB level (schema default) — business rule encoded as a column default, not app logic.
- `orders.status` and `products.status` state machines are enforced via Postgres `CHECK` constraints (`orders_status_check`, `products_status_check`) — `[CONFIRMED]` from schema, a legitimate DB-level business rule.
- `sellers.seller_type_check` restricts to `independent_designer`/`studio_owner` — hardcoded taxonomy at DB level.

## Hardcoded URLs

- `src/data/oguraCategories.ts` — **~25 hardcoded `https://` image URLs** (lines 50-99, 504-505 per grep) — almost certainly third-party (Unsplash-style) placeholder imagery embedded directly in source rather than CMS/DB-driven.
- `src/data/products.ts` (2 URLs), `src/data/stores.ts` (7 URLs, likely Google Maps links) — same pattern.
- `src/components/LoveOguraSection.tsx` — 5 hardcoded URLs (likely social/Instagram embeds).
- `src/lib/brandStores.ts`, `src/lib/mcp/index.ts` — 1 hardcoded URL each.
- `src/integrations/supabase/previewAuthStorage.ts` — hardcoded `https://`/`http://` origin strings used in preview-frame trust logic — `[SECURITY-SENSITIVE]`, origin-matching logic should be reviewed for exact-match vs prefix-match correctness.
- `structure.md` cites a **hardcoded external API base URL** `https://pyesltzkemtranachpne.supabase.co/functions/v1/products` for the "New Arrivals" Seller Center feed on the homepage — this project ref **does not match** the configured Supabase project (`yudzgkrjsstqbfrrrrly` in `supabase/config.toml`). `[CONFLICT]` — either stale documentation, or the live site fetches product data from an entirely separate/legacy backend project not otherwise represented in this repository's `supabase/` directory. Flag for human follow-up; not resolvable from static analysis alone.
- Numerous per-component external links (`Careers.tsx` mailto, `Contact.tsx` phone/email, `Stores.tsx` WhatsApp/map links) — business contact info hardcoded in JSX rather than config.

## Hardcoded IDs

- **`DEV_SELLER_ID = "07edb482-2c8e-4711-8cda-d2f3a87b790a"`** — hardcoded UUID fallback for the current seller, present in **4 files**: `src/components/seller-dashboard/pages/DashboardAddProduct.tsx`, `DashboardDiscounts.tsx`, `DashboardProducts.tsx`, `DashboardSettings.tsx`. `[SECURITY-SENSITIVE]` if this orphaned dashboard tree were ever wired into a route — it would let any authenticated (or unauthenticated, depending on guard placement) user act as a specific hardcoded seller. Currently mitigated only by the tree being unrouted/dead (see Duplicate Implementations). This UUID likely corresponds to a real seed/test seller row in the `sellers` table (row count = 1) — **treat as a real, sensitive identifier**, not a placeholder.
- `supabase/config.toml` `project_id = "yudzgkrjsstqbfrrrrly"` — hardcoded external project reference (not secret, but environment-identifying).
- Conflicting project ref `pyesltzkemtranachpne` cited in `structure.md` (see Hardcoded URLs / Conflicts).

## Hidden Admin Routes

None beyond the documented `/admin/*` set discovered in `AdminApp.tsx`. No separate super-admin, debug, or `/internal` route found.

## Undocumented Routes

`/.lovable/oauth/consent` (MCP OAuth consent screen — present in code, not mentioned as a user-facing surface in `structure.md`'s route tables, only referenced narratively). `/waitlist` and `/apply-to-join` redirect-only routes are present in code but not separately described as routes in `structure.md` (only the destination `/seller-program` is documented).

---

## Counts

| Metric | Count | Source |
|---|---|---|
| Total files (project tree) | 393 | `/tmp/extract/files.txt` |
| Pages (`src/pages/**`, incl. `admin/`,`seller/`) | 45 | file tree |
| Components (`src/components/**` excl. `ui/`) | ~95 | file tree |
| shadcn/ui primitive components | ~46 | file tree |
| Hooks (`src/hooks/*`) | 12 | file tree |
| Contexts (`src/contexts/*`) | 6 (`AuthContext`, `CartContext`, `FilterContext`, `LocationContext`, `MadeToOrderContext`, `WishlistContext`) | file tree |
| App "surfaces" (`src/apps/*`) | 3 (`CustomerApp`, `SellerApp`, `AdminApp`) | file tree |
| Edge functions | 14 | `supabase/functions/*` |
| Database tables | 20 | DB introspection |
| RLS policies | 50 | DB introspection |
| Storage buckets | 3 | DB introspection |
| Migrations | 24 | `supabase/migrations/*.sql` filenames |
| Env vars (client, `VITE_*`) | 3 distinct (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) | grep |
| Env vars / secrets (edge-function-only) | 9 distinct (`LOVABLE_API_KEY`, `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `MAKE_WEBHOOK_URL`, `ALGOLIA_ADMIN_KEY`, `HUGGINGFACE_API_TOKEN`) | grep |
| Test files | 0 | `[MISSING]` |
