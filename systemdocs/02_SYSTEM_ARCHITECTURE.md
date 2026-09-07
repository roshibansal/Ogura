# 02 — SYSTEM ARCHITECTURE
### OGURA — Implemented Reality vs Intended Architecture

Tagging conventions per extraction directive: `[CONFIRMED]` `[OBSERVED]` `[INFERRED]` `[UNKNOWN]` `[MISSING]` `[CONFLICT]` `[SECURITY-SENSITIVE]`.

---

## Layer Inventory (20 required areas)

**1. Frontend** — Tech: React 18 + Vite 5 + TypeScript + Tailwind/shadcn, React Router 6, TanStack Query. Responsibility: all three surfaces (customer, seller, admin) as one SPA bundle selecting a route tree at runtime. Entry: `src/main.tsx`→`App.tsx`. Deps: Supabase JS client, Algolia, GSAP/Lenis/Framer for motion. Consumes: DB via Supabase client, edge functions, Algolia index. Produces: UI, form submissions, storage uploads. Trust boundary: fully untrusted (browser-controlled); all authorization must be enforced by RLS/edge functions, not client code. Failure modes: blank page on JS error (no error boundary observed — `[MISSING]`), stale cached React Query data. `[CONFIRMED]`.

**2. Backend** — Tech: Supabase/Lovable Cloud (managed Postgres + PostgREST + GoTrue auth + Storage + Deno Edge Functions + Realtime). No custom Node/API server. Responsibility: data persistence, auth, business-logic edge functions. Entry points: PostgREST auto-API (via `supabase-js .from()`), 14 edge functions. Trust boundary: server-side, but 9/14 edge functions run with `verify_jwt=false` (see manifest) — reduces trust boundary strength for those. `[CONFIRMED]`.

**3. Database** — Postgres, 20 tables, 50 RLS policies, RLS enabled fleet-wide. Responsibility: system of record for catalog, orders, sellers, users, try-on history, waitlists. Failure modes: constraint violations (multiple `CHECK` state machines), FK cascade deletes on `sellers`→`user_id`, `products`→`designer_id`/`vendor_id`. `[CONFIRMED]`.

**4. Authentication** — Supabase Auth (`auth.users`), email/password + Google OAuth via `@lovable.dev/cloud-auth-js`; session bridged through a custom storage adapter (`previewAuthStorage.ts`) that uses `postMessage` inside Lovable's preview iframe. Separate OTP-based verification subsystem (`send-otp`/`verify-otp`/`otp_verifications`) exists server-side with **no confirmed frontend caller** — `[UNKNOWN]`/likely dormant. `[OBSERVED]`.

**5. Authorization** — Two independent mechanisms: (a) `user_roles` table + `has_role()` Postgres function, used only for the `admin` role at present; (b) `sellers` table row-ownership (`sellers.user_id = auth.uid()`), used for all seller-scoped RLS and the `SellerAuthRoute` guard. There is **no `seller` value in `app_role`** confirmed — sellerhood is modeled as data ownership, not a role claim. `[CONFIRMED]` from schema + route guards.

**6. Storage** — Supabase Storage, 3 public buckets (`tryon-images`, `influencer-videos`, `product-images`); policy strength varies per bucket (see manifest Group 14). `product-images` has no size/MIME limit and permits unauthenticated INSERT per policy `qual` — `[SECURITY-SENSITIVE]`.

**7. Edge Functions** — Deno, 14 functions, mix of AI (Lovable AI gateway), payments (Razorpay), geolocation, OTP, Pinterest OAuth, Algolia sync, MCP tool server. See manifest Group 9 for full table.

**8. External integrations** — Razorpay (payments), Algolia (search), Pinterest API (OAuth + boards, boards currently mocked client-side), HuggingFace Inference API (virtual try-on), Lovable AI Gateway (`LOVABLE_API_KEY`, powers recommendations/image-analysis/banner-generation), Make.com (webhook relay for social posting), Google OAuth (via Lovable cloud-auth), IP-geolocation provider (unspecified vendor, called from `ip-geolocation` edge fn).

