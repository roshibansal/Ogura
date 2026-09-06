# 70 — Deployment

## Hosting model
- **Platform**: Lovable (Lovable Cloud), which bundles a Vite-built SPA plus a Supabase-managed backend (project `yudzgkrjsstqbfrrrrly`) and Deno edge functions, all deployed together as part of Lovable's "publish" pipeline. [CONFIRMED via project structure and `lovable-tagger`/`@lovable.dev/*` packages]
- **Preview URL**: Lovable provides an auto-generated `*.lovable.app` (or similar) preview URL per project during development — the exact preview hostname is runtime-assigned and not hardcoded anywhere in this repo (no `*.lovable.app` string found in source, only `ogura.in`).
- **Published/custom domain**: `og ura.in` is the canonical production domain, hardcoded into SEO metadata: `index.html:12` (`<link rel="canonical" href="https://ogura.in/" />`), and Open Graph/Twitter meta tags (`og:url`, `og:image` all reference `https://ogura.in`).
- **admin.ogura.in status**: [CONFIRMED referenced in code, status of DNS/live cutover UNKNOWN]. `src/lib/domainDetection.ts` explicitly branches on `hostname.startsWith('admin.')` → renders `AdminApp`, and `hostname.startsWith('sellers.')` → renders `SellerApp` (note: `sellers.` plural, not `seller.`). Whether these subdomains are actually provisioned in DNS and pointed at the deployed app is **not verifiable from source code alone** — [UNKNOWN, requires checking Lovable project domain settings / DNS records directly].

## Domain-based app split (src/lib/domainDetection.ts)
Single Vite build serves three "apps" (`CustomerApp`, `SellerApp`, `AdminApp` in `src/apps/`) selected at runtime by `detectDomain()` in `App.tsx:19-27`, based on `window.location.hostname`:
- `sellers.*` → SellerApp
- `admin.*` → AdminApp
- everything else → CustomerApp
- **Dev/preview fallback**: since preview URLs don't have `sellers.`/`admin.` subdomains, the same function falls back to **path-based** detection (`pathname.startsWith('/seller')` / `/admin`) so that `/admin/*` and `/seller/*` routes work in a single-hostname preview environment. [CONFIRMED] This means: **in production (real subdomains), `/admin` paths on the main `ogura.in` host would NOT render AdminApp** (since `detectDomain()` checks hostname first, but path fallback only matters when hostname doesn't match a known subdomain — on `ogura.in` with path `/admin`, hostname doesn't start with `admin.`, so it falls through to the path check, which **does** match `/admin` — so actually both hostname- and path-based admin access coexist even in production unless explicitly guarded elsewhere). [CONFLICT RISK — SECURITY-SENSITIVE]: this implies `ogura.in/admin` may render `AdminApp` in production too, not just `admin.ogura.in`, effectively exposing the admin app shell (though presumably still behind `AdminLogin`/role checks) on the main customer domain. Recommend explicit verification against live DNS + a code path that disables path-based fallback outside dev/preview.

## Build
- Vite 5.4.19, `@vitejs/plugin-react-swc`, `lovable-tagger` (dev-mode only component tagging for the Lovable visual editor), `@lovable.dev/mcp-js` Vite plugin (auto-generates the `mcp` edge function from `src/lib/mcp/**` at build time — see `60_INTEGRATIONS.md` §14).
- `npm run build` → `vite build`; `build:dev` → `vite build --mode development` (used for Lovable's dev/preview builds, keeping `componentTagger()` active since it's gated on `mode === "development"`).
- Path alias `@` → `./src` (`vite.config.ts:14-16`).

