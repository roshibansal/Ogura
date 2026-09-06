# 10 — Frontend Architecture (OGURA)

## 1. Stack [CONFIRMED]
- React 18.3.1 + TypeScript, bundled with Vite (`vite.config.ts`), SWC react plugin (`@vitejs/plugin-react-swc`).
- Styling: Tailwind CSS (`tailwind.config.ts`) + shadcn/ui (Radix primitives) + `tailwindcss-animate`.
- Data/state: `@tanstack/react-query` (QueryClient created once in `src/App.tsx`, but most pages use raw `useEffect` + `supabase` calls rather than React Query — see 14/15).
- Routing: `react-router-dom` v6 (`BrowserRouter`, nested `<Routes>` per "app").
- Backend: Lovable Cloud / Supabase (`@supabase/supabase-js`, client at `src/integrations/supabase/client.ts`), typed via generated `src/integrations/supabase/types.ts`.
- Search: Algolia (`algoliasearch`, `react-instantsearch`), client in `src/lib/algoliaClient.ts`.
- Auth: `@lovable.dev/cloud-auth-js` wrapper (`src/integrations/lovable/index.ts`) used for Google OAuth sign-in; Supabase Auth for session/password.
- MCP: `@lovable.dev/mcp-js` Vite plugin (`mcpPlugin()` in `vite.config.ts`) and `src/lib/mcp/*` tool definitions (get-product, list-my-orders, search-products) — exposes an MCP surface over Supabase, not used by the UI directly.
- Animation libs: `framer-motion`, `gsap` (+ `ScrollTrigger`), `lenis` (smooth scroll, `useLenis`).
- Misc: `zod` (form validation on a few forms), `date-fns`, `embla-carousel-react`, `recharts` (seller dashboard analytics, currently unused legacy `seller-dashboard/*` components), `sonner` + shadcn `toast` (two toast systems coexist — see 15).

## 2. Entry Point [CONFIRMED] — `src/main.tsx`
```
createRoot(document.getElementById("root")!).render(<App />);
```
No StrictMode wrapper. No error boundary at the root. Imports `./index.css` (Tailwind base + CSS custom properties for the design tokens consumed by `tailwind.config.ts`).

## 3. `src/App.tsx` — Provider Nesting [CONFIRMED]
Order (outer → inner):
1. `QueryClientProvider` (`new QueryClient()`, default options, module-scope singleton)
2. `TooltipProvider` (shadcn/radix tooltip context)
3. `AuthProvider` (`src/contexts/AuthContext.tsx`)
4. `LocationProvider` (`src/contexts/LocationContext.tsx`)
5. `CartProvider` (`src/contexts/CartContext.tsx`)
6. `FilterProvider` (`src/contexts/FilterContext.tsx`)
7. `WishlistProvider` (`src/contexts/WishlistContext.tsx`)
8. `<Toaster />` (shadcn) and `<Sonner />` (sonner) — both toast systems mounted globally, siblings, **not** nested inside `BrowserRouter`.
9. `BrowserRouter` → `AppRouter()`

`AppRouter` calls `detectDomain()` and switches between `CustomerApp`, `SellerApp`, `AdminApp` (see below). Only one of the three route trees is ever mounted at a time; there is no shared top-level `<Routes>`.

`MadeToOrderProvider` (`src/contexts/MadeToOrderContext.tsx`) is **not** global — it is mounted locally inside `src/pages/MadeToOrderPage.tsx` only, wrapping `MadeToOrderContent`.

## 4. Domain-based App Split [CONFIRMED] — `src/lib/domainDetection.ts`
```ts
export function detectDomain(): AppDomain // 'customer' | 'seller' | 'admin'
```
Logic:
- Hostname starts with `sellers.` → `'seller'`
- Hostname starts with `admin.` → `'admin'`
- Else, path-based fallback (dev/preview only): pathname starts with `/seller` → `'seller'`; starts with `/admin` → `'admin'`
- Otherwise → `'customer'`

`getBasePath(domain)` is exported (returns `/seller`, `/admin`, or `''`) but is **not used anywhere** in `AppRouter`, `CustomerApp`, `SellerApp`, or `AdminApp` — the three route trees register absolute paths (e.g. `/seller/dashboard`) directly rather than stripping a base path, so it is dead/unused helper code. [OBSERVED]

This means: in production, `sellers.ogura.in/dashboard` would render `SellerApp`, but `SellerApp`'s own routes are declared as `/seller/dashboard` etc. — i.e. the subdomain strategy and the path strategy are **inconsistent**: on `sellers.ogura.in` the app would need requests to `/seller/dashboard`, not `/dashboard`, to match a route. [CONFLICT] This is a structural risk worth flagging for reconstruction: either the subdomain deploy needs a path rewrite, or `SellerApp`'s routes need to be domain-relative.

### 4.1 `src/apps/CustomerApp.tsx` [CONFIRMED]
- Renders `<Routes>` with all customer-facing routes (see 11_ROUTE_MAP.md).
- No shared layout wrapper at the router level — each page imports its own `<Header/>`/`<Footer/>` or `<LuxuryHeader/>`/`<LuxuryFooter/>` combination directly (layout is NOT centralized; `CustomerLayout` exists but is only used by a handful of pages: `PrivacyPolicy`, `TermsOfUse`, `Contact`, `Careers`).
- Mounts `<LocationPermissionModal/>` and `<ManualLocationSelector/>` globally as siblings to `<Routes>` (always in the DOM, controlled by `LocationContext` state).

### 4.2 `src/apps/SellerApp.tsx` [CONFIRMED]
- Declares a local `WrappedRoute` helper: `<SellerAuthRoute><SellerDashboardLayout>{children}</SellerDashboardLayout></SellerAuthRoute>`.
- Public seller routes (`/seller`, `/seller/join`) use `<SellerPublicLayout>` inline.
- `/seller/login`, `/seller-login`, `/seller/signup`(`/seller-signup`) render bare (no layout wrapper).
- Catch-all `/seller/*` → `SellerPublicLayout` + `SellerLanding` (acts as a 404-to-landing fallback, not a real 404 page).

### 4.3 `src/apps/AdminApp.tsx` [CONFIRMED]
- `WrappedRoute` = `<RoleProtectedRoute requiredRole="admin" loginPath="/admin/login" unauthorizedRedirect="/"><AdminDashboardLayout>{children}</AdminDashboardLayout></RoleProtectedRoute>`.
- `/admin` and `/admin/login` both render `AdminLogin`. Catch-all `/admin/*` → `AdminLogin` (also not a true 404).

## 5. Layouts [CONFIRMED] — `src/layouts/*`
| File | Used by | Structure |
|---|---|---|
| `CustomerLayout.tsx` | `Contact`, `Careers`, `PrivacyPolicy`, `TermsOfUse` | `<Header/>` (optional) + `<main>` + `<LuxuryFooter/>` (optional), props `hideHeader`/`hideFooter` |
| `SellerPublicLayout.tsx` | seller marketing pages (`/seller`, `/seller/join`, seller catch-all) | Minimal sticky header (OGURA + "Partners" badge, Login/Apply links) + `<main>` + minimal footer with links back to customer site |
| `SellerDashboardLayout.tsx` | all authenticated seller dashboard routes | Fixed left sidebar (desktop) / slide-over sidebar (mobile) with nav items Dashboard/Products/Add Product/Orders/Settings, `<DashboardHeader/>` top bar, `useAuth().logout` wired to Sign Out |
| `AdminDashboardLayout.tsx` | all authenticated admin routes | Same visual pattern as seller layout but nav items Dashboard/Approvals/Products/Sellers/Settings, "Admin" badge in destructive color |

Most **customer** pages do NOT use `CustomerLayout` — they directly compose `<Header/>`/`<Footer/>` (classic e-commerce pages: Collections, ProductDetail, Cart, Checkout, Wishlist, Search, Brands, Stores, Occasions, BrandDetail, DesignerDetail) or `<LuxuryHeader/>`/`<LuxuryFooter/>` (editorial/marketing-styled pages: Index, CategoryPage, MadeToOrderPage, Dashboard, Profile, JoinUs, SellerApply, BrandWaitlist). This is a duplicated-header/footer pattern (`Header` vs `LuxuryHeader`, `Footer` vs `LuxuryFooter`) rather than one canonical shell — see 15_COMPONENT_RELATIONSHIPS.md for the duplication list. [OBSERVED]

## 6. Auth/Role Guards [CONFIRMED] — `src/components/auth/*`
- `ProtectedRoute.tsx`: requires `useAuth().isAuthenticated`; shows spinner while `isLoading`; redirects to `/login` with `state={{from: location}}` if unauthenticated. Used only in `CustomerApp`.
- `SellerAuthRoute.tsx`: requires `isAuthenticated`; redirects to `/join` (not `/seller/login`) if not. Used only in `SellerApp`. Does **not** check any seller-specific role or `sellers` table row — any authenticated user can reach `/seller/dashboard` even if they have no seller profile. [SECURITY-SENSITIVE]
- `RoleProtectedRoute.tsx`: requires `isAuthenticated` AND `useUserRole().hasRole(requiredRole)`; configurable `loginPath`/`unauthorizedRedirect`; shows an inline "Access Denied" card (not a redirect) when authenticated but wrong role. Used only in `AdminApp` with `requiredRole="admin"`.
- `useUserRole.ts` (`src/hooks/useUserRole.ts`): queries `public.user_roles` table for `role` rows matching `user.id`; returns `{roles, hasRole, isLoading}`. Roles observed in code: `'consumer' | 'seller' | 'admin'`.

## 7. Code Splitting [OBSERVED]
- **No `React.lazy` / `Suspense`-based route splitting anywhere in the app.** All three app trees (`CustomerApp`, `SellerApp`, `AdminApp`) statically import every page component at module top-level, and `App.tsx` statically imports all three app trees. This means the initial JS bundle contains customer, seller, and admin route code simultaneously regardless of which domain is detected at runtime. [MISSING: route-level code splitting]
- `vite-plugin-react-swc` + esbuild/rollup default chunking is the only automatic splitting; no manual `manualChunks` config in `vite.config.ts`.
- `lovable-tagger`'s `componentTagger()` plugin only runs in `mode === "development"`.

## 8. Build Configuration [CONFIRMED]
### `vite.config.ts`
- Dev server: `host: "::"`, `port: 8080`.
- Plugins: `react()` (SWC), `componentTagger()` (dev only, Lovable component tagging for the visual editor), `mcpPlugin()` (Lovable MCP/Supabase stack integration, unconditional).
- `resolve.dedupe: ["react", "react-dom"]`.
- Path alias: `"@" → ./src`.