**9. AI infrastructure** — Two AI surfaces: (a) recommendation/analysis via Lovable AI Gateway (`ai-recommendations`, `image-analysis`, `generate-banner-image` edge functions, `LOVABLE_API_KEY`); (b) virtual try-on image generation via HuggingFace (`virtual-tryon` edge fn, `HUGGINGFACE_API_TOKEN`). No vector DB / embeddings store found — `[OBSERVED]` recommendations are likely prompt/LLM-based rather than embedding-similarity based; not independently confirmed by reading function bodies in depth.

**10. Payment infrastructure** — Razorpay only. `razorpay-create-order` (creates order, needs `RAZORPAY_KEY_ID/SECRET`) → client-side Razorpay checkout widget (`Checkout.tsx`) → `razorpay-verify-payment` (verifies HMAC signature server-side using `RAZORPAY_KEY_SECRET`, then writes to `orders`/`order_items` using `SUPABASE_SERVICE_ROLE_KEY`, bypassing RLS by design since the customer's own INSERT policy on `orders` requires `auth.uid()=customer_id` — service role is needed if verification happens without the customer's session, or to guarantee server-trusted write). `[SECURITY-SENSITIVE]`: signature verification is the sole gate before a service-role DB write — correctness of that verification logic is critical and was not independently re-derived line-by-line in this pass.

**11. Messaging** — No email/SMS provider integration found directly in this repo's edge functions except implicit SMS for OTP (`send-otp`, provider unspecified/`[UNKNOWN]`) and a Make.com webhook (`social-post-webhook`) which likely fans out to email/social channels externally. No transactional email service (e.g., Resend/SendGrid) found — `order-confirmation` "confirmation email" claim in `structure.md` is **not backed by a discovered edge function or provider integration** — `[CONFLICT]`/`[MISSING]`: either email is sent by an undiscovered mechanism (Supabase Auth's built-in mailer for account emails only, not order emails) or the confirmation-email UI copy is aspirational and not yet implemented.

**12. Analytics** — `recharts` is a dependency and `DashboardAnalytics.tsx`/`DashboardHome.tsx` exist under the orphaned `seller-dashboard` tree; the **live** `SellerDashboardHome.tsx` shows KPI cards per `structure.md`. No third-party analytics SDK (GA/Segment/Mixpanel) found in `package.json`. `[OBSERVED]` — analytics appears to be first-party/DB-derived only, no external analytics vendor confirmed.

**13. Deployment** — Lovable Cloud platform (`.lovable`/`.workspace` dirs present), Vite static build, no CI workflow files found in captured tree. `[INFERRED]` deployment model: Lovable's own build/publish pipeline, not a custom CI/CD.

**14. Environment separation** — Single `.env` with one Supabase project ref (`yudzgkrjsstqbfrrrrly`); no `.env.production`/`.env.staging` files found. `[MISSING]`/`[UNKNOWN]`: no confirmed separate staging vs production Supabase project — the "New Arrivals" fetch to a **different** project ref (`pyesltzkemtranachpne`, per `structure.md`) is the only evidence of a second environment/project, and it is unverified and flagged `[CONFLICT]`.

**15–18. Data flows / Request flows / user-to-DB / admin-to-DB / seller-to-DB / external-service-to-DB** — see Section C–H diagrams below.

---

## A. High-Level Architecture