## Edge function deployment model
- Edge functions live in `supabase/functions/*/index.ts`, each a standalone Deno script using `https://deno.land/std@0.168.0/http/server.ts` and (where DB access is needed) `https://esm.sh/@supabase/supabase-js@2` (pinned to major version 2, not an exact patch in most files; `sync-algolia` pins `@2.76.0` exactly, `mcp` pins `npm:@supabase/supabase-js@^2.76.1`).
- `supabase/config.toml` declares `verify_jwt = false` for **every** listed function (`virtual-tryon`, `generate-banner-image`, `ai-recommendations`, `image-analysis`, `pincode-lookup`, `sync-algolia`, `social-post-webhook`, `razorpay-create-order`, `razorpay-verify-payment`, `pinterest-token-exchange`). This means **all of these functions are publicly invocable without a Supabase auth JWT** — this is by design for public-facing functions like `pincode-lookup`, but for functions like `razorpay-create-order`/`razorpay-verify-payment` and `sync-algolia` this materially widens the attack surface (see `61_PAYMENT.md` for the payment-specific exploitation path this enables). `send-otp` and `verify-otp` are **not listed** in `config.toml` at all — meaning they use Supabase's **default** `verify_jwt` setting (default is `true` for functions without an explicit `false` override), so those two likely **do** require a valid JWT unless anonymous sessions are used — [UNKNOWN, recommend confirming default project-level setting].
- Deployment of edge functions is presumed automatic as part of Lovable's publish flow (no separate `supabase functions deploy` CI step found in this repo — no CI/CD config files like `.github/workflows` were located).

## Migration flow
- `supabase/migrations/*.sql`, timestamp-prefixed, applied in order — 24 migration files spanning Oct 2025 through Aug 2026 timestamps (note: some filenames carry dates in 2026, consistent with a sandboxed/simulated clock rather than literal future dates — treat as sequence order, not literal calendar dates).
- No rollback/down-migration files exist (Supabase CLI migrations here are forward-only `.sql` files) — **rollback = [MISSING]**, would require manually authoring a reverse migration.

## Environment separation
[CONFLICT / SINGLE-BACKEND RISK]: only **one** Supabase project (`yudzgkrjsstqbfrrrrly`) and one `.env` are present in this repo — there is no evidence of separate staging/production Supabase projects. Combined with the domain-split logic serving Customer/Seller/Admin apps from the *same* codebase and (implicitly) the same backend, **all three "apps" and any preview/production builds share one live database** unless Lovable's platform-level environment promotion introduces separation invisibly (not verifiable from source).

## Rollback / manual steps / publish limits
- Rollback: [MISSING] no documented or coded rollback mechanism; would rely on Lovable's platform-level "revert to previous version" feature (external to this repo) plus manual SQL for any already-applied migration that needs reversing.
- Manual steps: edge function secrets (`RAZORPAY_KEY_SECRET`, `LOVABLE_API_KEY`, `HUGGINGFACE_API_TOKEN`, `PINTEREST_CLIENT_SECRET`, `MAKE_WEBHOOK_URL`, `SUPABASE_SERVICE_ROLE_KEY`) must be configured as Supabase function secrets manually/via Lovable Cloud UI — none are committed to `.env` in this repo (only public `VITE_*` values are).
- Publish output limits: [UNKNOWN] — Lovable platform-specific build/publish size or function-count limits are not documented in this repo.

## Trace: code change → build → deploy → migration → edge functions → production
1. Developer edits `src/**` or `supabase/**` inside the Lovable environment (or via this sandbox).
2. Lovable's build pipeline runs `vite build` for the frontend bundle.
3. New/changed SQL files under `supabase/migrations/` are applied to the single shared Supabase project.
4. New/changed edge functions under `supabase/functions/` are deployed to that same project, with `verify_jwt` per `supabase/config.toml`.
5. Lovable publishes the built frontend bundle to the `ogura.in` domain (and, if configured, `sellers.ogura.in`/`admin.ogura.in`) — all pointing at the same backend project, so migrations/edge-function changes take effect for Customer/Seller/Admin apps simultaneously with no independent environment gating.

# 71 — Environment & Configuration Files

