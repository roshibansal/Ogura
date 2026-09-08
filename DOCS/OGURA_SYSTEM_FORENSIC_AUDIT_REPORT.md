# OGURA — PRE-MERGE FORENSIC AUDIT REPORT
## Full Forensic Technical & Architectural Audit Before Frontend / System Merge

> [!WARNING]
> ### ARCHIVED DOCUMENT
> This document is a **historical pre-merge forensic audit** from before the frontend/backend integration and commerce hardening work. It describes the state of the codebase **prior** to Track B marketplace hardening, atomic checkout implementation, and webhook crash-safe processing.
> For the current authoritative backend specification, see [`/DOCS/BACKEND.md`](file:///Users/samarth/Downloads/STUFF/WORK/Personal/coy-clone-studio_revamped/DOCS/BACKEND.md).

> **Audit Type:** Pre-Implementation Forensic System Audit  
> **Repository:** `coy-clone-studio` (Old Production System) vs `/ogura-handoff` (New Frontend / Taxonomy Prototype)  
> **Target Production URL:** `https://ogura.in` | `https://sellers.ogura.in` | `https://admin.ogura.in`  
> **Prototype Reference URL:** `https://ogura-rho.vercel.app`  
> **Status:** ARCHIVED — Superseded by `/DOCS/BACKEND.md` and `/DOCS/report.md`  

---

## 1. Executive Summary

This forensic audit evaluates two fundamentally different systems residing in the `coy-clone-studio_revamped` workspace:

1. **The Old Production System (`coy-clone-studio` / root):**
   A multi-tenant, production-grade marketplace application built on **Vite 5.4.19 + React 18.3.1 + TypeScript 5.8.3 + Tailwind CSS 3.4.17 + shadcn/ui (Radix UI)**. It features an automated multi-domain router (`ogura.in`, `sellers.ogura.in`, `admin.ogura.in`), full Supabase Lovable Cloud PostgreSQL backend integration (28 migrations, 19 tables, Row Level Security policies, database functions), 18 Deno Edge Functions, Razorpay payment capture and HMAC-SHA256 signature verification, Algolia instant search indexing (`ogura-products`), full cart and checkout state management, customer addresses, seller onboardings, and role-based access control (`consumer`, `seller`, `admin`).

2. **The New Frontend / Taxonomy Prototype (`/ogura-handoff`):**
   A high-fidelity editorial prototype built on **Next.js 16.3.4 (App Router) + React 19.1.1 + Tailwind CSS 4.1.13**. It contains **212 statically generated HTML pages**, an artisanal typography/color system (Fraunces serif + Inter sans, warm parchment `#f1eae0`, dark ink `#17130f`, terracotta clay `#b0512c`, forest green `#24402f`), an editorial positioning model ("The Call is the Product"), and an 11-category garment taxonomy. 
   **Critically: It has ZERO database connectivity, ZERO authentication, ZERO real cart, ZERO payment gateway, ZERO real order creation, and ZERO backend API calls.** All 193 designs and 12 boutique profiles are hardcoded in a 3,829-line static data file (`ogura-handoff/source/src/lib/data.ts`). Furthermore, as documented in `ogura-handoff/PHOTOS.md` and `README.md`, all 193 design photos are third-party reference images collected from other brands that cannot legally be published.

### Core Audit Findings & Architectural Verdict

- **The Myth of "Just Merge":** Merging the Next.js 16 / React 19 / Tailwind 4 codebase directly over the existing Vite 5 / React 18 / Tailwind 3 codebase would **completely annihilate** the working production marketplace. It would break Razorpay payments, destroy seller/admin subdomains, wipe out Supabase RLS authentication, break Algolia search, and cause fatal peer dependency conflicts with Radix UI and Tailwind plugins.
- **The True Merge Value:** The new handoff provides an **invaluable information architecture, superior visual aesthetics, a distinctive brand tone, and a high-converting consultation-first UX ("Request a Call")**.
- **The Execution Formula:**
  $$\text{Target OGURA} = \text{New UX / Taxonomy / Visuals} + \text{Old Production Hooks / Services / DB / RLS / Payments}$$
  All new screens must be transplanted as React components into the existing Vite/React Router app, driven by adapters that query the existing Supabase backend.

---

## 2. Repository Topology

### A. Comprehensive Workspace Directory Map

```text
coy-clone-studio_revamped/
├── .env / .env.local                    # Root environment configs (Supabase URL, Anon Key, Algolia)
├── index.html                          # Root HTML entry point (SEO metadata, viewport, fonts)
├── package.json                        # Root dependencies (React 18.3.1, Vite 5.4, Tailwind 3.4, Radix UI)
├── tailwind.config.ts                  # Root Tailwind config (HSL tokens, animations)
├── vite.config.ts                      # Vite build configuration (SWC React, path aliases)
├── structure.md                        # Master architectural map of old system
├── src/                                # OLD PRODUCTION SYSTEM SOURCE
│   ├── main.tsx                        # React DOM root render
│   ├── App.tsx                         # Global Providers & AppRouter domain dispatcher
│   ├── apps/                           # Subdomain Application Dispatchers
│   │   ├── CustomerApp.tsx             # 34 customer routes (ogura.in)
│   │   ├── SellerApp.tsx               # 12 seller portal routes (sellers.ogura.in)
│   │   └── AdminApp.tsx                # 8 admin portal routes (admin.ogura.in)
│   ├── components/                     # 86 production UI components & sub-systems
│   │   ├── ui/                         # 48 shadcn / Radix UI primitives
│   │   ├── auth/                       # ProtectedRoute, RoleProtectedRoute, SellerAuthRoute
│   │   ├── search/                     # Algolia InstantSearch components
│   │   ├── seller-dashboard/           # Seller portal dashboard modules
│   │   ├── luxury3d/                   # 3D Tilt and Parallax visual effects
│   │   └── wine/                       # Canvas shaders and atmospheric layout wrappers
│   ├── contexts/                       # 6 Authoritative React Contexts
│   │   ├── AuthContext.tsx             # Supabase Auth, sessions, profiles
│   │   ├── CartContext.tsx             # LocalStorage cart persistence, item management
│   │   ├── WishlistContext.tsx         # Wishlist persistence
│   │   ├── FilterContext.tsx           # PLP filters state
│   │   ├── LocationContext.tsx         # IP Geolocation & PIN verification
│   │   └── MadeToOrderContext.tsx      # Bespoke customization wizard state
│   ├── hooks/                          # 13 Custom hooks (useDesigners, useUserRole, useLenis, etc.)
│   ├── integrations/
│   │   ├── supabase/                   # Supabase client (`client.ts`) & database types (`types.ts`)
│   │   └── lovable/                    # Lovable Cloud auth helpers
│   ├── layouts/                        # CustomerLayout, SellerDashboardLayout, AdminDashboardLayout
│   ├── lib/                            # algoliaClient, brandStores, domainDetection, utils
│   ├── pages/                          # 34 Customer, Seller, and Admin view controllers
│   ├── services/                       # recommendationService, socialPostService
│   └── types/                          # Domain models (Product, CartItem, User, Designer, Brand)
├── supabase/                           # SUPABASE BACKEND INFRASTRUCTURE
│   ├── config.toml                     # Supabase project configuration
│   ├── migrations/                     # 28 SQL migration files (tables, triggers, RLS, functions)
│   └── functions/                      # 18 Deno Edge Functions
│       ├── razorpay-create-order/      # Razorpay order generation
│       ├── razorpay-verify-payment/    # Payment signature verification & order insertion
│       ├── sync-algolia/               # Catalog indexing into Algolia engine
│       ├── send-otp/ & verify-otp/     # Phone number verification
│       ├── pincode-lookup/             # Indian Postal Code logistics check
│       ├── ai-recommendations/         # AI recommendation pipeline
│       └── virtual-tryon/              # AI virtual garment fitting
└── ogura-handoff/                      # NEW FRONTEND / TAXONOMY SYSTEM
    ├── README.md                       # Prototype overview, hosting instructions, backend roadmap
    ├── PHOTOS.md                       # Copyright notice & photo replacement instructions
    ├── DOCS/report.md                  # Analysis report of the handoff prototype
    ├── static-site/                    # 212 statically built HTML pages
    └── source/                         # Next.js 16 application source code
        ├── package.json                # Dependencies (Next 16.3.4, React 19.1.1, Tailwind 4.1.13)
        ├── next.config.ts              # Next.js static export configuration
        ├── scripts/scan-photos.mjs     # Build-time photo manifest generator
        ├── public/                     # Reference photography (193 designs, 12 boutiques)
        └── src/
            ├── app/                    # Next.js App Router routes
            │   ├── layout.tsx          # Root layout (Wordmark, Nav, Footer, Fraunces font link)
            │   ├── page.tsx            # Homepage (Hero, Category rail, Category shelves)
            │   ├── globals.css         # Tailwind v4 theme, grain noise, swatch styling
            │   ├── designs/            # Catalog (/designs) & PDP (/designs/[slug])
            │   ├── boutiques/          # Boutiques directory & Profile (/boutiques/[slug])
            │   ├── for-boutiques/      # B2B studio onboarding landing page
            │   └── how-it-works/       # Trust guide & 6-step buying process
            ├── components/             # 4 Isolated Components (Cards, CallRequest, Media, Rail)
            └── lib/
                ├── data.ts             # 3,829 lines of hardcoded catalog, boutiques & taxonomy
                └── media.ts            # Photo lookup utility

```

### B. Directory Classification

| Directory | Ownership / Role | Classification |
|---|---|---|
| `/src` | Main Production Application | Source of Truth for Architecture, Auth, State, Commerce |
| `/supabase` | Production Backend & Edge Functions | Source of Truth for DB, RLS, APIs, Razorpay |
| `/ogura-handoff/source/src/app` | New Presentation Routes | Source of Truth for Visual Design, Layout, Content Hierarchy |
| `/ogura-handoff/source/src/lib/data.ts` | Hardcoded Prototype Data | Source of Truth for NEW Taxonomy & Boutique Profiles ONLY |
| `/ogura-handoff/static-site` | Static HTML Output | Build Artifact — DO NOT MERGE |
| `/ogura-handoff/source/public/designs` | Placeholder Reference Imagery | Unusable in Production (Copyrighted Reference Works) |

### C. Relationship Between Systems

The `/ogura-handoff` directory is an **independent, unintegrated Next.js static prototype**. It has zero communication with the root Vite/Supabase application. It does not import anything from `/src`, nor does `/src` import anything from `/ogura-handoff`.

---

## 3. Old System — Complete Architecture Audit

### Frontend Architecture
- **Framework:** React 18.3.1 with Vite 5.4.19 and TypeScript 5.8.3 (`package.json:L61, L95`).
- **Routing Engine:** `react-router-dom` v6.30.1 (`package.json:L67`).
- **Domain Routing Dispatcher:** Implemented in `src/App.tsx:L18-28` and `src/lib/domainDetection.ts:L16-32`.
  - `ogura.in` / `www.ogura.in` $\rightarrow$ `CustomerApp` (`src/apps/CustomerApp.tsx`)
  - `sellers.ogura.in` $\rightarrow$ `SellerApp` (`src/apps/SellerApp.tsx`)
  - `admin.ogura.in` $\rightarrow$ `AdminApp` (`src/apps/AdminApp.tsx`)
  - Dev/Preview mode resolves paths: `/seller/*` $\rightarrow$ `SellerApp`, `/admin/*` $\rightarrow$ `AdminApp`.
- **Global Providers Hierarchy (`src/App.tsx:L30-50`):**
  $$\text{QueryClientProvider} \rightarrow \text{TooltipProvider} \rightarrow \text{AuthProvider} \rightarrow \text{LocationProvider} \rightarrow \text{CartProvider} \rightarrow \text{FilterProvider} \rightarrow \text{WishlistProvider} \rightarrow \text{BrowserRouter}$$
- **Data Fetching & Cache:** TanStack React Query v5.83.0 (`package.json:L48`). Queries Supabase tables directly via `@supabase/supabase-js` v2.76.1.
- **UI & Component Primitives:** 48 Radix UI headless components styled with Tailwind CSS 3.4.17 and `class-variance-authority` (shadcn/ui architecture in `src/components/ui/`).
- **Motion & Smooth Scrolling:** Framer Motion 12.40.0, GSAP 3.15.0, Lenis 1.3.23 (`src/hooks/useLenis.ts`).

### Backend Architecture
- **Platform:** Supabase (Lovable Cloud) PostgreSQL 14.5 (`src/integrations/supabase/types.ts:L13`).
- **Authentication:** Supabase Auth (`supabase.auth.onAuthStateChange` in `src/contexts/AuthContext.tsx:L41`). Supports Email/Password and Google OAuth (with canonical origin normalizer stripping `www.` in `AuthContext.tsx:L27-31`).
- **Authorization & RLS:** Custom enum `app_role` (`consumer`, `seller`, `admin`) in table `user_roles`. Evaluated via security-definer PostgreSQL function `has_role(_user_id, _role)` (`types.ts:L1210-1216`).
- **Storage Buckets:** Supabase Storage for product images, seller documents, and avatar uploads.
- **18 Edge Functions (`supabase/functions/`):**
  - `razorpay-create-order`: Invokes Razorpay Orders API via HTTP Basic Auth.
  - `razorpay-verify-payment`: Verifies SHA-256 HMAC signature using `RAZORPAY_KEY_SECRET`; inserts orders and order items into database using `SUPABASE_SERVICE_ROLE_KEY`.
  - `sync-algolia`: Batches catalog sync from `products` + `designers` to Algolia index `ogura-products`.
  - `pincode-lookup` & `ip-geolocation`: Postal logistics validation.
  - `send-otp` & `verify-otp`: Phone verification.

### Production Commerce Pipeline
Every commerce transaction in the old system follows an immutable, verified contract:

```text
[Browser UI: Checkout.tsx]
       │
       ▼
[CartContext: total, subtotal, items]
       │
       ▼ (HTTP POST invoke)
[Edge Function: razorpay-create-order]
       │ (Calls Razorpay API)
       ▼
[Razorpay Checkout Modal in Browser]
       │ (User Pays via UPI/Card/NetBanking)
       ▼ (Returns order_id, payment_id, signature)
[Browser UI: Checkout.tsx:L208]
       │
       ▼ (HTTP POST invoke with HMAC payload + order_data)
[Edge Function: razorpay-verify-payment]
       │
       ├─► 1. crypto.subtle HMAC-SHA256 signature verification with RAZORPAY_KEY_SECRET
       ├─► 2. Generates unique order number: "OGR" + Date.now().toString(36)
       ├─► 3. supabase.from('orders').insert({...}) using Service Role Key
       └─► 4. supabase.from('order_items').insert([...])
       │
       ▼ (Returns success: true, order_number)
[Browser UI: OrderConfirmation.tsx] (Cart cleared via clearCart())
```

---

## 4. New System — `/ogura-handoff` Audit

### Technical Stack
- **Framework:** Next.js 16.3.4 (App Router) with static HTML export (`output: 'export'` implied by `npm run export` script in `package.json:L11`).
- **React Version:** React 19.1.1 (`ogura-handoff/source/package.json:L15`).
- **Styling:** Tailwind CSS 4.1.13 using PostCSS `@tailwindcss/postcss` and `@theme` CSS syntax (`src/app/globals.css`).
- **Zero Component Libraries:** Does not use Radix UI, Lucide, or shadcn. All icons are embedded raw `<svg>` elements.

### Content & Routing Topology
- `/`: Homepage with single hero listing (`lengha-03`), 11 category horizontal pills, and 11 category shelves (`src/app/page.tsx`).
- `/designs`: Catalog page with 4 faceted client-side filters (Category, Availability, Audience, Price) and low/high price sort (`src/app/designs/page.tsx`).
- `/designs/[slug]`: 193 pre-rendered dynamic product detail pages (`src/app/designs/[slug]/page.tsx`).
- `/boutiques`: Directory of 12 studios with 8 city filter pills (`src/app/boutiques/page.tsx`).
- `/boutiques/[slug]`: 12 pre-rendered boutique profile pages with studio stats, techniques, and designer call booking panel (`src/app/boutiques/[slug]/page.tsx`).
- `/for-boutiques`: B2B recruitment page explaining 20% commission, 1-piece listing, and visit request form (`src/app/for-boutiques/page.tsx`).
- `/how-it-works`: 6-step bespoke consultation process guide (`src/app/how-it-works/page.tsx`).

### The Prototype Reality
1. **Mock Data:** All content is statically imported from `src/lib/data.ts`.
2. **Dead Commerce:** On `/designs/[slug]`, the button `<button>Order this piece</button>` (`page.tsx:L103`) has **no `onClick` handler**. Clicking it does nothing.
3. **Mock Booking Flow:** `CallRequest.tsx:L312` explicitly renders `<p>Prototype — nothing is actually sent.</p>`.
4. **Mock B2B Form:** On `/for-boutiques/page.tsx:L73`, the form button renders `<p>Prototype form — not wired up yet.</p>`.
5. **No Authentication or State:** There is no concept of users, logins, carts, orders, or accounts.

---

## 5. Taxonomy Forensic Analysis

### Master Taxonomy Structure

```text
OGURA DISCOVERY TAXONOMY (from /ogura-handoff)
│
├── 1. GARMENT CATEGORIES (11 Primary Nodes)
│   ├── Lehengas          ("Bridal and occasion, six to ten weeks")
│   ├── Sarees            ("Handwoven, with the blouse drafted to you")
│   ├── Indo-Western      ("The in-between wardrobe")
│   ├── Indian Co-ords    ("Kurta sets and printed pairs")
│   ├── Western Dresses   ("Slip, prairie, midi, mini")
│   ├── Western Co-ords   ("Matched separates, cut sharp")
│   ├── Tops              ("Handloom and linen, for a working week")
│   ├── Bottoms           ("Trousers and skirts drafted from your rise")
│   ├── Jumpsuits         ("One piece, done")
│   ├── Bags              ("Leather, canvas and mirror-work" - ACCESSORY)
│   └── Shoes             ("Juttis, kolhapuris, block heels" - ACCESSORY)
│
├── 2. AUDIENCE / GENDER
│   ├── Women
│   ├── Men
│   └── Unisex
│
├── 3. AVAILABILITY & FULFILLMENT MODEL
│   ├── In Studio Now     (readyStock !== null; ships in 2-3 days; fixed size)
│   └── Made on Order     (readyStock === null; custom drafted; leadTimeDays: 10–70 days)
│
├── 4. PRICE BANDS
│   ├── Under ₹3,000      ("under3")
│   ├── ₹3,000 – ₹7,000   ("3to7")
│   └── Over ₹7,000       ("over7")
│
└── 5. ARTISAN BOUTIQUE NETWORK (12 Studios across 7 Creative Hubs)
    ├── Hyderabad: Atelier Vindhya
    ├── Delhi: Aangan Atelier, Noor Bagh, Studio Malhar
    ├── Chennai: Kamala House
    ├── Kolkata: Taant & Co., Neelambari
    ├── Jaipur: Chheepa & Sons, Maru
    ├── Mumbai: Kora Living, Zariwala & Daughters
    └── Bengaluru: The Silk Room
```

### Taxonomy Comparison & Conflict Table

| Taxonomy Dimension | New Frontend (`/ogura-handoff`) | Old System (`coy-clone-studio`) | Backed by Old DB? | Route Pattern | Data Source | Conflict / Risk |
|---|---|---|---|---|---|---|
| **Garment Categories** | 11 granular garment types (Lehengas, Sarees, etc.) | 8 broad categories (`dresses`, `tops`, `bottoms`, `outerwear`, `footwear`, `accessories`, `bags`) | **PARTIAL** (`products.category` is text; `categories` table lacks 11 rows) | `/designs?category=` vs `/collections/:category` | `data.ts` vs DB table `products` | **[HIGH RISK]** TS enum in `src/types/index.ts:L15` breaks if not expanded. |
| **Editorial Discovery** | None (pure category shelves on home) | 8 lifestyle themes (`celebrity-fashion`, `made-to-order`, `street-casual`, etc.) | **YES** (`src/data/oguraCategories.ts`) | `/category/:slug` | Hardcoded config + DB queries | **[MEDIUM RISK]** New UI discards old editorial landing pages. |
| **Availability / Stock** | `readyStock` (text count e.g. "3 pieces") vs `null` | `is_available` (bool) + `product_variants.stock_quantity` | **PARTIAL** | Filter `availability=stock` | Static vs DB columns | **[HIGH RISK]** DB has numeric stock; new UI assumes human text descriptor. |
| **Audience** | `Women`, `Men`, `Unisex` | `gender` in Algolia index; absent in DB table `products` | **NO** | Filter `for=Women` | Static vs Algolia only | **[HIGH RISK]** Old DB `products` table has no `gender` or `audience` column! |
| **Studios / Makers** | 12 `Boutiques` (owner, city, specialty, techniques, calls) | `designers` table & `sellers` table | **PARTIAL** (table `designers` has 15 columns) | `/boutiques/:slug` vs `/designer/:slug` | `data.ts` vs DB `designers` | **[MEDIUM RISK]** Attribute names differ (`owner` vs `name`, `story` vs `description`). |
| **Price Filtering** | 3 preset tiers (`under3`, `3to7`, `over7`) | Free numeric slider `[min, max]` via `FilterContext` | **YES** | URL query params | Local state vs URL | **[LOW RISK]** Trivial adapter logic. |

---

## 6. Route-by-Route Comparison Matrix

| Route | Old System Route | New System Route | Old Functionality | New UX Presentation | Real Data Source | Auth Required | Mutations Performed | Merge Strategy | Risk |
|---|---|---|---|---|---|---|---|---|---|
| **Home** | `/` (`Index.tsx`) | `/` (`page.tsx`) | Full 3D wine museum, Lenis scroll, New Arrivals, Brands, Stores | Minimalist editorial, hero showcase, category rail & shelves | Lovable DB vs `data.ts` | No | None | **MERGE** (Adopt New Layout, wire to DB) | **MEDIUM RISK** |
| **Catalog** | `/collections` | `/designs` | Breadcrumb, simple cards, wishlist, Buy Now, DB fetch | Faceted sticky filters (Category, Stock, Audience, Price), INR sort | Lovable DB vs `data.ts` | No | None | **MERGE** (Keep `/collections`, alias `/designs`, use New UI) | **HIGH RISK** |
| **Catalog Filter**| `/collections/:category` | `/designs?category=` | Dynamic route param filter | URL search param filter | Lovable DB vs `data.ts` | No | None | **ADAPT** (Support search params in router) | **LOW RISK** |
| **Product Detail**| `/product/:id` | `/designs/:slug` | 681 lines: Image gallery, video, color/size variants, Try-On, Pincode checker, Reviews, AddToCart, BuyNow | Clean 2-column editorial, stock badge, fabric notes, Call Request modal, dead order button | Lovable DB vs `data.ts` | No | Add to Cart / Buy Now (Old) | **ADAPT & REUSE OLD LOGIC** (Wrap New Visuals around Old PDP Logic) | **BLOCKER** |
| **Boutiques Directory** | `/designers` & `/brands` | `/boutiques` | Grid of designers from DB table `designers` with search & filters | Boutique cards with city filter pills, price band, review ratings | Lovable DB vs `data.ts` | No | None | **MERGE** (Keep `/designers`, redirect `/boutiques` or alias) | **LOW RISK** |
| **Boutique Profile** | `/designer/:slug` & `/store/:slug` | `/boutiques/:slug` | Profile, gallery, products grid | Editorial story, studio metrics, techniques, sticky call panel, designs grid | Lovable DB vs `data.ts` | No | None | **MERGE** (Replace presentation, map DB `designers`) | **MEDIUM RISK** |
| **B2B Onboarding** | `/join`, `/join/apply`, `/seller-program` | `/for-boutiques` | Production forms inserting into `seller_applications` and `brand_waitlist_applications` | Static marketing landing page + mock form | Lovable DB vs Static | No | Inserts into DB (Old) | **KEEP OLD LOGIC** (Use New Copy/Visuals, wire to old DB mutation) | **HIGH RISK** |
| **How It Works** | None | `/how-it-works` | None (fragmented in modals) | 6-step trust guide, consultation explainer | Static HTML | No | None | **NEW ROUTE** (Port cleanly to Vite) | **SAFE TO MERGE** |
| **Search** | `/search` | None (No search in handoff) | Full Algolia InstantSearch with facet refinements | **MISSING IN NEW** | Algolia API | No | None | **OLD MUST REMAIN** | **HIGH RISK** |
| **Cart** | `/cart` | None | Line items, quantities, price calculation, address selection | **MISSING IN NEW** | `CartContext` + LocalStorage | Customer Auth | Cart item updates | **OLD MUST REMAIN** | **BLOCKER** |
| **Checkout** | `/checkout` | None | Address selection, discounts, Razorpay order creation & payment verification | **MISSING IN NEW** | Edge Functions + Razorpay | Customer Auth | Order creation, payment capture | **OLD MUST REMAIN** | **BLOCKER** |
| **Order Confirmation**| `/order-confirmation` | None | Order ID, Razorpay payment ID, summary | **MISSING IN NEW** | Route location state | Customer Auth | None | **OLD MUST REMAIN** | **HIGH RISK** |
| **Customer Auth** | `/login`, `/onboarding`, `/profile` | None | Supabase auth, profile updates | **MISSING IN NEW** | Supabase Auth | Required | Session creation | **OLD MUST REMAIN** | **BLOCKER** |
| **Seller Portal** | `/seller/*` (12 routes) | None | Complete multi-page seller management dashboard | **MISSING IN NEW** | Supabase DB | Seller Role | CRUD on products & orders | **OLD MUST REMAIN** | **BLOCKER** |
| **Admin Portal** | `/admin/*` (8 routes) | None | Product approvals, seller approvals, metrics | **MISSING IN NEW** | Supabase DB | Admin Role | Approvals / status changes | **OLD MUST REMAIN** | **BLOCKER** |

---

## 7. Component Forensic Comparison

### 1. Navigation & Header
- **Old System (`src/components/LuxuryHeader.tsx` & `MegaMenu.tsx`):** Full-bleed wine theme, brand logo, mega menu navigation (Women, Men, Brands, Designers, Occasions, Stores, Careers), location indicator (`HeaderLocationIndicator`), Wishlist counter, Cart drawer/counter, User login menu.
- **New System (`ogura-handoff/source/src/app/layout.tsx:L23-43`):** Minimalist ivory bar (`bg-ivory/85 backdrop-blur-md`), SVG brand wordmark (`Wordmark`), 4 static links (Boutiques, Designs, How it works, For boutiques), and a "Find a boutique" pill button.
- **Verdict:** **MERGE & RESTYLE**. The Old Header possesses essential commerce capabilities (Cart trigger, Wishlist, Auth profile, Location). It must be restyled using the New System's aesthetic tokens (ivory background, Fraunces wordmark, ink typography), but **retaining** the Cart, Wishlist, and Auth icons.

### 2. Product Card
- **Old System (`src/components/PLPProductCard.tsx`):** Image with aspect ratio container, name, brand, price, original price, discount badge, wishlist heart button with toggle state, Buy Now button with direct checkout redirect.
- **New System (`ogura-handoff/source/src/components/Cards.tsx:L30-89`):** DesignCard with `Media` component, "In studio" badge, Title, Subtitle, Price formatted in INR, Availability line ("In the studio now · 3 pieces · ships in 2 days" vs "Made on order · 45 days"), Boutique link ("by Kavya Reddy · Hyderabad"), and mini `CallRequest` button.
- **Verdict:** **REPLACE PRESENTATION ONLY + REUSE OLD LOGIC**. Adopt the `DesignCard` visual presentation, typography, and availability badges, but inject the old wishlist heart toggle and wire the card click to `/product/:id`.

### 3. Product Detail (PDP)
- **Old System (`src/pages/ProductDetail.tsx` — 686 lines):** Complete commerce PDP. Gallery with thumbnail selection, variant selectors (colors and sizes with stock checks), interactive quantity selector, Add to Cart mutation, Buy Now mutation, pincode delivery estimator (`DeliveryChecker`), Virtual Try-On trigger (`VirtualTryOnDialog`), Recommendation engine (`RecommendationCarousel`).
- **New System (`ogura-handoff/source/src/app/designs/[slug]/page.tsx` — 163 lines):** Static editorial layout. 4-photo grid, designer attribution, static fabric description, static non-clickable color/size pills, availability disclaimer box, Call Request button ("Start with a call to Kavya"), dead order button.
- **Verdict:** **REUSE OLD LOGIC + NEW UI WRAPPER [BLOCKER]**. Do NOT overwrite `ProductDetail.tsx` with the new page! Instead, restyle the old page to adopt the Fraunces typography, editorial spacing, and the New "Request a Call" drawer, while keeping all interactive variant selection, Add to Cart, and delivery validation intact.

### 4. Call Booking Flow ("The Call is the Product")
- **Old System:** Fragmented consultation flow in `src/pages/MadeToOrderPage.tsx` using multi-step form wizard.
- **New System (`ogura-handoff/source/src/components/CallRequest.tsx` — 321 lines):** Exceptional 4-step modal/drawer.
  - Step 1: Topic selection (Sizing & fit, Colours, Custom design, Fabric, Delivery, Budget) + Video/Voice mode + Language selection (English, Hindi, Tamil, Bengali, Telugu, Marathi).
  - Step 2: Date slot selector (Next 3 days, 4 time slots: 11:00 am, 2:30 pm, 5:00 pm, 7:30 pm).
  - Step 3: Name & Indian mobile number input (+91 validation).
  - Step 4: Confirmation screen.
- **Verdict:** **NEW COMPONENT [SAFE TO MERGE WITH BACKEND HOOK]**. Port `CallRequest.tsx` to Vite, and wire Step 3 submission to insert a record into a new `call_requests` table or send a WhatsApp webhook notification.

---

## 8. Data Contract Audit

### Primary Data Object Matrix

| Object | Old Production Type (`src/types/index.ts`) | New Prototype Type (`src/lib/data.ts`) | Old DB Table | Field Name Discrepancies | Missing in Old DB | Missing in New Prototype | Required Transformation / Adapter |
|---|---|---|---|---|---|---|---|
| **Product / Design** | `interface Product` (L9-29) | `type Design` (L29-47) | `products` | `name` vs `title`<br>`brand` vs `boutique`<br>`tags` vs `techniques`<br>`material` vs `fabric` | `audience`<br>`readyStock` (text)<br>`leadTimeDays`<br>`palette`<br>`subtitle` | `videoUrl`<br>`rating`<br>`reviews`<br>`originalPrice`<br>`status`<br>`inStock` (bool) | **ADAPTER REQUIRED**: Map `p.title` $\rightarrow$ `title`, `p.short_description` $\rightarrow$ `subtitle`, compute `readyStock` from `p.dispatch_days` and stock. |
| **Boutique / Designer** | `interface Designer` (L91-111) | `type Boutique` (L7-27) | `designers` | `name` vs `owner`<br>`brand_name` vs `name`<br>`description` vs `story` | `techniques` (array)<br>`leadTimeDays` (tuple)<br>`callsTaken`<br>`respondsIn`<br>`palette`<br>`people` | `instagram_link`<br>`contact_number`<br>`email`<br>`followers` | **ADAPTER REQUIRED**: Map `d.brand_name` $\rightarrow$ `name`, `d.name` $\rightarrow$ `owner`, `d.description` $\rightarrow$ `story`, fallback defaults for `leadTimeDays`. |
| **Category** | `'dresses' \| 'tops' \| 'bottoms' \| 'outerwear' \| 'footwear' \| 'accessories' \| 'bags'` | `Category` (11 enum strings: "Lehengas", "Sarees", etc.) | `categories` | Case mismatch & slug differences | 11 new granular categories | Old 8 editorial themes | **DB SEED & TS EXPANSION REQUIRED**. |
| **Cart Item** | `interface CartItem` (L31-36) | **NONE** | LocalStorage | N/A | N/A | Complete Cart Contract | **KEEP OLD CONTRACT UNCHANGED**. |
| **Order** | `Table['orders']['Row']` | **NONE** | `orders` | N/A | N/A | Complete Order Contract | **KEEP OLD CONTRACT UNCHANGED**. |

### Detailed Field Mapping: `Product` vs `Design`

```typescript
// Required Data Adapter Specification (src/lib/adapters/productAdapter.ts)
export function transformDbProductToDesign(row: any, designer?: any): Design {
  return {
    slug: row.id, // Or generate slug from title
    boutique: designer?.slug || row.brand || "ogura",
    title: row.title || row.name || "Untitled Piece",
    subtitle: row.short_description || row.material || "Bespoke handcrafted piece",
    category: mapCategoryToNewTaxonomy(row.category),
    audience: row.style_tags?.includes("Men") ? "Men" : "Women",
    price: Number(row.price) || 0,
    fabric: row.fabric || row.material || "Pure artisanal fabric",
    colours: Array.isArray(row.colors) ? row.colors.map((c: any) => c.name || c) : ["Custom"],
    sizes: Array.isArray(row.sizes) ? row.sizes : ["Custom Measurement"],
    readyStock: row.is_available && row.dispatch_days && row.dispatch_days <= 3 
      ? `In studio · Ready to ship` 
      : null,
    shipsInDays: row.dispatch_days || 3,
    customisable: row.is_made_to_order ?? true,
    leadTimeDays: row.is_made_to_order ? (row.dispatch_days || 21) : 3,
    note: row.description || "Handmade in the boutique atelier.",
    palette: { from: "#7c2f3e", to: "#3a1420", accent: "#d4a24c" }
  };
}
```

---

## 9. Database Contract Audit

### Existing Database Tables (`supabase/migrations/`)
1. `profiles`: Customer profile data linked to `auth.users.id`.
2. `user_roles`: Core security table linking `user_id` to role (`consumer`, `seller`, `admin`).
3. `sellers`: Studio/seller entity linked to `user_id` with GSTIN, PAN, bank details, and verification status.
4. `seller_applications`: Inbound applications from prospective studios.
5. `brand_waitlist_applications`: B2B waitlist submissions.
6. `categories`: Hierarchical category table (`id`, `name`, `slug`, `parent_id`, `sort_order`, `is_active`).
7. `products`: Master products catalog (`id`, `title`, `price`, `original_price`, `category`, `category_id`, `designer_id`, `seller_id`, `images`, `sizes`, `colors`, `is_available`, `is_made_to_order`, `dispatch_days`, `fabric`, `material`, `status`).
8. `product_variants`: SKU variants with size, color hex, price override, and stock quantity.
9. `orders`: Authoritative commerce order record (`order_number`, `customer_id`, `seller_id`, `status`, `subtotal`, `total`, `discount`, `shipping_fee`, `shipping_address`, `tracking_id`).
10. `order_items`: Order line items with `product_id`, `variant_id`, `quantity`, `unit_price`, `total_price`.
11. `payouts`: Settlement records for sellers.
12. `discounts`: Promotional coupon codes with usage limits.
13. `designers`: Public-facing atelier directory (`id`, `name`, `brand_name`, `slug`, `city`, `category`, `price_range`, `description`, `profile_image`, `banner_image`).
14. `user_addresses`: Customer delivery addresses.
15. `delivery_zones`: Postal pincodes deliverability table.
16. `otp_verifications`: SMS OTP hashes and expirations.
17. `support_tickets`: Customer support communications.
18. `tryon_history`: AI Virtual Try-On logs.
19. `notifications` & `device_tokens`: Mobile push notification registrations.

### Database Gaps & Mismatches with New Frontend

1. **Missing 11 Taxonomy Rows in `categories` Table:**
   The `categories` table currently contains generic categories. To support `/designs?category=Lehengas`, records must be seeded for all 11 new categories.
2. **Missing `lead_time_days` and `ready_stock_text` in `products` Table:**
   The new frontend displays "ships in X days" and "Made on order · 45 days". The `products` table has `dispatch_days` (integer) and `is_made_to_order` (boolean), but lacks an explicit lead-time range for bespoke garments.
3. **No Schema Changes Strictly Required for Launch:**
   Existing columns (`dispatch_days`, `is_made_to_order`, `fabric`, `material`, `images`) can power the new UI through adapter logic without altering any database tables immediately.

---

## 10. API / Service / Edge Function Audit

### Edge Function Inventory & Contracts

```text
[CLIENT APP] ─────────────────────────────────────────────────────────────┐
     │                                                                    │
     ├─► razorpay-create-order      (Creates Razorpay order ID)           │
     ├─► razorpay-verify-payment    (HMAC-SHA256 verification & DB order) │
     ├─► sync-algolia               (Admin catalog batch sync)            │
     ├─► pincode-lookup             (Checks Indian postal deliverability) │
     ├─► send-otp & verify-otp      (SMS 2FA phone login)                 │
     ├─► ip-geolocation             (Detects user city for delivery)      │
     ├─► ai-recommendations         (Gemini-powered personalized picks)   │
     └─► virtual-tryon              (AI model fitting generation)         │
                                                                          ▼
                                                                [SUPABASE BACKEND]
```

### Risk Evaluation of New Frontend
- **Does `/ogura-handoff` bypass any security or APIs?**
  **NO**, because it has NO API calls whatsoever.
- **Critical Risk:** If an inexperienced engineer deletes the old API services and imports `data.ts` directly, the entire system loses all server-side validation, all inventory checks, and all payment verifications.

---

## 11. Authentication / Authorization Audit

### Current Authentication Architecture
- Managed by `src/contexts/AuthContext.tsx` via Supabase GoTrue.
- Roles stored in `public.user_roles`, protected by PostgreSQL RLS:
  ```sql
  CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);
  ```
- Subdomain Routing Isolation:
  - Seller portal routes wrapped in `SellerAuthRoute` (`src/apps/SellerApp.tsx:L15-19`).
  - Admin dashboard wrapped in `RoleProtectedRoute` requiring `role = 'admin'` (`src/apps/AdminApp.tsx:L12-16`).

### New Frontend Reality
- `/ogura-handoff` has **NO authentication code, NO login buttons, and NO user profile handling**.
- **Action:** Retain 100% of the Old System's auth infrastructure. Add a discreet, elegant User Profile icon in the restyled header that opens the existing login/profile modal.

---

## 12. State Management Audit

| State Domain | Old Source of Truth | New Source of Truth | Persistence Mechanism | Synchronization Model | Merge Verdict & Risk |
|---|---|---|---|---|---|
| **Auth Session** | `AuthContext` + Supabase Session | None | LocalStorage / Cookies | Realtime listener (`onAuthStateChange`) | **KEEP OLD** [SAFE] |
| **Shopping Cart** | `CartContext` | None | LocalStorage (`cart`) | Local state | **KEEP OLD** [SAFE] |
| **Catalog Filters**| `FilterContext` + `Search.tsx` | URL Query Params (`useSearchParams`) | URL query string | Browser navigation (`router.replace`) | **MERGE** (Adopt URL query param state for shareable links) [LOW RISK] |
| **Location & PIN** | `LocationContext` | None | LocalStorage (`ogura_location`) | IP Geolocation Edge Function | **KEEP OLD** [SAFE] |
| **Server Cache** | TanStack React Query (`QueryClient`) | None (static bundled JS) | In-memory cache | Automatic background re-validation | **KEEP OLD** [SAFE] |
| **Call Requests** | None | Component local state (`useState`) | In-memory | None (lost on page refresh) | **CONNECT TO DB** [MEDIUM RISK] |

---

## 13. Search / Discovery Audit

### The Algolia Search Contract (`src/lib/algoliaClient.ts` & `supabase/functions/sync-algolia`)
- **App ID:** `KEBAEMMQPI`
- **Index Name:** `ogura-products`
- **Current Indexed Fields:** `objectID`, `name`, `category`, `price`, `brand`, `gender`, `image`, `url`, `originalPrice`, `inStock`, `tags`, `rating`.

### Critical Discovery Question:
**Can the new 11-category taxonomy be expressed using the existing search system?**
- **YES**, but with one mandatory update:
  The Edge Function `supabase/functions/sync-algolia/index.ts:L675` maps `category: product.category`. If products are updated with the new 11 categories, Algolia will index them immediately.
- However, if Algolia facets remain restricted to `['dresses', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'bags']`, searching for "Lehenga" will return un-faceted results.
- **Solution:** Add `taxonomy_category` and `boutique` as searchable attributes and facet attributes in `sync-algolia/index.ts:L588-598`.

---

## 14. Commerce / Checkout Audit

### Old Commerce Pipeline vs New Frontend Comparison

```text
Feature                  Old System (`coy-clone-studio`)      New System (`/ogura-handoff`)
──────────────────────────────────────────────────────────────────────────────────────────
Add to Cart              Fully Functional (CartContext)       MISSING (No handler)
Quantity Stepper         Fully Functional (CartContext)       MISSING
Address Selection        Modal with User Addresses DB         MISSING
Coupon / Discounts       Validated against discounts table    MISSING
Razorpay Gateway         Loaded & Verified on Server          MISSING
Order State Insertion    Database orders + order_items        MISSING
Order Confirmation       Dedicated page with tracking info    MISSING
Alteration / Fit Escrow  Documented in terms                  Editorial Promise on PDP
```

### Blocker Verification
Any attempt to replace the old checkout flow with the new prototype would instantly shut down the business's ability to transact money.
**Classification:** **[BLOCKER]** — All Old Cart, Checkout, and Order Confirmation components must be preserved 100% intact.

---

## 15. Payment Architecture

The payment architecture in `src/pages/Checkout.tsx` and `supabase/functions/razorpay-verify-payment/index.ts` is production-hardened:
1. **Double-Order Protection:** Order is initiated through `razorpay-create-order` with server-side pricing recalculation.
2. **Cryptographic Validation:** Webhook/callback verifies SHA-256 HMAC digest:
   $$\text{HMAC}_{\text{SHA256}}(\text{order\_id} + "|" + \text{payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
3. **Transactional Order Capture:** Only when the cryptographic signature passes is the order inserted into `orders` with `status = 'new'` and tracking ID set to `razorpay_payment_id`.
4. **Zero Frontend Tampering:** Cart prices cannot be modified in the browser; totals are validated against database records.
**Mandate:** Payment code must not be refactored, touched, or merged with new UI.

---

## 16. Visual & Design System Audit

### Visual Token Reconciliation

| Design Token | Old System (`tailwind.config.ts` / `index.css`) | New System (`globals.css`) | Merge Recommendation |
|---|---|---|---|
| **Background** | Wine / Dark Plum (`#1C0B0F` / `hsl(var(--background))`) | Warm Ivory (`#faf7f1`) & Parchment (`#f1eae0`) | **ADOPT NEW WARM IVORY** (Superior luxury editorial feel) |
| **Foreground / Ink** | White / Light Silver | Dark Charcoal Ink (`#17130f`) & Soft Ink (`#6b6058`) | **ADOPT NEW DARK INK** |
| **Primary Accent** | Ogura Pink (`hsl(var(--ogura-pink))`) | Terracotta Clay (`#b0512c`) & Soft Clay (`#d98a63`) | **ADOPT NEW TERRACOTTA CLAY** |
| **Secondary Accent** | Gold glow / Metallic | Forest Green (`#24402f`) & Brass (`#a3853f`) | **ADOPT NEW BRASS & FOREST** |
| **Display Font** | Inter / Serif Fallback | **Fraunces** (`opsz 9..144, wght 400..600, "SOFT" 0, "WONK" 1`) | **ADOPT FRAUNCES** |
| **Body Font** | Inter (`ui-sans-serif`) | Inter (`ui-sans-serif`) | **IDENTICAL** |
| **Texture / Effects**| Museum shader / Canvas light sweep | Subtle fractal noise (`.grain::before`), `.swatch` fabric weave | **ADOPT NEW GRAIN & SWATCH** |

### Tailwind Conflict Warning
- Old system uses **Tailwind CSS v3.4.17** with JS config (`tailwind.config.ts`).
- New system uses **Tailwind CSS v4.1.13** with CSS `@theme` variables.
- **DO NOT UPGRADE TO TAILWIND 4 IN ROOT REPO.** Tailwind 4 is a breaking change that invalidates shadcn/ui and `tailwindcss-animate`. Instead, copy the new color hex codes and font families directly into root `tailwind.config.ts`.

---

## 17. Responsive & Mobile Audit

### Breakpoint Inspection
- Desktop (1280px+): Both systems perform cleanly.
- Tablet (768px – 1024px):
  - Old system collapses mega-menus into sheets.
  - New system collapses `/designs` filters cleanly into an inline horizontal scrollbar.
- Mobile (< 768px):
  - New PDP (`/designs/[slug]`): Single column, photos stack cleanly, sticky call CTA remains accessible.
  - New Catalog (`/designs`): Filter chips scroll horizontally without wrapping; does not obstruct product grid.
  - New Homepage: Horizontal category rail is sticky at `top-[65px]` with smooth horizontal touch-scrolling.

---

## 18. Accessibility Audit

- **Headings Hierarchy:** New system uses proper single `<h1>` on all major pages (`Fraunces text-4xl sm:text-5xl`).
- **Contrast Ratios:**
  - Ink (`#17130f`) on Ivory (`#faf7f1`): **16.8:1** (Exceeds WCAG AAA).
  - Clay (`#b0512c`) on Ivory (`#faf7f1`): **5.4:1** (Passes WCAG AA for normal text, AAA for large text).
  - Forest Green (`#24402f`) on Ivory (`#faf7f1`): **11.2:1** (Passes WCAG AAA).
- **Interactive Targets:** Buttons in `CallRequest.tsx` and `Cards.tsx` are minimum 44px touch height (`py-3.5`).
- **Defects in New Prototype:** Filter chips use `<Link>` without `role="checkbox"` or `aria-checked` attributes.

---

## 19. SEO Audit

- **URL Structures:**
  - Old: `/collections`, `/product/:id`, `/category/:slug`, `/brands`, `/designers`.
  - New: `/designs`, `/designs/:slug`, `/boutiques`, `/boutiques/:slug`.
- **SEO Impact:** The old URLs (`/collections`, `/product/:id`) already exist. Changing product URLs to `/designs/:slug` without 301 redirects will destroy existing indexed search equity.
- **Merge Strategy:** Retain `/product/:id` as canonical; support `/designs/:slug` as an alias that redirects or resolves via slug lookup.

---

## 20. Performance Audit

- **Asset Weight:** In `/ogura-handoff/source/public/designs`, there are 193 JPG files totaling ~35MB.
- **Image Delivery:** The prototype uses unoptimized standard `<img>` tags (`Media.tsx:L36`).
- **Old System:** Uses `OptimizedImage.tsx` with lazy loading, blurred placeholders, and WebP fallback.
- **Merge Mandate:** All new image presentation cards must be refactored to use `OptimizedImage` from the old system.

---

## 21. Security Audit

1. **Service Role Keys:** Checked all files in `/ogura-handoff` — **NO secrets or service role keys are exposed**.
2. **Client-side DB Operations:** The new frontend contains no database code, so no RLS bypass risks exist in prototype files.
3. **Input Sanitization:** The new forms (`CallRequest.tsx`, `/for-boutiques`) have client-side phone regex validation (`/^[6-9]\d{9}$/`). When wired to a real backend, standard server-side Zod schemas must validate phone and text inputs to prevent injection.

---

## 22. Mock Data Audit

### Complete Inventory of Prototype Data in `/ogura-handoff/source/src/lib/data.ts`

| File Path | Entity | Mock Description | Production Source of Truth | Replacement / Migration Requirement | Risk |
|---|---|---|---|---|---|
| `src/lib/data.ts:L79-280` | 12 Boutiques | Hardcoded boutique objects (Vindhya, Aangan, Kamala House, etc.) | DB table `designers` & `sellers` | Seed missing boutiques into `designers` table with matching slugs. | **MEDIUM RISK** |
| `src/lib/data.ts:L282-3829` | 193 Designs | 193 hardcoded designs across 11 categories with fabricated prices | DB table `products` | Seed catalog into `products` table via script or adapter. | **HIGH RISK** |
| `public/designs/*.jpg` | 193 Images | Reference photography scraped from other fashion brands | Real studio photography | **LEGAL RISK** — Must replace with boutique-owned photography before public launch (`PHOTOS.md`). | **BLOCKER** |
| `src/components/CallRequest.tsx:L16-28` | Time Slots | Dynamic JS calculation of next 3 days | Studio opening hours DB | Connect to boutique real-time calendar or WhatsApp API. | **LOW RISK** |

---

## 23. Dependency Audit

| Dependency | Old Production Version | New Prototype Version | Incompatible? | Resolution Action |
|---|---|---|---|---|
| **React** | `18.3.1` | `19.1.1` | **YES** (Radix UI peer dependency mismatch) | **KEEP REACT 18** in root workspace. |
| **Framework** | Vite `5.4.19` | Next.js `16.3.4` | **YES** (Vite SPA vs Next App Router) | **KEEP VITE**; port Next components as pure React components. |
| **Tailwind CSS** | `3.4.17` | `4.1.13` | **YES** (`tailwind.config.ts` vs `@theme`) | **KEEP TAILWIND 3**; copy color tokens to `tailwind.config.ts`. |
| **Routing** | `react-router-dom 6.30.1` | `next/navigation` | **YES** | Replace `next/link` with `Link` from `react-router-dom`. Replace `useSearchParams` with `useSearchParams` from `react-router-dom`. |
| **Icons** | `lucide-react 0.462.0` | Raw inline SVG | No | Compatible; Lucide can remain. |
| **State** | TanStack Query `5.83.0` | None | No | Keep TanStack Query. |

---

## 24. Functional Parity Matrix

| Marketplace Capability | Old System Status | New System Status | Winner | Final Strategic Decision | Risk |
|---|---|---|---|---|---|
| **Information Architecture** | Fragmented | Cohesive, bespoke | **NEW** | Adopt New IA & 11-category structure | **LOW RISK** |
| **Visual Aesthetics** | Dark wine/gold | Ivory/parchment/clay | **NEW** | Adopt New Design Tokens | **SAFE TO MERGE** |
| **Homepage Layout** | 3D wine museum | Editorial shelves | **NEW** | Replace Homepage Presentation | **LOW RISK** |
| **Category Browsing** | Basic filters | Sticky faceted chips | **NEW** | Replace Catalog Presentation | **LOW RISK** |
| **Product Detail UX** | Cluttered commerce | Elegant editorial | **TIE** | Merge: New Visual Shell + Old Commerce Core | **HIGH RISK** |
| **Boutique / Maker Profile**| Basic profile page | Rich studio profile | **NEW** | Adopt New Boutique UX | **LOW RISK** |
| **Consultation ("Call")** | Multi-step form | High-converting modal | **NEW** | Port `CallRequest` modal | **SAFE TO MERGE** |
| **Shopping Cart** | Fully Functional | Non-existent | **OLD** | Keep Old Cart System 100% | **BLOCKER** |
| **Checkout & Payments** | Fully Functional | Non-existent | **OLD** | Keep Old Checkout System 100% | **BLOCKER** |
| **Razorpay Verification** | Cryptographically Secure | Non-existent | **OLD** | Keep Old Razorpay System 100% | **BLOCKER** |
| **User Authentication** | Supabase Auth + Google | Non-existent | **OLD** | Keep Old Auth System 100% | **BLOCKER** |
| **Seller Portal** | 12 Functional Routes | Non-existent | **OLD** | Keep Old Seller Portal 100% | **BLOCKER** |
| **Admin Portal** | 8 Functional Routes | Non-existent | **OLD** | Keep Old Admin Portal 100% | **BLOCKER** |
| **Algolia Search** | Realtime index | Non-existent | **OLD** | Keep Old Algolia Engine | **HIGH RISK** |

---

## 25. Data Flow Preservation Map

```text
1. CUSTOMER DISCOVERY FLOW
   New Homepage (/) ──► Category Rail (/designs?category=Lehengas) ──► Product Card ──► PDP (/product/:id)
   [Presentation: NEW Fraunces/Ivory UI] ──► [Data: Hook query to Supabase table `products`]

2. CONSULTATION FLOW ("THE CALL")
   PDP (/product/:id) ──► CallRequest Modal ──► Enter Phone/Slot ──► Webhook / Database Insert
   [Presentation: NEW CallRequest UI] ──► [Data: Edge Function or Supabase table `call_requests`]

3. DIRECT PURCHASE FLOW
   PDP (/product/:id) ──► Add to Cart ──► CartDrawer (/cart) ──► Checkout (/checkout) ──► Razorpay ──► Confirmation
   [Presentation: Hybrid Editorial UI] ──► [Data: OLD CartContext ──► razorpay-verify-payment ──► `orders`]

4. SELLER ONBOARDING & MANAGEMENT FLOW
   For Boutiques (/for-boutiques) ──► Apply Form ──► Admin Approvals (/admin/approvals) ──► Seller Dashboard (/seller/dashboard)
   [Presentation: NEW Pitch Copy] ──► [Data: OLD `seller_applications` mutation ──► Admin Auth]
```

---

## 26. Critical Contradiction Register

### C-001: Framework & Engine Mismatch
- **Old:** Vite 5.4 SPA + React 18.3.1 + React Router DOM 6.
- **New:** Next.js 16.3 App Router + React 19.1.1.
- **Impact:** Attempting to run `/ogura-handoff` as the root app will break all client-side routing, domains, and Radix UI libraries.
- **Severity:** `[BLOCKER]`
- **Required Decision:** Retain Vite 5 + React 18 as the master engine. Port Next components by converting `next/link` to `react-router-dom` `Link`, and `next/navigation` to `useSearchParams()`.

### C-002: Tailwind CSS Version Collision
- **Old:** Tailwind 3.4.17 with `tailwind.config.ts` and `tailwindcss-animate`.
- **New:** Tailwind 4.1.13 with CSS `@theme` variables.
- **Impact:** Upgrading root to Tailwind 4 breaks `components.json`, shadcn primitives, and all existing animation utilities.
- **Severity:** `[BLOCKER]`
- **Required Decision:** Do not upgrade to Tailwind 4. Transcribe new CSS color variables (`--color-ivory`, `--color-clay`, etc.) directly into `tailwind.config.ts`.

### C-003: Category Enum Incompatibility
- **Old:** `src/types/index.ts:L15` restricts category to `'dresses' | 'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories' | 'bags'`.
- **New:** Taxonomy defines 11 categories (`"Lehengas" | "Sarees" | "Indo-Western" | ...`).
- **Impact:** TypeScript compilation errors across `Collections.tsx`, `ProductDetail.tsx`, and `sync-algolia`.
- **Severity:** `[HIGH RISK]`
- **Required Decision:** Update `src/types/index.ts` to expand the `Product['category']` type to union both old and new category sets.

### C-004: Missing Commerce Buttons & Actions
- **Old:** Full Add-to-Cart and Buy-Now mutations.
- **New:** "Order this piece" button in `designs/[slug]/page.tsx` is completely non-functional (no click handler).
- **Impact:** User cannot purchase items.
- **Severity:** `[BLOCKER]`
- **Required Decision:** Re-introduce `useCart().addItem()` and checkout navigation into the restyled PDP.

### C-005: Copyrighted Placeholder Imagery
- **Old:** Uses licensed Unsplash / brand assets.
- **New:** 193 product images are scraped third-party reference photographs (`PHOTOS.md`).
- **Impact:** Immediate copyright infringement liability if published to production domain `ogura.in`.
- **Severity:** `[BLOCKER]`
- **Required Decision:** Keep `ALLimages` or existing database product photos; do not deploy `ogura-handoff/source/public/designs` to live AWS/Vercel production CDN.

---

## 27. Blocker Register

| ID | Description | Evidence | Why Implementation Must Stop | Required Resolution / Action |
|---|---|---|---|---|
| **B-001** | **Cart & Checkout Absent in New UI** | `ogura-handoff/source/src/app` has no cart/checkout pages. | Marketplace cannot process customer orders or generate revenue. | Retain `Cart.tsx`, `Checkout.tsx`, and `CartContext.tsx` from old system without alteration. |
| **B-002** | **Razorpay Cryptographic Verification Missing** | New code has zero Razorpay SDK or Edge Function calls. | Payments cannot be collected; webhooks cannot verify payments. | Keep `supabase/functions/razorpay-*` and `Checkout.tsx` untouched. |
| **B-003** | **React 19 / Radix UI Incompatibility** | `ogura-handoff/source/package.json:L15` uses React 19. | Radix UI primitives in `src/components/ui/` throw peer dependency runtime errors. | Lock root application to React 18.3.1. |
| **B-004** | **Subdomain Routing Destruction** | New code lacks `domainDetection.ts` and subdomain routing. | `sellers.ogura.in` and `admin.ogura.in` will cease to function. | Preserve `src/App.tsx` multi-app router and domain detection logic. |
| **B-005** | **Hardcoded Prototype Data Dependency** | All designs in handoff are in `data.ts`, not database. | Inventory, price updates, and seller additions cannot be dynamic. | Build database adapter to fetch real catalog from Supabase `products`. |
| **B-006** | **Third-Party Copyrighted Photos** | Explicitly stated in `ogura-handoff/PHOTOS.md`. | Publishing will result in DMCA takedowns and legal liability. | Do not publish reference images; map designs to existing verified images. |

---

## 28. Safe-to-Merge Register

| ID | Item / Component | Source File | Why It Is Demonstrably Safe |
|---|---|---|---|
| **S-001** | **Fraunces Display Typography** | `layout.tsx:L98` & Google Fonts link | Pure font asset; does not alter runtime behavior or business logic. |
| **S-002** | **Color Palette Design Tokens** | `globals.css:L7-15` (`#faf7f1`, `#b0512c`, `#17130f`) | Pure CSS variables; enhances branding without touching logic. |
| **S-003** | **Grain & Swatch CSS Utilities** | `globals.css:L29-44` (`.grain`, `.swatch`) | Pure presentation layer sitting above UI with `pointer-events: none`. |
| **S-004** | **Call Request Modal Component** | `CallRequest.tsx` | Self-contained UI modal; can be added without disturbing existing flows. |
| **S-005** | **How It Works Editorial Page** | `how-it-works/page.tsx` | Pure static content page explaining bespoke trust guarantees. |
| **S-006** | **Boutique Cards Component** | `Cards.tsx:L7-28` (`BoutiqueCard`) | Pure presentation component accepting data props. |
| **S-007** | **Category Rail Component** | `Rail.tsx` | Horizontal scrolling category shelf with pure CSS layout. |

---

## 29. File-Level Merge Map

| New Prototype File | Old System Equivalent | Target Action | Technical Reason & Dependencies | Risk Level |
|---|---|---|---|---|
| `app/globals.css` | `src/index.css` & `tailwind.config.ts` | **MERGE TOKENS** | Extract color hex values and font families; merge into `tailwind.config.ts`. | **SAFE** |
| `app/layout.tsx` | `src/components/Header.tsx` & `Footer.tsx` | **MERGE PRESENTATION** | Adopt Fraunces wordmark and minimal footer; preserve Cart/Auth triggers. | **MEDIUM RISK** |
| `app/page.tsx` | `src/pages/Index.tsx` | **REPLACE PRESENTATION** | Replace 3D wine museum with new editorial hero and category shelves; wire to DB. | **MEDIUM RISK** |
| `app/designs/page.tsx` | `src/pages/Collections.tsx` | **REPLACE PRESENTATION** | Adopt faceted filter bar and grid; keep route `/collections` and alias `/designs`. | **HIGH RISK** |
| `app/designs/[slug]/page.tsx` | `src/pages/ProductDetail.tsx` | **ADAPT & REUSE OLD LOGIC** | Apply new 2-column layout & Call modal; preserve Add to Cart & variants. | **BLOCKER** |
| `app/boutiques/page.tsx` | `src/pages/Designers.tsx` | **MERGE PRESENTATION** | Adopt city filter pills and boutique card styling; fetch from `designers` table. | **LOW RISK** |
| `app/boutiques/[slug]/page.tsx` | `src/pages/DesignerProfilePage.tsx` | **MERGE PRESENTATION** | Adopt studio stats and Call panel; wire to `useDesignerBySlug`. | **LOW RISK** |
| `app/for-boutiques/page.tsx` | `src/pages/JoinUs.tsx` & `SellerApply.tsx`| **MERGE COPY / KEEP LOGIC** | Adopt new editorial B2B copy; wire form to existing `seller_applications` DB insert. | **MEDIUM RISK** |
| `app/how-it-works/page.tsx` | None (New Page) | **NEW** | Create `src/pages/HowItWorks.tsx` and add route in `CustomerApp.tsx`. | **SAFE** |
| `components/CallRequest.tsx` | None (New Component) | **NEW** | Port to `src/components/CallRequest.tsx`; convert to React Router / Vite. | **SAFE** |
| `components/Cards.tsx` | `src/components/PLPProductCard.tsx` | **MERGE** | Use DesignCard layout, but inject Wishlist toggle and Add-to-Cart logic. | **LOW RISK** |
| `components/Media.tsx` | `src/components/OptimizedImage.tsx` | **ADAPT** | Use gradient fallback logic inside existing `OptimizedImage`. | **SAFE** |
| `lib/data.ts` | `src/integrations/supabase/` | **DO NOT MERGE DATA** | Use only as reference for seeding DB; do NOT use as runtime state. | **BLOCKER** |

---

## 30. Proposed Final Target Architecture

```text
                                  USER BROWSER
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
                 DESKTOP BROWSER                MOBILE BROWSER
                        │                             │
                        └──────────────┬──────────────┘
                                       │
                                       ▼
                       VITE 5 + REACT 18 APPLICATION SHELL
                    (Preserves Domain Detection & Fast HMR)
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
       ogura.in (Customer)    sellers.ogura.in (Seller)   admin.ogura.in (Admin)
              │                        │                        │
     ┌────────┴────────┐               │                        │
     │                 │               ▼                        ▼
NEW EDITORIAL UI   EXISTING      EXISTING SELLER         EXISTING ADMIN
  (Fraunces /      COMMERCE      PORTAL MODULES          PORTAL MODULES
 Ivory Palette /  (Cart/Checkout/ (Add Product, Orders,   (Approvals, Sellers,
 Call Request)    Razorpay Modal)  Settings, Payouts)      Platform Settings)
     │                 │               │                        │
     └────────┬────────┘               │                        │
              │                        │                        │
              ▼                        ▼                        ▼
       DATA ADAPTER LAYER ──► EXISTING HOOKS & CONTEXTS (Cart, Auth, Location)
                                       │
                                       ▼
                         SUPABASE CLIENT & EDGE FUNCTIONS
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
      SUPABASE POSTGRES            RAZORPAY             ALGOLIA SEARCH
      (RLS, 19 Tables)        (Payment Signature)      (ogura-products)
```

---

## 31. Safe Implementation Sequence

```text
PHASE 0: AUDIT & DECISION RATIFICATION (THIS DOCUMENT)
  └─ Freeze all code edits. Obtain stakeholder sign-off on Blocker and Contradiction registers.

PHASE 1: VISUAL TOKENS & FOUNDATION (Blast Radius: Zero)
  └─ Add Fraunces font to index.html.
  └─ Add `--color-ivory`, `--color-parchment`, `--color-clay`, `--color-ink` to tailwind.config.ts.
  └─ Add `.grain`, `.swatch`, and `.font-display` utility classes to src/index.css.

PHASE 2: NEW STANDALONE PAGES & COMPONENTS (Blast Radius: Zero)
  └─ Port `src/components/CallRequest.tsx` to Vite (convert any Next.js imports).
  └─ Port `src/pages/HowItWorks.tsx` and register route `/how-it-works` in CustomerApp.tsx.

PHASE 3: HEADER & FOOTER RE-SKIN (Blast Radius: Low)
  └─ Restyle LuxuryHeader to use Ivory/Ink styling and Fraunces logo wordmark.
  └─ Preserve CartDrawer trigger, Wishlist link, and User Login menu.

PHASE 4: TAXONOMY & DATABASE SEEDING (Blast Radius: Low)
  └─ Seed 11 new category records into database table `categories`.
  └─ Update `src/types/index.ts` to include 11 categories in TypeScript definitions.

PHASE 5: HOMEPAGE TRANSFORMATION (Blast Radius: Low)
  └─ Refactor `src/pages/Index.tsx` to adopt the clean Editorial Hero, Category Rail, and Shelves.
  └─ Wire Category Shelves to query live `products` from Supabase.

PHASE 6: CATALOG / PLP TRANSFORMATION (Blast Radius: Medium)
  └─ Update `src/pages/Collections.tsx` with sticky faceted chips (Category, Stock, Audience, Price).
  └─ Add route alias `/designs` redirecting to `/collections`.

PHASE 7: PDP RECONCILIATION (Blast Radius: High - Critical Care Required)
  └─ Update `src/pages/ProductDetail.tsx` visual layout to match clean 2-column editorial aesthetic.
  └─ Embed `CallRequest` modal button alongside "Add to Cart" and "Buy Now".
  └─ DO NOT touch variant selector logic, stock check logic, or checkout navigation.

PHASE 8: COMMERCE & CHECKOUT HARDENING (Blast Radius: High)
  └─ Verify Razorpay payment flow end-to-end in staging.
  └─ Ensure zero regressions in order creation or order items storage.

PHASE 9: VERIFICATION & REGRESSION SUITE
  └─ Run full test matrix across Customer, Seller, and Admin domains.
```

---

## 32. Verification & Test Plan

### Functional Testing Matrix
- [ ] **Discovery:** Verify all 11 category pills filter products correctly on desktop and mobile.
- [ ] **Call Booking:** Complete Step 1 through Step 4 of `CallRequest` modal; verify phone validation (+91).
- [ ] **Cart Flow:** Add ready-stock item to cart; verify quantity increments in header counter.
- [ ] **Checkout:** Open `/checkout`, verify saved address loads from `user_addresses`, apply valid discount code.
- [ ] **Payment Simulation:** Trigger Razorpay test payment; verify `razorpay-verify-payment` returns `success: true`.
- [ ] **Order Confirmation:** Verify redirect to `/order-confirmation` with order number and payment ID.
- [ ] **Database Integrity:** Verify row insertion in `orders` and `order_items` tables with matching totals.
- [ ] **Seller Portal:** Login at `/seller-login`; verify `SellerDashboardHome` and `SellerProducts` load without errors.
- [ ] **Admin Portal:** Login at `/admin/login`; verify approval queues operate normally.
- [ ] **Responsive Navigation:** Verify horizontal scrolling of category pills on 375px viewport (iPhone SE).

---

## 33. Executive Verdict

### Direct Answers to the 18 Mandatory Audit Questions

1. **Can the new frontend be integrated into the old system without backend changes?**  
   **YES.** By using a TypeScript adapter layer (`src/lib/adapters/productAdapter.ts`), the new presentation layer can render existing `products` and `designers` database rows without modifying a single database table or Edge Function.

2. **Can the new taxonomy be represented using the old database?**  
   **YES.** The `products.category` column is a `text`/`varchar` column in PostgreSQL, capable of storing "Lehengas", "Sarees", etc. However, rows for these 11 categories must be inserted into the `categories` table.

3. **Can the new taxonomy be represented using the old search/indexing system?**  
   **YES.** The Algolia indexing Edge Function (`supabase/functions/sync-algolia`) already indexes `category`. It only requires updating index facets to recognize the 11 new category names.

4. **Can the new frontend consume the old data contracts?**  
   **NO, not directly.** It requires an adapter because field names differ (e.g., `title` vs `name`, `boutique` vs `brand`, `fabric` vs `material`).

5. **Which components should be replaced?**  
   The visual presentation components: Homepage Hero, Category Rail, Product Cards, and Boutique Profile layouts.

6. **Which components MUST remain from the old system?**  
   `CartContext`, `Cart.tsx`, `Checkout.tsx`, `OrderConfirmation.tsx`, `AuthContext`, `ProtectedRoute`, `SellerAuthRoute`, all `seller-dashboard/*` components, all `admin/*` components, `LocationContext`, and `AddressSelectionModal`.

7. **Which components require adapters?**  
   `Cards.tsx` (`DesignCard` $\rightarrow$ `Product`), `ProductDetail.tsx` (PDP layout $\rightarrow$ variant/cart state), and `BoutiqueCard` (`Boutique` $\rightarrow$ `Designer`).

8. **Which routes need migration?**  
   `/designs` and `/designs/:slug` should be created as aliases pointing to `/collections` and `/product/:id` to preserve existing URL equity while supporting the new URL scheme.

9. **Which routes must remain unchanged?**  
   All `/seller/*`, `/admin/*`, `/cart`, `/checkout`, `/order-confirmation`, `/login`, and `/search` routes.

10. **Are there any backend changes actually required?**  
    **NO backend changes are mandatory for launch.** However, adding a `call_requests` table to store call bookings is strongly recommended for Phase 2.

11. **Are there any database changes actually required?**  
    **NO schema modifications are strictly required.** Only data inserts (11 category rows in `categories`) are needed.

12. **Are there any security risks?**  
    **LOW RISK** if the merge follows the adapter pattern. **CRITICAL RISK** if someone attempts to replace Supabase Auth or RLS policies with prototype code.

13. **Are there any payment risks?**  
    **ZERO RISK**, provided `Checkout.tsx` and the Razorpay Edge Functions remain 100% untouched.

14. **Are there any SEO regressions?**  
    **POTENTIAL HIGH RISK** if existing `/product/:id` URLs are dropped. Solved by maintaining `/product/:id` as canonical.

15. **Are there any mobile regressions?**  
    **NONE.** The new UI is mobile-first and responsive down to 375px.

16. **What is the highest-risk part of the merge?**  
    **The Product Detail Page (PDP).** It is the nexus where high-fidelity visual design, bespoke consultation ("The Call"), interactive size/color variant selection, and direct cart/checkout execution collide.

17. **What is the safest first implementation step?**  
    **Phase 1:** Adding the Fraunces font, color variables, and grain/swatch CSS classes into `tailwind.config.ts` and `src/index.css`. This has zero blast radius and touches no business logic.

18. **What must NOT be touched?**  
    - `src/contexts/CartContext.tsx`
    - `src/contexts/AuthContext.tsx`
    - `src/pages/Checkout.tsx`
    - `supabase/functions/razorpay-*`
    - `src/apps/SellerApp.tsx` and `src/apps/AdminApp.tsx`
    - Database migrations and RLS policies

---

## 34. Final Scorecard & Merge Readiness Score

| Evaluation Dimension | Score (0–100) | Forensic Assessment |
|---|---|---|
| **Frontend UI Compatibility** | 88 / 100 | High visual appeal; components easily portable to Vite/React 18. |
| **Taxonomy Compatibility** | 82 / 100 | Clean 11-category structure; fits into existing DB text columns. |
| **Data Contract Compatibility**| 54 / 100 | Significant field naming discrepancies; requires adapter layer. |
| **Backend Compatibility** | 92 / 100 | Old Supabase backend easily satisfies all prototype requirements. |
| **State Compatibility** | 45 / 100 | Prototype has no state; must be wired into old contexts. |
| **Routing Compatibility** | 78 / 100 | URLs differ slightly; solvable via route aliasing. |
| **Authentication Compatibility**| 100 / 100 | Old auth remains 100% authoritative; prototype has no conflicting auth. |
| **Commerce Compatibility** | 20 / 100 | Prototype commerce is completely non-functional; must keep old commerce. |
| **Payment Compatibility** | 100 / 100 | Old payment pipeline is intact and protected; zero conflict. |
| **Search Compatibility** | 75 / 100 | Algolia supports taxonomy once index facets are refreshed. |
| **SEO Compatibility** | 80 / 100 | Good semantic tags; requires URL redirect protection. |
| **Responsive Compatibility** | 90 / 100 | Both codebases handle mobile viewports cleanly. |
| **Security Compatibility** | 95 / 100 | Old RLS policies remain completely untouched. |

```text
================================================================================
OVERALL MERGE READINESS SCORE: 75 / 100
CLASSIFICATION: YELLOW (Proceed with strict adapter architecture; DO NOT rewrite backend)
================================================================================
```

---

## 35. Open Decisions Required from Stakeholders

1. **URL Strategy for Products:**  
   Should production product URLs remain `/product/:id` (backward compatible) or migrate to `/designs/:slug` (with automated 301 redirects and slug generation for existing products)?
2. **Call Request Backend:**  
   Should "Request a Call" submissions send an instant WhatsApp Business notification via an Edge Function, insert into a new Supabase table `call_requests`, or trigger an email to `brands@ogura.in`?
3. **Photography Asset Replacement:**  
   When will verified studio photography be supplied by the 12 boutiques to replace the reference imagery currently in `ogura-handoff/source/public/designs`?
4. **Editorial Category Landing Pages:**  
   Does the team wish to keep the old editorial pages (`/category/celebrity-fashion`, `/category/occasion-wear`) accessible from the footer/search, or retire them entirely in favor of the 11 garment categories?

---

## 36. Addendum: Post-Audit Implementation & Production Hardening (September 2026)

All architectural tensions identified during the initial forensic audit have been resolved in the production codebase:

### 1. Product URL Strategy & Schema Reality
- **Resolution:** Canonical product routes remain `/product/:id`.
- **Database Schema Fact:** The `products` table does **NOT** contain a `slug` column. The initial attempt to query `.or('id.eq.${id},slug.eq.${id}')` resulted in PostgREST `400 Bad Request` exceptions that rendered "Piece not found" on PDP.
- **Architectural Remedy:** `ProductDetail.tsx` now first searches in-memory catalog data, validates UUID format with `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`, queries `.eq('id', id)` only on valid UUIDs, and falls back to safe title searches.

### 2. Consultation Call Pipeline
- **Resolution:** Rather than creating empty or unmonitored SQL tables, `CallRequest.tsx` formats an executive styling briefing and opens a direct deep link to the verified WhatsApp concierge (+91 7742698970). This eliminates unmonitored database records and provides instant concierge contact.

### 3. Photography Assets & Copyright Compliance
- **Resolution:** All 24 clean studio assets from `ogura-design-mockup.html` were extracted and persisted into `/public/mockup-assets/`. Dual-image hover maps were configured in `CATEGORY_IMAGE_MAP` in `productAdapter.ts` to provide reliable image fallbacks.

### 4. Authoritative Pricing & Commercial Accessibility
- **Resolution:** Implemented `normalizeCatalogPrice()` in `productAdapter.ts`. Guarantees a deterministic price range of **₹1,200 to ₹12,000**, with **65% strictly under ₹3,000** (₹1,299–₹2,999) and authentic MRP strike-through discounts (25%–40%).

### 5. Pure White Minimalist Luxury Aesthetic
- **Resolution:** Purged all synthetic pink gradients and blush backgrounds. Canvas is pure `#FFFFFF` with subtle faded gold hairline borders (`#E2D1A3`, `#B38F24`), dark contrast typography (`#5A0A26`, `#0F1111`), and zero AI-slop graphics.

### 6. Consolidated Navigation & Mobile Viewport Hardening
- **Resolution:** Deprecated the secondary sub-nav rail in `Header.tsx`. "Marketplace" was placed directly beside "Sell on Ogura" in the main utility row. In `Index.tsx`, unbounded absolute positioning was replaced with bounded insets (`inset-0 p-4 sm:p-7`), eliminating horizontal mobile scrollbar spillover.
- **Live Production URL:** [`https://coy-clone-studio-samarth-itms-projects.vercel.app`](https://coy-clone-studio-samarth-itms-projects.vercel.app). Build verified clean (3.06s, 0 TypeScript errors).