```text
                          ┌───────────────────────────────────────────┐
                          │           Browser (single SPA bundle)      │
                          │  main.tsx → App.tsx → detectDomain()        │
                          │                                             │
                          │   hostname/path                             │
                          │   ┌─────────┬─────────────┬──────────────┐  │
                          │   │CustomerApp│  SellerApp │   AdminApp   │  │
                          │   │ (30 rts) │  (11 rts)  │   (7 rts)    │  │
                          │   └────┬────┴──────┬──────┴──────┬───────┘  │
                          └────────┼───────────┼─────────────┼──────────┘
                                   │            │             │
                     supabase-js  │  supabase-js│  supabase-js│
                                   ▼            ▼             ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                Supabase / Lovable Cloud (yudzgkrjsstqbfrrrrly) │
        │  ┌────────────┐ ┌──────────────┐ ┌───────────┐ ┌────────────┐ │
        │  │ GoTrue Auth│ │ PostgREST API│ │  Storage  │ │  Realtime  │ │
        │  └─────┬──────┘ └──────┬───────┘ └─────┬─────┘ └─────┬──────┘ │
        │        │               │  RLS (50 policies)│               │  │
        │        └───────┬───────┴────────┬────────┴───────┬───────┘  │
        │                ▼                ▼                ▼           │
        │        ┌───────────────────────────────────────────────┐    │
        │        │   Postgres (20 tables, 24 migrations)          │    │
        │        └───────────────────────────────────────────────┘    │
        │                                                               │
        │   Edge Functions (Deno, 14 total, service-role for 4 of them) │
        │   ai-recommendations · image-analysis · generate-banner-image │
        │   virtual-tryon · razorpay-create-order · razorpay-verify-*   │
        │   send-otp · verify-otp · pincode-lookup · ip-geolocation     │
        │   pinterest-token-exchange · social-post-webhook · mcp        │
        │   sync-algolia                                                │
        └───────────────────┬───────────────┬───────────────┬──────────┘
                             │               │               │
                             ▼               ▼               ▼
                     ┌───────────┐   ┌───────────────┐  ┌──────────────┐
                     │  Razorpay │   │ Lovable AI GW │  │ Algolia /    │
                     │ (payments)│   │ HuggingFace    │  │ Pinterest /  │
                     │           │   │ (AI/try-on)    │  │ Make.com     │
                     └───────────┘   └───────────────┘  └──────────────┘

   [CONFLICT] structure.md also references a homepage "New Arrivals" fetch to
   https://pyesltzkemtranachpne.supabase.co/functions/v1/products — a DIFFERENT
   project ref than the one configured above. Not resolved by static analysis.
```

## B. Runtime Architecture

- **One Vite build, three logical apps.** `detectDomain()` (`src/lib/domainDetection.ts`) inspects `window.location.hostname`/`pathname` at render time and mounts exactly one of `CustomerApp`/`SellerApp`/`AdminApp` via a `switch`. All three route trees are bundled together (no code-splitting per app observed — `[OBSERVED]`, potential unnecessary bundle weight for e.g. admin code shipped to customer users, though it is simply unmounted, not un-downloaded).
- **Global providers wrap all three apps identically**: `QueryClientProvider` → `TooltipProvider` → `AuthProvider` → `LocationProvider` → `CartProvider` → `FilterProvider` → `WishlistProvider` → `Toaster`/`Sonner` → `BrowserRouter` → `AppRouter`. This means seller/admin surfaces also carry customer-oriented context (cart, wishlist, location) even though they don't use it — `[OBSERVED]`, architectural inefficiency, not a defect.
- **Auth session is process-wide**, not per-surface: `AuthContext` uses a single Supabase client (`src/integrations/supabase/client.ts`) shared by all three apps. A user logged in as a customer and a user logged in as a seller are the same `auth.users` row space; role/seller-ness is derived, not a separate credential store.

## C. Request Lifecycle (generic)

1. Browser loads SPA shell (`index.html` → `main.tsx`).
2. `detectDomain()` picks route tree; React Router matches path.
3. Guarded routes (`ProtectedRoute`/`RoleProtectedRoute`/`SellerAuthRoute`) call `useAuth()`/`useUserRole()` — these read `AuthContext` state, which was populated by `supabase.auth.getSession()` + `onAuthStateChange` listener set up on mount.
4. Page component fires data queries via TanStack Query calling `supabase.from(...).select()` (PostgREST) — request carries the user's JWT (or anon key if unauthenticated) — **RLS is the enforcement point**, not application code.
5. For write-heavy or privileged operations, page/component calls `supabase.functions.invoke('<name>', {...})` — edge function executes server-side, optionally using service-role key to bypass RLS for legitimate cross-cutting writes (payments, OTP, Algolia sync).
6. Response renders; TanStack Query caches per query key.

## D. Authentication Lifecycle