## .env (project root, present, NOT in .gitignore explicitly — `.gitignore` has no `.env` entry) [SECURITY-SENSITIVE: low, since only public keys are present, but the *pattern* of not gitignoring .env is a latent risk if a real secret is ever added there]
```
SUPABASE_PUBLISHABLE_KEY=REDACTED   # anon/public JWT, safe to expose
SUPABASE_URL=REDACTED               # https://yudzgkrjsstqbfrrrrly.supabase.co
VITE_SUPABASE_PROJECT_ID=REDACTED   # yudzgkrjsstqbfrrrrly
VITE_SUPABASE_PUBLISHABLE_KEY=REDACTED
VITE_SUPABASE_URL=REDACTED
```
All true secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `HUGGINGFACE_API_TOKEN`, `LOVABLE_API_KEY`, `PINTEREST_CLIENT_SECRET`, `MAKE_WEBHOOK_URL`) are **not** in `.env` — they exist only as Supabase Edge Function secrets (server-side, managed via Lovable Cloud), which is the correct pattern.

## supabase/config.toml
```
project_id = "yudzgkrjsstqbfrrrrly"
[functions.<name>]
verify_jwt = false
```
Listed for: virtual-tryon, generate-banner-image, ai-recommendations, image-analysis, pincode-lookup, sync-algolia, social-post-webhook, razorpay-create-order, razorpay-verify-payment, pinterest-token-exchange.