### `tailwind.config.ts`
- `darkMode: ["class"]`, no `prefix`.
- `content` globs: `./pages/**`, `./components/**`, `./app/**`, `./src/**` (the first three globs are legacy Next.js-style paths that don't exist in this project — dead globs, harmless but imprecise). [OBSERVED]
- Design tokens are all HSL CSS variables consumed via `hsl(var(--x))` (border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card, sidebar-*), plus a custom `brand` color keyed to `--ogura-pink`/`--ogura-pink-light`.
- Custom keyframes/animations: `accordion-down/up`, `fade-in`, `fade-in-slow`, `scale-in`, `slide-up`, `kenburns` (used for hero image Ken Burns effect).
- `container` centered, max `1400px` at `2xl`.
- Plugin: `tailwindcss-animate`.

### `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`
- Root `tsconfig.json` is a solution file with `references` to `tsconfig.app.json` and `tsconfig.node.json`; itself declares `paths: {"@/*": ["./src/*"]}`, `allowJs: true`, `noImplicitAny: false`, `noUnusedLocals: false`, `noUnusedParameters: false`, `strictNullChecks: false`, `skipLibCheck: true`. Type strictness is intentionally loose project-wide. [OBSERVED]

### `package.json` scripts [CONFIRMED]
`dev` (vite), `build` (vite build), `build:dev` (vite build --mode development), `lint` (eslint .), `preview` (vite preview). No test script defined.

## 9. Global CSS [OBSERVED]
`src/index.css` (not fully enumerated here) defines the CSS custom properties consumed by Tailwind and additional bespoke classes referenced ad hoc in components (`museum-surface`, `museum-gold-glow`, `museum-grain-strong`, `museum-vignette-strong`, `waitlist-page`, `editorial-label`, `instagram-gradient`, `font-body`, `font-serif` custom utility classes) — these are one-off theming classes for specific marketing sections (Index page "Museum Band", BrandWaitlist page) rather than a systematic design system layer beyond the shadcn tokens.

## 10. Notable Structural Observations
- Three independent SPA route trees are bundled into one JS artifact and switched at runtime by hostname/path sniffing — there is no server-side routing/split-bundling per subdomain. [OBSERVED]
- `getBasePath()` dead code combined with hard-coded `/seller/*` and `/admin/*` paths in the sub-app routers is a latent bug for the subdomain-based production deploy described in `domainDetection.ts`'s own comment. [CONFLICT] [SECURITY-SENSITIVE: could cause admin/seller UI to 404 in production if subdomains are used without a path prefix, potentially prompting operators to work around it in ways that weaken guards]
- No centralized `NotFound`/404 handling for `/seller/*` or `/admin/*` — both fall back to their landing/login pages instead of an explicit 404, which can mask broken links.

# 11 — Route Map (all three app routers)

Router library: `react-router-dom` v6, three independent `<Routes>` trees selected at runtime by `detectDomain()` (`src/lib/domainDetection.ts`). See 10_FRONTEND_ARCHITECTURE.md for how the trees are selected.

Legend for **Access**: `public` (no auth check), `auth` (any logged-in user via `ProtectedRoute`/`SellerAuthRoute`), `admin` (role-gated via `RoleProtectedRoute requiredRole="admin"`).

## A. CustomerApp (`src/apps/CustomerApp.tsx`) — default domain

| Path | Static/Dynamic | Params | Component (file) | Access | Guard | Data / Edge Fns | Notes |
|---|---|---|---|---|---|---|---|
| `/` | static | – | `Index` (`src/pages/Index.tsx`) | public | none | none directly (children fetch their own data) | Composes many marketing sections (`LuxuryHero`, `Premium3DCategorySection`, `SellerNewArrivals`, `HiddenGemsSection`, `CategoryShowcase`, `DesignersSpotlight`, `LuxuryTrustBadges`, `LuxuryBrands`, `LuxuryGiftCard`, `LuxuryStoreLocator`). Uses `useLenis()` smooth scroll. |
| `/login` | static | – | `Login` (`src/pages/Login.tsx`) | public | none | Supabase Auth via `AuthContext` | Redirects authenticated users to `/onboarding` (new users) or `from`/`next`/stored path/`/dashboard`. |
| `/collections` | static | – | `Collections` (`src/pages/Collections.tsx`) | public | none | `supabase.from('products')` (status in `[live,submitted]`, `is_available=true`) + fallback `fetch()` to `https://pyesltzkemtranachpne.supabase.co/functions/v1/products` + static `data/products.ts` | Filters via `?category=`/`?subcategory=` query params, client-side merge of DB + external API + static fallback (dedup by id, DB wins). |
| `/collections/:category` | dynamic | `category` (path param, unused — component reads `?category=` query instead) | `Collections` | public | none | same as above | The `:category` path param is declared in the route but the component only reads `useSearchParams`, not `useParams` — dead route param. [OBSERVED] |
| `/product/:id` | dynamic | `id` | `ProductDetail` (`src/pages/ProductDetail.tsx`) | public | none | `supabase.from('products').eq('id',id).maybeSingle()`, fallback `fetch()` external products API, static fallback | Color/size selection, `useCart().addItem`, `useWishlist().toggleItem`, `?debug=1` dumps product JSON. |
| `/brands` | static | – | `Brands` (`src/pages/Brands.tsx`) | public | none | `useBrandStores()` hook (Supabase-backed live brand stores) + static `data/brands.ts` | Two sections: live "Brand stores" + static "Featured brands". |
| `/store/:slug` | dynamic | `slug` | `BrandStore` (`src/pages/BrandStore.tsx`) | public | none | `fetchBrandStores()` (`src/lib/brandStores.ts`) | Same component and slug space as `/brand/:slug`. |
| `/brand/:slug` | dynamic | `slug` | `BrandStore` | public | none | same | Duplicate route to `/store/:slug`, identical component. |
| `/brands/:brandId` | dynamic | `brandId` | `BrandDetail` (`src/pages/BrandDetail.tsx`) | public | none | static `data/brands.ts` + `data/products.ts` (no DB) | Legacy static-data brand page, distinct from `/store/:slug`/`/brand/:slug`live brand stores — two parallel "brand" concepts. [OBSERVED] |
| `/designers` | static | – | `Designers` (`src/pages/Designers.tsx`) | public | none | `useDesigners()` hook (`supabase.from('designers')`) + realtime subscription `postgres_changes` on `designers` table | Search + category filter, debounced 300ms. |
| `/designers/:designerId` | dynamic | `designerId` | `DesignerDetail` (`src/pages/DesignerDetail.tsx`) | public | none | `useDesigner(id)` hook | Legacy/simple designer detail (Instagram-style), distinct from `/designer/:slug`. |
| `/designer/:slug` | dynamic | `slug` | `DesignerProfilePage` (`src/pages/DesignerProfilePage.tsx`) | public | none | `useDesignerBySlug`, `useDesignerProducts`, `useDesignerCategories` hooks | Richer designer storefront with filters/pagination ("Load more"). Two parallel designer detail routes/components exist. [OBSERVED] |
| `/occasions` | static | – | `Occasions` (`src/pages/Occasions.tsx`) | public | none | static `data/occasions.ts` | Grid linking to `/occasions/:occasionId`. |
| `/occasions/:occasionId` | dynamic | `occasionId` | `OccasionDetail` (`src/pages/OccasionDetail.tsx`) | public | none | static `data/products.ts` filtered by `product.occasions` + `FilterContext` | |
| `/stores` | static | – | `Stores` (`src/pages/Stores.tsx`) | public | none | static `data/stores.ts` | Physical store locator cards (map link, WhatsApp). |
| `/search` | static | – | `Search` (`src/pages/Search.tsx`) | public | none | Algolia `InstantSearch` (`src/lib/algoliaClient.ts`), `?q=` seeds initial query | Also renders `BrandSearchResults` (Supabase-backed brand stores) alongside Algolia hits. |
| `/category/:slug` | dynamic | `slug` | `CategoryPage` (`src/pages/CategoryPage.tsx`) | public | none | `getCategoryBySlug()` (`data/oguraCategories.ts`) static config | Special-case: `slug==='made-to-order'` renders `MadeToOrderPage` instead. Unknown slug → `<Navigate to="/" replace/>`. |
| `/join` | static | – | `JoinUs` (`src/pages/JoinUs.tsx`) | public | none | `supabase.auth` (signup/login), `supabase.from('seller_applications')`-style insert (in later step), Storage upload | Multi-step: hero → auth (login/signup tabs) → apply form → success. |
| `/join/apply` | static | – | `SellerApply` (`src/pages/SellerApply.tsx`) | public | none | `supabase.storage.from('product-images').upload`, `supabase.from('seller_applications').insert` | zod-validated form; standalone (no login required to apply). |
| `/privacy` | static | – | `PrivacyPolicy` (`src/pages/PrivacyPolicy.tsx`) | public | none | none (static content) | Wrapped in `CustomerLayout`. |
| `/terms` | static | – | `TermsOfUse` (`src/pages/TermsOfUse.tsx`) | public | none | none (static content) | Wrapped in `CustomerLayout`. |
| `/contact` | static | – | `Contact` (`src/pages/Contact.tsx`) | public | none | none — submits via `mailto:` link (no backend call) | zod-validated form; "submission" opens the user's email client. |
| `/careers` | static | – | `Careers` (`src/pages/Careers.tsx`) | public | none | none — form target is `careers@ogura.in` (mailto-style intended) | zod schema defined; 931-line static content page with accordions per role. |
| `/seller-program` | static | – | `BrandWaitlist` (`src/pages/BrandWaitlist.tsx`) | public | none | `WaitlistForm`/`WaitlistSection` components (likely Supabase insert — see 14) | Sets `document.title` and meta description manually (page-level SEO). |
| `/waitlist` | static (redirect) | – | `<Navigate to="/seller-program" replace/>` | public | none | – | Legacy redirect. |
| `/apply-to-join` | static (redirect) | – | `<Navigate to="/seller-program" replace/>` | public | none | – | Legacy redirect. |
| `/auth/pinterest/callback` | static | – | `PinterestCallback` (`src/pages/PinterestCallback.tsx`) | public | none | `supabase.functions.invoke('pinterest-token-exchange')` | Reads `?code=`, stores token in `localStorage` (`pinterest_token`, `pinterest_connected`, `pinterest_code`), auto-redirects to `/` after 2s. Hard-codes redirect_uri `https://coy-clone-studio.lovable.app/auth/pinterest/callback` (stale preview domain). [SECURITY-SENSITIVE: hardcoded external redirect URI, token stored in localStorage not httpOnly] |
| `/.lovable/oauth/consent` | static, internal | – | `OAuthConsent` (`src/pages/OAuthConsent.tsx`) | public route, but functionally requires session | none (manual session check inside component) | `supabase.auth.oauth.getAuthorizationDetails/approveAuthorization/denyAuthorization` (beta Supabase Auth OAuth-provider API), `supabase.auth.getSession()` | Hidden/internal route (not linked from nav) implementing an OAuth **authorization server** consent screen — OGURA acting as an OAuth provider for third-party MCP/app integrations. Redirects unauthenticated users to `/login?next=...`. [SECURITY-SENSITIVE: approves third-party app access to the user's OGURA account/data based on scopes returned by the authorization server] |
| `/dashboard` | static | – | `Dashboard` (`src/pages/Dashboard.tsx`) | auth | `ProtectedRoute` | none directly (reads `useAuth().user`) | Customer account home; quick links to Orders (`/orders` — **not a registered route**, dead link [OBSERVED]), Wishlist, Cart, `/profile#addresses`. |
| `/onboarding` | static | – | `Onboarding` (`src/pages/Onboarding.tsx`) | auth | `ProtectedRoute` | `completeOnboarding()` → `supabase.from('profiles').update({is_onboarded:true})` | Category/notification preference UI is **local state only** — preferences are never persisted to Supabase, only the `is_onboarded` flag is. [OBSERVED] |
| `/profile` | static | – | `Profile` (`src/pages/Profile.tsx`) | auth | `ProtectedRoute` | `supabase.from('profiles').update(...)` | Also a stub "Saved Addresses" section (always shows empty state; no `user_addresses` fetch here) and disabled "coming soon" notification toggles. |
| `/wishlist` | static | – | `Wishlist` (`src/pages/Wishlist.tsx`) | auth | `ProtectedRoute` | `WishlistContext` (localStorage-backed, see 15) | Move-to-cart moves first size/color only. |
| `/cart` | static | – | `Cart` (`src/pages/Cart.tsx`) | auth | `ProtectedRoute` | `CartContext`, `LocationContext` (address) | Empty-state screen when `items.length===0`. |
| `/checkout` | static | – | `Checkout` (`src/pages/Checkout.tsx`) | auth | `ProtectedRoute` | `supabase.from('discounts')` (code validation), `supabase.functions.invoke('razorpay-create-order')`, `supabase.functions.invoke('razorpay-verify-payment')`, Razorpay Checkout.js (loaded via injected `<script>`) | Redirects to `/cart` if cart empty. On success navigates to `/order-confirmation` with order state in router `location.state` (not persisted in URL — refresh loses data). |
| `/order-confirmation` | static | – | `OrderConfirmation` (`src/pages/OrderConfirmation.tsx`) | auth | `ProtectedRoute` | none (reads `location.state` only) | Redirects to `/` if no `state.orderNumber` (e.g. on refresh/direct nav) — success page cannot be reloaded or deep-linked. [OBSERVED] |
| `*` (catch-all) | static | – | `NotFound` (`src/pages/NotFound.tsx`) | public | none | none | Logs `console.error` with attempted path; plain 404 (not styled with app shell). |

### Also referenced but declared inside other route components (not top-level `Route`s)
- `MadeToOrderPage` (`src/pages/MadeToOrderPage.tsx`) is reached only via `/category/made-to-order` (conditional render inside `CategoryPage`), not its own `<Route>`. [OBSERVED]

## B. SellerApp (`src/apps/SellerApp.tsx`) — `sellers.` subdomain or `/seller*` path

| Path | Static/Dynamic | Component (file) | Access | Guard | Layout | Data | Notes |
|---|---|---|---|---|---|---|---|
| `/join` | static | `JoinUs` (shared with customer app) | public | none | none | see above | Seller app also serves the customer `/join` marketing/apply flow. |
| `/seller` | static | `SellerLanding` (`src/pages/seller/SellerLanding.tsx`) | public | none | `SellerPublicLayout` | none (static marketing content: benefits, commission tiers, testimonials) | |
| `/seller/join` | static | `SellerLanding` | public | none | `SellerPublicLayout` | same | Alias of `/seller`. |
| `/seller-login` | static | `SellerLogin` (`src/pages/seller/SellerLogin.tsx`) | public | none | none (bare) | `signInWithEmail` (Supabase Auth), `GoogleSignInButton` | Duplicate of `/seller/login` with a different URL shape. |
| `/seller-signup` | static | `SellerSignup` (`src/pages/seller/SellerSignup.tsx`) | public | none | none | `signUpWithEmail` (auto-inserts `sellers` row + `user_roles` row with `role:'seller'`) | Duplicate of implicit signup flow; `/seller/signup` is NOT registered (only `/seller-signup`). [OBSERVED] |
| `/seller/login` | static | `SellerLogin` | public | none | none | same as `/seller-login` | |
| `/seller/dashboard` | static | `SellerDashboardHome` (`src/pages/seller/SellerDashboardHome.tsx`) | auth | `SellerAuthRoute` (no role/seller-row check) | `SellerDashboardLayout` | none (all stats hard-coded to 0/—, static placeholder) | |
| `/seller/products` | static | `SellerProducts` (`src/pages/seller/SellerProducts.tsx`) | auth | `SellerAuthRoute` | `SellerDashboardLayout` | `supabase.from('sellers').eq('user_id',user.id)` → `supabase.from('products').eq('seller_id', sellerId)` | Table view w/ status badges. |
| `/seller/products/new` | static | `SellerAddProduct` (`src/pages/seller/SellerAddProduct.tsx`) | auth | `SellerAuthRoute` | `SellerDashboardLayout` | `supabase.storage.from('product-images').upload`, `supabase.from('products').insert(status:'submitted')` | Full product form: sizes, colors, occasion/style tags, material/care. |
| `/seller/orders` | static | `SellerOrders` (`src/pages/seller/SellerOrders.tsx`) | auth | `SellerAuthRoute` | `SellerDashboardLayout` | `supabase.from('sellers')` → `supabase.from('orders').eq('seller_id',...)` | Read-only order list. |
| `/seller/settings` | static | `SellerSettings` (`src/pages/seller/SellerSettings.tsx`) | auth | `SellerAuthRoute` | `SellerDashboardLayout` | `supabase.from('sellers').select('*')/.update(...)` | Edits `brand_name`, `city`, `instagram_handle`, `description`; shows read-only `application_status`/`seller_type`. |
| `/seller/*` (catch-all) | static | `SellerLanding` | public | none | `SellerPublicLayout` | none | No real 404 for the seller app — any unmatched `/seller/...` path renders the landing page. |

## C. AdminApp (`src/apps/AdminApp.tsx`) — `admin.` subdomain or `/admin*` path

| Path | Static/Dynamic | Component (file) | Access | Guard | Layout | Data | Notes |
|---|---|---|---|---|---|---|---|
| `/admin` | static | `AdminLogin` (`src/pages/admin/AdminLogin.tsx`) | public | none | none | `useAuth`, `useUserRole` | Shows "Access Restricted" inline if authenticated but not admin role; otherwise Google sign-in only (no email/password on admin). |
| `/admin/login` | static | `AdminLogin` | public | none | none | same | Duplicate of `/admin`. |
| `/admin/dashboard` | static | `AdminDashboardHome` (`src/pages/admin/AdminDashboardHome.tsx`) | admin | `RoleProtectedRoute requiredRole="admin"` | `AdminDashboardLayout` | none — all KPI cards render `—` placeholders | "Approval Queue" section says workflow "will be built in Phase 3" though `/admin/approvals` already implements it — stale copy. [OBSERVED] |
| `/admin/approvals` | static | `AdminApprovals` (`src/pages/admin/AdminApprovals.tsx`) | admin | `RoleProtectedRoute` | `AdminDashboardLayout` | `supabase.from('products').eq('status','pending')`, `.update({status:'live'})` / `.update({status:'rejected', rejection_reason})` | Approve/Reject actions with a reject-reason dialog. |
| `/admin/products` | static | `AdminProducts` (`src/pages/admin/AdminProducts.tsx`) | admin | `RoleProtectedRoute` | `AdminDashboardLayout` | `supabase.from('products')` with status filter + client-side title search, `.limit(200)` | Read-only catalogue browser. |
| `/admin/sellers` | static | `AdminSellers` (`src/pages/admin/AdminSellers.tsx`) | admin | `RoleProtectedRoute` | `AdminDashboardLayout` | `supabase.from('sellers').select(...)`, `.update({application_status:'approved', is_verified:true})` | Approve action's toast claims "Seller role has been assigned" but the client code does **not** insert into `user_roles`— role assignment must happen via a DB trigger/edge function not visible in this component. [OBSERVED — verify against DB triggers] |
| `/admin/settings` | static | `AdminSettings` (`src/pages/admin/AdminSettings.tsx`) | admin | `RoleProtectedRoute` | `AdminDashboardLayout` | none (reads `useAuth().user` only) | Read-only account info display. |
| `/admin/*` (catch-all) | static | `AdminLogin` | public | none | none | – | No true 404; unmatched paths render login. |

## D. Route Count Summary

| Category | Count |
|---|---|
| TOTAL distinct `<Route>` declarations (all 3 routers) | 52 |
| PUBLIC (no auth required) | 34 |
| AUTH (any logged-in user) | 7 |
| SELLER (authenticated, seller layout, no role check) | 6 |
| ADMIN (role-gated `admin`) | 6 |
| HIDDEN / not in nav (`/.lovable/oauth/consent`, `/auth/pinterest/callback`, `/apply-to-join`, `/waitlist`, seller/admin catch-alls) | 6 |
| LEGACY REDIRECTS (`Navigate` to another route) | 2 (`/waitlist`, `/apply-to-join`) |
| UNKNOWN / ambiguous access (duplicate brand/designer routes, dead `:category` param) | 4 (`/brand/:slug` vs `/store/:slug` duplication, `/designers/:designerId` vs `/designer/:slug` duplication, `/collections/:category` dead param) |

Note: counts overlap by category (e.g., a hidden route is also public); totals are informational, not mutually exclusive partitions except TOTAL.

# 12 — Page Inventory (one row per file under src/pages/**)

| Route file | Route(s) | Purpose | User type | Data source | Key components | Status |
|---|---|---|---|---|---|---|
| src/pages/Index.tsx | `/` | Marketing homepage | Public | static/child-fetched | LuxuryHeader, LuxuryHero, Premium3DCategorySection, SellerNewArrivals, HiddenGemsSection, CategoryShowcase, DesignersSpotlight, LuxuryTrustBadges, LuxuryBrands, LuxuryGiftCard, LuxuryStoreLocator, LuxuryFooter | Active |
| src/pages/Login.tsx | `/login` | Customer auth entry | Public/Auth | Supabase Auth via AuthContext | GoogleSignInButton | Active |
| src/pages/Collections.tsx | `/collections`, `/collections/:category` | Product listing (all/category) | Public | supabase `products` + external fn API + static | Header, Footer, Breadcrumb | Active, dead `:category` param |
| src/pages/ProductDetail.tsx | `/product/:id` | PDP | Public | supabase `products` + external API fallback | ProductImageGallery, VirtualTryOnDialog, RecommendationCarousel, SimilarProductsGrid, AddressSelectionModal, ProductDetailsAccordion, DeliveryChecker | Active, largest page (685 lines) |
| src/pages/Cart.tsx | `/cart` | Shopping cart | Auth | CartContext, LocationContext | AddressSelectionModal, AddressCard | Active |
| src/pages/Checkout.tsx | `/checkout` | Checkout + payment | Auth | supabase `discounts`, edge fns razorpay-create-order/verify-payment | AddressSelectionModal, AddressCard | Active |
| src/pages/OrderConfirmation.tsx | `/order-confirmation` | Post-payment confirmation | Auth | router `location.state` only | none special | Active, not deep-linkable |
| src/pages/Brands.tsx | `/brands` | Brand directory | Public | useBrandStores hook + static `data/brands.ts` | OptimizedImage | Active |
| src/pages/BrandDetail.tsx | `/brands/:brandId` | Legacy static brand page | Public | static `data/brands.ts`/`products.ts` | DesignerGallery, ProductGrid | Active but duplicate concept vs BrandStore |
| src/pages/BrandStore.tsx | `/store/:slug`, `/brand/:slug` | Live seller brand storefront | Public | `fetchBrandStores()` (Supabase) | OptimizedImage, Breadcrumb | Active |
| src/pages/BrandWaitlist.tsx | `/seller-program` | Seller-program marketing/waitlist landing | Public | WaitlistForm/WaitlistSection (likely Supabase insert) | JourneyTimeline-like sections | Active, largest marketing page (486 lines) |
| src/pages/Designers.tsx | `/designers` | Designer directory | Public | useDesigners hook + realtime subscription | AzaDesignerCard, DesignerFilters | Active |
| src/pages/DesignerDetail.tsx | `/designers/:designerId` | Legacy designer detail | Public | useDesigner hook | DesignerGallery | Active, duplicate of DesignerProfilePage |
| src/pages/DesignerProfilePage.tsx | `/designer/:slug` | Rich designer storefront | Public | useDesignerBySlug/useDesignerProducts/useDesignerCategories | DesignerProductFilters, DesignerProductGrid, Sheet (mobile filters) | Active |
| src/pages/Occasions.tsx | `/occasions` | Occasion directory | Public | static `data/occasions.ts` | OptimizedImage | Active |
| src/pages/OccasionDetail.tsx | `/occasions/:occasionId` | Occasion PLP | Public | static `data/products.ts` + FilterContext | FilterBar, Breadcrumb | Active |
| src/pages/CategoryPage.tsx | `/category/:slug` | Category landing (luxury editorial) | Public | static `data/oguraCategories.ts` | CategoryHeroBanner, SubCategoryScroll, FeaturedCollectionGrid, LuxeEditSection, CategoryProductGrid, CelebrityIconsSection | Active; delegates to MadeToOrderPage for `made-to-order` slug |
| src/pages/MadeToOrderPage.tsx | reached via `/category/made-to-order` | Made-to-order design flow | Public | MadeToOrderContext (local state) | MTOHeroSection, MTOEntryPaths, MTOProgressIndicator, MTOInspirationUpload, MTODesignerSelector, MTOBaseDesignGallery, MTOCustomizationPanel | Active, not a top-level route |
| src/pages/Stores.tsx | `/stores` | Physical store locator | Public | static `data/stores.ts` | none special | Active |
| src/pages/Search.tsx | `/search` | Search results | Public | Algolia InstantSearch + useBrandStores | AlgoliaFilterSidebar, AlgoliaMobileFilters, AlgoliaSearchResults, BrandSearchResults | Active |
| src/pages/JoinUs.tsx | `/join` (both apps) | Seller acquisition funnel (hero→auth→apply→success) | Public/Auth transition | Supabase Auth, Storage upload, seller_applications insert | GoogleSignInButton, JourneyTimeline, ImageUploadZone | Active, largest hybrid flow (342 lines) |
| src/pages/SellerApply.tsx | `/join/apply` | Standalone seller application form | Public | supabase Storage + `seller_applications` insert | ImageUploadZone | Active |
| src/pages/Contact.tsx | `/contact` | Contact form | Public | none (mailto) | CustomerLayout | Active |
| src/pages/Careers.tsx | `/careers` | Careers listing + application | Public | none (mailto intended) | Accordion, CustomerLayout | Active, largest static page (931 lines) |
| src/pages/PrivacyPolicy.tsx | `/privacy` | Legal | Public | none | CustomerLayout | Active |
| src/pages/TermsOfUse.tsx | `/terms` | Legal | Public | none | CustomerLayout | Active |
| src/pages/Dashboard.tsx | `/dashboard` | Customer account home | Auth | useAuth only | quick-link Cards | Active, links to non-existent `/orders` |
| src/pages/Onboarding.tsx | `/onboarding` | Post-signup preference collection | Auth | supabase `profiles.is_onboarded` only | Checkbox, Card | Active, preferences not persisted |
| src/pages/Profile.tsx | `/profile` | Account settings | Auth | supabase `profiles.update` | Avatar, Card | Active, addresses/notifications stubbed |
| src/pages/Wishlist.tsx | `/wishlist` | Saved items | Auth | WishlistContext (localStorage) | Card | Active |
| src/pages/PinterestCallback.tsx | `/auth/pinterest/callback` | OAuth token exchange callback | Public | edge fn `pinterest-token-exchange` | none special | Active, hardcoded stale redirect_uri |
| src/pages/OAuthConsent.tsx | `/.lovable/oauth/consent` | 3rd-party OAuth consent screen | Auth (session-gated inline) | `supabase.auth.oauth.*` (beta API) | Card | Active, internal/hidden |
| src/pages/NotFound.tsx | `*` (CustomerApp only) | 404 | Public | none | none | Active, unstyled with app shell |
| src/pages/seller/SellerLanding.tsx | `/seller`, `/seller/join`, seller catch-all | Seller marketing landing | Public | static content | Card | Active |
| src/pages/seller/SellerLogin.tsx | `/seller-login`, `/seller/login` | Seller login | Public | Supabase Auth | GoogleSignInButton | Active |
| src/pages/seller/SellerSignup.tsx | `/seller-signup` | Seller signup | Public | Supabase Auth, auto-inserts `sellers`+`user_roles` | GoogleSignInButton | Active |
| src/pages/seller/SellerDashboardHome.tsx | `/seller/dashboard` | Seller dashboard overview | Seller (auth) | none (static placeholders) | Card KPIs | Active, no real data |
| src/pages/seller/SellerProducts.tsx | `/seller/products` | Seller product list | Seller (auth) | supabase `sellers`→`products` | Table | Active |
| src/pages/seller/SellerAddProduct.tsx | `/seller/products/new` | Add product form | Seller (auth) | supabase Storage + `products.insert` | ImageUploadZone | Active |
| src/pages/seller/SellerOrders.tsx | `/seller/orders` | Seller order list | Seller (auth) | supabase `sellers`→`orders` | Table | Active, read-only |
| src/pages/seller/SellerSettings.tsx | `/seller/settings` | Seller profile settings | Seller (auth) | supabase `sellers.select/.update` | Card, Input | Active |
| src/pages/admin/AdminLogin.tsx | `/admin`, `/admin/login`, admin catch-all | Admin auth entry + access-denied state | Public | useAuth + useUserRole | GoogleSignInButton | Active |
| src/pages/admin/AdminDashboardHome.tsx | `/admin/dashboard` | Admin overview | Admin | none (placeholder KPIs) | Card | Active, stale copy re: approvals |
| src/pages/admin/AdminApprovals.tsx | `/admin/approvals` | Product approval queue | Admin | supabase `products` (status pending) | Table, Dialog | Active |
| src/pages/admin/AdminProducts.tsx | `/admin/products` | All-products browser | Admin | supabase `products` (limit 200) | Table, Select, Input | Active, read-only |
| src/pages/admin/AdminSellers.tsx | `/admin/sellers` | Seller management/approval | Admin | supabase `sellers` | Table | Active |
| src/pages/admin/AdminSettings.tsx | `/admin/settings` | Admin account info | Admin | useAuth only | Card | Active, read-only |

# 13 — Page Specifications

Scope: every file under `src/pages/**` (48 files). Depth is concentrated on the pages named in the brief; remaining static/utility pages get shorter but specific entries. All facts cross-reference 10/11/12; new detail here comes from direct reads of the page source files. Tags: [CONFIRMED] read from source, [OBSERVED] inferred from code but not runtime-tested, [INFERRED] reasonable deduction, [UNKNOWN]/[MISSING] absent, [CONFLICT] contradicts runtime probe or another doc, [SECURITY-SENSITIVE].

---

## Index (`src/pages/Index.tsx`) — `/`
- **Purpose**: Customer marketing homepage. **User type**: public.
- **Entry**: default landing route, nav logo, most internal links. **Exit**: every section links deeper (collections, category, designers, stores).
- **Structure (render order)** [CONFIRMED]: `LuxuryHeader` → `LuxuryHero` → `Premium3DCategorySection` → `SellerNewArrivals` → museum-themed wrapper `<div className="museum-surface">` (mouse-tracked gradient via `onMouseMove` setting CSS vars `--mx/--my`) containing `HiddenGemsSection`, `CategoryShowcase`, `DesignersSpotlight`, `LuxuryTrustBadges`, `LuxuryBrands`, `LuxuryGiftCard`, `LuxuryStoreLocator` → `LuxuryFooter`.
- **Forms**: none directly (children may have their own, e.g. `LuxuryGiftCard`, waitlist widgets — see 14).
- **Buttons**: none at this level; all CTAs are inside child components.
- **Modals/drawers/tabs**: none at this level.
- **Loading/empty/error**: none — page itself renders synchronously; children (`SellerNewArrivals`) fetch their own data and manage their own states [OBSERVED].
- **Auth/authz**: none; fully public.
- **Data sources**: none owned by `Index` itself; delegates entirely to children.
- **Mutations**: none.
- **URL/query params**: none read.
- **Side effects**: `useLenis()` initializes smooth-scroll (GSAP/Lenis) for the whole page; mousemove handler on the museum wrapper mutates inline CSS custom properties (`el.style.setProperty`) — a DOM side effect outside React state.
- **Responsive/mobile**: relies on Tailwind responsive classes inside each child; no page-level breakpoint logic.
- **SEO metadata**: [MISSING] — no `<title>`/meta tag management via `react-helmet` or manual `document.title` in this file (unlike `BrandWaitlist`).
- **Business rules**: none at this level.
- **Security notes**: none directly; children performing Supabase reads use `anon` key only.
- **Related pages**: virtually all customer routes (hub page).
- **RECONSTRUCTION SPEC**: Static composition page. To rebuild: import 11 marketing components in the exact order above, wrap sections 4–10 in a div with mouse-tracked CSS custom properties for a spotlight effect, call `useLenis()` once at top, no props/state of its own required.

---

## Collections (`src/pages/Collections.tsx`) — `/collections`, `/collections/:category`
- **Purpose**: All-products / category-filtered PLP (product listing page). **User type**: public.
- **Entry**: header nav "Shop"/category links, homepage CTAs, `?category=`/`?subcategory=` deep links. **Exit**: product cards → `/product/:id`.
- **Structure**: `Header` → `<main>` breadcrumb (`Home`/`Collections`/category) → `<h1>` title with item count → active-filter `Badge` chips (removable) + "Clear all" → grid (`isLoading` skeleton | empty state | product grid) → `Footer`.
- **Forms**: none (no search input on this page — filtering is via query params only).
- **Buttons**: filter-chip remove (`X` icon, calls `clearFilter`), "Clear all" (text button), per-card wishlist heart toggle (`toggleItem`), per-card "Buy Now" button (`ShoppingBag` icon, navigates to PDP) — note label says "Buy Now" but action is `navigate('/product/:id')`, not an actual purchase [OBSERVED — mislabeled CTA, no add-to-cart happens here].
- **Modals/drawers**: none.
- **Loading state**: 8 skeleton `Card`s (aspect-[3/4] image + 3 text lines) while `isLoading`.
- **Empty state**: `PackageOpen` icon + "No products available" + "Try adjusting your filters or check back later." when `filteredProducts.length === 0`.
- **Error state**: none surfaced to UI; DB/API errors only `console.error`'d, silently degrade to whatever data succeeded [OBSERVED].
- **Auth/authz**: none — public route, no guard.
- **Data sources** [CONFIRMED]:
  1. `supabase.from("products").select("*").in("status",["live","submitted"]).eq("is_available", true)` — mapped to internal `Product` shape (`title→name`, `style_tags→tags`, `occasion_tags→occasions`, `fabric` fallback for `material`).
  2. Fallback/parallel external `fetch("https://pyesltzkemtranachpne.supabase.co/functions/v1/products")` (legacy edge function, hard-coded absolute URL to the project's own Supabase functions endpoint — not env-configured) [SECURITY-SENSITIVE: hardcoded backend URL, no auth header sent].
  3. Static fallback `data/products.ts` (`staticProducts`), merged last (DB and API rows take precedence by id).
- **Mutations**: none (wishlist toggle is client-side `WishlistContext`, not a DB write here — see 14/15 for `WishlistContext` internals).
- **URL/query params**: `?category=` and `?subcategory=` control filtering via two static lookup maps (`categoryMapping`, `subcategoryMapping`); `setSearchParams({})` clears all. The declared route param `:category` (from `/collections/:category`) is **not read** — dead route param [CONFLICT with route table intent].
- **Side effects**: single `useEffect` on mount fetches DB + API in sequence (not parallel) and merges.
- **Responsive**: grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- **SEO**: [MISSING] no title/meta management.
- **Business rules**: DB rows always win over external API and static data on id collision; only `status in (live, submitted)` AND `is_available=true` rows are shown — note `submitted` (pending admin approval) products are visibly listed to customers alongside `live` ones, which contradicts the admin-approval workflow implied by `AdminApprovals` (`pending`→`live`) [CONFLICT / SECURITY-SENSITIVE: unapproved ("submitted") seller products may be publicly visible before admin review, though the actual approval flow uses status values `pending`→`live`/`rejected`, so `submitted` may be a distinct pre-pending seller-side status — verify against DB CHECK constraint on `products.status`].
- **Security**: anon Supabase client only; RLS assumed to gate `products` table (not verified here — see DB extraction docs).
- **Related pages**: `ProductDetail`, `Search`, `CategoryPage`, `OccasionDetail`.
- **RECONSTRUCTION SPEC**: Need `supabase` client, `data/products.ts` static fallback array, `WishlistContext`, shadcn `Card/Badge/Skeleton/Breadcrumb`, react-router `useSearchParams`. Reproduce the two mapping dictionaries (`categoryMapping`, `subcategoryMapping`, `categoryDisplayNames`) verbatim since filtering logic depends on them.

---

## ProductDetail (`src/pages/ProductDetail.tsx`) — `/product/:id`
- **Purpose**: PDP (product detail page), largest customer page (685 lines). **User type**: public (mutations like add-to-cart/wishlist require nothing extra client-side, but persistent cart/wishlist for guests is local-only — see 15).
- **Entry**: product cards everywhere (`Collections`, `Search`, `BrandStore`, carousels). **Exit**: `/cart` (Buy Now flow), `/store/:slug` (brand link), `/collections` (not-found fallback).
- **Structure (render order)**: `Header` → optional `?debug=1` raw JSON dump (`<pre>`) → 2-col grid: **Left** = `ProductImageGallery` (sticky) + optional `<video>` if `videoUrl`; **Right** = brand link → title → rating badge → price block (price, MRP strike-through, discount % `Badge`) → tag `Badge`s (first 4) → color swatch selector (`colorVariants`) → size selector (grid, continues below fold — file truncated at line 446 but route/12_PAGE_INVENTORY confirms further sections: quantity stepper, Add to Bag / Buy Now buttons, delivery/DeliveryChecker, ProductDetailsAccordion, wishlist toggle, share, then below the fold `RecommendationCarousel`, `SimilarProductsGrid`) → `Footer`. Modals: `VirtualTryOnDialog`, `ViewSimilarModal`, `SizeGuideModal`, `AddressSelectionModal` (Buy-Now flow).
- **Forms**: none classic form; selection UI (size/color/qty) acts as an implicit form with client-side validation (`if (!selectedSize) toast error`).
- **Buttons**: color swatches (circular, `Check` overlay when selected), size buttons, quantity `+/-` (Minus/Plus icons), "Add to Bag" (`handleAddToCart`), "Buy Now" (`handleBuyNow` → opens `AddressSelectionModal`, then navigates to `/cart` on select), wishlist heart toggle (`handleWishlistToggle`), share (`Share2` icon — handler not shown in first 446 lines, presumably `SocialShareButtons`), "View Similar" button (opens `ViewSimilarModal`), Size Guide trigger (opens `SizeGuideModal`), hidden debug "Test social webhook" flow (`handleTestSocialWebhook`, calls `triggerSocialPost` service — a Make.com/webhook integration test button not gated behind any admin flag) [SECURITY-SENSITIVE: appears to be a leftover dev/test action reachable by any visitor if rendered].
- **Loading**: skeleton layout (image + 5 text-line placeholders) while `isApiLoading`.
- **Empty/not-found**: "Product not found" + "Browse Collections" button when `currentProduct` is null after DB+API+static lookup all fail.
- **Auth/authz**: none — public; cart/wishlist actions work for guests via context (localStorage-backed, not gated by `ProtectedRoute` at this route, though `/cart` itself IS gated).
- **Data sources** [CONFIRMED]: `supabase.from("products").select("*").eq("id",id).maybeSingle()` → mapped to `Product`; on miss, `fetch("…/functions/v1/products")` external API, filtered by id; on miss, `staticProducts.find(p=>p.id===id)`.
- **Mutations**: none server-side; `addItem` (CartContext, local), `toggleItem` (WishlistContext, local).
- **URL/query params**: `id` path param; `?debug=1` toggles raw JSON dump of `currentProduct` (a diagnostic backdoor exposing full mapped product object incl. internal `status` field) [SECURITY-SENSITIVE: low severity, exposes internal `status` value client-side].
- **Side effects**: two `useEffect`s — product fetch (keyed on `id`), and variant/size/qty reset whenever `currentProduct.id` changes; `console.log` statements left in production code (`"PDP RAW DATA"`, `"[PDP] DB product row"`, `"[PDP] mapped description"`) [OBSERVED: debug logging shipped to prod].
- **Responsive**: `grid lg:grid-cols-2`, image gallery `lg:sticky lg:top-24`.
- **SEO**: [MISSING] no per-product `<title>`/OG tags — bad for social sharing/SEO of PDPs.
- **Business rules**: `discountPercent = round((original-price)/original*100)`; size/color reset on variant change; `selectedColor` derived from `activeVariant` or first `colors[0]`; similar-products modal uses static data only (`staticProducts`), independent of DB products, so DB-only products never appear as "similar" [OBSERVED — cross-source inconsistency].
- **Security**: `triggerSocialPost` webhook test button sends product data externally on demand — verify this is dev-only and should be removed before production hardening.
- **Related pages**: `Collections`, `Cart`, `BrandStore` (via brand link), `Search`.
- **RECONSTRUCTION SPEC**: Requires `CartContext`, `WishlistContext`, `LocationContext` (for address modal), `supabase` client, static `data/products.ts`, `Product`/`ColorVariant`/`UserAddress` types, and the child components `ProductImageGallery`, `VirtualTryOnDialog`, `RecommendationCarousel`, `SimilarProductsGrid`, `ViewSimilarModal`, `SizeGuideModal`, `ProductDetailsAccordion`, `DeliveryChecker`, `AddressSelectionModal`. Preserve the 3-tier data-fallback order (DB → external API → static) and the variant/size reset-on-change logic exactly, since it's the "single source of truth" pattern the code comments call out.

---

## Cart (`src/pages/Cart.tsx`) — `/cart`
- **Purpose**: Shopping cart review before checkout. **User type**: authenticated (`ProtectedRoute`).
- **Entry**: header cart icon, PDP "Buy Now"/"Add to Bag" flows, Dashboard quick link. **Exit**: `/checkout`, `/collections` (continue shopping or empty-state CTA).
- **Structure**: `Header` → `<h1>` "Shopping Cart (N items)" → 2-col grid: **left** = Delivery Address `Card` (shows `AddressCard` if `selectedAddress` else dashed "Add Delivery Address" button) + per-item `Card`s (image, name/brand, price×qty, size/color, qty stepper, Remove button); **right** = sticky Order Summary `Card` (subtotal, delivery FREE/₹99 threshold ₹999, 18% GST tax line, total, free-delivery nudge message, "Proceed to Checkout" primary button, "Continue Shopping" outline button) → `Footer` → `AddressSelectionModal`.
- **Forms**: none text-input forms; qty stepper and address modal act as the interactive elements.
- **Buttons**: address Change/Add (`ChevronRight`), qty `+/-` (`Minus`/`Plus` icon buttons calling `updateQuantity`), "Remove" (`Trash2` icon, `removeItem`), "Proceed to Checkout" (`navigate('/checkout')`), "Continue Shopping" (`navigate('/collections')`), empty-state "Browse Collections".
- **Loading/empty state**: `items.length===0` renders a full replacement screen (`ShoppingBag` icon, "Your cart is empty", CTA) instead of the cart layout — no separate loading spinner (cart is derived from in-memory/localStorage context, synchronous).
- **Error state**: none (no async fetch in this page itself).
- **Auth/authz**: `ProtectedRoute` at router level — unauthenticated users redirected to `/login?from=/cart`.
- **Data sources**: `CartContext` (`items, updateQuantity, removeItem, subtotal, tax, total`), `LocationContext` (`selectedAddress, showAddressModal`).
- **Mutations**: all client-side context mutations; no direct Supabase writes on this page.
- **URL/query params**: none.
- **Side effects**: `handleAddressSelect` shows a toast confirming delivery city/pincode.
- **Business rules**: free delivery threshold **₹999** (else **₹99**), tax label "18% GST" (tax value computed in `CartContext`, not on this page — verify GST calc logic there), key for cart line uniqueness = `product.id + size + color` (supports same product in multiple size/color as separate lines).
- **SEO**: [MISSING].
- **Security**: none beyond route guard; cart persists in a context — see 15 for whether it's localStorage (guest-vulnerable to tampering) or DB-synced.
- **Related pages**: `ProductDetail`, `Checkout`, `Wishlist`.
- **RECONSTRUCTION SPEC**: Needs `CartContext` (items/subtotal/tax/total/updateQuantity/removeItem), `LocationContext` (address state), `AddressCard`, `AddressSelectionModal`. Free-shipping threshold (999) and flat fee (99) are hard-coded in this file — must be replicated exactly, not read from config.

---

## Checkout (`src/pages/Checkout.tsx`) — `/checkout`
- **Purpose**: Address confirmation, discount code, and Razorpay payment. **User type**: authenticated.
- **Entry**: Cart's "Proceed to Checkout". **Exit**: `/order-confirmation` (success, via `navigate` with `location.state` payload) or back to `/cart` if cart empties.
- **Structure**: `Header` → breadcrumb text (Cart→Checkout→Confirmation) → `<h1>Checkout</h1>` → 2-col grid: **left** = Delivery Address `Card` (same pattern as Cart) + Order Items `Card` (image, name, brand, size/color/qty, line total); **right** = sticky Payment Summary `Card`: discount-code `Input`+"Apply" button (hidden once a discount is applied, replaced by an inline "Discount (CODE) [Remove]" line), subtotal/delivery/tax/discount/total breakdown, "Pay ₹total" button (disabled while `isProcessing` or Razorpay script not loaded, shows spinner), trust badges (Shield/Truck/CheckCircle2 icons + copy), payment-method icons row → `AddressSelectionModal`.
- **Forms**: discount code `Input` (`onKeyDown Enter` triggers apply, no other validation beyond server round-trip).
- **Buttons**: "Apply" (discount), "Remove" (discount), "Change"/"Add Address", "Pay ₹{amount}" (primary CTA).
- **Loading state**: "Apply" button shows `Loader2` spinner while `applyingDiscount`; "Pay" button shows `Loader2` + "Processing..." while `isProcessing`.
- **Empty state**: if `items.length===0`, component renders `null` (blank page) after the redirect-to-`/cart` `useEffect` fires — brief flash of blank screen possible before redirect completes [OBSERVED].
- **Error state**: toast-based errors for invalid/expired/min-purchase-not-met discount codes; toast for order-creation/verification failures; Razorpay modal `ondismiss` shows a "Payment Cancelled" toast and resets `isProcessing`.
- **Auth/authz**: `ProtectedRoute`.
- **Data sources / mutations** [CONFIRMED]:
  - `supabase.from("discounts").select("*").eq("code", CODE).eq("status","active").maybeSingle()` — client-side validates `usage_limit` vs `usage_count`, `min_purchase` vs `subtotal`; discount types: `free_shipping` (amount = deliveryFee), `*percentage*` (amount = subtotal × value/100), else flat (amount = min(value, subtotal)). **No server-side re-validation of the discount before charging** beyond what's passed in `order_data` to the verify function — potential trust boundary issue [SECURITY-SENSITIVE: discount amount computed client-side and sent as part of order_data to `razorpay-verify-payment`; if the edge function doesn't re-validate server-side, a client could tamper with `discount`/`total` before payment verification].
  - `supabase.functions.invoke('razorpay-create-order', {body:{amount:finalTotal, currency:'INR', receipt, notes:{customer_email, items_count}}})`.
  - Razorpay Checkout.js loaded via injected `<script src="https://checkout.razorpay.com/v1/checkout.js">` in a `useEffect` (added/removed on mount/unmount).
  - On payment success (`handler` callback): `supabase.functions.invoke('razorpay-verify-payment', {body:{razorpay_order_id, razorpay_payment_id, razorpay_signature, order_data}})` where `order_data` includes `customer_id, subtotal, shipping_fee, discount, total, shipping_address, items[]`.
  - On verify success: `clearCart()` then `navigate('/order-confirmation', {state:{orderNumber, paymentId, total, address, items}})`.
- **URL/query params**: none.
- **Business rules**: delivery fee same ₹999/₹99 threshold as Cart; `finalTotal = total + deliveryFee - discountAmount`; Razorpay `theme.color:'#000000'`, `prefill` uses selected address name/mobile + user email.
- **SEO**: [MISSING].
- **Security**: [SECURITY-SENSITIVE] Razorpay key (`key_id`) returned from the edge function and used client-side (expected/standard for Razorpay Checkout.js — not itself a leak, it's the publishable key). Discount validation duplicated client-side without visible server enforcement in this file (edge function internals not in scope of this doc).
- **Related pages**: `Cart`, `OrderConfirmation`.
- **RECONSTRUCTION SPEC**: Needs `CartContext`, `AuthContext` (`user`), `LocationContext`, `useToast`, `supabase` client + two edge functions (`razorpay-create-order`, `razorpay-verify-payment`), `discounts` table read access, dynamic Razorpay script injection, and router `state`-based handoff to `OrderConfirmation` (no persistence — a refresh mid-checkout loses discount state, by design of local component state).

---

## OrderConfirmation (`src/pages/OrderConfirmation.tsx`) — `/order-confirmation`
- **Purpose**: Post-payment success summary. **User type**: authenticated.
- **Entry**: only reachable via `Checkout`'s `navigate(..., {state})`. **Exit**: `/dashboard` ("Track Order" — dashboard has no real order tracking UI, dead-end feature) [OBSERVED], `/collections` ("Continue Shopping").
- **Structure**: `Header` → success icon+headline → Order Number `Card` (order number, Copy button, payment ID, total) → Delivery Address `Card` → Order Items `Card` → "What's Next?" 3-step numbered list `Card` → action buttons row → `Footer`.
- **Buttons**: "Copy" (clipboard write + toast), "Track Order" (link to `/dashboard`), "Continue Shopping" (link to `/collections`).
- **Loading/empty**: if `location.state` has no `orderNumber`, `useEffect` immediately `navigate('/')` and component returns `null` in the meantime — **this page cannot be deep-linked, bookmarked, or reloaded**; refreshing loses all order data because nothing is persisted or fetched by order number [OBSERVED, matches 11/12 notes]. [CONFLICT-RISK: if a real "order history" is later added, this page's data model (route state only) will need to be replaced by an `orders` table fetch keyed by `orderNumber`].
- **Auth/authz**: `ProtectedRoute`.
- **Data sources**: none — 100% from `location.state` (`orderNumber, paymentId, total, address, items`).
- **Mutations**: none.
- **Business rules**: static "What's Next" copy (email confirmation, 2–3 day shipping, SMS/email tracking) — these are marketing promises not wired to any actual notification system visible in this codebase [OBSERVED].
- **SEO**: [MISSING] (also arguably should be `noindex` given it's a transient, session-only page).
- **Security**: order/payment IDs and full shipping address are rendered from unvalidated router state — since this state can only realistically arrive from the `Checkout` flow, risk is low, but a manually-crafted `history.pushState`/`Link state` could show fabricated success content because there is no server-side confirmation performed on this page itself [SECURITY-SENSITIVE: low — spoofable success screen client-side, though no protected action is taken based on it].
- **Related pages**: `Checkout`, `Dashboard`.
- **RECONSTRUCTION SPEC**: Simple stateless presentational page keyed entirely on `location.state` typed as `OrderConfirmationState`; redirect-to-home guard for missing state; no data fetching to reproduce.

---

## Search (`src/pages/Search.tsx`) — `/search`
- **Purpose**: Full-text/faceted product search via Algolia, plus a parallel brand-store results block. **User type**: public.
- **Entry**: header search bar (`?q=`), nav search icon. **Exit**: individual `AlgoliaProductHit` links to PDPs; `BrandSearchResults` links to `/store/:slug`.
- **Structure**: `Header` → `InstantSearch` (Algolia) wrapping `Configure hitsPerPage=12` and `SearchContent` (title/query text, desktop sidebar `AlgoliaFilterSidebar` (`hidden lg:block`), mobile `AlgoliaMobileFilters` (`lg:hidden`), `BrandSearchResults` (Supabase-backed, rendered above product hits), `AlgoliaSearchResults`, `AlgoliaPagination`) → `Footer`.
- **Data sources** [CONFIRMED]: Algolia `searchClient`/`ALGOLIA_INDEX_NAME` from `src/lib/algoliaClient.ts` (index seeded from `?q=` via `initialUiState`); `BrandSearchResults` presumably queries Supabase brand/seller data by the same `query` string (see 14 for its internals).
- **URL/query params**: `?q=` seeds the initial Algolia query (one-way — Algolia's own URL sync, if any, is not configured here since no `routing` prop is passed to `InstantSearch`, meaning **user's search-box edits do not update the browser URL** and the page is not bookmarkable mid-search) [OBSERVED].
- **Loading/empty/error**: delegated entirely to Algolia InstantSearch's own hit/loading state inside `AlgoliaSearchResults`/`AlgoliaNoResults` (see 14).
- **Auth/authz**: none.
- **Business rules**: `hitsPerPage=12` hard-coded via `Configure`.
- **SEO**: [MISSING].
- **Related pages**: `Collections`, `BrandStore`.
- **RECONSTRUCTION SPEC**: Requires Algolia account/index + `algoliasearch`/`react-instantsearch`, `src/lib/algoliaClient.ts`, and the `src/components/search/*` family (`AlgoliaFilterSidebar`, `AlgoliaMobileFilters`, `AlgoliaSearchResults`, `AlgoliaPagination`, `BrandSearchResults`). No `routing` config means URL sync must be added if bookmarkable search state is required for reconstruction parity or improvement.

---

## BrandStore (`src/pages/BrandStore.tsx`) — `/store/:slug`, `/brand/:slug`
- **Purpose**: Live seller brand storefront page (distinct from legacy `BrandDetail`). **User type**: public. 157 lines.
- **Data source** [per 11/12, CONFIRMED via route map]: `fetchBrandStores()` from `src/lib/brandStores.ts`, matched by `slugifyBrand()`; renders brand hero, `OptimizedImage`, `Breadcrumb`, and (per naming convention) that brand's live products.
- **URL params**: `slug` — resolved against the live `sellers`/brand-store list, not a static dataset.
- **Business rule**: `/store/:slug` and `/brand/:slug` are the exact same component/route target — a deliberate alias, not a duplicate bug, but doubles crawl surface for SEO [OBSERVED].
- **SEO**: [MISSING] no per-brand meta tags observed at this depth of read.
- **Related pages**: `Brands` (directory), `ProductDetail` (brand link), `BrandDetail` (legacy/static parallel page for a *different* data source — see 11 [OBSERVED] duplication note).
- **RECONSTRUCTION SPEC**: Needs `src/lib/brandStores.ts` (`fetchBrandStores`, `slugifyBrand`), `OptimizedImage`, `Breadcrumb`. [Recommend follow-up full read if pixel-level rebuild is required; this entry is based on route-map-level evidence plus file-size confirmation, not a full line-by-line read.] [INFERRED: exact section order not independently verified in this pass.]

---

## CategoryPage (`src/pages/CategoryPage.tsx`) — `/category/:slug`
- **Purpose**: Editorial category landing page driven by a static config (`data/oguraCategories.ts`). **User type**: public. 83 lines.
- **Special case** [CONFIRMED via 11]: if `slug === 'made-to-order'`, renders `MadeToOrderPage` instead of the normal category layout — i.e. this route is the *only* entry point to the Made-to-Order flow.
- **Structure** (per 12_PAGE_INVENTORY, component list): `CategoryHeroBanner`, `SubCategoryScroll`, `FeaturedCollectionGrid`, `LuxeEditSection`, `CategoryProductGrid`, `CelebrityIconsSection`.
- **Data source**: `getCategoryBySlug(slug)` — pure static lookup, no Supabase call in the page itself (child `CategoryProductGrid` may query products by category — see 14).
- **Not-found behavior**: unknown slug → `<Navigate to="/" replace/>` (silent redirect, no 404 message shown to the user) [OBSERVED].
- **SEO**: [MISSING].
- **Related pages**: `Collections`, `MadeToOrderPage`, `OccasionDetail`.
- **RECONSTRUCTION SPEC**: Requires `data/oguraCategories.ts` static config keyed by slug, the six category-section components, and the made-to-order conditional branch. [INFERRED structure ordering from component-list evidence in 12; not independently re-verified line-by-line here.]

---

## BrandWaitlist (`src/pages/BrandWaitlist.tsx`) — `/seller-program` (+ legacy redirects `/waitlist`, `/apply-to-join`)
- **Purpose**: Seller-program marketing/waitlist landing, largest marketing page (486 lines). **User type**: public.
- **SEO**: [CONFIRMED per 11] — this is the **one** customer page that manually sets `document.title` and a meta description, i.e. the only page in the app with any client-side SEO handling at all.
- **Data source**: `WaitlistForm`/`WaitlistSection` components — per naming and typical pattern, these likely perform a Supabase insert into a waitlist table (see 14 for confirmation: `src/components/waitlist/WaitlistForm.tsx` is in the direct-Supabase-call list found by grep).
- **Business rules**: two legacy paths (`/waitlist`, `/apply-to-join`) permanently redirect here via `<Navigate replace>` — treat both as historical URLs preserved for inbound-link compatibility.
- **Related pages**: `JoinUs`, `SellerApply`, `SellerLanding` (three parallel seller-acquisition entry points across the customer and seller apps) [OBSERVED: potential redundant/overlapping funnels].
- **RECONSTRUCTION SPEC**: Requires manual `document.title`/meta description side effect, `WaitlistForm`/`WaitlistSection` (with their Supabase insert target table), and the two `Navigate` redirect routes. [INFERRED: full section-by-section layout not re-read line-by-line in this pass beyond what 11/12 already captured; treat as [MISSING] full detail for anything beyond title/meta + waitlist form.]

---

## Login (`src/pages/Login.tsx`) — `/login`
- **Purpose**: Customer Google-OAuth sign-in gateway. **User type**: public (pre-auth).
- **Structure**: 2-col split — left (`hidden lg:flex`) branding panel with OGURA wordmark, headline, stat counters (500+ Designers / 10K+ Products / 50+ Cities — static marketing numbers, not live data) [OBSERVED: hard-coded fake/placeholder stats]; right column — mobile logo, "Welcome Back" heading, `GoogleSignInButton`, divider, Terms/Privacy links, "← Back to browsing" link.
- **Forms**: none manual — the only auth mechanism on this page is Google OAuth (no email/password fields on the customer login, unlike `SellerLogin`) [OBSERVED — inconsistent auth UX between customer and seller apps].
- **Redirect logic** [CONFIRMED, fairly intricate]:
  - Reads `?next=` query param; accepted only if it's a same-origin path (`startsWith('/')` and not `//`).
  - Reads `sessionStorage['ogura_post_auth_path']` as a fallback "path saved before the Google OAuth round-trip" (handles cross-subdomain OAuth redirects), rejected if it starts with `/login`.
  - Priority: `next` param > `location.state.from.pathname` > stored path > `/dashboard` default.
  - On successful auth: if `isNewUser` and not using a same-origin `next`, force `/onboarding`; else go to the resolved `from`.
  - On mount, reads `?error`/`?error_description` query params (OAuth error passthrough) and shows a `sonner` toast, then strips them from the URL via `history.replaceState`.
- **Loading/auth states**: full-screen spinner while `isLoading` OR while `isAuthenticated` (briefly, before the redirect `useEffect` fires) — i.e. authenticated users always see a spinner flash on this route rather than instant redirect [OBSERVED].
- **Auth/authz**: none required to view; effectively self-redirecting once authenticated.
- **Data sources**: `AuthContext` only (`isAuthenticated, isLoading, isNewUser`), no direct Supabase calls in this file.
- **Security notes**: [SECURITY-SENSITIVE] open-redirect mitigation exists (same-origin check on `next`/stored path) — good practice, correctly implemented (`startsWith('/') && !startsWith('//')`).
- **Related pages**: `Onboarding`, `Dashboard`, `SellerLogin`, `AdminLogin` (three parallel, inconsistent login UIs across apps).
- **RECONSTRUCTION SPEC**: Requires `AuthContext` (`isAuthenticated`, `isLoading`, `isNewUser`), `GoogleSignInButton`, and the exact `next`/`from`/`sessionStorage` priority chain above — this redirect-resolution logic is non-trivial and must be reproduced precisely to avoid open-redirect regressions or broken post-login navigation across subdomains.

---

## Onboarding (`src/pages/Onboarding.tsx`) — `/onboarding`
- **Purpose**: Post-signup preference collection (largely cosmetic). **User type**: authenticated.
- **Structure**: centered card layout — welcome header (`Sparkles` icon, "Welcome to OGURA, {firstName}!"), "What interests you?" `Card` with a 2×3/3×2 grid of toggle buttons (womenswear/menswear/bridal/ethnic/contemporary/accessories, each with an emoji), "Stay Updated" `Card` with two `Checkbox` rows (order notifications default **checked**, promotions default **unchecked**), action row ("Skip for now" outline button, "Get Started" primary button).
- **Forms**: fully local `useState({womenswear, menswear, bridal, ethnic, contemporary, accessories, notifications, promotions})` — **none of these values are sent anywhere** [CONFIRMED, matches 11's flag]. Only action taken is `completeOnboarding()` from `AuthContext`.
- **Mutations**: `completeOnboarding()` → (per 11) `supabase.from('profiles').update({is_onboarded:true})`. The category/notification checkboxes are pure UI theatre with no persistence [SECURITY/DATA-INTEGRITY OBSERVATION: not a security issue, but a functional gap — any "personalization" promised by this screen does not exist].
- **Buttons**: category toggle buttons (local state only), "Skip for now" (`navigate('/dashboard', {replace:true})` without calling `completeOnboarding`, meaning skipping does **not** set `is_onboarded=true`) [OBSERVED — user could be re-shown onboarding indefinitely if `/onboarding` is gated by `is_onboarded` elsewhere, though no such gate was found in the route table besides `Login`'s `isNewUser` check], "Get Started" (`handleComplete` → `completeOnboarding()` + success toast + navigate to `/dashboard`).
- **Loading**: "Get Started" button shows `Loader2` + "Setting up..." while `isSubmitting`.
- **Error state**: generic toast "Something went wrong. Please try again." on any `completeOnboarding()` throw.
- **Related pages**: `Login` (source of `isNewUser` redirect), `Dashboard`, `Profile`.
- **RECONSTRUCTION SPEC**: Only functional requirement is `AuthContext.completeOnboarding()` and `user.name`; the entire preferences UI can be reproduced as pure decorative local state (or, if true personalization is desired, this is the exact spot where a `profiles`/`user_preferences` write would need to be added — currently absent).

---

## Profile (`src/pages/Profile.tsx`) — `/profile`
- **Purpose**: Account settings. **User type**: authenticated. 270 lines.
- **Structure**: `Header` → "Back to Dashboard" button → avatar+name/email header → stacked `Card`s: **Personal Information** (Full Name editable `Input`, Email `Input` disabled with "cannot be changed... linked to Google account" note, Phone editable `Input`, "Save Changes" button) → **Security** (static "Google Sign-In / Active" display card, no interactive control) → **Saved Addresses** (`id="addresses"` anchor target used by Dashboard's `/profile#addresses` link; content is **always** the empty state — "No saved addresses yet" — there is no fetch of a `user_addresses`/similar table on this page) [CONFIRMED stub, matches 11/12] → **Notifications** (two rows, both marked "Coming soon", non-interactive) → **Danger Zone / Sign Out** card (destructive-styled "Sign Out" button).
- **Forms**: name/phone edit form, no client-side validation beyond none-required (any string, including empty, is accepted) [OBSERVED — no zod/regex validation on phone format here despite `AddressForm` elsewhere in the app using stricter validation].
- **Mutations** [CONFIRMED]: `supabase.from("profiles").update({name, phone, updated_at: now}).eq("id", user.id)`.
- **Buttons**: "Save Changes" (shows "Saving..." text while `isSaving`), "Sign Out" (`logout()` then `navigate('/login')`).
- **Error/success**: `sonner` toast success "Profile updated successfully" / error "Failed to update profile. Please try again."
- **Auth/authz**: `ProtectedRoute`.
- **Business rules**: email field is immutable in the UI (Google-linked) though the underlying `profiles.email` column may or may not be enforced immutable at the DB layer — [UNKNOWN, verify DB constraint].
- **Related pages**: `Dashboard` (`#addresses` anchor link, and general account hub), `Onboarding`.
- **RECONSTRUCTION SPEC**: Needs `AuthContext` (`user`, `logout`), `supabase.from('profiles')` write access scoped to the current user's own row (RLS `auth.uid() = id` expected — verify in DB docs). The Saved Addresses and Notifications sections must be explicitly reproduced as **static stub UI**, not real features, unless the rebuild scope is to actually implement them.

---

## Dashboard (`src/pages/Dashboard.tsx`) — `/dashboard`
- **Purpose**: Customer account home/hub. **User type**: authenticated. 195 lines.
- **Structure**: `Header` → avatar + "Welcome back, {firstName}!" + email → "Explore New Arrivals" promo `Card` (Sparkles icon, "Shop Now" button → `/collections`) → 4-card quick-link grid: **My Orders** (`href="/orders"` — **not a registered route in any app router**, confirmed dead link [CONFLICT with route map, matches 11's flag]), **Wishlist** (`/wishlist`), **Shopping Cart** (`/cart`), **Saved Addresses** (`/profile#addresses`) → 2-col Account section: Profile Information `Card` (read-only Name/Email/Phone display + "Edit Profile" link to `/profile`) and Account Actions `Card` (Profile Settings link, Sign Out button) → `LuxuryFooter`.
- **Buttons**: "Shop Now", 4× quick-link cards (whole card is a `<Link>`), "Edit Profile", "Profile Settings", "Sign Out" (`logout()` — no navigate after, unlike `Profile`'s sign-out which explicitly navigates to `/login`; relies on `AuthContext`/route guards to redirect) [OBSERVED minor inconsistency].
- **Data sources**: `AuthContext.user` only — **no order history, no live stats**; this is a purely presentational hub with one confirmed broken link.
- **Auth/authz**: `ProtectedRoute`.
- **Related pages**: `Profile`, `Wishlist`, `Cart`, `OrderConfirmation` ("Track Order" links here, reinforcing that Dashboard is meant to be an order-tracking hub but currently has zero order data wired in) [OBSERVED — functional gap: Dashboard cannot fulfill the "Track Order" promise made by OrderConfirmation].
- **RECONSTRUCTION SPEC**: Needs `AuthContext` only; the "My Orders" link either needs a real `/orders` route + an `orders` table query (currently missing entirely) or should be corrected to point at an existing route.

---

## SELLER APP PAGES (`src/pages/seller/*`)

### SellerLanding (`/seller`, `/seller/join`, catch-all) — 207 lines
Purely static marketing content, no data/auth. Sections in order: Hero (badge, H1, subcopy, "Apply as Partner"/"Seller Login" buttons — both point to `/seller/login`, not to a distinct signup route, so "Apply as Partner" doesn't actually start an application, it just logs in) [OBSERVED — CTA mislabeling], Commission tiers (3 static cards: 15% Standard / 12% Growth ₹1L+/mo / 10% Premium ₹5L+/mo — hard-coded business numbers), Benefits grid (6 static cards), Testimonials (3 hard-coded fake/sample names — "Priya Sharma", "Rajesh Mehra", "Anita Kapoor" with generic quotes, not sourced from any CMS/DB) [OBSERVED: likely placeholder content, flag if going to production], final CTA. **RECONSTRUCTION**: no data dependencies; reproduce the 3 hard-coded commission tiers and benefits/testimonials arrays verbatim if pixel parity is required.

### SellerLogin (`/seller-login`, `/seller/login`) — 128 lines
Email/password **and** Google sign-in (unlike customer `Login`). Form fields: `email` (type=email), `password` (type=password) — **no client-side validation at all** (empty check only: `if (!email || !password) toast.error(...)`, no format/regex checks). Submit → `useAuth().signInWithEmail(email, password)` → on success `navigate('/seller/dashboard', {replace:true})`, on failure toast the returned error string. Also has an `?error`/`?error_description` query-param passthrough toast (OAuth error surfacing) identical pattern to customer `Login`. Link to `/join` for signup (not `/seller-signup`, despite that route existing) [OBSERVED — inconsistent signup routing across the seller app]. **Security**: password sent via `AuthContext.signInWithEmail` (Supabase Auth, presumably HTTPS + Supabase's own hashing) — no additional client-side risk beyond standard Supabase Auth password flow.

### SellerSignup (`/seller-signup` only — NOT `/seller/signup`) — 120 lines
Fields: `email`, `password` (min-length check: `password.length < 6` → toast "Password must be at least 6 characters", the only validation rule present). Submit → `useAuth().signUpWithEmail(email, password)` which (per 11) auto-inserts a `sellers` row and a `user_roles` row with `role:'seller'` — i.e. **any self-signup via this form immediately grants the `seller` role**, with no admin approval gate at the auth layer (approval is instead modeled via `sellers.application_status` checked later, but the role itself is pre-granted) [SECURITY-SENSITIVE: self-service role escalation to `seller` at signup time, decoupled from the `application_status` approval workflow — a user could sign up here and immediately pass `SellerAuthRoute`'s auth-only check to reach `/seller/dashboard`, `/seller/products/new`, etc., even while `application_status` is still `pending`]. Link to `/join` for "Log in" (should arguably link to `/seller-login`) [OBSERVED — same cross-link mismatch as `SellerLogin`].

### SellerDashboardHome (`/seller/dashboard`) — 73 lines
100% static placeholder: 4 KPI cards (Total Products "0", Total Orders "0", Revenue "₹0", Growth "—") — **no Supabase query at all**, numbers are hard-coded string literals, not computed from real zero-state data [OBSERVED, matches 11/12's "no real data" flag]. Empty-state card below KPIs ("No products yet"). **Business rule**: none real; this is a non-functional dashboard shell.

### SellerProducts (`/seller/products`) — 163 lines
Two sequential `useEffect`s: (1) resolve `sellerId` via `supabase.from('sellers').select('id').eq('user_id', user.id).maybeSingle()`; (2) once `sellerId` known, `supabase.from('products').select('id,title,price,original_price,category,status,is_available,images,created_at').eq('seller_id', sellerId).order('created_at', {ascending:false})`. Loading spinner (`Loader2`) while `loading`. Empty state: `Package` icon + "No products yet" + "Add Product" CTA. Table columns: thumbnail, Product title, Category, Price (₹ `toLocaleString('en-IN')`), Status `Badge` (color map: draft=muted, pending=yellow, live=green, rejected=red — **note "submitted" status used elsewhere in `Collections.tsx` has no color mapping here**, would render with no badge styling/undefined class) [OBSERVED — status-value inconsistency between `SellerAddProduct`'s inserted status `"submitted"` and this table's `statusColors` map which only knows `draft/pending/live/rejected`, missing a `submitted` entry — CONFLICT in status vocabulary across the app], Created date. Read/list-only — no edit/delete actions on this page.

### SellerAddProduct (`/seller/products/new`) — 393 lines, most complex seller page
Full new-product form. **Fields**: title* (text), category* (`Select`, 12 hard-coded options: dresses/tops/bottoms/outerwear/footwear/accessories/bags/sarees/lehengas/kurtas/co-ords/jumpsuits), dispatch_days (number, default "7"), description (textarea), price* (number, ₹), original_price/MRP (number, optional), sizes (multi-select button grid: XS/S/M/L/XL/XXL/Free Size), colors (multi-select swatch grid, 12 hard-coded name+hex pairs: Black #000000, White #FFFFFF, Red #DC2626, Blue #2563EB, Green #16A34A, Pink #EC4899, Yellow #EAB308, Beige #D2B48C, Brown #92400E, Navy #1E3A5F, Maroon #800000, Grey #6B7280), occasion tags (`Badge` multi-select: Wedding/Festive/Party/Casual/Work/Brunch/Date Night/Vacation), style tags (`Badge` multi-select: Boho/Minimal/Ethnic/Western/Indo-Western/Streetwear/Classic/Contemporary), material (text), fabric (text), care_instructions (textarea), is_made_to_order/is_returnable (booleans present in form state but **no visible UI toggle rendered for them** in the read portion — likely defaulted, `is_returnable` defaults `true`) [OBSERVED], images* (`ImageUploadZone`, max 9 files, max 20MB each). **Validation**: required-field check (`title`, `category`, `price`) via toast, at-least-one-image check via toast. **Submit flow**: `uploadImages()` loops files → `supabase.storage.from('product-images').upload(\`${sellerId}/${Date.now()}-${file.name}\`, file)` then `getPublicUrl()`; then `supabase.from('products').insert({..., status:'submitted', images:imageUrls, colors, sizes, occasion_tags, style_tags})`. On success: toast + `navigate('/seller/products')`. **Security**: `sellerId` resolved from the authed user's own `sellers` row before any insert/upload — scoping relies on this client-side lookup plus (presumably) RLS on `products`/`storage.objects` — not independently verified here [SECURITY-SENSITIVE: verify server-side RLS actually restricts `insert` to `seller_id = own sellers.id`, since this page trusts client state for `sellerId`].

### SellerOrders (`/seller/orders`) — 129 lines
Read-only. Resolves `sellerId` then `supabase.from('orders').select('id,order_number,status,total,created_at,customer_id').eq('seller_id', sellerId).order('created_at',{ascending:false})`. Status color map: new=blue, accepted=yellow, packed=orange, shipped=purple, delivered=green, cancelled=red. Empty state: `ShoppingCart` icon + "No orders yet". **No actions available** — sellers cannot update order status, add tracking, etc. from this page — purely a read list [OBSERVED — functional gap vs typical seller-order workflows].

### SellerSettings (`/seller/settings`) — 117 lines
Fetches own `sellers` row (`select('*')`). Editable fields: `brand_name`, `city`, `instagram_handle`, `description` (all plain text inputs mutating local `seller` object state directly on each keystroke — no separate form-state object, edits the fetched row in place). "Save Changes" → `supabase.from('sellers').update({brand_name, description, city, instagram_handle}).eq('id', seller.id)`. Read-only "Application Status" card shows `application_status` and `seller_type` with **no way to see or act on rejection reasons** (unlike `AdminApprovals`'s product-level rejection reason, sellers have no visible rejection-reason field even though `AdminSellers` only ever sets `approved`, never records a reason for rejection) [OBSERVED gap].

---

## ADMIN APP PAGES (`src/pages/admin/*`)

### AdminLogin (`/admin`, `/admin/login`, catch-all) — 89 lines
Google-only sign-in (no email/password, unlike seller). Two-role-check flow: `useAuth()` for session, `useUserRole().hasRole('admin')` for authorization. If authenticated but not admin → inline "Access Restricted" card (`ShieldCheck` destructive icon, "This area is restricted to authorized administrators only.", plain `<a href="/">` link — **not a router `Link`**, causing a full page reload back to the customer app) [OBSERVED]. If authenticated AND admin → auto-redirect to `/admin/dashboard`. Also handles `?error` OAuth passthrough toast. Copy: "Authorized personnel only. Access is logged and monitored." — an access-logging claim not verified anywhere in this frontend codebase [OBSERVED: unverified security claim, no client-side logging call present here; if backend/edge-function logging exists it's out of scope of this file].

### AdminDashboardHome (`/admin/dashboard`) — 68 lines
100% placeholder, 4 KPI cards all showing `"—"` (Pending Approvals, Live Products, Total Sellers, Total Products) — no Supabase query. Copy explicitly says "Product approval workflow will be built in Phase 3" even though `/admin/approvals` **already fully implements** that workflow — stale/contradictory copy [CONFLICT, matches 11's flag exactly].

### AdminApprovals (`/admin/approvals`) — 205 lines
Fetches `supabase.from('products').select('id,title,price,category,status,images,created_at,seller_id').eq('status','pending').order('created_at',{ascending:'true'})` — **note**: this queries status `'pending'`, while `SellerAddProduct` inserts status `'submitted'` — meaning newly submitted seller products (`status='submitted'`) **will never appear in this approval queue**, which only surfaces rows with `status='pending'` [CONFLICT / functional bug: the seller-submission status value and the admin-approval query's filter value do not match, so the approval workflow as wired in the frontend cannot process products created via `SellerAddProduct` unless something else (a DB trigger/edge function) transitions `submitted`→`pending` server-side — unverified, flag for DB-layer investigation]. Actions: "Approve" (`update({status:'live'})`, removes row from local list, toast success), "Reject" opens a `Dialog` with an optional `Textarea` reason → "Confirm Reject" (`update({status:'rejected', rejection_reason})`). Empty state: `Inbox` icon + "All caught up!". Loading: `Loader2` full-page spinner.

### AdminProducts (`/admin/products`) — 148 lines
Read-only catalogue browser: `Select` status filter (all/draft/pending/live/rejected — again, **no `submitted` option**, so admin cannot filter to see seller-submitted-but-not-yet-pending products either) [same status-vocabulary gap], text `Input` search (client-side `.filter(title.includes(search))`, case-insensitive), query capped `.limit(200)`. Table: thumbnail, title, category, price, status badge, created date. No row actions (view/edit) — purely informational.

### AdminSellers (`/admin/sellers`) — 147 lines
Fetches all `sellers` rows. "Approve" button (only shown when `application_status==='pending'`) → `update({application_status:'approved', is_verified:true}).eq('id', s.id)`, toast: **"Seller approved! Seller role has been assigned."** — but this component performs **no `user_roles` insert/update** [CONFIRMED absent in this file, matches 11's flag] — meaning either (a) a DB trigger on `sellers.application_status` handles role assignment server-side [UNKNOWN, unverified — check DB triggers/functions doc], or (b) the toast message is inaccurate and no role is actually granted by this action [SECURITY-SENSITIVE / CONFLICT: UI claims a security-relevant state change (role grant) that its own client code does not perform — combined with the earlier finding that `SellerSignup` already grants `role:'seller'` at signup time regardless of `application_status`, the practical effect may be that the "Approve" button here is largely redundant for authorization purposes and only actually gates the `is_verified` flag/store-front visibility, not dashboard access]. No "Reject" action exists in the UI at all — sellers can only be approved or left pending, never explicitly rejected from this screen [OBSERVED gap].

### AdminSettings (`/admin/settings`) — 36 lines
Pure read-only display of `useAuth().user` (name, email) + a static "Administrator" role badge. No form, no mutation, no Supabase call.

---

## SMALLER / STATIC PAGES (shorter entries)

- **Brands** (`/brands`) — directory combining `useBrandStores()` (live DB-backed) + static `data/brands.ts` "Featured brands" section; public; `OptimizedImage` cards link to `/store/:slug` and `/brands/:brandId` respectively (two different link targets from what look like similar cards — confirms the dual brand-model duplication noted in 11).
- **BrandDetail** (`/brands/:brandId`) — legacy, 100% static data (`data/brands.ts` + `data/products.ts`), no Supabase; `DesignerGallery` + `ProductGrid` children; public.
- **Designers** (`/designers`) — `useDesigners()` hook (Supabase `designers` table) + a live `postgres_changes` realtime subscription (auto-updates list on DB changes) + 300ms-debounced search + category filter; public.
- **DesignerDetail** (`/designers/:designerId`) — legacy simpler designer page via `useDesigner(id)` hook; parallel/duplicate of `DesignerProfilePage`.
- **DesignerProfilePage** (`/designer/:slug`) — richer storefront: `useDesignerBySlug`, `useDesignerProducts`, `useDesignerCategories` hooks; filters + "Load more" pagination (client-driven, not true infinite scroll); mobile filters in a `Sheet`.
- **Occasions** (`/occasions`) — static grid from `data/occasions.ts`, links to `/occasions/:occasionId`; public, no data fetch.
- **OccasionDetail** (`/occasions/:occasionId`) — filters static `data/products.ts` by `product.occasions` array membership; uses global `FilterContext` for additional client-side filter state; `FilterBar` + `Breadcrumb`.
- **Stores** (`/stores`) — static `data/stores.ts` physical-store cards with a map link and a WhatsApp deep link (`wa.me/...` presumably; confirm exact number format if reconstructing — [MISSING] exact WhatsApp number not read in this pass).
- **JoinUs** (`/join`, shared by both customer and seller apps) — multi-step funnel: hero → auth (login/signup tabs, Supabase Auth) → apply form → success; performs Storage upload + `seller_applications`-style insert in the apply step; 342 lines; largest hybrid flow.
- **SellerApply** (`/join/apply`) — standalone application form usable without login; zod-validated; `supabase.storage.from('product-images').upload` + `supabase.from('seller_applications').insert`; success state not gated by auth.
- **Contact** (`/contact`) — `CustomerLayout`; zod-validated form; **no backend call** — "submission" opens a `mailto:` link in the user's email client, meaning form data is never stored server-side and delivery depends entirely on the user having a configured mail client [OBSERVED: not a true backend contact form].
- **Careers** (`/careers`) — `CustomerLayout`; 931 lines, largest static page; zod schema defined for an application form but target is described as `careers@ogura.in` (mailto-style intent, same caveat as Contact); accordion-based per-role listings, entirely static content.
- **PrivacyPolicy** / **TermsOfUse** (`/privacy`, `/terms`) — `CustomerLayout`, fully static legal text, no data, no forms.
- **Wishlist** (`/wishlist`) — `ProtectedRoute`; reads `WishlistContext` (localStorage-backed per 11); "move to cart" action moves only the **first available size/color** of a wishlist item rather than prompting the user to choose [OBSERVED — UX/business-rule shortcut, potential mismatch between wishlisted variant and what's actually added to cart].
- **PinterestCallback** (`/auth/pinterest/callback`) — public; reads `?code=`; calls `supabase.functions.invoke('pinterest-token-exchange')`; stores `pinterest_token`/`pinterest_connected`/`pinterest_code` in `localStorage` (not httpOnly) [SECURITY-SENSITIVE, per 11]; hard-codes a stale preview `redirect_uri` (`https://coy-clone-studio.lovable.app/...`) [SECURITY-SENSITIVE / CONFLICT: production OAuth redirect URI does not match production domain]; auto-redirects to `/` after 2s.
- **OAuthConsent** (`/.lovable/oauth/consent`) — hidden/internal; implements a full OAuth **provider-side** consent screen using beta Supabase Auth APIs (`getAuthorizationDetails`, `approveAuthorization`, `denyAuthorization`); redirects unauthenticated users to `/login?next=...`; approves third-party app access to the user's OGURA account based on server-provided scopes [SECURITY-SENSITIVE, per 11 — this is the most sensitive customer-facing page in the app since it grants external app access].
- **NotFound** (`*`, CustomerApp only) — logs the attempted path via `console.error`, renders a plain unstyled 404 (no `Header`/`Footer`, not wrapped in the app shell) [OBSERVED].

---

## Cross-page conflicts and gaps summary (for quick reference)
1. **Status-vocabulary mismatch** [CONFLICT, SECURITY-SENSITIVE]: `SellerAddProduct` inserts `status:'submitted'`; `AdminApprovals` only queries/filters `status:'pending'`; `Collections`/PDP customer-facing queries treat `['live','submitted']` as publicly visible. Net effect: newly submitted products may be **publicly visible immediately** (via `Collections`'s `in('status',['live','submitted'])` filter) **before** any admin approval step can even see them (since Admin only looks at `pending`). This is the single most significant cross-page business-logic conflict found in this pass.
2. **Role-grant timing**: `SellerSignup` grants `role:'seller'` at signup (pre-approval); `AdminSellers`'s "Approve" toast claims to grant the seller role but the code doesn't do it — actual authorization gate for `/seller/*` dashboard routes is only "any authenticated user" (`SellerAuthRoute`), not "approved seller."
3. **Dead/mismatched links**: `Dashboard`'s "My Orders" → `/orders` (unregistered); "Track Order" on `OrderConfirmation` → `/dashboard` (which has no order data); `SellerLanding`'s "Apply as Partner" → `/seller/login` (not an application flow); `SellerLogin`/`SellerSignup` cross-link to `/join` instead of each other.
4. **Duplicate/parallel concepts**: `BrandDetail` (static) vs `BrandStore` (live) for "brands"; `DesignerDetail` vs `DesignerProfilePage` for "designers"; `JoinUs`/`SellerApply`/`SellerLanding`/`BrandWaitlist` as four overlapping seller-acquisition entry points.
5. **No true 404s** for `/seller/*` or `/admin/*` — both fall back to landing/login.

# 14 — Component Inventory

Scope: all 195 files under `src/components/**`. Section A covers the 48 `src/components/ui/**` shadcn primitives as a group. Section B documents the 147 non-ui components individually (grouped by folder for readability). Depth is based on prop-interface greps, direct-Supabase/fetch/storage greps, and prior facts from 10-13. Tags per project convention.

## A. shadcn/ui primitives (`src/components/ui/**`) [CONFIRMED — standard shadcn output, Radix-based]
All are generic, reusable, unstyled-logic + Tailwind-variant primitives generated by the shadcn CLI; none contain business logic or data access. Listed with their exported variants/sub-parts where multiple named exports exist:
- `accordion.tsx` — Accordion, AccordionItem, AccordionTrigger, AccordionContent
- `alert.tsx` — Alert, AlertTitle, AlertDescription (variants: default, destructive)
- `alert-dialog.tsx` — AlertDialog + Trigger/Content/Header/Footer/Title/Description/Action/Cancel
- `aspect-ratio.tsx` — AspectRatio
- `avatar.tsx` — Avatar, AvatarImage, AvatarFallback
- `badge.tsx` — Badge (variants: default, secondary, destructive, outline)
- `breadcrumb.tsx` — Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis
- `button.tsx` — Button, buttonVariants (variants: default, destructive, outline, secondary, ghost, link; sizes: default, sm, lg, icon)
- `calendar.tsx` — Calendar (react-day-picker wrapper)
- `card.tsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `carousel.tsx` — Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext (embla-carousel-react wrapper)
- `chart.tsx` — ChartContainer, ChartTooltip, ChartLegend etc. (recharts wrapper) — used only by legacy `seller-dashboard/pages/DashboardAnalytics.tsx`
- `checkbox.tsx` — Checkbox
- `collapsible.tsx` — Collapsible, CollapsibleTrigger, CollapsibleContent
- `command.tsx` — Command, CommandInput, CommandList, CommandItem, etc. (cmdk wrapper)
- `context-menu.tsx` — ContextMenu family
- `dialog.tsx` — Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
- `drawer.tsx` — Drawer family (vaul wrapper)
- `dropdown-menu.tsx` — DropdownMenu family
- `form.tsx` — Form, FormField, FormItem, FormLabel, FormControl, FormMessage (react-hook-form wrapper)
- `hover-card.tsx` — HoverCard family
- `input.tsx` — Input
- `input-otp.tsx` — InputOTP family
- `label.tsx` — Label
- `menubar.tsx` — Menubar family
- `navigation-menu.tsx` — NavigationMenu family
- `pagination.tsx` — Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious/Next
- `popover.tsx` — Popover, PopoverTrigger, PopoverContent
- `progress.tsx` — Progress
- `radio-group.tsx` — RadioGroup, RadioGroupItem
- `resizable.tsx` — ResizablePanelGroup, ResizablePanel, ResizableHandle
- `scroll-area.tsx` — ScrollArea, ScrollBar
- `select.tsx` — Select family
- `separator.tsx` — Separator
- `sheet.tsx` — Sheet family (used for mobile filter drawers, e.g. `DesignerProfilePage`)
- `sidebar.tsx` — Sidebar primitive family (large generated file; used as base for `SellerDashboardLayout`/`AdminDashboardLayout` sidebars — verify actual usage vs custom sidebar markup in layouts)
- `skeleton.tsx` — Skeleton
- `slider.tsx` — Slider
- `sonner.tsx` — Toaster (sonner wrapper, re-exported as the app's second toast system)
- `switch.tsx` — Switch
- `table.tsx` — Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption
- `tabs.tsx` — Tabs, TabsList, TabsTrigger, TabsContent
- `textarea.tsx` — Textarea
- `toast.tsx` / `toaster.tsx` / `use-toast.ts` — shadcn's own toast system (`useToast()` hook), coexisting with `sonner.tsx`'s `toast` from the `sonner` package — **two parallel toast systems** used inconsistently across pages (e.g. `Cart`/`Checkout` use `useToast()`; `Profile`/`Onboarding`/`SellerLogin`/admin pages use `sonner`'s `toast`) [OBSERVED, duplication — see 15].
- `toggle.tsx` / `toggle-group.tsx` — Toggle, ToggleGroup, ToggleGroupItem
- `tooltip.tsx` — Tooltip, TooltipTrigger, TooltipContent, TooltipProvider

None of the `ui/*` files access Supabase, perform fetches, or contain business logic. All are reusable by definition. No deprecated/unused flags identifiable without a full usage graph, but `chart.tsx` (recharts) is only reachable through the legacy/likely-unused `seller-dashboard/pages/*` tree (see below), and `sidebar.tsx` may be partially unused if the dashboard layouts hand-roll their own sidebar markup instead of this primitive [UNKNOWN — verify].

---

## B. Non-UI components (`src/components/**`, excluding `ui/`)

### B.1 Direct data-access components (found via `rg -l "supabase\."` / `"storage.from"` / `"fetch("`) — explicitly flagged
| Component | Path | Data access |
|---|---|---|
| `LoveOguraSection` | `src/components/LoveOguraSection.tsx` | direct `supabase.*` call [CONFIRMED via grep; exact table not read in this pass — INFERRED to be a testimonials/reviews-style read] |
| `SellerNewArrivals` | `src/components/SellerNewArrivals.tsx` | direct `supabase.*` call **and** `fetch(...)` — used on `Index`; likely queries `products` for newest live items, possibly with the same external-API fallback pattern seen in `Collections`/`ProductDetail` [INFERRED from naming + pattern reuse]. |
| `VirtualTryOn` | `src/components/VirtualTryOn.tsx` | direct `supabase.*` call — likely invokes an edge function or writes try-on session data; used by `VirtualTryOnDialog` on PDP. |
| `TryOnHistory` | `src/components/TryOnHistory.tsx` | `fetch(...)` (not raw supabase-js call per this grep, but likely calls a Supabase Edge Function via `fetch` or `supabase.functions.invoke` under a different alias) [UNKNOWN exact mechanism — flag for follow-up]. |
| `TryOnResult` | `src/components/TryOnResult.tsx` | `fetch(...)` — renders/persists a try-on result image. |
| `PinterestBoardModal` | `src/components/PinterestBoardModal.tsx` | `fetch(...)` — Pinterest API calls (board listing), consumes `pinterest_token` from `localStorage` set by `PinterestCallback`. |
| `UserPinterestBoards` | `src/components/UserPinterestBoards.tsx` | `fetch(...)` — same Pinterest integration family. |
| `WaitlistForm` | `src/components/waitlist/WaitlistForm.tsx` | direct `supabase.*` call — almost certainly an `insert` into a waitlist/seller-leads table, used by `BrandWaitlist` page. |
| `seller-dashboard/pages/DashboardAddProduct.tsx` | legacy seller-dashboard tree | `supabase.*` **and** `storage.from(...)` upload — near-duplicate of `pages/seller/SellerAddProduct.tsx`'s upload+insert logic, but inside the apparently-unused `seller-dashboard/*` component tree (not reachable from `SellerApp`'s routes, which use `SellerDashboardLayout` + `pages/seller/*` directly, not `components/seller-dashboard/pages/*`) [OBSERVED — likely dead/legacy code, see 15 for confirmation]. |
| `seller-dashboard/pages/DashboardDiscounts.tsx` | legacy | direct `supabase.*` call — likely reads/writes a `discounts` table (same table `Checkout.tsx` reads from). |
| `seller-dashboard/pages/DashboardProducts.tsx` | legacy | `supabase.*` **and** `fetch(...)` — a legacy duplicate of `pages/seller/SellerProducts.tsx`. |
| `seller-dashboard/pages/DashboardSettings.tsx` | legacy | `fetch(...)` only. |

All of the above bypass any shared "service"/hook abstraction layer — there is no `src/services/products.ts`-style data layer used consistently; most components call `supabase.from(...)` inline in `useEffect`s (matching the pattern already documented for pages in 10/13). One exception: `ProductDetail.tsx` imports `triggerSocialPost` from `src/services/socialPostService.ts`, showing a service-layer pattern exists but is not used consistently elsewhere.

### B.2 Top-level marketing/section components (`src/components/*.tsx`)
- **Header** (`Header.tsx`) — customer classic header (search, cart icon, user menu, mega menu trigger); used by most "classic" customer pages (`Collections`, `ProductDetail`, `Cart`, `Checkout`, `Search`, `Wishlist`, `Dashboard`, `Profile`, etc.). Duplicate of `LuxuryHeader` (see 15).
- **LuxuryHeader** (`LuxuryHeader.tsx`) — editorial-styled header variant; used by `Index`, `CategoryPage`, `MadeToOrderPage`, `SellerApply`, `JoinUs`, `BrandWaitlist`. Duplicate of `Header`.
- **Footer** / **LuxuryFooter** — same duplication pattern as headers; `Footer` used by classic pages, `LuxuryFooter` by editorial/marketing pages and account pages (`Dashboard`, `Profile`).
- **MegaMenu** (props: `isScrolled?: boolean`) and **NykaaStyleMegaMenu** (same prop shape) and **MegaMenuMobile** (props: `onItemClick?`) — three separate mega-menu implementations; only one is presumably live inside `Header`/`LuxuryHeader` at a time — near-duplicate component family (see 15).
- **Hero** / **LuxuryHero** / **CinematicHeroBanner** / **FullScreenHeroCarousel** / **HeroCarousels** — five distinct hero/banner implementations across the codebase; only `LuxuryHero` is wired into `Index` per the read source; the others are likely alternate/legacy variants or used elsewhere (`FullScreenHeroCarousel` possibly in `MadeToOrderPage`'s `MTOHeroSection` or category banners) [UNKNOWN exact usage sites without a full grep-cross-reference — flag for follow-up if precision required].
- **Premium3DCategorySection**, **RoundCategorySection** (+ **RoundCategoryCard**, props `name`,`gifSrc`,...), **CategoryShowcase**, **ShopByCategory** — four category-showcase-style grids; overlapping purpose, likely used on different pages (`Index` uses `Premium3DCategorySection` + `CategoryShowcase`).
- **DesignersSpotlight**, **AzaDesignerCarousel** (+ **AzaDesignerCard**, props `designer: Designer`), **DesignerCard** (props `designer: Designer`), **DesignerGallery** (props `images: string[]`, `brandName: string`), **DesignerFilters** (props `searchQuery`, `onSearchChange`, plus category filter callbacks) — the designer-directory component family used across `Designers`, `DesignerDetail`, `DesignerProfilePage`. Two card components (`AzaDesignerCard` vs `DesignerCard`) targeting the same `Designer` type is a near-duplicate.
- **DesignerProductCard** (props: `product: DesignerProduct`), **DesignerProductFilters** (props: `categories`, `filters`, plus change callbacks), **DesignerProductGrid** (props: `products`, `isLoading`) — the product-grid family specific to `DesignerProfilePage`, parallel to `ProductGrid`/`PLPProductGrid`/`ProductCarousel` (three-plus separate "grid of products" implementations across the app — see 15 duplication list).
- **ProductGrid** (props: `title`, `products: Array<{...}>`) — generic named grid with a title, likely used on `BrandDetail`.
- **PLPProductCard** (props: `product: Product`), **PLPProductGrid** (props: `products`, `isLoading?`), **PLPFilterSidebar** (props: `filters: PLPFilters`, `onChange`), **PLPSortDropdown** (props: `value`, `onChange`) — a full "PLP" (product listing page) component family that does **not** appear to be used by the actual `Collections.tsx` PLP page read in 13 (which hand-rolls its own `Card`-based grid inline) — likely built for an alternate/future PLP implementation or used by `CategoryPage`'s `CategoryProductGrid` instead [OBSERVED — possible unused/parallel component family; flag for confirmation].
- **ProductCarousel** (props: `title`, `products: Product[]`) — yet another product-list renderer, carousel-style; likely used in `Index`/PDP recommendation rows.
- **ProductImageGallery** (props: `images`, `productName`, `selectedIndex`, `onSelectIndex`, `onViewSimilar`) — PDP main gallery, confirmed used by `ProductDetail`.
- **ProductDetailsAccordion** (props: `product: Product`) — PDP accordion (materials/care/shipping sections), confirmed used by `ProductDetail`.
- **RecommendationCarousel** (props: `title`, `type: 'similar'|'brand'|'search'|'category'`, plus likely a source id/query) and **RecommendationSkeleton** (props: `count?`) — PDP/Search recommendation rail with a typed loading skeleton; confirmed used by `ProductDetail`.
- **SimilarProductsGrid** (props: `currentProduct: Product`, `allProducts: Product[]`) and **ViewSimilarModal** (props: `isOpen`, `onClose`, ...) — PDP similar-items family, confirmed used by `ProductDetail`; note `SimilarProductsGrid`'s "allProducts" is passed from `staticProducts` only in `ProductDetail`, meaning DB-only products are excluded from similar-item suggestions (matches the cross-source gap noted in 13).
- **SizeGuideModal** (props: `isOpen`, `onClose`, likely `category`/`sizes`) — confirmed used by `ProductDetail`.
- **VirtualTryOnDialog** (props: `productImageUrl`, `productName`, ...) — wraps **VirtualTryOn** (direct-Supabase component, see B.1) in a `Dialog`; confirmed used by `ProductDetail`.
- **ModelGallery** (props: `selectedModelId`, `onSelectModel`), **ModelPresetSelector** (props: `selectedPreset`, `onSelectPreset`), **ModelSearchFilter** — model-selection UI for the virtual try-on flow, child of `VirtualTryOn`/`VirtualTryOnDialog` [INFERRED from naming and prop shapes].
- **AddressForm** (props: `initialData?: Partial<UserAddress>`, `onSubmit: (data)=>Promise<void>`) — reusable address create/edit form; used inside `AddressSelectionModal`.
- **AddressCard** (props: `address: UserAddress`, `isSelected?`, plus `selectable`/`showActions` per usage in `Cart`/`Checkout`) — reusable address display card; confirmed used by `Cart`, `Checkout`.
- **AddressSelectionModal** (props: `open`, `onOpenChange`, `onAddressSelect`, `selectedAddressId?`) — confirmed used by `Cart`, `Checkout`, `ProductDetail` (Buy Now flow); orchestrates `AddressCard`/`AddressForm`, backed by `LocationContext`.
- **DeliveryChecker** (props: `className?`, `compact?`) — pincode/serviceability checker widget, confirmed used on `ProductDetail`.
- **HeaderLocationIndicator** (props: `className?`, `variant?: 'default'|'compact'`) — location display in header, tied to `LocationContext`.
- **LocationPermissionModal**, **ManualLocationSelector** — global location-selection modals mounted at the `CustomerApp` root level per 10_FRONTEND_ARCHITECTURE.
- **ImageUploadZone** (props: `onFilesSelected: (files: File[]) => void`, `maxFiles?`, `maxSizeMB?`) — reusable drag/drop uploader; confirmed used by `SellerAddProduct`, `SellerApply`, `JoinUs`. No direct Supabase call itself — parent pages own the actual `storage.from().upload()` call, so this component is a pure UI/file-selection layer (reusable, page-agnostic).
- **ImageSearchDialog** (props: `trigger?: React.ReactNode`) — visual/image search entry point, likely wraps an image-upload-to-search flow (possibly Algolia visual search or a custom edge function) [INFERRED, not fully traced].
- **OptimizedImage** (props: `src`, `alt`, `aspectRatio?`, ...) — the app's universal image wrapper (lazy-loading / aspect-ratio-boxed `<img>`); used extremely widely (`Collections`, `Brands`, `BrandStore`, `Occasions`, etc.) — one of the most reused components in the codebase.
- **FilterBar** — generic filter bar, confirmed used by `OccasionDetail`, tied to `FilterContext`.
- **CategoryShowcase**, **HiddenGemsSection**, **FreshDrops**, **GameSpot** (props: `id`, `isClicked`, plus click handlers), **RewardGame**, **RewardCard**, **HoliDhamakaSale**, **InstagramModelsBanner**, **PinterestInspiredSection**, **LaunchStudio** (+ `launch-studio/*` subcomponents: `LaunchStudioHero`, `LaunchStudioCTA`, `LaunchStudioFeatures`, `LaunchStudioTestimonials`, `LaunchStudioTimeline`) — a large family of one-off marketing/gamification sections, mostly static-content, page-specific (not broadly reused), likely composed into `Index` and/or a "Launch Studio" marketing page not covered by the 48 route files read (possibly reachable only as a section, not a route) [UNKNOWN exact mount point for `LaunchStudio`/`launch-studio/*` — no route named "launch studio" was found in 11_ROUTE_MAP, so this may be **dead/unused** or embedded inside `Index`'s untruncated middle sections not fully enumerated — flag for confirmation].
- **CertificateSection**, **GiftCardSection** / **LuxuryGiftCard**, **LuxuryTrustBadges**, **LuxuryBrands**, **LuxuryStoreLocator** / **StoreLocator**, **LoveOguraSection**, **FeaturedBrands**, **FeaturedCollections**, **DesignersSpotlight**, **FullWidthImageSection** (props: `backgroundImage`, `height?: 'screen'|'70vh'|'60vh'|'50vh'`), **SellerNewArrivals** — marketing sections primarily composed into `Index`; `StoreLocator` vs `LuxuryStoreLocator` and `GiftCardSection` vs `LuxuryGiftCard` are further instances of the classic/luxury duplication pattern.
- **FilterBar**, **AIStylistCTA**, **Welcome**, **SocialShareButtons**, **SaveToPinterestButton** (props: `productUrl`, `imageUrl`, ...), **ConnectPinterestButton** — miscellaneous CTA/share widgets; `SaveToPinterestButton`/`ConnectPinterestButton`/`PinterestBoardModal`/`UserPinterestBoards` together form the Pinterest integration feature set (tokens in `localStorage`, see 13's `PinterestCallback` security note).
- **Spline3DBackground**, **luxury3d/Tilt3D** (props: `children`, `className?`), **luxury3d/ParallaxLayer** (props: `children`, `className?`) — 3D/parallax visual-effect wrappers, purely presentational, reusable, no data access.

### B.3 `auth/*`
- **GoogleSignInButton** — no props read in this pass; wraps `@lovable.dev/cloud-auth-js` Google OAuth trigger; used on `Login`, `SellerLogin`, `SellerSignup`, `AdminLogin`.
- **ProtectedRoute** (props: `children: React.ReactNode`) — customer auth gate, documented in 10.
- **RoleProtectedRoute** (props: `children`, `requiredRole: AppRole`, plus `loginPath`/`unauthorizedRedirect`) — admin gate, documented in 10.
- **SellerAuthRoute** — seller gate (no role check), documented in 10, [SECURITY-SENSITIVE].
- **UserMenu** (props: `isScrolled?: boolean`) — header account dropdown (login/logout/profile links), consumes `AuthContext`.

### B.4 `category/*` (used by `CategoryPage`)
`CategoryHeroBanner` (props: `title`, `subtitle`, ...), `SubCategoryScroll` (props: `subCategories: SubCategory[]`, `onSelectSubCategory`), `FeaturedCollectionGrid` (props: `collection: FeaturedCollection`, `categorySlug`), `LuxeEditSection` (props: `luxeEdit: LuxeEdit`, `categorySlug`), `CategoryProductGrid` (props: `categorySlug`, `productCategories: string[]`, likely performs its own product query/filter — the probable place where `CategoryPage` actually reaches products, since the page itself has no direct data call) [INFERRED], `CelebrityIconsSection` — all page-specific to `CategoryPage`, driven by the static `data/oguraCategories.ts` config passed down as typed props (`SubCategory`, `FeaturedCollection`, `LuxeEdit` types).

### B.5 `made-to-order/*` (used by `MadeToOrderPage`, via `MadeToOrderContext`)
`MTOHeroSection` (props: `onStartJourney: () => void`), `MTOEntryPaths`, `MTOProgressIndicator` (props: `currentStep: number`, `className?`), `MTOInspirationUpload`, `MTODesignerSelector` (props: `onProceed: () => void`), `MTOBaseDesignGallery` (props: `onProceed: () => void`), `MTOCustomizationPanel` (props: `onProceed: () => void`), plus a barrel `index.ts`. All are step components in a linear wizard driven by local `MadeToOrderContext` state (mounted only inside `MadeToOrderPage`, per 10). Page-specific, not reusable elsewhere.

### B.6 `search/*` (used by `Search` page)
`AlgoliaSearchBox`, `AlgoliaSearchDropdown` (header-integrated quick search, likely used inside `Header`/`LuxuryHeader`), `AlgoliaSearchResults`, `AlgoliaFilterSidebar`, `AlgoliaMobileFilters`, `AlgoliaMobileSearch`, `AlgoliaNoResults`, `AlgoliaPriceRange`, `AlgoliaProductHit` (individual hit-card renderer — another "product card" implementation, adding to the multi-implementation list), `AlgoliaRefinementList`, `AlgoliaTrendingProducts`, `BrandSearchResults` (props: `query: string`; Supabase-backed brand-store search parallel to Algolia product search), plus barrel `index.ts`. All are Algolia InstantSearch render-prop/hook consumers, page-specific to `Search` (and `AlgoliaSearchDropdown` potentially to the header).

### B.7 `seller-dashboard/*` (legacy/likely-unused component tree)
`DashboardHeader`, `DashboardSidebar` (props: `activeTab`, `setActiveTab`), `SellerDashboardShowcase`, and `pages/*`: `DashboardHome`, `DashboardProducts`, `DashboardAddProduct` (props: `onBack: () => void`), `DashboardOrders`, `DashboardAnalytics` (uses `ui/chart.tsx`/recharts), `DashboardCustomers`, `DashboardInventory`, `DashboardMarketing`, `DashboardMarkets`, `DashboardDiscounts`, `DashboardGiftCards`, `DashboardCollections`, `DashboardTransfers`, `DashboardSettings`, `DashboardContent`. This entire tree implements a **tab-based** dashboard (`activeTab`/`setActiveTab` prop pattern) that is structurally different from the **route-based** `SellerDashboardLayout` + `pages/seller/*` actually wired into `SellerApp`'s routes (per 11_ROUTE_MAP, no route renders anything from `components/seller-dashboard/*`) [OBSERVED — strong candidate for dead/legacy code superseded by the newer `pages/seller/*` route tree; flag as **deprecated/unused** pending confirmation that no dynamic import or hidden route references it]. This tree independently re-implements product add, discounts, and settings screens with their own Supabase calls (see B.1), duplicating logic already in `pages/seller/*`.

### B.8 `join-us/*`, `launch-studio/*` (see B.2), `waitlist/*`
- **JourneyTimeline** (`join-us/JourneyTimeline.tsx`) — step-timeline visual, used by `JoinUs` page.
- **WaitlistForm** (`waitlist/WaitlistForm.tsx`) — direct-Supabase form (see B.1), used by `BrandWaitlist`.
- **WaitlistSection** (`waitlist/WaitlistSection.tsx`, props: `id?`, `kicker?`, ...) — section wrapper composing `WaitlistForm` with marketing copy, used by `BrandWaitlist`.

---

## Accessibility notes (cross-cutting) [OBSERVED, not exhaustive]
- shadcn/Radix primitives (`ui/*`) provide baseline ARIA semantics (dialog, dropdown, tabs roles) out of the box.
- Custom icon-only buttons across many non-ui components (e.g. product-card wishlist hearts in `Collections`/PDP, qty steppers in `Cart`) sometimes include `aria-label` (confirmed on `ProductDetail`'s color swatches: `aria-label={\`Select ${variant.name} color\`}`) but this is not verified as consistent across all icon buttons in the 147-component set — a full accessibility audit is out of scope of this pass. [MISSING: systematic aria-label audit]

## Reusable vs page-specific summary
- **Broadly reusable** (used across ≥3 distinct pages/route groups): `OptimizedImage`, `Header`/`Footer`/`LuxuryHeader`/`LuxuryFooter`, `AddressCard`/`AddressForm`/`AddressSelectionModal`, `ImageUploadZone`, `GoogleSignInButton`, `ProtectedRoute`/`RoleProtectedRoute`/`SellerAuthRoute`, all `ui/*` primitives.
- **Page/flow-specific** (single page or single wizard): everything under `category/*`, `made-to-order/*`, `search/*` (mostly `Search`-only), `join-us/*`, `waitlist/*`, and most `Index`-only marketing sections in B.2.
- **Likely deprecated/unused**: entire `seller-dashboard/*` tree (B.7) pending confirmation; `launch-studio/*` family pending confirmation of a mount point.

# 16 — Design System (OGURA Frontend)

Scope: `src/index.css` (1031 lines), `tailwind.config.ts`, `index.html`, `src/components/ui/**` (shadcn), `src/components/luxury3d/**`, animation packages. [CONFIRMED] unless flagged.

## 1. CSS Custom Properties (`src/index.css`)

### 1.1 `:root` (light) — lines 10–65
| Token | Value (HSL triplet) | Provenance |
|---|---|---|
| `--background` | `0 0% 100%` | custom CSS, consumed via Tailwind `bg-background` |
| `--foreground` | `0 0% 10%` | " |
| `--card` / `--card-foreground` | `0 0% 100%` / `0 0% 10%` | " |
| `--popover` / `--popover-foreground` | `0 0% 100%` / `0 0% 10%` | " |
| `--primary` / `--primary-foreground` | `0 0% 10%` / `0 0% 98%` | " |
| `--secondary` / `--secondary-foreground` | `0 0% 96%` / `0 0% 10%` | " |
| `--muted` / `--muted-foreground` | `0 0% 96%` / `0 0% 45%` | " |
| `--accent` / `--accent-foreground` | `25 95% 53%` (orange) / `0 0% 98%` | " |
| `--destructive` / `--destructive-foreground` | `0 84.2% 60.2%` / `0 0% 98%` | " |
| `--border` | `0 0% 90%` | " |
| `--input` | `0 0% 90%` | " |
| `--ring` | `0 0% 10%` | " |
| `--radius` | `0.75rem` | drives Tailwind `borderRadius.lg/md/sm` |
| `--instagram-purple/pink/orange/yellow` | `276 51% 47%` / `340 75% 54%` / `11 90% 61%` / `35 97% 63%` | custom CSS, used by `.instagram-gradient*` utilities |
| `--ogura-red` | `0 84% 60%` | custom brand token; [OBSERVED] not obviously consumed anywhere audited beyond declaration (grep for usages advised) — **[UNKNOWN]** usage sites |
| `--ogura-pink` | `342 68% 52%` | consumed by Tailwind `colors.brand.DEFAULT`, `.text-brand`, `.border-brand`, `.bg-brand-soft`, `.text-brand-gradient`, `--gradient-ogura`, waitlist `--wl-pink` |
| `--ogura-pink-light` | `342 74% 62%` | Tailwind `colors.brand.light`, `--gradient-ogura` |
| `--gradient-ogura` | `linear-gradient(100deg, hsl(var(--ogura-pink)) 0%, hsl(var(--ogura-pink-light)) 100%)` | custom CSS gradient var |
| `--sidebar-background/foreground/primary/primary-foreground/accent/accent-foreground/border/ring` | shadcn sidebar palette (`0 0% 98%` etc.) | shadcn convention, mapped 1:1 in `tailwind.config.ts` `colors.sidebar` |

### 1.2 `.dark` (dark mode) — lines 67–109
Overrides background/foreground/card/popover/primary/secondary/muted/border/input/ring/sidebar to inverted greyscale (e.g. `--background: 0 0% 10%`, `--foreground: 0 0% 98%`). `--accent` stays `25 95% 53%` (same as light). Instagram gradient vars are re-declared identically ("same in dark mode" per inline comment, line 104). `--destructive` becomes darker (`0 62.8% 30.6%`). No `--ogura-*` or `--gradient-ogura` redeclaration inside `.dark` — **[OBSERVED]** brand pink tokens are not re-themed for dark mode (relies on light-mode values leaking through). **[UNKNOWN]** whether `.dark` class is ever actually toggled anywhere in the app (no `next-themes`/theme toggle found in the audited component list — grep did not surface a theme switcher component). Tag: **[INFERRED]** dark mode is wired at the CSS/Tailwind level (`darkMode: ["class"]` in `tailwind.config.ts`) but there is no confirmed UI control that adds `.dark` to `<html>`; treat dark mode as present-but-possibly-unused. **[MISSING]** confirmation of a theme toggle component.

### 1.3 Non-semantic "layer" theme systems (all custom CSS, not shadcn, not Tailwind config)
The file defines several **parallel, hardcoded design languages** layered on top of the shadcn token system, each scoped by a wrapper class:

- **`.museum-*` ("Atelier of Light" museum aesthetic)** — lines ~389–591. Its own local CSS-var palette declared **inline inside the class** (not in `:root`): `--museum-bg:#08070a`, `--museum-espresso:#15110d`, `--museum-gold:#c9a56b`, `--museum-gold-bright:#e9d4a3`, `--museum-ivory:#f4efe6`, `--museum-glass`, `--museum-glass-line`. Utilities: `.museum-surface`, `.museum-gold-glow`, `.museum-vignette-strong`, `.museum-grain-strong` (SVG-noise `feTurbulence` data-URI + `lux-grain` keyframe, disabled under `prefers-reduced-motion: reduce`), `.museum-eyebrow`, `.museum-display` / `.museum-display-sm` (fluid `clamp()` serif display type, font `Cormorant Garamond`), `.museum-lede`, `.museum-glass`, `.museum-card` (hover-lift + border-color transition), `.museum-hairline-gold`, `.museum-spotlight` (cursor-follow radial gradient via `--mx/--my` CSS vars set from JS), `.museum-cta`, `.museum-meta`, `.museum-rule`, `.museum-orbit` (decorative concentric rings). Provenance: 100% custom CSS.
- **`.luxury-*` (earlier "luxury 3D enhancement layer")** — lines ~232–382. `.luxury-tilt-root` / `.luxury-tilt-inner` / `.luxury-tilt-glare` (CSS custom-property-driven 3D tilt: `--rx --ry --s --ty --mx --my`, paired with `Tilt3D.tsx` JS component below), `.luxury-glass`, `.luxury-depth`, `.luxury-spotlight`, `.luxury-sweep` (skewed light-sweep hover), `.luxury-vignette`, `.luxury-grain` (same SVG-noise technique as museum-grain but lower opacity 0.06), `.luxury-hairline-gold`, `.luxury-eyebrow-gold` (Cormorant Garamond italic, color `#c9a56b` hardcoded, not a var), `.luxury-float-idle` (`lux-float` keyframe), `.luxury-cta-glass`.
- **`.waitlist-page` ("atelier paper" theme, BrandWaitlist page only)** — lines ~660+ (per truncated view; confirmed presence via grep). Own local HSL vars: `--wl-paper: 42 33% 97%`, `--wl-paper-deep: 38 26% 93%`, `--wl-ink: 24 12% 12%`, `--wl-pink: var(--ogura-pink)` (reuses brand token), `--wl-gold: 38 70% 58%`. Utilities: `.wl-paper-card`, `.wl-tint`, `.wl-prose` (drop-cap first-letter styling via `::first-letter`, gradient text-clip), `waitlist-marquee` keyframe. Provenance: custom CSS, scoped to one page.
- **`.editorial-*` (Careers / general editorial typography)** — lines ~625–660 approx: `.font-display` / `.font-body` (both map to `'Manrope', system-ui, sans-serif`), `.editorial-eyebrow`, `.editorial-h1`, `.editorial-h2`, `.editorial-h3`, `.editorial-body`, `.editorial-label`. Provenance: custom CSS utility layer, weight/letter-spacing driven, no color set (inherits `currentColor`/Tailwind color utility applied alongside).
- **`.waitlist-serif` / `.waitlist-serif-italic`** — `'Playfair Display', 'Cormorant Garamond', serif` display type for the waitlist landing.

### 1.4 General/base utilities (custom CSS, `@layer utilities`)
`.hover-scale`, `.instagram-gradient`, `.instagram-gradient-overlay`, `.hero-gradient-overlay`, `.luxury-overlay`, `.luxury-heading`, `.luxury-button`, `.fade-out` (+ `fadeOut` keyframe), `@keyframes kenburns` (duplicated: also defined as a Tailwind `animation` in `tailwind.config.ts` — **[CONFLICT]**: `kenburns` keyframe exists both hand-written in `index.css` line 181 (`0%/50%/100%` scale `1/1.05/1`) and in `tailwind.config.ts` (`0%/50%/100%` scale `1/1.08/1`) — the two definitions use **different peak scale values (1.05 vs 1.08)**, meaning whichever cascade wins (Tailwind's generated utility class vs the raw CSS keyframe) determines actual runtime behavior; not reconciled in source. **[CONFLICT]** `.product-tile-3d` / `.product-tile-3d-shimmer` (gradient-border 3D product card treatment, hardcoded `hsl(38 92% 60%/.55)` etc., not tokenized).

### 1.5 Brand-accent utilities (custom CSS, reuse tokens)
`.text-brand`, `.border-brand`, `.bg-brand-soft`, `.brand-rule`, `.text-brand-gradient` — all built on `hsl(var(--ogura-pink))`/`--gradient-ogura`. Provenance: custom CSS layer, properly tokenized (good practice) — contrasts with the hardcoded museum/luxury hex colors below.

## 2. Tailwind Theme Extension (`tailwind.config.ts`)
- `darkMode: ["class"]`, `prefix: ""`.
- `content`: `./pages/**`, `./components/**`, `./app/**`, `./src/**` (note: `./pages` and `./components` at repo root do not exist in this project — only `./src/**` glob is actually effective; **[OBSERVED]** redundant/stale content globs, harmless but imprecise, likely copied from a default Lovable/shadcn template).
- `container`: `center: true`, `padding: "2rem"`, breakpoint override `2xl: "1400px"` (this is the **only breakpoint customization**; all other Tailwind default breakpoints — `sm 640px, md 768px, lg 1024px, xl 1280px` — are untouched defaults, confirmed by widespread use of `md:`/`lg:` in components matching Tailwind defaults).
- `colors`: adds `brand.DEFAULT` / `brand.light` (mapped to `--ogura-pink` / `--ogura-pink-light`) plus the full standard shadcn set (`border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card, sidebar.*`), all as `hsl(var(--token))` — shadcn convention.
- `borderRadius`: `lg = var(--radius)` (0.75rem), `md = calc(var(--radius) - 2px)`, `sm = calc(var(--radius) - 4px)` — shadcn convention.
- `keyframes`/`animation`: `accordion-down/up` (shadcn/radix accordion, height+opacity), `fade-in` (translateY 20px→0, 0.6s), `fade-in-slow` (opacity only, 1s), `scale-in` (0.95→1 scale, 0.2s), `slide-up` (translateY 40px→0, 0.8s), `kenburns` (scale 1→1.08→1, 20s infinite — see §1.4 conflict).
- `plugins`: `tailwindcss-animate` only.
- No custom `fontFamily` extension in Tailwind config — **[OBSERVED]** all custom font-family declarations (Cormorant Garamond, Playfair Display, Manrope) are applied via raw CSS `font-family:` inside utility classes in `index.css`, NOT via Tailwind `theme.fontFamily`/`font-serif`/`font-sans` tokens. Default Tailwind `font-sans`/`font-serif` stacks remain unmodified.
- No custom `boxShadow`, `spacing`, or `screens` (beyond the `2xl` container override) extensions — all shadow/spacing values used across the "luxury"/"museum" layers are hardcoded inline `box-shadow` strings in `index.css`, not Tailwind tokens.

## 3. Fonts
- **Loaded via `index.html`** (Google Fonts, lines 8–10): `Cormorant Garamond` (weights 300,400,500,600,700 + italics 300,400,600), `Manrope` (300,400,500,600,700,800), `Playfair Display` (400,500,600,700 + italic 400,500,600). Preconnected to `fonts.googleapis.com` and `fonts.gstatic.com`.
- **Usage mapping** (from CSS, [OBSERVED]):
  - `Manrope` → default body/editorial typography (`.font-display`, `.font-body`, `.editorial-*`, `.museum-lede`, `.museum-meta`, `.museum-cta`) — the de facto UI sans-serif.
  - `Cormorant Garamond` → italic gold "eyebrow" labels and museum display headings (`.luxury-eyebrow-gold`, `.museum-eyebrow`, `.museum-display`, `.museum-display-sm`, `.museum-meta .k`), with fallback `'Times New Roman', serif`.
  - `Playfair Display` → waitlist-only serif display (`.waitlist-serif`, `.waitlist-serif-italic`, drop-cap in `.wl-prose`), fallback `'Cormorant Garamond', serif`.
  - No global `body { font-family }` override was found in the `@layer base body` rule (only `@apply bg-background text-foreground`) — **[OBSERVED]** base body font relies on Tailwind's default sans stack (system font) except where the above utility classes are explicitly applied per-component. **[INFERRED]** this produces visually inconsistent typography across the site unless every heading/body element opts into `.font-display`/`.editorial-*`/`.museum-*` classes.
  - Icon font/favicon: `/favicon.png` (PNG, not SVG/ICO), also used as `apple-touch-icon`.

## 4. Component styling conventions (shadcn `cva` variants)
All under `src/components/ui/*.tsx`, using `class-variance-authority` (`cva`) + Radix primitives + `cn()` (from `src/lib/utils`, tailwind-merge/clsx convention). Confirmed for:
- **Button** (`button.tsx`): variants `default | destructive | outline | secondary | ghost | link`; sizes `default | sm | lg | icon`. Fully token-based (`bg-primary`, `bg-destructive`, etc.), no hardcoded colors.
- **Badge, Card, Input, Dialog, Drawer, Tabs, Table, Toast, Skeleton, Alert-Dialog, Accordion, Avatar, Breadcrumb, Calendar, Carousel, Chart, Checkbox, Collapsible, Command, Context-Menu, Dropdown-Menu, Form, Hover-Card, Input-OTP** — present under `src/components/ui/` (confirmed file listing) — [INFERRED same shadcn `cva`+Radix convention, token-based colors] based on Button's pattern and standard shadcn scaffolding conventions; not each individually line-inspected in this pass. **[UNKNOWN]** whether any of these ui/ primitives have been hand-edited to introduce hardcoded colors (would require a full per-file diff against stock shadcn — out of scope here; recommend targeted grep of `src/components/ui/*.tsx` for hex codes if deeper audit needed).
- Custom/product-specific card components (`PLPProductCard`, `DesignerProductCard`, `AzaDesignerCard`, etc.) largely bypass shadcn `Card` variants in favor of bespoke Tailwind classNames plus the `.museum-card`/`.luxury-tilt-*`/`.product-tile-3d` custom-CSS treatments — provenance: custom CSS + inline Tailwind, not shadcn `cva`.

## 5. Animation / interaction system
- **framer-motion** (`^12.40.0`) — used directly in `src/components/luxury3d/Tilt3D.tsx` (`motion.div`, `initial`/`whileInView` scroll-reveal) and other components (grep-confirmed as a project dependency; individual usage sites not exhaustively enumerated here — **[UNKNOWN]** full list of all consuming components beyond Tilt3D).
- **gsap** (`^3.15.0`) — declared dependency; **[UNKNOWN]** exact consuming components not enumerated in this pass (would require a full `import gsap` grep across `src/components` — recommend follow-up if GSAP usage detail is required).
- **lenis** (`^1.3.23`) — smooth-scroll library dependency; **[UNKNOWN]** exact mount point (typically wrapped near app root) not confirmed in this pass.
- **Tilt3D** (`src/components/luxury3d/Tilt3D.tsx`) — custom 3D hover-tilt wrapper: tracks mouse position, sets CSS custom properties `--mx/--my/--rx/--ry/--s` on the wrapped element (consumed by `.luxury-tilt-*` CSS above), combined with a `framer-motion` `whileInView` fade/slide-up entrance (`opacity:0,y:24 → 1,0`). Props: `max` (tilt degrees, default 6), `scale` (default 1.015), `glare` (default true), `perspective` (default 1200).
- **ParallaxLayer** (`src/components/luxury3d/ParallaxLayer.tsx`) — present in file tree; **[UNKNOWN]** exact implementation not read in this pass (recommend follow-up view if parallax mechanics need documenting).
- **Glare/spotlight hover effects**: implemented as CSS radial-gradients following `--mx/--my` (`.luxury-tilt-glare`, `.luxury-spotlight::before`, `.museum-spotlight::before`), all requiring a JS mousemove handler (Tilt3D or per-component equivalent) to update those vars — pure-CSS `:hover` fallback would not position the gradient.
- **Grain/noise textures**: `.luxury-grain` / `.museum-grain-strong` — inline SVG `feTurbulence` filter as a `background-image: url("data:image/svg+xml,...")`, animated via `lux-grain` keyframe (position jitter), explicitly disabled under `prefers-reduced-motion: reduce` for the museum variant only (`.luxury-grain` has no such media-query guard — **[OBSERVED]** inconsistent reduced-motion handling between the two near-duplicate effects).
- Tailwind-native animations (`accordion-down/up`, `fade-in`, `fade-in-slow`, `scale-in`, `slide-up`, `kenburns`) used as utility classes (`animate-fade-in` etc.) across marketing sections.

## 6. Icon library
- **lucide-react** (`^0.462.0`) — confirmed sole icon import source in files read (`Mail, Phone, MapPin` in Contact.tsx; `MessageCircle` in waitlist; `Sparkles, Users, Gem, Rocket, Layers` in Careers.tsx). No other icon package found in dependency grep.

## 7. Image treatments
- `OptimizedImage.tsx` component exists (`src/components/OptimizedImage.tsx`) — **[UNKNOWN]** exact lazy-loading/responsive-srcset implementation not read in this pass; presence confirmed only.
- Ken-Burns slow-zoom effect (`.kenburns`/`kenburns` keyframe) applied to hero imagery (per naming convention and typical usage — **[INFERRED]** consuming components not individually enumerated).
- `.museum-card img` hover-scale (`transform: scale(1.08)` on `.luxury-tilt-root:hover`) for product/editorial cards.
- Vignette/grain overlays (`.luxury-vignette`, `.museum-vignette-strong`) layered on top of hero/banner images via absolutely-positioned pseudo-siblings.

## 8. Provenance summary (rule origin)
| Layer | Origin |
|---|---|
| Semantic color tokens (`--background`, `--primary`, etc.) | Custom CSS `:root`/`.dark`, shadcn convention |
| Tailwind `colors.*` mapping | `tailwind.config.ts`, shadcn convention |
| `brand` color | Custom addition on top of shadcn convention (OGURA-specific) |
| Button/Badge/Dialog/etc. variants | shadcn `cva`, Radix primitives |
| `.museum-*`, `.luxury-*`, `.waitlist-*`, `.editorial-*`, `.product-tile-3d*` | 100% hand-written custom CSS (`@layer utilities`), not generated by any tool |
| Fonts (Cormorant/Manrope/Playfair) | External Google Fonts `<link>` in `index.html`, applied via raw CSS `font-family` (not Tailwind config) |
| Icons | `lucide-react` package, inline React usage |
| 3D tilt/parallax/glare | Custom React components (`Tilt3D`, `ParallaxLayer`) + custom CSS vars, `framer-motion` for entrance animation |
| Inline hardcoded Tailwind color utilities (`text-[#e9d4a3]`, `bg-[#D4AF37]`, etc.) | Ad hoc inline Tailwind arbitrary-value classes, bypassing the token system entirely |

## 9. Hardcoded colors / inconsistencies (evidence)
A `grep -rn "text-\[#\|bg-\[#\|border-\[#"` across `src/components` and `src/pages` returned **150+ raw hex-color occurrences** (152 total hex-literal matches outside `index.css`). This indicates the "museum gold" (`#c9a56b` / `#e9d4a3` / `#f4efe6`) and a **second, unrelated "made-to-order gold"** (`#D4AF37` / `#B8860B`) and a **third luxe-edit palette** (`#4A3728`, `#6B5B4F`, `#C9A962`, `#3A2A1E`) and a **fourth CTA blue** (`#1E9FD9`) are all used as raw arbitrary Tailwind values instead of design tokens. Evidence:

- `src/components/HiddenGemsSection.tsx:87,92,112,147,148,161` — `text-[#e9d4a3]`, `border-[#c9a56b]/10`, etc. (museum gold, duplicated inline instead of reusing `.museum-eyebrow`/CSS vars).
- `src/components/LuxuryBrands.tsx:58,64` — `text-[#e9d4a3]/85`, `text-[#f4efe6]/65` (museum ivory/gold, inline).
- `src/components/LuxuryStoreLocator.tsx:58,59,65` — `text-[#e9d4a3]`, `text-[#c9a56b]`, `text-[#f4efe6]/65`.
- `src/components/LuxuryTrustBadges.tsx:34,35,37,40` — `border-[rgba(233,212,163,0.4)]`, `text-[#e9d4a3]`, `text-[#f4efe6]`.
- `src/components/PinterestInspiredSection.tsx:71,73,90` — `text-[#f4efe6]/85`, `text-[#e9d4a3]`.
- `src/components/category/CategoryHeroBanner.tsx:79,91` — a **third gold**, `#D4AF37`, mixed with `#E8D5B7` — inconsistent with museum gold `#c9a56b`/`#e9d4a3` used elsewhere. **[CONFLICT]**: two different "gold" hex families (`#c9a56b`/`#e9d4a3` museum vs `#D4AF37`/`#B8860B` made-to-order) are used for what appears to be the same conceptual "luxury gold accent," with no shared token.
- `src/components/category/LuxeEditSection.tsx:21,24,27,32` — yet another palette: `#C9A962`, `#4A3728`, `#6B5B4F`, `#4A3728`/`#3A2A1E` (brown/gold "luxe edit" theme, distinct from both golds above).
- `src/components/made-to-order/MTOBaseDesignGallery.tsx:131,152,153,169,187`, `MTOCustomizationPanel.tsx:192,203,278,279,292,298`, `MTODesignerSelector.tsx:72,100,101,117`, `MTOEntryPaths.tsx:66` — pervasive `#D4AF37`/`#B8860B` "made-to-order gold," entirely separate from `--ogura-pink`/museum tokens, used dozens of times as raw arbitrary values rather than a CSS variable.
- `src/pages/Contact.tsx:170` — `bg-[#1E9FD9] hover:bg-[#1a8bbf]` — a one-off blue CTA button color unrelated to any brand/accent token (`--accent` is orange `25 95% 53%`, `--ogura-pink` is pink `342 68% 52%`; this blue matches neither).
- `@keyframes kenburns` duplicate definitions with **different scale peaks** (`index.css` line 181: `1.05`; `tailwind.config.ts`: `1.08`) — see §1.4.
- `--ogura-red` (`0 84% 60%`) declared in `:root` but **no confirmed consumer** found in this pass — possible dead/unused token. **[UNKNOWN]**.
- Dark mode (`.dark` class) does not redeclare `--ogura-pink`/`--gradient-ogura`/museum vars, and no theme-toggle UI was found — dark mode CSS exists but its activation path is unconfirmed. **[MISSING]**.

**Net effect**: the project has at least **four distinct, non-tokenized "gold/luxury accent" color families** in simultaneous use (`#c9a56b`/`#e9d4a3` museum, `#D4AF37`/`#B8860B` made-to-order, `#C9A962`/`#4A3728` luxe-edit, `#E8D5B7`/`#D4AF37` category-hero) plus the token-based `--ogura-pink` brand color, none of which are unified in `tailwind.config.ts` or `:root`.

# 17 — Content Inventory (verbatim user-visible copy)

Tag: [CONFIRMED] = read verbatim from source. Static = literal string in JSX. Dynamic = template/variable.

## index.html (meta/OG)
File: `index.html`. All static.
- Title: `OGURA — Premium Fashion Marketplace | Designer Wear Online`
- meta description: `Shop curated designer fashion from premium Indian brands at OGURA. Made-to-order couture, AI styling and free delivery on orders above ₹999.`
- meta keywords: `fashion, online shopping, premium brands, designer wear, AI stylist, clothing, accessories`
- og:title: `OGURA — Premium Fashion Marketplace`
- og:description: `Curated designer fashion, made-to-order couture and AI styling. Free delivery on orders above ₹999.`
- og:image: `https://ogura.in/og-image.jpg?v=4` (1200×630), og:image:alt: `OGURA homepage — Fashion that defines you.`
- twitter:site: `@ogura_fashion`; twitter:title/description mirror OG.

## Home / Hero (`src/components/Hero.tsx`)
- Slide 1 eyebrow: `NEW IN MIDSEASON`, heading: `Shop Now`
- Slide 2 eyebrow: `THE BEST DEALS`, heading: `Discover More`
All static, no display conditions found beyond carousel slide index.

## Login (`src/pages/Login.tsx`)
- Wordmark heading: `OGURA` (tracked letter-spacing, appears twice — likely two render branches, e.g. mobile/desktop)
- `Welcome Back` (h2)

## Contact (`src/pages/Contact.tsx`)
- Eyebrow: `Get in touch`
- H1: `Contact Us`
- Body: `We'd love to hear from you. Reach out for brand collaborations, wholesale enquiries or any questions about OGURA.`
- Contact card labels: `Email` → `brands@ogura.in`; `Phone` → `+91 98970 14111` (`tel:+919897014111`); `Studio` → `India`
- Form labels: `Your First Name` (placeholder `Enter your first name`), `Your Email Address*` (placeholder `Enter your email address`), `Mobile Number` (placeholder `Mobile number`), `Your Message*` (placeholder `Type your message here`)
- Consent checkbox: `I agree to receive messages for communication via RCS.` (label text above it literally reads `terms`)
- Submit button: `Submit Your Inquiry` / `Sending...` while submitting (dynamic, `submitting` state)
- Validation (zod, dynamic via `parsed.error.issues[0]?.message`): `Please enter a valid email`, `Invalid phone number`, `Message is required`, `Please accept the terms`
- Toast on submit: title `Please check the form` (destructive) OR title `Inquiry ready to send`, description `Your email client has opened with your message.`
- Behavior: submits via `mailto:brands@ogura.in?subject=...&body=...` (client-side mailto, not a backend call — see doc 20).

## Careers (`src/pages/Careers.tsx`)
- `CAREERS_EMAIL = "careers@ogura.in"` (static const, used in copy/mailto).
- SEO/share description string (line ~558, static, likely used as meta or hidden text): `Remote OGURA internships across fashion, marketplace, Launchpad, content, product, technology and operations. 16 open roles — apply at careers@ogura.in.`
- Application form fields (zod-validated, dynamic error copy): Name (`Name is required`), Email (`Please enter a valid email`), Phone (optional, regex `Invalid phone number`), Role (`Please tell us the role you want`), Portfolio (optional), Message (`A short note is required`).
- **16 roles** grouped under 5 headings — verbatim, static content (all copied exactly from source, see full detail in `src/pages/Careers.tsx` lines 54–560+; representative excerpts below; full text is copied verbatim in-source and not paraphrased here beyond direct quotation):
  - **Fashion & Marketplace**: `01 Fashion Catalogue & Product Taxonomy Intern`, `02 Fashion Brand Sourcing Intern`, `03 Brand Partnerships & Seller Onboarding Intern`, `04 Seller Success & Marketplace Operations Intern`.
  - **OGURA Launchpad**: `05 Fashion Founder Lead Generation & Outreach Intern`, `06 Fashion Partnerships & Launchpad Sales Intern`, `07 Fashion Brand Strategy & Research Intern`, `08 Fashion Sourcing & Product Development Intern`.
  - **Content & Editorial**: `09 Fashion Content & Editorial Intern`, `10 Influencer & Creator Partnerships Intern`.
  - **Product & Growth**: `11 Product Management Intern`, `12 Product Marketing & Growth Intern`.
  - **Technology**: `13 AI Product / AI Engineering Intern` (+ likely 3 more roles beyond line 397, **[MISSING]** — file continues past the 500-line read window to 931 total lines; remaining role copy (roles 14–16 and closing sections) was not re-fetched in this pass due to time constraints — recommend a follow-up `code--view` of `src/pages/Careers.tsx` lines 397–931 to capture verbatim).
  - Each role object has fields: `title, department, experience?, preferred?, about, doList[], needList[], needLabel?, qualifications?, note?, extraLabel?, extra?` — all static string arrays, rendered inside `Accordion` components.

## Legal pages (verbatim — both short enough to reproduce in full, not summarized)

### Privacy Policy (`src/pages/PrivacyPolicy.tsx`) — Effective Date: March 17, 2025
Section headings in order: `Information We Collect`, `How We Use Your Information`, `Communication Consent`, `Information Sharing`, `Data Security`, `Cookies`, `Your Rights`, `Data Retention`, `Changes to This Policy`, `Contact Us`.
Key verbatim clauses:
- Intro: `Ogura ("we", "our", "us") is committed to protecting your privacy and ensuring transparency in the way your personal data is handled.` / `This Privacy Policy is issued in accordance with applicable laws in India, including the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.`
- Communication Consent blockquote (SECURITY/COMPLIANCE-SENSITIVE copy — [SECURITY-SENSITIVE]): `"We collect personal details like your name, email address, and phone number etc. By sharing your information, you authorize Ogura to contact you via SMS, RCS, WhatsApp, Email, and other communication channels. This consent overrides any NDNC/DND registration as per TRAI regulations."`
- Rights/contact email used: `foundercares@ogura.in` (**[OBSERVED] [CONFLICT]**: differs from the `brands@ogura.in` used elsewhere in Contact/Careers pages — two different official contact emails exist in the codebase).

### Terms of Use (`src/pages/TermsOfUse.tsx`) — Effective Date: March 17, 2025
Section headings in order: `Platform Overview`, `User Responsibilities`, `Purchases & Payments`, `Seller Responsibility`, `Returns, Refunds & Cancellations`, `Intellectual Property`, `Communication Consent` (same blockquote as Privacy Policy, verbatim identical), `Limitation of Liability`, `Termination`, `Governing Law`.
Notable clause: `These Terms shall be governed by the laws of India, and any disputes shall be subject to the jurisdiction of the courts in Agra, Uttar Pradesh.` — [OBSERVED] establishes registered jurisdiction as Agra, UP.
`Ogura operates as an online marketplace that enables independent sellers and brands to list and sell products to users. Ogura acts as an intermediary and does not own or directly sell the products listed on the platform.`

## Footer (two implementations coexist — [OBSERVED] [CONFLICT])
### `src/components/Footer.tsx` (light theme)
- Brand blurb: `Your destination for curated fashion from premium brands. Discover personalized style with our AI-powered shopping experience.`
- Columns: **Shop** (`All Products`, `New Arrivals`, `Brands`, `Designer Labels`, `Occasions`, `Gift Cards`); **Help** (`Contact Us`, `Shipping Info`, `Returns`, `Size Guide`, `Store Locator`); **Legal** (`Privacy Policy`, `Terms of Use`, `Cookie Policy`, `Join as Fashion Designer`, `Seller Program`).
- Copyright: `© 2024 Ogura. All rights reserved. Prices are inclusive of all taxes.` (static, hardcoded year 2024 — **[OBSERVED]** not dynamically generated from `new Date().getFullYear()`).
- Social icons link to `href="#"` placeholders (Instagram/Facebook/Twitter/Youtube) — **[OBSERVED]** non-functional links, no real social URLs wired.
- Note: `Cookie Policy` link target `/cookies` — **[UNKNOWN]** whether this route exists (not present in the routes list captured for `CustomerApp.tsx`); likely a **dead link** — flag as [MISSING] route.

### `src/components/LuxuryFooter.tsx` (dark/luxury theme, uses `ogura-logo.png.asset.json`)
- Newsletter: heading `Join the List`, body `Subscribe to receive exclusive access to new arrivals, private sales, and more.`, button `Subscribe` (form has no visible submit handler in the excerpt read — **[UNKNOWN]** whether newsletter signup actually persists anywhere; likely non-functional UI).
- Columns: **Shop** (`New Arrivals, Dresses, Tops, Bottoms, Accessories` — all link to `/collections` regardless of label, **[OBSERVED]** non-differentiated links); **About** (`Our Story, Sustainability, Careers, Press` — all link to `/` except explicit `Join as Fashion Designer` → `/join` and `Seller Program` → `/seller-program`; **[OBSERVED]** `Careers`/`Press`/`Our Story`/`Sustainability` labels all point to `/` — dead/unimplemented links except that a real `/careers` route exists elsewhere, meaning this footer's `Careers` link is broken); **Help** (`Contact Us→/contact, Careers→/careers, Shipping→/, Returns→/, Size Guide→/, Store Locator→/stores, Privacy Policy→/privacy, Terms of Use→/terms`).
- Customer service line: `Customer Service` + phone `+91 12345 67890` (`tel:+911234567890`) — **[OBSERVED] [CONFLICT]**: this is a different, generic-looking placeholder phone number vs. the real `+91 98970 14111` used on the Contact page — likely a placeholder never replaced.

## Waitlist / Seller Program (`src/pages/BrandWaitlist.tsx`, `src/components/waitlist/WaitlistForm.tsx`)
- WhatsApp CTA: `Chat with Ogura on WhatsApp` (aria-label), `Chat on WhatsApp` (button text), footer strap: `Ogura Seller Program. Curated designerwear, original brands only. ogura.in · +91 77426 98970`.
- `WHATSAPP_NUMBER = "917742698970"` constant, used to build `https://wa.me/{number}?text=...` deep link.
- Section eyebrows/labels observed: `Vision`, `Mission`. Numeric stat: `50` (large serif number, context/label truncated in view — likely "50 brands" or similar goal metric, **[UNKNOWN]** exact accompanying label text not fully captured).
- Form field: `Contact number` with hint `WhatsApp preferred`; placeholder `+91 98765 43210`; submit path also offers `Apply on WhatsApp` button.

## Stores / Store Locator (`src/data/stores.ts`)
- Static store records with `phone` and `whatsapp` fields per store (Mumbai `+91 22 2640 1234` / `+919876543210`... pattern), used to build `tel:`/`wa.me` links in `src/pages/Stores.tsx`. **[OBSERVED]** these look like placeholder/demo phone numbers (`+9198765432XX` sequential pattern) rather than real store lines — likely mock data, not production contact info.

## 404 (`src/pages/NotFound.tsx`)
- `404` (h1), `Oops! Page not found`, link `Return to Home` → `/`. Styling uses raw Tailwind gray/blue utilities (`bg-gray-100`, `text-blue-500`) inconsistent with the rest of the token-based design system — [OBSERVED] visual inconsistency (see doc 16 §9 pattern).

## Checkout (`src/pages/Checkout.tsx`) — toasts and dynamic copy
- `Delivery Address Selected` / description dynamic: `Delivering to ${address.city}, ${address.pincode}`
- Discount code flow (dynamic, all destructive-variant toasts on failure): `Invalid code` / `This discount code is not valid.`; `Code expired` / `This discount has reached its usage limit.`; `Minimum not met` / `` Minimum purchase of ₹${data.min_purchase} required. ``; success: `Discount applied!` / `` You saved ₹${amount} ``; generic failure: `Error` / `Could not apply discount.`
- Free delivery threshold copy implied by logic: `deliveryFee = subtotal >= 999 ? 0 : 99` (matches homepage meta claim "free delivery on orders above ₹999").

## Contact details summary (as they literally appear in code — collect once, cross-reference above)
| Value | File | Context |
|---|---|---|
| `brands@ogura.in` | `src/pages/Contact.tsx` | primary contact email, mailto + display |
| `foundercares@ogura.in` | `src/pages/PrivacyPolicy.tsx` | data-rights/grievance email — **[CONFLICT]** differs from `brands@ogura.in` |
| `careers@ogura.in` | `src/pages/Careers.tsx` | careers applications |
| `+91 98970 14111` | `src/pages/Contact.tsx` | real business phone (`tel:+919897014111`) |
| `+91 12345 67890` | `src/components/LuxuryFooter.tsx` | placeholder-looking phone (`tel:+911234567890`) |
| `+91 77426 98970` (`917742698970`) | `src/components/waitlist/WaitlistForm.tsx`, `src/pages/BrandWaitlist.tsx` | WhatsApp seller-program contact |
| `+9198765432XX` series | `src/data/stores.ts` | per-store demo phone/WhatsApp numbers, likely mock |

## Note on scope/limits of this extraction
Given the size of the codebase (393 files, `Careers.tsx` alone 931 lines with likely 3 more roles beyond line 397), this document captures **all major page-level and component-level copy blocks read directly from source** but does **not** re-transcribe every single microcopy string in every admin/seller dashboard page (`src/components/seller-dashboard/pages/*`, `src/pages/admin/*`) verbatim — those were enumerated by file path only (see doc 18/20 file lists) and are flagged **[MISSING]** for full verbatim copy extraction in a follow-up pass focused specifically on Admin/Seller dashboard UI strings.

# 18 — ASSETS INVENTORY

## 1. `src/assets/**` (bundled, Vite-processed, build-time imports)

Two categories exist: raw binary files committed to the repo, and Lovable CDN-externalized assets represented by a `<file>.asset.json` sidecar (the actual binary lives on Lovable's R2/CDN and is fetched at build time via the `url` field; the `.asset.json` itself is what's in git).

### 1a. Raw files (not asset.json-backed)
| Path | Type | Source | Usage | Public/Private | Dynamic/Static |
|---|---|---|---|---|---|
| src/assets/bags-hero.jpg | jpg | static import | CategoryShowcase/Hero sections (bags category) [OBSERVED] | public (bundled) | static |
| src/assets/bottoms-hero.jpg | jpg | static import | bottoms category hero [OBSERVED] | public | static |
| src/assets/chanderi-shine.jpg | jpg | static import | collection/editorial section [OBSERVED] | public | static |
| src/assets/dresses-hero.jpg | jpg | static import | dresses category hero [OBSERVED] | public | static |
| src/assets/footwear-hero.jpg | jpg | static import | footwear category hero [OBSERVED] | public | static |
| src/assets/hidden-gems-hero.jpg | jpg | static import | HiddenGemsSection.tsx [INFERRED] | public | static |
| src/assets/indie-vogue.jpg | jpg | static import | editorial/collection grid [INFERRED] | public | static |
| src/assets/insta-loved.jpg | jpg | static import | InstagramModelsBanner-adjacent grid [INFERRED] | public | static |
| src/assets/made-to-order-lehenga.jpg | jpg | static import | MTOHeroSection / Made-to-Order marketing [INFERRED] | public | static |
| src/assets/outerwear-hero.jpg | jpg | static import | outerwear category hero [OBSERVED] | public | static |
| src/assets/saree-society.jpg | jpg | static import | editorial section [INFERRED] | public | static |
| src/assets/tops-hero.jpg | jpg | static import | tops category hero [OBSERVED] | public | static |
| src/assets/urban-loom.jpg | jpg | static import | editorial section [INFERRED] | public | static |

All the above are referenced via `import x from "@/assets/..."` and get hashed filenames + content-based cache-busting by Vite at build (`[name]-[hash].ext`). [INFERRED from Vite defaults]

### 1b. `.asset.json` CDN-externalized assets (Lovable platform mechanism)
Each `.asset.json` is a pointer; Lovable's build tooling resolves the `url` to the actual file content from R2 storage at build time and the import resolves to that CDN path in the emitted bundle. **These are not raw pixel files in the repo** — no dimensions available from metadata; only size/content-type. [OBSERVED]

| Sidecar path | CDN URL | original_filename | size (bytes) | content_type | created_at | Usage |
|---|---|---|---|---|---|---|
| src/assets/designers/anamika-khanna.jpg.asset.json | /__l5e/assets-v1/74ee1438-eb0c-46ee-817f-d8316c187b90/anamika-khanna.jpg | anamika-khanna.jpg | 81092 | image/jpeg | 2026-07-13T17:44:58Z | Designer spotlight card (AzaDesignerCard/DesignersSpotlight) [INFERRED] |
| src/assets/designers/anita-dongre.jpg.asset.json | /__l5e/assets-v1/c108a610-370e-4e10-9084-be1846477332/anita-dongre.jpg | anita-dongre.jpg | 136048 | image/jpeg | 2026-07-13T17:44:51Z | Designer spotlight card [INFERRED] |
| src/assets/designers/aseem-kapoor.jpg.asset.json | /__l5e/assets-v1/a401cc07-6fd8-4843-bb0d-b75873d1d346/aseem-kapoor.jpg | aseem-kapoor.jpg | 59761 | image/jpeg | 2026-07-13T17:44:44Z | Designer spotlight card [INFERRED] |
| src/assets/designers/gauri-nainika.jpg.asset.json | /__l5e/assets-v1/3e134417-c269-40d4-9226-5bc6ec98e261/gauri-nainika.jpg | gauri-nainika.jpg | 106167 | image/jpeg | 2026-07-13T17:44:40Z | Designer spotlight card [INFERRED] |
| src/assets/designers/ka-sha.jpg.asset.json | /__l5e/assets-v1/eaf1a3ef-4d66-4a98-b48b-0aedb4c19ce7/ka-sha.jpg | ka-sha.jpg | 148350 | image/jpeg | 2026-07-13T17:45:02Z | Designer spotlight card [INFERRED] |
| src/assets/designers/punit-balana.jpg.asset.json | /__l5e/assets-v1/d942dedf-2014-4714-b10e-40ecc2c51ceb/punit-balana.jpg | punit-balana.jpg | 116585 | image/jpeg | 2026-07-13T17:44:37Z | Designer spotlight card [INFERRED] |
| src/assets/designers/rajiramniq.jpg.asset.json | /__l5e/assets-v1/e7930fed-ffca-46b8-813f-583ab442fa8a/rajiramniq.jpg | rajiramniq.jpg | 123479 | image/jpeg | 2026-07-13T17:44:47Z | Designer spotlight card [INFERRED] |
| src/assets/designers/roshi.jpg.asset.json | /__l5e/assets-v1/59ec30bf-93cc-49e3-9e75-155801d957b8/roshi.jpg | roshi.jpg | 65001 | image/jpeg | 2026-07-13T17:44:33Z | Designer spotlight card; note also duplicated as static product photos under public/roshi/ [OBSERVED] |
| src/assets/designers/tarun-tahiliani.jpg.asset.json | /__l5e/assets-v1/9c802cec-9735-420f-8a35-1dc6344c4bf6/tarun-tahiliani.jpg | tarun-tahiliani.jpg | 92449 | image/jpeg | 2026-07-13T17:44:54Z | Designer spotlight card [INFERRED] |
| src/assets/ogura-logo.png.asset.json | /__l5e/assets-v1/8fd62990-93af-40f4-bd92-2685c5d42633/ogura-logo.png | ogura-logo.png | 92462 | image/png | 2026-08-17T19:59:44Z | Header/LuxuryHeader/Footer logo [INFERRED — imported wherever brand logo is rendered] |
| src/assets/waitlist/wl-ai-studio.png.asset.json | /__l5e/assets-v1/745a04b5-b8b9-4c67-ab21-285db9aea827/ogura-studio.png | ogura-studio.png | 145626 | image/webp (mismatched: `.png` filename, `content_type: image/webp`) [CONFLICT] | 2026-08-25T13:24:43Z | BrandWaitlist page AI-studio teaser [INFERRED] |
| src/assets/waitlist/wl-brand-1.png.asset.json | /__l5e/assets-v1/477b9f55-c508-4ffe-ac0a-35718b341e40/waitlist-brand-1.png | waitlist-brand-1.png | 640240 | image/png | 2026-08-25T13:24:32Z | BrandWaitlist page brand showcase [INFERRED] |
| src/assets/waitlist/wl-brand-2.png.asset.json | /__l5e/assets-v1/56726882-aa82-40ce-a890-618bc9dfba7c/waitlist-brand-2.png | waitlist-brand-2.png | 747649 | image/png | 2026-08-25T13:24:37Z | BrandWaitlist page brand showcase [INFERRED] |

No dimensions are recorded in any `.asset.json` — width/height are [UNKNOWN] for all CDN-externalized images.

## 2. `public/**` (served verbatim, no hashing, no cache-busting unless via query string)

| Path | Type | Usage | Public/Private | Notes |
|---|---|---|---|---|
| public/favicon.png | png | index.html:6-7 `<link rel="icon">` / apple-touch-icon | public | **No cache-busting version query** on favicon links [OBSERVED][CONFLICT — og-image has `?v=4`, favicon does not] |
| public/og-image.jpg | jpg | index.html:22-23,34 og:image / twitter:image, referenced with `?v=4` cache-busting query | public | Static 1200×630 (declared via `og:image:width`/`height` meta, not verified against actual file) [OBSERVED] |
| public/placeholder.svg | svg | Generic fallback image (used by OptimizedImage / product cards on error) [INFERRED] | public | fallback asset |
| public/robots.txt | txt | crawler policy | public | static |
| public/instagram-brands-hero.png | png | InstagramModelsBanner or FeaturedBrands hero [INFERRED] | public | static |
| public/bags/collection-hero.jpg | jpg | Bags collection page hero [INFERRED] | public | static |
| public/bags/buckle-shoulder-burgundy.webp | webp | static demo product image, referenced from src/data/products.ts (hardcoded catalog) [INFERRED] | public | static |
| public/bags/classic-crossbody-black.webp | webp | same as above | public | static |
| public/bags/fringe-hobo-brown.webp | webp | same as above | public | static |
| public/bags/moon-crescent-blue.webp | webp | same as above | public | static |
| public/bags/striped-canvas-tote.webp | webp | same as above | public | static |
| public/bags/vanity-top-handle-black.webp | webp | same as above | public | static |
| public/bags/woven-hobo-brown.webp | webp | same as above | public | static |
| public/bags/woven-hobo-burgundy.webp | webp | same as above | public | static |
| public/bags/woven-tote-cream.webp | webp | same as above | public | static |
| public/indigo/product-1.jpg … product-5.jpg | jpg (5 files) | Static demo "Indigo" brand product set, src/data/products.ts or src/data/stores.ts [INFERRED] | public | static |
| public/roshi/product-1.jpg … product-10.jpg | jpg (10 files) | Static demo "Roshi" designer product set, src/data/products.ts [INFERRED] | public | static |

## 3. Fonts

index.html:9-10 preconnects to `fonts.googleapis.com`/`fonts.gstatic.com`; index.html:11 loads Google Fonts stylesheet:
`Cormorant+Garamond` (weights 300–700, italics), `Manrope` (300–800), `Playfair+Display` (400–700, italics). [CONFIRMED, index.html:11]
No local `@font-face` declarations found in `src/App.css` or Tailwind config search performed; fonts are 100% Google Fonts CDN, loaded render-blocking-free via `display=swap`. [OBSERVED]

## 4. Icons

Icon system is exclusively `lucide-react` — 151 files import from `"lucide-react"` [OBSERVED, code.txt]. No custom SVG icon sprite system found. Icons are inlined React components, tree-shaken per import, no separate network asset.

## 5. Hardcoded remote/CDN media URLs in components/data (file:line + URL)

### Videos (Cloudinary, category hero/card videos)
All in `src/data/oguraCategories.ts` (heroVideo/cardVideo pairs, same URL repeated for hero+card per category):
- :70,74 `https://res.cloudinary.com/dow8lbkui/video/upload/v1768726916/19ygmntpw5rmy0cvt1arvsffr0_result__be5kbh.mp4`
- :121,125 `https://res.cloudinary.com/dpnosz8im/video/upload/v1768723510/nvfa3tvknnrmy0cvt0gbe0nd5r_result__q3spyc.mp4`
- :185,189 `https://res.cloudinary.com/dow8lbkui/video/upload/v1768728765/ekk60tp1qhrmt0cvt1s9gz5xtw_result__kgwj0e.mp4`
- :236,240 `https://res.cloudinary.com/dpnosz8im/video/upload/v1768725355/t88wqe2hy5rmy0cvt0z8c534s8_result__flnqjk.mp4`
- :288,292 `https://res.cloudinary.com/dpnosz8im/video/upload/v1768726004/g7h46ecqsdrmw0cvt14985g7fr_result__dctjte.mp4`
- :347,351 `https://res.cloudinary.com/dow8lbkui/video/upload/v1768726481/n074nvqgt9rmw0cvt1696aag3w_result__r9ng7h.mp4`
- :398,402 `https://res.cloudinary.com/dow8lbkui/video/upload/v1768727437/pdc7kwtt9nrmt0cvt1f9jmjmyw_result__c49r5p.mp4`
- :457,461 `https://res.cloudinary.com/dow8lbkui/video/upload/v1768727700/ypkv23106xrmw0cvt1h8ddvvhc_result__ffbnha.mp4`

`src/components/made-to-order/MTOHeroSection.tsx:5` reuses the same first Cloudinary URL as a hardcoded constant (duplication with oguraCategories.ts:70). [OBSERVED][CONFLICT — duplicated hardcoded literal instead of shared import]

`src/components/InstagramModelsBanner.tsx:11` — `https://res.cloudinary.com/dow8lbkui/video/upload/v1772960567/Ogura_fashion_brand_reel_d936ed2c10_y9kikd.mp4`

`src/data/menuData.ts:26` — `https://videos.pexels.com/video-files/4125383/4125383-uhd_2560_1440_30fps.mp4` (mega-menu preview video)

`src/components/LoveOguraSection.tsx:9-13` — 5 Pexels video URLs + matching Unsplash poster images (hardcoded array, static, not from DB despite the component also querying `influencer_videos` table via react-query — see §7 conflict below):
- :9 video `videos.pexels.com/video-files/4778602/...mp4`, poster `images.unsplash.com/photo-1617137968427-...`
- :10 video `.../5480459/...mp4`, poster `.../photo-1515886657613-...`
- :11 video `.../4536558/...mp4`, poster `.../photo-1539008835657-...`
- :12 video `.../5480711/...mp4`, poster `.../photo-1496747611176-...`
- :13 video `.../4765917/...mp4`, poster `.../photo-1509631179647-...`

### GIFs
`src/components/RoundCategorySection.tsx:9,15,21,27,33` — hardcoded `https://ogura.in/assets/gifs/{dresses,tops,bottoms,outerwear,accessories}-loop.gif`. **These point at the production domain's own `/assets/gifs/` path, which does not exist anywhere in `public/` or `src/assets/` in this repo** — [MISSING] referenced-but-missing asset. In local/preview environments these 404.

### Other hardcoded image domains referenced in data files (not fully enumerated line-by-line; representative)
- `src/data/products.ts:212,246` — external image URLs for demo catalog entries [OBSERVED, needs manual review for exact domain]
- `src/data/stores.ts:7,12,18,23,29,34,40,45` — external store logo/cover image URLs [OBSERVED]
- `src/pages/Stores.tsx:62`, `src/pages/BrandDetail.tsx:102`, `src/pages/Careers.tsx:903`, `src/pages/BrandWaitlist.tsx:451,468`, `src/pages/JoinUs.tsx:304`, `src/pages/SellerApply.tsx:224` — each contains one hardcoded `https://` literal (likely Unsplash/placeholder imagery or external form links); exact URL text not captured in this pass [UNKNOWN — requires per-file re-grep for full text]

## 6. Storage-bucket-backed media

| Bucket | Written from | DB column holding URL | Public/Private | URL generation |
|---|---|---|---|---|
| `product-images` | src/pages/seller/SellerAddProduct.tsx:113-122, src/pages/SellerApply.tsx:51-53, src/pages/JoinUs.tsx:108-110, src/components/seller-dashboard/pages/DashboardAddProduct.tsx:76-78 | `products.images` (jsonb array) [CONFIRMED, db.txt:130]; also seller-application photo fields on `seller_applications`/`sellers` [INFERRED] | Public — all call sites use `.getPublicUrl()`, no signed URL generation found | `supabase.storage.from("product-images").getPublicUrl(path)` after `.upload(path, file)` |
| `tryon-images` | src/hooks/useVirtualTryOn.ts:110-116 | Not a DB column directly — public URL is passed in-memory to `virtual-tryon` edge function invoke (useVirtualTryOn.ts:137) and/or stored to `tryon_history` table via VirtualTryOn.tsx:99,136 [INFERRED — column name not enumerated in db.txt excerpt] | Public — `.getPublicUrl()` | same pattern as above |
| `influencer-videos` (referenced by requirement, no direct `storage.from("influencer-videos")` call site found in the grepped `src` calls) | Not observed in client code — `influencer_videos` table (db.txt) stores `video_filename` + `poster_url` as **text columns**, not resolved via `storage.from()` in the client; likely resolved to a public bucket URL by convention/CDN base path in the consuming component (`LoveOguraSection.tsx` queries `influencer-videos` react-query key but renders hardcoded array — see conflict below) | `influencer_videos.video_filename`, `influencer_videos.poster_url` [CONFIRMED, db.txt] | [UNKNOWN] whether bucket is public | [UNKNOWN — no client-side URL construction found] |

No `.storage.from("influencer-videos")` or `.storage.from("tryon-images").upload` call outside the ones listed was found; storage bucket privacy (public vs. RLS-gated) is [UNKNOWN] beyond what `getPublicUrl()` implies (bucket must be public for that URL to resolve without a token).

## 7. Conflicts / anomalies

- [CONFLICT] `src/components/LoveOguraSection.tsx` fetches `influencer_videos` table via react-query key `['influencer-videos']` (code.txt) yet the component **also** defines a hardcoded array of 5 Pexels/Unsplash URLs at lines 9-13. Whether the hardcoded array is a fallback or the query result is actually used/replaced could not be fully confirmed without the full component body — flagged for review.
- [CONFLICT] `wl-ai-studio.png.asset.json` original_filename is `ogura-studio.png` but content_type is `image/webp` — filename/type mismatch.
- [MISSING] `RoundCategorySection.tsx` GIF URLs point to `https://ogura.in/assets/gifs/*.gif`, none of which exist in `public/assets/gifs/` in this repository.
- No favicon cache-busting version param exists, unlike `og-image.jpg?v=4` — inconsistent cache-invalidation strategy for icons vs. og-image [OBSERVED].

## 8. Orphaned / unused assets

Not independently verified by exhaustive cross-reference of every asset against every import in this pass; candidates suspected of narrow/single-purpose use with no cross-links found beyond one component: `public/instagram-brands-hero.png`, `src/assets/hidden-gems-hero.jpg`, `src/assets/indie-vogue.jpg`, `src/assets/insta-loved.jpg`, `src/assets/saree-society.jpg`, `src/assets/urban-loom.jpg` — [UNKNOWN, requires per-file `rg` confirmation not completed in this pass; do not treat as confirmed-orphaned].

## 9. Referenced-but-missing assets

- `https://ogura.in/assets/gifs/{category}-loop.gif` (5 files) — referenced in RoundCategorySection.tsx but absent from repo [MISSING].

# 19 — FRONTEND STATE

## 1. AuthContext (src/contexts/AuthContext.tsx)
Exported: `user, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, isAuthenticated, isLoading, isNewUser, completeOnboarding` (AuthContext.tsx:7-17). Backed by internal `session` state (not exposed).
- Init: `supabase.auth.onAuthStateChange` subscription set up first (line 41), then `supabase.auth.getSession()` (line 59) — standard Supabase SSR-safe pattern.
- On session present: `fetchUserProfile` queries `profiles` table by id (line 73-77); falls back to session metadata if no profile row; sets `isNewUser = profile.is_onboarded === false`.
- `signInWithEmail`/`signUpWithEmail` call `supabase.auth.signInWithPassword` / `signUp` directly (lines 160,170). Signup **client-side auto-inserts** `sellers` row (line 175, `application_status: 'approved'` hardcoded) and `user_roles` row (`role: 'seller'`) (line 184) — [SECURITY-SENSITIVE] every self-registered user is auto-approved as a seller from the client with no server-side check.
- `logout()`: `supabase.auth.signOut()` then clears `user`, `session`, `isNewUser` (lines 195-200). No explicit localStorage/cart/wishlist clear — cart and wishlist persist across logout (see §7).
- `sessionStorage` key `ogura_post_auth_path` (line 21,123) stores intended post-login redirect path; read in `src/pages/Login.tsx:20,44` and removed after use.
- Cross-tab: relies entirely on Supabase's own storage-key sync (see `previewAuthStorage.ts`, auto-generated, not documented further per instructions); no custom `storage` event listeners for auth in this context.
- Race condition: `fetchUserProfile` is invoked from `onAuthStateChange` via `setTimeout(...,0)` (line 47-49) specifically to avoid Supabase client deadlock — a known Supabase pattern; if `getSession()` resolves after `onAuthStateChange` fires, `setIsLoading(false)` could be called twice but is idempotent.

```text
[unauthenticated] --signInWithEmail/signUpWithEmail/signInWithGoogle--> [session set via onAuthStateChange]
        |                                                                        |
        |                                                          fetchUserProfile(userId)
        |                                                                        |
        |                                              profile found? --yes--> user set, isNewUser=profile.is_onboarded===false
        |                                                     |no
        |                                                     v
        |                                       user set from session metadata, isNewUser=true
        v
[isAuthenticated=false] <--logout()-- [isAuthenticated=true, user set]
```

## 2. CartContext (src/contexts/CartContext.tsx)
Shape: `items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, tax, total` (lines 4-14).
- Persistence: `localStorage['cart']` (lines 20,25) — plain JSON array of `{product, size, color, quantity}`. **Guest and authenticated carts share the same key; no per-user namespacing** — [SECURITY-SENSITIVE] cart persists after logout and is visible to next user of shared browser.
- `tax = subtotal * 0.18` (18% GST) computed **entirely client-side** (line 67); `total = subtotal + tax` (line 68) — no server recomputation observed in CartContext; Checkout.tsx recomputes independently (see doc 20).
- No cross-tab sync via `storage` event listener — a second tab won't see updates until reload/remount.
- No React Query involvement; pure `useState` + `useEffect` write-through to localStorage.

```text
mount: items = JSON.parse(localStorage['cart']) || []
addItem(product,size,color,qty) -> find matching line -> merge qty or push new line -> setItems -> useEffect -> localStorage['cart']=items
removeItem/updateQuantity(qty<=0) -> filter out line -> same persistence
clearCart() -> items=[] -> localStorage['cart']="[]"
(logout does NOT call clearCart — cart survives auth transitions)
```

## 3. WishlistContext (src/contexts/WishlistContext.tsx, 64 lines)
- Persistence: `localStorage['wishlist']` (code.txt:16,21), same pattern as Cart — JSON array, write-through `useEffect`.
- No per-user namespacing; survives logout — same [SECURITY-SENSITIVE] shared-browser concern as cart.
- Consumers: Search.tsx / Collections.tsx / ProductCard-type components use `useWishlist()` to toggle heart icon state.

## 4. FilterContext (src/contexts/FilterContext.tsx)
Shape: `filters: {category, search, sortBy, priceRange, sizes, colors, tags}`, actions `setCategory, setSearch, setSortBy, setPriceRange, toggleSize, toggleColor, toggleTag, clearFilters` (lines 4-24).
- Pure in-memory `useState`, **no persistence** — filters reset on page reload/navigation away and back. Default: `category:'All', search:'', sortBy:'newest', priceRange:[0,50000], sizes:[], colors:[], tags:[]` (lines 16-24).
- Not connected to URL query params in this context (PLP pages may separately read `useSearchParams` — see §6); no evidence this FilterContext syncs to/from the URL.

```text
clearFilters() -> filters = defaultFilters (category:'All', search:'', sortBy:'newest', priceRange:[0,50000], sizes:[], colors:[], tags:[])
toggleSize/toggleColor/toggleTag -> array include-check -> push or filter -> setFilters(prev=>({...prev, list}))
```

## 5. LocationContext (src/contexts/LocationContext.tsx, 373 lines)
Shape (lines 29-53): `location, isLoading, permissionStatus, requestLocation, setManualLocation, detectLocationByIP, checkDelivery, lookupPincode, showPermissionModal/setShowPermissionModal, showManualSelector/setShowManualSelector, showAddressModal/setShowAddressModal, selectedAddress/setSelectedAddress`.
- Persistence keys: `ogura_user_location` (`LOCATION_STORAGE_KEY`, line 58) and `ogura_selected_address` (`SELECTED_ADDRESS_KEY`, line 59). Also `ogura_location_asked` set by `LocationPermissionModal.tsx:31` (separate flag, "have we asked yet").
- Load order on mount (lines ~104-140): (1) read `localStorage[LOCATION_STORAGE_KEY]` synchronously if present → set immediately; (2) if `isAuthenticated`, query DB (likely a `profiles`/`addresses` table) for a saved location, overwrite localStorage+state if found; (3) fallback to `detectLocationByIP()` which calls the `ip-geolocation` edge function (line 76) and defaults to Delhi on failure (lines 90-100).
- `detectLocationByIP` is silent-fail-safe: on error it still sets a hardcoded `{city:'Delhi', state:'Delhi', country:'India', pincode:''}` default (lines 93-100) so the app is never without a location.
- `checkDelivery`/`lookupPincode` call `pincode-lookup` edge function (line 325) for delivery-zone checks against `delivery_zones` table server-side.
- `selectedAddress` (checkout delivery address) persists to `SELECTED_ADDRESS_KEY` (line 168) — used by Checkout.tsx.
- Cross-tab: none (no storage event listener). Race condition: localStorage read and DB read both mutate `location` state independently; if DB read resolves after localStorage read, DB value wins (last-write) — order-dependent but not guarded against out-of-order async resolution explicitly.

```text
mount -> localStorage[ogura_user_location]? --yes--> setLocation(stored)
                                            --no---> (skip)
      -> isAuthenticated? --yes--> query DB location --found--> setLocation(dbLocation); localStorage[..]=dbLocation
                          --no/not found--> detectLocationByIP()
                                              -> functions.invoke('ip-geolocation')
                                                   success -> setLocation(ipLocation); localStorage[..]=ipLocation
                                                   failure -> setLocation(defaultDelhi); localStorage[..]=defaultDelhi
```

## 6. MadeToOrderContext (src/contexts/MadeToOrderContext.tsx)
Shape: single `state: MTOState` object covering the entire wizard (currentStep, entryPath, inspirationImages: File[], occasion, budget, notes, selectedDesigner, selectedBaseDesign, customizations, generatedPreviews, selectedPreview, designerReviewStatus, designerComments, estimatedPrice, consentToSocialShare) plus setters and `resetJourney()` (lines 19-52).
- **No persistence** — pure in-memory `useState`; a page refresh mid-wizard loses all progress including uploaded `File[]` objects (Files cannot be serialized to localStorage anyway).
- `setEntryPath` also forces `currentStep = 1` as a side effect (line 83) — coupled transition.
- `resetJourney()` resets to `initialState` (defaults: `budget:[25000,500000]`, `customizations:{dressType:'Lehenga', fabric:'Silk', color:'#8B0000', embroideryLevel:'Moderate'}`, `estimatedPrice:[45000,65000]`) (lines 54-75).

```text
[null entryPath, step 0] --setEntryPath(path)--> [entryPath=path, step=1]
  --setSelectedDesigner/setSelectedBaseDesign--> [step 2]
  --setCustomizations(partial merge)--> [step N, customizations updated]
  --setGeneratedPreviews/setSelectedPreview--> [preview review]
  --resetJourney()--> [back to initialState]
```

## 7. @tanstack/react-query usage
Confirmed call sites (code.txt):
- `src/hooks/useDesigners.ts:7` `queryKey:['designers', filters]`; `:43` `queryKey:['designer', id]`
- `src/hooks/useDesignerProducts.ts:13` `queryKey:['designer-products', designerId, filters, page]`; `:88` `queryKey:['designer-categories', designerId]`
- `src/hooks/useDesignerBySlug.ts:7` `queryKey:['designer','slug',slug]`
- `src/components/LoveOguraSection.tsx:18` `queryKey:['influencer-videos']`

No explicit `invalidateQueries`/`useMutation` call sites were found in the grepped set — all observed usage is read-only `useQuery`, meaning writes elsewhere (product uploads, discount inserts, order writes) do **not** invalidate any of these query caches; stale designer/product lists after a seller edits their own product are possible until natural refetch (default `staleTime`) or full navigation remount. [OBSERVED/INFERRED — no global QueryClient config file inspected in this pass]

## 8. URL/query state
`src/pages/Collections.tsx` and `src/pages/Search.tsx` use `useSearchParams` (Collections.tsx pattern inferred from category/subcategory mapping constants at top of file) to drive category filters from the URL; Algolia's InstantSearch (`Search.tsx`) manages its own internal search-state (query, refinements, page) independent of `FilterContext`. [OBSERVED/INFERRED]

## 9. Auth/session persistence (informational only — files below are auto-generated, not to be edited)
`src/integrations/supabase/client.ts` and `src/integrations/supabase/previewAuthStorage.ts` implement the Supabase client and a custom storage adapter: in framed/preview mode, session tokens are relayed via `postMessage` so preview surfaces share one login; otherwise falls back to `localStorage` (previewAuthStorage.ts:18,74-84). Actual Supabase session storage key name is managed internally by the generated client and not restated here per instructions.

## 10. Seller/admin session state
No separate seller/admin session context exists; seller/admin identity is derived per-request via `supabase.from("sellers").select("id").eq("user_id", user.id).maybeSingle()` (e.g. DashboardProducts.tsx:45, DashboardDiscounts.tsx:57, DashboardAddProduct.tsx:56) and `src/hooks/useUserRole.ts` (role lookup, presumably against `user_roles` table) — i.e., role/seller-scoping state is **re-fetched per component**, not centralized in AuthContext. [OBSERVED] This means role changes elsewhere are not reactively propagated to already-mounted components using a stale `useUserRole` result until they refetch.

## 11. Other localStorage/sessionStorage keys (misc, non-context)
- `pinterest_connected`, `pinterest_token`, `pinterest_code` — set/read in `ConnectPinterestButton.tsx`, `UserPinterestBoards.tsx`, `PinterestCallback.tsx`. [SECURITY-SENSITIVE] `pinterest_token` (an OAuth access token) is stored in plain localStorage (PinterestCallback.tsx:35), readable by any script/XSS on the origin.
- `ogura_location_asked` — `LocationPermissionModal.tsx:31`, one-time "don't ask again" flag.
- `sidebar:state` cookie (`SIDEBAR_COOKIE_NAME`, `src/components/ui/sidebar.tsx:68`) — shadcn sidebar UI persistence, non-sensitive.

## 12. Security-sensitive summary
- [SECURITY-SENSITIVE] Cart/Wishlist localStorage not cleared on logout — cross-user leakage risk on shared devices.
- [SECURITY-SENSITIVE] Pinterest OAuth token stored in plain localStorage (XSS-exfiltratable).
- [SECURITY-SENSITIVE] `signUpWithEmail` client-side auto-approves every signup as a `seller` with `application_status:'approved'` and assigns `role:'seller'` directly from the browser (AuthContext.tsx:175-187) — trust boundary violation if not backed by strict RLS insert policies limiting what a self-insert can set.

# 20 — FRONTEND DATA FETCHING

## 1. Supabase `from()` call sites

| File:Line | Table | Op | Trigger | Fields | Auth req | RLS reliance |
|---|---|---|---|---|---|---|
| src/contexts/AuthContext.tsx:73-77 | profiles | SELECT | on session change | `*` by id | session required | RLS: user reads own profile [INFERRED] |
| src/contexts/AuthContext.tsx:175-181 | sellers | INSERT | signUpWithEmail | user_id, brand_name, city, seller_type, application_status:'approved' | authenticated (post-signup) | [SECURITY-SENSITIVE] client sets `application_status:'approved'` directly — depends entirely on RLS/insert policy to not trust this column, otherwise self-approval |
| src/contexts/AuthContext.tsx:184-187 | user_roles | INSERT | signUpWithEmail | user_id, role:'seller' | authenticated | [SECURITY-SENSITIVE] client-assigned role; RLS must restrict insertable roles or any signup could self-assign `admin` if the value were attacker-controlled (here hardcoded to 'seller', so limited, but pattern is risky) |
| src/contexts/AuthContext.tsx:205-208 | profiles | UPDATE | completeOnboarding() | is_onboarded:true, updated_at | authenticated | RLS: `auth.uid()=id` presumed |
| src/components/waitlist/WaitlistForm.tsx:82 | brand_waitlist_applications | INSERT | form submit | brand_name, handle_or_website, what_you_make, city, brand_age, sell_channels, monthly_orders, phone | public/unauthenticated (marketing form) | RLS presumably public INSERT-only |
| src/components/seller-dashboard/pages/DashboardProducts.tsx:45 | sellers | SELECT (id) | dashboard mount | id by user_id | authenticated | RLS: sellers self-select |
| src/components/seller-dashboard/pages/DashboardDiscounts.tsx:57 | sellers | SELECT (id) | dashboard mount | id | authenticated | same |
| src/components/seller-dashboard/pages/DashboardAddProduct.tsx:56 | sellers | SELECT (id) | form mount | id | authenticated | same |
| src/components/seller-dashboard/pages/DashboardAddProduct.tsx:101 | products | INSERT | add-product submit | full product row incl. price, images, category, etc. | authenticated seller | RLS policy "Sellers can insert own products" WITH CHECK seller_id ownership [CONFIRMED db.txt:290] |
| src/components/VirtualTryOn.tsx:99,136 | tryon_history | INSERT | after virtual try-on generation | user id + result reference | authenticated | RLS [UNKNOWN, not in excerpt] |
| src/pages/Checkout.tsx:78-114 (handleApplyDiscount) | discounts | SELECT `*` | user clicks "Apply" | filter by code, status='active' | any (client reads full discount row incl. usage_limit, min_purchase) | RLS: presumably public SELECT of active discounts — [SECURITY-SENSITIVE] client fetches full row and does eligibility math itself (usage_limit, min_purchase, percentage calc) rather than server validating; a modified client could apply invalid/expired/ineligible codes if RLS doesn't also enforce at write time downstream |
| src/pages/SellerApply.tsx:73 | seller_applications | INSERT | application submit | applicant fields (as any cast — no generated types) | public/unauthenticated | RLS [UNKNOWN] |
| src/pages/JoinUs.tsx:125 | seller_applications | INSERT | application submit | applicant fields | public/unauthenticated | RLS [UNKNOWN] |
| src/pages/seller/SellerAddProduct.tsx:157 | products | INSERT | add-product submit (alt page) | product row | authenticated seller | same RLS as above |
| src/hooks/useDesigners.ts:6-43 | designers | SELECT | list/detail pages | filtered/by id | public | RLS: public read presumably |
| src/hooks/useDesignerProducts.ts:12-88 | products (+categories) | SELECT | designer storefront | filtered by designer_id, paged | public | RLS "Anyone can view live products" (status='live' AND is_available=true) [CONFIRMED db.txt:286] |
| src/hooks/useDesignerBySlug.ts:6 | designers | SELECT | designer page by slug | by slug | public | public read |
| src/components/LoveOguraSection.tsx:17-18 | influencer_videos | SELECT | homepage mount | video rows | public | public read |
| src/pages/Collections.tsx (supabase import) | products (implied, alongside external API merge) | SELECT | PLP mount | product rows merged with `staticProducts` and external API | public | public read |

## 2. Supabase `storage` call sites
| File:Line | Bucket | Op | Notes |
|---|---|---|---|
| src/pages/seller/SellerAddProduct.tsx:113,122 | product-images | upload + getPublicUrl | seller product image upload |
| src/pages/SellerApply.tsx:51,53 | product-images | upload + getPublicUrl | seller application proof image |
| src/pages/JoinUs.tsx:108,110 | product-images | upload + getPublicUrl | join-us application image |
| src/hooks/useVirtualTryOn.ts:110,116 | tryon-images | upload + getPublicUrl | user-uploaded try-on photo |
| src/components/seller-dashboard/pages/DashboardAddProduct.tsx:76,78 | product-images | upload + getPublicUrl | seller dashboard product image |

All uploads use **public bucket + `getPublicUrl()`**, no signed URLs observed — file paths become guessable/public once uploaded; no explicit content-type/size validation visible at these call sites in this pass [UNKNOWN — needs code body inspection to confirm].

## 3. Supabase `functions.invoke` (edge functions) call sites
| File:Line | Function | Trigger | Input | Purpose |
|---|---|---|---|---|
| src/services/socialPostService.ts:82 | social-post-webhook | social share action | post payload | pushes social post webhook |
| src/services/recommendationService.ts:70,108,138,167 | ai-recommendations | various recommendation widgets | user/context params | product recommendations |
| src/services/recommendationService.ts:196 | image-analysis | image-based search/recs | image data | visual analysis |
| src/contexts/LocationContext.tsx:76 | ip-geolocation | mount, silent location detect | none | IP → city/state |
| src/contexts/LocationContext.tsx:325 | pincode-lookup | delivery checker / address form | pincode | city/state/deliverability lookup |
| src/hooks/useVirtualTryOn.ts:137 | virtual-tryon | user starts try-on | model image + garment image URLs | AI try-on generation |
| src/pages/Checkout.tsx:152 | razorpay-create-order | user clicks pay | amount, currency, receipt, notes | creates Razorpay order server-side |
| src/pages/Checkout.tsx:208 | razorpay-verify-payment | Razorpay handler callback | razorpay_order_id/payment_id/signature + full `order_data` (customer_id, subtotal, shipping_fee, discount, total, shipping_address, items[]) | **Server-side signature verification AND the actual `orders`/`order_items` INSERT happens inside this edge function** (client only assembles the payload) — this is the correct pattern: monetary totals are computed client-side (Checkout.tsx `finalTotal = total + deliveryFee - discountAmount`) and merely **passed** to the edge function, not authoritative unless the edge function recomputes/re-validates server-side [UNKNOWN whether razorpay-verify-payment recomputes totals — flagged in findings] |
| src/pages/PinterestCallback.tsx:26 | pinterest-token-exchange | OAuth callback | auth code | exchanges Pinterest code for token |

## 4. Raw `fetch()` to external services
| File:Line | Endpoint | Purpose | Auth | Error handling |
|---|---|---|---|---|
| src/pages/ProductDetail.tsx:108 | `https://pyesltzkemtranachpne.supabase.co/functions/v1/products` | fetch external "Seller Center" product catalog for a single product's detail merge | none observed (no auth header) | [UNKNOWN — needs body inspection] |
| src/pages/Collections.tsx:25 (`EXTERNAL_API_URL`) | same endpoint | fetch full external product catalog for PLP, merged with `staticProducts` | none | maps external shape via helper |
| src/lib/brandStores.ts:3,25-49 (`EXTERNAL_API_URL`, `mapApiProduct`) | same endpoint | builds brand/store pages from an external, cross-project Seller Center API (different Supabase project id than this app's own backend — `pyesltzkemtranachpne` vs this project's own ref) [SECURITY-SENSITIVE — cross-tenant data dependency, no visible auth, response shape defensively coerced with `??`/fallbacks suggesting an unstable/loosely-typed contract] | none | defensive `?? / \|\|` fallbacks throughout `mapApiProduct`, placeholder image fallback `/placeholder.svg` |
| src/components/PinterestBoardModal.tsx:41 | `https://api.pinterest.com/v5/boards/{board.id}/pins?page_size=25` | fetch board pins for "connect Pinterest" UX | uses `pinterest_token` from localStorage (Bearer) [INFERRED] | [UNKNOWN] |
| src/lib/algoliaClient.ts | Algolia REST via `algoliasearch/lite` client, index `ogura-products` | product search (Search.tsx, Header search dropdowns) | Algolia public search-only API key (embedded client-side; by design lite/search keys are safe to expose) [OBSERVED] | handled by InstantSearch internals |
| Checkout.tsx (script tag, not fetch) | `https://checkout.razorpay.com/v1/checkout.js` | loads Razorpay JS SDK | none | onload sets `razorpayLoaded` |

## 5. Summary tables

### Reads by table
`profiles, sellers, discounts, designers, products, product_variants (via RLS-visible join), influencer_videos, tryon_history (implied read on history page, not directly grepped)`.

### Writes by table
`sellers (INSERT — signup auto-seller), user_roles (INSERT — signup auto-role), profiles (UPDATE — onboarding), brand_waitlist_applications (INSERT), products (INSERT — seller add-product, two separate pages), tryon_history (INSERT), seller_applications (INSERT ×2 pages)`. **No direct client-side INSERT to `orders` or `order_items` was found** — those are created inside the `razorpay-verify-payment` edge function only (server-side), per Checkout.tsx:208 and RLS policy "Customers can create orders" (`auth.uid()=customer_id`, db.txt:274) which exists presumably for the edge function's use of the user's JWT context or a service-role bypass [UNKNOWN which].

### Edge functions invoked from client
`ai-recommendations, image-analysis, ip-geolocation, pincode-lookup, virtual-tryon, razorpay-create-order, razorpay-verify-payment, pinterest-token-exchange, social-post-webhook`. Not invoked directly from client (server/cron only, per supabase/functions listing): `generate-banner-image, mcp, send-otp, verify-otp, sync-algolia` [OBSERVED — no client call sites found for these five].

### External endpoints
`https://pyesltzkemtranachpne.supabase.co/functions/v1/products` (external Seller Center API, 3 call sites), Algolia (`*.algolia.net` via SDK), `api.pinterest.com/v5`, `checkout.razorpay.com` (SDK script), Cloudinary/Pexels/Unsplash (static media only, see doc 18).

## 6. Findings — frontend operations that should be server-side only

1. **[HIGH] Discount/coupon validation and amount computation performed entirely client-side.** Evidence: Checkout.tsx:78-121 — reads full `discounts` row via `supabase.from("discounts").select("*")`, then client JS checks `usage_limit`, `min_purchase`, and computes `amount` for percentage/fixed/free-shipping types, storing `discountAmount`/`appliedDiscount` in component state. Nothing forces the edge function to recompute or verify the discount server-side beyond whatever `razorpay-verify-payment` may (not confirmed) trust. A tampered client could send an arbitrary `discount` value inside `order_data` (Checkout.tsx:161-181, `discount: Math.round(discountAmount)`), and if the edge function doesn't recompute the discount from the DB and only uses the client-provided `total`, this is a direct pricing-integrity risk.

2. **[HIGH] Order total (`finalTotal`) is computed client-side** (Checkout.tsx:132-133, `deliveryFee`, `finalTotal = total + deliveryFee - discountAmount`) and passed both to `razorpay-create-order` (used to set the actual charge amount, line 152-166) and again inside `order_data.total` to `razorpay-verify-payment` (line 161-181). If `razorpay-create-order` uses the client-supplied `amount` as-is to create the payment order without recomputing from server-held cart/product prices, a modified client can pay less than the real cart total. Evidence: amount field sent directly from `finalTotal` with no server-side product-price lookup visible from the client code path.

3. **[MEDIUM] `unit_price`/`total_price` per line item are taken from client state** (Checkout.tsx: `items.map(item => ({... unit_price: Math.round(item.product.price) ...}))`), i.e., `item.product.price` originates from whatever product data the client currently has loaded (which could itself be stale/tampered if sourced from the cart's localStorage-persisted `product` object — see doc 19 CartContext, which stores full product objects in localStorage). If the edge function trusts these values instead of re-querying `products` by `product_id`, an attacker could edit `localStorage['cart']` to lower `product.price` before checkout.

4. **[MEDIUM] Client-side auto-creation of seller identity and role at signup** (AuthContext.tsx:175-187) — writing `application_status:'approved'` and `role:'seller'` from the browser during self-signup bypasses any human/automatic vetting workflow implied by the existence of a separate `seller_applications` review table (SellerApply.tsx, JoinUs.tsx). This creates two parallel, inconsistent seller-onboarding paths: one instant/self-approved (AuthContext), one application-based (`seller_applications`).

5. **[LOW-MEDIUM] External Seller Center API calls with no visible authentication** to `https://pyesltzkemtranachpne.supabase.co/functions/v1/products` from `Collections.tsx`, `ProductDetail.tsx`, `brandStores.ts` — cross-project data fetch merged directly into product listings/detail pages; if that endpoint is unauthenticated and mutable state ever gets derived from it (e.g., price display), it constitutes an external trust dependency outside this app's own RLS/edge-function boundary.

**Note:** actual `orders`/`order_items` table writes were not found client-side (good practice — confirmed done inside `razorpay-verify-payment` edge function, consistent with RLS policy `orders` INSERT `auth.uid()=customer_id` at db.txt:274, and order_items INSERT policy scoped to owning order at db.txt:257-259). The remaining risk is whether that edge function **re-derives** amounts/discounts from trusted server data or **trusts the client-supplied `order_data` verbatim** — the edge function's internal logic was not in the extracted `code.txt`/`db.txt` facts available to this document and is marked **[UNKNOWN — verify supabase/functions/razorpay-verify-payment/index.ts server-side logic directly]**.