1. **Sign-in**: `Login.tsx`/`SellerLogin.tsx`/`AdminLogin.tsx` call `supabase.auth.signInWithPassword` or `lovable.auth.signInWithOAuth('google')` (→ `supabase.auth.setSession()` on completion).
2. **Session persistence**: session stored via `brokeredPreviewStorage()` — inside a Lovable preview iframe, tokens are brokered through `postMessage` to the parent frame so multiple preview surfaces share one login; outside the iframe (real deployment), falls back to plain `localStorage`. `[SECURITY-SENSITIVE]`: cross-frame token exchange trusts `event.origin` checks against hardcoded origin strings — correctness of that allow-list was not independently re-derived byte-for-byte in this pass.
3. **`AuthContext`** subscribes via `supabase.auth.onAuthStateChange` and also calls `getSession()` on mount; exposes `user`, `session`, `signIn`, `signUp`, `signOut`. On sign-up, it also inserts rows into `sellers` and/or `user_roles` in some flows (`contexts/AuthContext.tsx` lines ~175/184) — `[OBSERVED]` sign-up can directly create a `sellers` row or `user_roles` row from client code, gated only by the respective RLS INSERT policies (`sellers`: `auth.uid() = user_id`; `user_roles` has no public INSERT policy in the 50-policy dump other than admin-ALL — meaning a plain client-side `user_roles` insert **would be rejected by RLS** unless performed by an admin session or a service-role edge function). This is an important nuance: **role self-elevation via the client is not possible for `user_roles`**, but **self-registration as a seller is possible** directly from the client, subject to RLS `auth.uid()=user_id`.
4. **Role/seller resolution**: `useUserRole()` queries `user_roles`; seller-ness is resolved by presence of a `sellers` row with matching `user_id` (as seen in multiple `DashboardX.tsx`/`SellerApply.tsx` call sites doing `.from("sellers").select("id").eq("user_id", user.id).maybeSingle()`).
5. **Sign-out**: `supabase.auth.signOut()`; storage adapter clears accordingly.
6. **Secondary OTP path**: `send-otp`→(SMS, provider unknown)→user enters code→`verify-otp` checks against `otp_verifications.otp_hash`. No confirmed UI wiring found — `[UNKNOWN]` whether this is live, planned, or vestigial.

## E. Data Lifecycle

- **Catalog data**: seeded via `products`/`designers`/`vendors`/`categories` tables (row counts: products=36, designers=9, vendors=3, categories=8 at time of extraction — small/early-stage dataset, `[OBSERVED]`). Sellers create products via `SellerAddProduct.tsx` (`status='draft'` default) → submitted → admin review (`AdminApprovals.tsx`/`AdminProducts.tsx`) → `status='live'` → publicly visible per RLS. `sync-algolia` edge function pushes live catalog into Algolia for `/search`.
- **Order data**: `orders`(0 rows)/`order_items`(0 rows) — **no completed orders exist in the database at extraction time**, `[OBSERVED]`, consistent with an early-stage/pre-launch product.
- **User data**: `profiles`, `user_addresses`, `tryon_history`, `otp_verifications` — self-owned, RLS-isolated per user; no admin-read policy on `profiles`/`user_addresses` (see manifest RLS section) — `[MISSING]` for any admin customer-support tooling that would need this.
- **Lead-gen data**: `seller_applications` (12 rows) and `brand_waitlist_applications` (1 row) — public-insert, admin-only-read, reviewed manually via `AdminApprovals.tsx`.

## F. Payment Lifecycle