**Meaning of `verify_jwt = false`**: Supabase normally requires a valid Authorization Bearer JWT (from Supabase Auth) on every edge function invocation. Setting it to `false` allows **anonymous/unauthenticated** invocation — necessary here because: (a) some functions are meant to be public (pincode-lookup, ip-geolocation — though ip-geolocation isn't even listed, meaning it uses the default), (b) some are invoked from a payment flow before/without a logged-in session in some cases (razorpay-*), (c) `sync-algolia` is presumably meant to be triggered by an internal/admin process but as configured is **callable by anyone on the internet with the function's URL**, with no additional auth check inside the function body itself (not verified for an internal secret/token check — recommend confirming). `send-otp`/`verify-otp`/`ip-geolocation`/`mcp` are **absent** from this file, meaning they use the Supabase project's **default** `verify_jwt` setting (typically `true`) — [UNKNOWN] whether the default has been globally overridden at the project level outside this file.

## vite.config.ts
- Dev server: host `::` (all interfaces), port `8080`.
- Plugins: `@vitejs/plugin-react-swc`, `componentTagger()` (dev-mode only, Lovable visual editor support), `mcpPlugin()` (always active, generates the `mcp` edge function).
- `resolve.dedupe: ["react","react-dom"]` — prevents duplicate React copies (relevant given many Radix/animation deps).
- Alias `@` → `./src`.

## components.json
[Standard shadcn/ui config file — not read in full this pass; governs the `shadcn` CLI's component generation paths/aliases. Rebuild note: must be recreated with matching `@/components`, `@/lib/utils` aliases for shadcn tooling to keep working.]

## eslint.config.js
[Flat ESLint config, using `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` — standard Vite+React+TS lint setup per `package.json` devDependencies; not fully re-read this pass.]

## tsconfig*.json
[Not fully re-read this pass; standard Vite React-TS split-config (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` pattern is typical for this template — recommend direct read if exact `strict`/`paths` settings are needed for a rebuild.]

## tailwind.config.ts / postcss.config.js
Tailwind CSS **v3.4.17** (not v4 — confirmed via `package.json` devDependencies), with `tailwindcss-animate` and `@tailwindcss/typography` plugins. PostCSS standard `autoprefixer` + `tailwindcss` pipeline. [Not fully re-read for custom theme tokens this pass; recommend direct read if exact design-token values are needed.]

## index.html — meta/OG tags
- Title: `OGURA — Premium Fashion Marketplace | Designer Wear Online`.
- Canonical: `https://ogura.in/`.
- OG: `og:site_name=OGURA`, `og:title`, `og:description` ("Curated designer fashion, made-to-order couture and AI styling. Free delivery on orders above ₹999."), `og:type=website`, `og:url=https://ogura.in/`, `og:image=https://ogura.in/og-image.jpg?v=4` (cache-busted with `?v=4`, implying the OG image has been updated at least 4 times), full image dimensions declared (1200×630), `og:locale=en_IN`.
- Twitter: `summary_large_image` card, `@ogura_fashion` handle.
- Fonts preconnected: Google Fonts (`Cormorant Garamond`, `Manrope`, `Playfair Display`).
- Favicon: `/favicon.png` (both standard and apple-touch-icon).

## What must be recreated in a from-scratch rebuild
1. A new (or the same) Supabase project with identical schema (all 24 migrations applied in order) and identical Storage buckets (`tryon-images` at minimum).
2. All edge-function secrets re-provisioned: `RAZORPAY_KEY_ID/SECRET`, `HUGGINGFACE_API_TOKEN`, `LOVABLE_API_KEY` (or an alternative OpenAI-compatible gateway if leaving Lovable Cloud — this is a **vendor lock-in point**, see 72), `PINTEREST_CLIENT_ID/SECRET`, `MAKE_WEBHOOK_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. `.env` with `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` pointed at the new project.
4. Algolia account + index `ogura-products` + a fresh search-only API key (current one is hardcoded in `src/lib/algoliaClient.ts` and would need rotating for a genuinely independent deployment) + an admin key for `sync-algolia`.
5. Google OAuth reconfiguration — **cannot be trivially rebuilt outside Lovable Cloud** since Google credentials are held by `@lovable.dev/cloud-auth-js`, not this repo (see `60_INTEGRATIONS.md` §3) — a non-Lovable rebuild needs its own Google Cloud OAuth client + a real `signInWithOAuth` implementation via `supabase.auth.signInWithOAuth`.
6. DNS: `ogura.in`, and if used in production, `sellers.ogura.in` / `admin.ogura.in` CNAME/A records pointed at the hosting platform.
7. A real SMS provider to replace the OTP stub in `send-otp` before this can be considered production-safe.

# 72 — Dependency Inventory

(Versions exactly as pinned in `package.json`; `^` = caret range, actual installed patch may float.)

## Frontend runtime dependencies

| Package | Version | Purpose | Criticality | Evidence | External service? | Notes |
|---|---|---|---|---|---|---|
| react / react-dom | ^18.3.1 | UI runtime | hard | used everywhere | no | **Pinned to React 18**, not 19 — relevant for any future upgrade of Radix/react-query majors that may require React 19. |
| react-router-dom | ^6.30.1 | routing | hard | `src/apps/*App.tsx` `<Routes>` | no | v6 API (not v7 data routers). |
| @supabase/supabase-js | ^2.76.1 | backend client | hard | `src/integrations/supabase/client.ts` | yes (Supabase) | |
| @tanstack/react-query | ^5.83.0 | server-state cache | hard | `App.tsx` `QueryClientProvider` | no | |
| @lovable.dev/cloud-auth-js | ^1.0.0 | Google/Apple OAuth brokering | hard (for social login) | `src/integrations/lovable/index.ts` | yes (Lovable Cloud) | **Vendor lock-in**: no raw Google/Apple SDK fallback exists. |
| @lovable.dev/mcp-js | ^0.24.0 | MCP tool server + Vite plugin | soft (platform tooling) | `vite.config.ts`, `supabase/functions/mcp` | yes (Lovable) | **Vendor lock-in**. |
| algoliasearch | ^5.47.0 | search client | hard for search UX | `src/lib/algoliaClient.ts` | yes (Algolia) | |
| react-instantsearch | ^7.22.1 | Algolia React bindings | hard for `search/` components | `src/components/search/*` | yes (Algolia) | |
| framer-motion | ^12.40.0 | animation | soft | many components | no | |
| gsap | ^3.15.0 | animation | soft | likely luxury3d/parallax components | no | duplicate-purpose with framer-motion (see overlap note) |
| lenis | ^1.3.23 | smooth scroll | soft | cosmetic | no | |
| zod | ^3.23.8 | schema validation | hard where used | `react-hook-form` resolvers, MCP tool defs | no | **Pinned to Zod v3** — v3 vs v4 API differs (v4 changes error customization, `.and`, some type-inference behavior); any dependency upgrade or copy-pasted v4-era code would break silently. MCP's bundled function also references `zod@^3.23.8` explicitly. |
| react-hook-form + @hookform/resolvers | ^7.61.1 / ^3.10.0 | forms | hard | Address/Discount/Auth forms | no | |
| @radix-ui/* (25 packages) | various ^1.x/^2.x | headless UI primitives (shadcn/ui base) | hard | `src/components/ui/*` | no | large surface area, all first-party Radix, no obvious duplicates among them. |
| tailwind-merge, clsx, class-variance-authority | current | className utilities for shadcn pattern | hard | `src/lib/utils.ts` (cn helper) pattern | no | |
| sonner | ^1.7.4 | toast notifications | soft | `App.tsx` `<Sonner/>` | no | **Overlaps** with Radix's own `@radix-ui/react-toast` + shadcn's `use-toast` hook (`toast()` used in `useVirtualTryOn.ts` etc.) — two toast systems (`sonner` and Radix-toast-based `use-toast`) appear to coexist. [Potential duplicate/overlapping UI feedback systems — verify which is authoritative before further UI work.] |
| embla-carousel-react | ^8.6.0 | carousels | soft | ProductCarousel, hero carousels | no | |
| recharts | ^2.15.4 | charts | soft, seller/admin dashboards only | `DashboardAnalytics.tsx` likely | no | |
| date-fns | ^3.6.0 | date utils | soft | forms/calendars | no | |
| next-themes | ^0.3.0 | theme (dark/light) toggling | soft | [UNKNOWN usage extent — package present but this is a fashion e-commerce app; verify if dark mode is actually exposed to users or vestigial from the shadcn template] | no | possibly unused/template leftover — flag for review |
| input-otp | ^1.4.2 | OTP input UI | hard for OTP login screens | Login/verify-otp UI | no | |
| vaul | ^0.9.9 | drawer/bottom-sheet | soft | mobile filters/menus | no | |
| react-resizable-panels | ^2.1.9 | resizable panel UI | soft | likely admin/seller dashboard panels or `ui/resizable.tsx` | no | |
| react-day-picker | ^8.10.1 | calendar picker | soft | date-of-birth/date filters | no | |
| cmdk | ^1.1.1 | command palette | soft | `ui/command.tsx` (search dropdown?) | no | |
| lucide-react | ^0.462.0 | icon set | hard (visual) | everywhere | no | |

## Dev dependencies (build/tooling only, not shipped)
`typescript ^5.8.3`, `vite ^5.4.19`, `@vitejs/plugin-react-swc ^3.11.0`, `eslint ^9.32.0` + `typescript-eslint ^8.38.0` + `eslint-plugin-react-hooks ^5.2.0` + `eslint-plugin-react-refresh ^0.4.20` + `@eslint/js ^9.32.0` + `globals ^15.15.0`, `tailwindcss ^3.4.17` (**Tailwind 3, not 4** — v4's CSS-first config and engine changes are not in play here; any AI-suggested Tailwind v4 syntax would be incompatible), `@tailwindcss/typography ^0.5.16`, `autoprefixer ^10.4.21`, `postcss ^8.5.6`, `lovable-tagger ^1.1.11` (Lovable-specific, dev-mode component tagging — **vendor lock-in**, harmless to remove for a non-Lovable rebuild), `@types/node`, `@types/react`, `@types/react-dom`.

## Deno-side imports (edge functions) — pinned versions
| Import | Version | Used in |
|---|---|---|
| `https://deno.land/std@0.168.0/http/server.ts` | 0.168.0 | all edge functions (`serve()`) |
| `https://deno.land/std@0.168.0/encoding/base64.ts` | 0.168.0 | pinterest-token-exchange |
| `https://esm.sh/@supabase/supabase-js@2` | 2.x (unpinned patch) | razorpay-verify-payment, send-otp, verify-otp |
| `https://esm.sh/@supabase/supabase-js@2.76.0` | 2.76.0 (exact) | sync-algolia |
| `npm:@supabase/supabase-js@^2.76.1` | ^2.76.1 | mcp (auto-generated) |
| `npm:@lovable.dev/mcp-js@0.24.0` | 0.24.0 | mcp function |
| `npm:zod@^3.23.8` | ^3.23.8 | mcp tool schema (search-products) |

**Version drift risk**: `deno.land/std@0.168.0` is a very old std-lib pin (deno.land/std has had many breaking releases since); `@supabase/supabase-js` is pinned inconsistently across functions (`@2` unpinned vs `@2.76.0` exact vs `^2.76.1`), meaning different edge functions could silently diverge in Supabase client behavior over time as `esm.sh`/`npm:` resolve differing minor/patch versions at each redeploy.

## Unused / questionable packages (candidates for review, not confirmed dead)
- `next-themes` — no confirmed dark-mode UI toggle found in this pass; likely a shadcn-template leftover.
- `gsap` vs `framer-motion` — two full animation libraries present; likely overlapping responsibility, worth auditing for consolidation.
- `sonner` vs Radix `@radix-ui/react-toast`-based `use-toast` — two toast/notification systems present simultaneously.

## Vendor lock-in summary
Hard-tied to the **Lovable platform**: `@lovable.dev/cloud-auth-js` (Google/Apple OAuth), `@lovable.dev/mcp-js` (MCP tooling + auto-generated edge function), `lovable-tagger` (dev-only, low lock-in), and the **Lovable AI Gateway** (`ai.gateway.lovable.dev`) used by three edge functions with no alternative-provider fallback coded. A migration off Lovable Cloud would require: reimplementing OAuth via standard Supabase `signInWithOAuth`, removing/replacing the MCP plugin and function, and re-pointing the three AI edge functions at a different OpenAI-compatible endpoint (e.g. OpenAI, Anthropic-via-proxy, or self-hosted Gemini access) with new API keys and equivalent model IDs.

## APPLICATION → PACKAGE → SERVICE → DATABASE → EXTERNAL PROVIDER chain
```
Customer/Seller/Admin React apps (react, react-router-dom, @tanstack/react-query)
  → @supabase/supabase-js  → Supabase project yudzgkrjsstqbfrrrrly (Postgres, Auth, Storage)
  → supabase.functions.invoke(...)  → Deno edge functions
        → razorpay-create-order/verify-payment → Razorpay API (api.razorpay.com)
        → virtual-tryon → Hugging Face Space (yisol-idm-vton.hf.space)
        → ai-recommendations / image-analysis / generate-banner-image → Lovable AI Gateway (ai.gateway.lovable.dev, model google/gemini-2.5-*)
        → pincode-lookup → api.postalpincode.in
        → ip-geolocation → ip-api.com
        → pinterest-token-exchange → api.pinterest.com/v5
        → social-post-webhook → Make.com (env MAKE_WEBHOOK_URL)
        → sync-algolia → Algolia (algoliasearch)
  → algoliasearch (frontend, lite client) → Algolia index ogura-products
  → @lovable.dev/cloud-auth-js → Lovable Cloud Auth → Google OAuth
  → fetch() (raw, no package) → external "Seller Center" Supabase project (pyesltzkemtranachpne.supabase.co)
```

# 73 — Monitoring & Logging

## What logging exists
- **Edge functions**: every function uses `console.log`/`console.error` (counts per function, from a direct grep of `supabase/functions/*/index.ts`):
  - `virtual-tryon`: 11 (most verbose — logs request receipt, SSE messages, image URLs (truncated to 80 chars), success/failure).
  - `image-analysis`: 7.
  - `generate-banner-image`, `verify-otp`, `social-post-webhook`: 5 each.
  - `ai-recommendations`: 5.
  - `sync-algolia`, `razorpay-verify-payment`, `pinterest-token-exchange`: 4 each.
  - `ip-geolocation`, `send-otp`: 3–4.
  - `razorpay-create-order`: 2.
  - `pincode-lookup`: 1.
  - These are only visible via Supabase's Function Logs UI/CLI (`supabase functions logs`), not aggregated into any external log sink (no Logtail/Datadog/CloudWatch export configured).
- **Frontend**: scattered `console.log`/`console.error` in hooks like `useVirtualTryOn.ts` (upload metadata, edge-function request/response echoing) — visible only in the end-user's browser devtools, never transmitted to any server-side error tracker.
- **Supabase platform logs**: Postgres/Auth/Storage logs exist at the platform level (standard Supabase project logging) but nothing in this repo configures alerting or export from them.

## Risk of logging sensitive data [SECURITY-SENSITIVE]
- `supabase/functions/send-otp/index.ts:94`: `console.log(`OTP for +91${phone}: ${otp}`);` — **logs the plaintext OTP and the user's phone number together, server-side, on every OTP send.** Combined with the `demoOtp` field also being returned in the API response (see `63_EMAIL_WHATSAPP_SMS.md`), this makes the OTP fully visible both in logs and in the network response — a genuine, current secret-exposure pattern, not just a hypothetical.
- `useVirtualTryOn.ts` logs image URLs (truncated to 80 chars) and file metadata (`name, size, type`) — low sensitivity, but uploaded human photos' storage URLs are logged client-side, which is at least visible to anyone with devtools access on that browser session (not a server-side leak).
- `razorpay-verify-payment/index.ts` logs `console.error('Failed to save order:', orderError)` and `console.error('Payment verification error:', error)` — Supabase/Postgres error objects can include partial row data/constraint details; not confirmed to include full card/payment data (Razorpay itself never sends raw card data to this backend, so this risk is lower than the OTP case) but the **full `order_data` payload is never logged**, which is good practice, though also means failures are hard to debug without reproducing.
- No log redaction/scrubbing utility exists anywhere in the codebase — logging hygiene is ad hoc per function.

## Alerting
[MISSING] — no alerting system (PagerDuty, Slack webhook-on-error, email-on-failure) is wired to any of: payment verification failures, the `order_saved:false` partial-payment-state (`61_PAYMENT.md`), AI Gateway 429/402 responses, or Make.com webhook delivery failures. All of these currently fail silently from an operations standpoint — a human would only learn about them by manually reading Supabase function logs or via a customer complaint.

## Observability gaps (summary)
1. No error-tracking SDK (Sentry/Bugsnag) on frontend or edge functions.
2. No structured logging (all logs are ad hoc string interpolation, not JSON, making log-based querying/aggregation difficult even if exported).
3. No metrics/dashboards for payment success rate, AI feature latency/error rate, or OTP delivery (moot, since OTP "delivery" is simulated).
4. No uptime/synthetic monitoring for the external "Seller Center" API dependency (`pyesltzkemtranachpne.supabase.co`) — if that project goes down, four customer-facing pages fail with no proactive alert.
5. No audit log for admin/seller privileged actions (approvals, product edits, discount creation) beyond whatever `updated_at` timestamps exist implicitly in each table.

# 74 — Testing Reality

## What exists
[CONFIRMED — effectively nothing.] A repo-wide search for test files (`*.test.*`, `*.spec.*`), test runner configs (`vitest.config.*`, `playwright.config.*`, `jest.config.*`), fixtures, and seed-data scripts returned **zero results** outside `node_modules`. `package.json` contains no `test` script and no test-framework devDependency (`vitest`, `jest`, `@testing-library/*`, `playwright`, `cypress` are all absent). There is no CI configuration (`.github/workflows/` not present) that would run tests on push/PR either.

**Conclusion: this application has no automated test coverage of any kind — no unit tests, no integration tests, no end-to-end tests, no visual regression tests, and no seeded test fixtures.**

## Risk register — critical untested functionality

| Area | Current coverage | Risk if broken silently | Recommended coverage [PROPOSED] |
|---|---|---|---|
| Checkout total computation (`Checkout.tsx`) | None | Wrong charges to customers; already has a confirmed [SECURITY-SENSITIVE] client-trust bug (see `61_PAYMENT.md`) that tests would likely have caught | [PROPOSED] Unit tests for `deliveryFee`/`discountAmount`/`finalTotal` math; [PROPOSED] integration test asserting server rejects a client `amount` that doesn't match server-recomputed cart total (requires fixing the underlying bug first). |
| Razorpay signature verification | None | A regression here silently disables fraud protection or bricks all payments | [PROPOSED] Unit test with known Razorpay test-mode order/payment/signature triples to assert `verifySignature()` correctness (positive + tampered-signature negative case). |
| Order/order_items insert on payment success | None | Partial-state bug (`order_saved:false`) already exists and is unmonitored | [PROPOSED] Integration test simulating a DB insert failure to assert the correct partial-failure response shape is returned and (once implemented) an alert fires. |
| Inventory/stock decrement | None (feature itself is [MISSING]) | Overselling once inventory tracking is implemented | [PROPOSED] Once built: concurrency test for two simultaneous purchases of the last unit. |
| RLS policies (all tables) | None | Cross-tenant data leaks (customer sees another customer's address/order; seller sees another seller's products) | [PROPOSED] Automated RLS test suite (e.g. pgTAP or scripted Supabase client calls under different JWTs) asserting `user_addresses`, `orders`, `discounts`, `sellers`-scoped tables enforce `auth.uid()`/role checks per the policies defined in migrations. |
| Seller isolation (products, discounts, orders visibility) | None | A seller editing/deleting another seller's discount or product | [PROPOSED] Multi-seller fixture test verifying `discounts` policy `seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())` actually blocks cross-seller writes. |
| Admin permissions (`has_role(auth.uid(),'admin')` checks) | None | Privilege escalation if a role-check migration is ever reverted/mis-ordered | [PROPOSED] Test asserting non-admin authenticated users cannot `INSERT/UPDATE/DELETE` on `designers`, `vendors`, `influencer_videos`, or view `brand_waitlist_applications`. |
| Refunds | N/A — feature is [MISSING] entirely | N/A | [PROPOSED] Build the feature with tests from day one given the payment-integrity issues already present. |
| Auth (email/password, Google OAuth, phone OTP) | None | Login regressions block all commerce | [PROPOSED] E2E smoke test per auth method; [PROPOSED] specifically test the phone-OTP magic-link exchange path (`verify-otp/index.ts`) which has nontrivial branching (existing vs new user, session vs no-session fallback). |
| OTP flow security | None | The current stub (OTP returned in API response, logged in plaintext) is a **known, present** vulnerability, not just an untested edge case — see `63_EMAIL_WHATSAPP_SMS.md` and `73_MONITORING_LOGGING.md` | [PROPOSED] Once a real SMS provider is wired in, add a test asserting `demoOtp`/plaintext OTP is never present in either the log stream or the HTTP response outside a clearly gated dev-only build flag. |
| AI flows (try-on, recommendations, image-analysis, banner gen) | None | Silent prompt/parsing regressions (e.g., the regex-based JSON extraction from LLM responses breaking on a subtly different model output format) | [PROPOSED] Contract tests mocking the Lovable AI Gateway / HF Space responses to verify the JSON-array/attribute-parsing logic handles malformed/markdown-wrapped responses (already partially defensive in code, but unverified). |
| Domain-based app routing (`detectDomain()`) | None | The [CONFLICT] noted in `70_DEPLOYMENT.md` (possible `/admin` path exposing AdminApp on the main customer domain) is exactly the kind of regression a routing test would catch | [PROPOSED] Unit tests for `detectDomain()` across hostname/path combinations, explicitly asserting production-hostname behavior differs from dev-path-fallback behavior if that's the intended design. |

## Recommended baseline setup [PROPOSED]
- `vitest` + `@testing-library/react` for component/unit tests (fits the existing Vite toolchain with minimal config).
- `playwright` for E2E smoke tests of checkout, login, and seller/admin route boundaries.
- A dedicated Supabase test project (or local `supabase start`) with the same 24 migrations applied, seeded with fixture users/sellers/products, to safely test RLS policies without touching production data.