1. Customer proceeds through `Cart.tsx`→`Checkout.tsx`.
2. `Checkout.tsx` invokes edge fn `razorpay-create-order` (server creates a Razorpay order using `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`, returns an order id/handle to the client).
3. Client opens Razorpay's hosted checkout widget with that order id; user pays.
4. Razorpay returns a payment response to the client, which is immediately forwarded to edge fn `razorpay-verify-payment`.
5. `razorpay-verify-payment` recomputes the HMAC signature server-side with `RAZORPAY_KEY_SECRET` to confirm authenticity, then — using `SUPABASE_SERVICE_ROLE_KEY` — writes the `orders`/`order_items` rows (bypassing the customer-scoped RLS insert policy, since this write happens from a trusted server context rather than the customer's own session).
6. On success, client navigates to `/order-confirmation` (`OrderConfirmation.tsx`), reading the newly created order back (subject to the customer's own RLS SELECT policy, `auth.uid()=customer_id`, so this read *does* require the customer to be authenticated as the order's owner).
7. **[SECURITY-SENSITIVE]** No refund/webhook-based reconciliation edge function found (no `razorpay-webhook`) — if the client fails to call `razorpay-verify-payment` after a successful Razorpay charge (e.g. network drop), the money is captured by Razorpay but no `orders` row is ever created — `[MISSING]` a server-side webhook fallback for payment reconciliation.

## G. AI Generation Lifecycle

- **Recommendations**: `useRecommendations`/`recommendationService.ts` → `ai-recommendations` edge fn (4 modes: trending/personalized/similar/other, inferred from 4 distinct call sites) → Lovable AI Gateway using `LOVABLE_API_KEY` → returns product suggestions rendered in `RecommendationCarousel.tsx`.
- **Image analysis**: `recommendationService.ts` → `image-analysis` edge fn → Lovable AI Gateway; used for style/keyword extraction from an uploaded image (`ImageSearchDialog.tsx`/`ImageUploadZone.tsx` likely callers, `[INFERRED]`).
- **Banner generation**: `generate-banner-image` edge fn, likely admin-facing marketing tool (`[INFERRED]`, no confirmed frontend call site found in the grep pass — possibly invoked only from an admin page not captured in the `code.txt` grep, or currently unused — `[UNKNOWN]`).
- **Virtual try-on**: `useVirtualTryOn.ts` uploads model+product images to `tryon-images` storage bucket, then invokes `virtual-tryon` edge fn (HuggingFace Inference API, `HUGGINGFACE_API_TOKEN`) which returns a composited try-on result image; result + inputs logged to `tryon_history` table for the signed-in user (anonymous try-on is technically possible per RLS INSERT policy requiring only `auth.uid()=user_id`, so **anonymous/unauthenticated try-on would fail to log history but the edge fn itself has `verify_jwt=false`**, meaning the generation itself may work without login even if history logging is skipped — `[OBSERVED]`, worth confirming intent).

## H. Deployment Architecture

`[INFERRED]` overall, since no CI/CD manifests were found in the captured tree: Lovable Cloud builds the Vite SPA and provisions/manages the paired Supabase backend (`yudzgkrjsstqbfrrrrly`), including edge function deployment (`supabase/functions/*`) and migrations (`supabase/migrations/*.sql`) applied through Lovable's own tooling (evidenced by `.lovable`/`.workspace` directories and the `lovable-tagger` Vite plugin). `structure.md` asserts a three-subdomain production topology (`ogura.in`, `sellers.ogura.in`, `admin.ogura.in`) mapped to `detectDomain()`'s hostname checks — this is **architecturally consistent with the code** (the hostname checks literally look for `sellers.`/`admin.` prefixes) but the actual DNS/hosting configuration is **outside this repository and unverifiable** — `[UNKNOWN]`. No separate staging environment or environment-specific config files were found — `[MISSING]`.

---

## Surface Map — Marketplace / Launchpad-Seller-Portal / Studio / Admin

| Surface | Exists in code today | Status | Evidence |
|---|---|---|---|
| **Marketplace (consumer)** | Yes | **Fully implemented** — 30 routes in `CustomerApp.tsx`, full catalog/cart/checkout/payment/order flow, wired to live DB + Razorpay + Algolia. | `src/apps/CustomerApp.tsx`, `Checkout.tsx`, `razorpay-*` edge fns, `products`/`orders` tables |
| **Launchpad / Seller Portal** | Yes, but **split into a live half and a dead half** | **Partial / [CONFLICT]** — The routed, functioning seller portal (`src/pages/seller/*`, mounted via `SellerApp.tsx`) covers landing, login, signup, dashboard home, product list, add-product, orders, settings — a real but comparatively thin feature set (no discounts/analytics/inventory/marketing/collections/customers/gift-cards/markets/transfers UI reachable from any route). A **second, much richer** dashboard implementation exists at `src/components/seller-dashboard/**` (sidebar + header + 14 page components covering Analytics, Collections, Content, Customers, Discounts, Gift Cards, Home, Inventory, Marketing, Markets, Orders, Products, Settings, Transfers) but is **not mounted by any route** and uses a hardcoded `DEV_SELLER_ID`. **This strongly suggests the "Launchpad/Seller Portal" as documented/marketed (a full Shopify-style seller admin) is largely built as components but not wired into the live app** — the richer feature set is documentation/prototype-only in terms of actual reachability. | `src/apps/SellerApp.tsx` (only 5 authed routes) vs `src/components/seller-dashboard/**` (14 unrouted pages) |
| **Studio (AI)** | Partially | **Partial** — Virtual try-on (`VirtualTryOn*`, `useVirtualTryOn`, `virtual-tryon` edge fn) and AI recommendations/image-analysis are real and wired to live edge functions. "Made-to-Order" design studio (`MadeToOrderPage.tsx` + 7 `made-to-order/*` components + `MadeToOrderContext`) is present as a full multi-step UI but has **no discovered DB table or edge function for persisting an MTO order/design request** — `[MISSING]`, likely a **UI-only prototype** for the AI/customization "Studio" concept, not yet backed by data persistence. A dedicated "Launch Studio" **AI banner generator** (`generate-banner-image`) exists server-side with no confirmed caller — `[UNKNOWN]` reachability. | `MadeToOrderContext.tsx`, `made-to-order/*`, `generate-banner-image/index.ts` |
| **Admin** | Yes | **Implemented but narrow** — 5 functional admin pages (`AdminApprovals`, `AdminProducts`, `AdminSellers`, `AdminSettings`, `AdminDashboardHome`) behind `RoleProtectedRoute requiredRole="admin"`, backed by real RLS admin policies on `products`/`sellers`/`designers`/`vendors`/`seller_applications`/`user_roles`. No admin visibility into `orders`/`payouts`/`profiles`/`user_addresses` at the RLS level (no admin policy present on those tables) — `[MISSING]` for a "full" admin back-office (e.g., can't resolve customer support tickets requiring profile/address lookup without a service-role tool, none found for this purpose). | `src/apps/AdminApp.tsx`, `src/pages/admin/*`, RLS policy dump |

**Domain-based routing split** (`src/lib/domainDetection.ts` + `src/apps/*`): `[CONFIRMED]` implemented as described — a single SPA statically bundles all three app route trees and switches on `hostname`/`pathname` at runtime via `detectDomain()`, with `App.tsx`'s `AppRouter` component performing the `switch`. This is a legitimate, working "poor man's multi-tenant" routing strategy, but it means: (a) all three surfaces' code ships in one JS bundle (no separate deploy artifacts per subdomain confirmed), and (b) in any environment where subdomain-based hosting isn't configured (e.g. a single preview URL), the **path-based fallback** (`/seller/*`, `/admin/*` prefixes) is the only way to reach the seller/admin surfaces — meaning `ogura.in/admin` and `ogura.in/seller` are also technically reachable on the customer domain itself if `CustomerApp.tsx`'s own routes don't already claim those paths first (`CustomerApp.tsx` does *not* define `/admin` or `/seller` routes, so on the customer domain those paths would fall through to `CustomerApp`'s own `*`→`NotFound`, **not** to `AdminApp`/`SellerApp`, since only one app tree is ever mounted per page load). This is an important, non-obvious architectural subtlety: **the path-based fallback only works if the hosting layer itself routes `/admin`/`/seller` paths to a build where `detectDomain()` still resolves to that surface** (e.g., same bundle, different serving rule) — `[INFERRED]`, not verifiable purely from the SPA code, depends on external hosting/rewrite rules.

---

## Summary of Implemented Reality vs Intended/Documented Architecture

- **Solid and real**: customer marketplace browsing/cart/checkout/payment, admin approvals workflow, RLS-enforced multi-tenant data model, edge-function-isolated secrets, AI recommendation/try-on pipelines.
- **Partial or unreachable**: the feature-rich seller dashboard (components exist, routes don't), Made-to-Order persistence, banner-generation AI tool, Pinterest board browsing (mocked), OTP auth flow (unwired).
- **Documentation-only / unverified `[MISSING]`/`[CONFLICT]`**: three-subdomain production hosting split (asserted in `structure.md`, architecturally supported by code but not verifiable from the repo), a second Supabase project ref referenced for homepage product data, transactional order-confirmation emails, and a Razorpay reconciliation webhook.
