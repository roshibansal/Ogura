# 50 — Security Architecture

Scope: OGURA Lovable/Supabase project. React SPA (Vite) + Supabase (Postgres/PostgREST/Auth/Storage) + Deno edge functions + external APIs (Razorpay, Replicate/Lovable AI, Pinterest, Algolia, Make.com).

## 1. Trust Boundaries

```
[Browser SPA] --anon publishable key--> [PostgREST + RLS] --(Postgres)
      |                                        ^
      | fetch (supabase.functions.invoke)      |
      v                                        |
[Edge Functions (Deno, Supabase)] --service-role (bypasses RLS)--> [Postgres]
      |
      +--> [Razorpay API] (server-side, key secret)
      +--> [Lovable AI Gateway] (LOVABLE_API_KEY)
      +--> [Pinterest OAuth token endpoint] (client secret)
      +--> [Algolia] (admin key, sync-algolia function)
      +--> [Make.com webhook] (social-post-webhook)

[Browser SPA] --anon key, direct--> [Algolia search] (client-side, react-instantsearch — search key expected, verify)
[Browser SPA] --Google OAuth popup/redirect--> [Supabase Auth / Google]
```

- **[OBSERVED]** The SPA never talks to Postgres directly; all data access is via `@supabase/supabase-js`, which uses PostgREST under the anon (`VITE_SUPABASE_PUBLISHABLE_KEY`) or authenticated user JWT.
- **[OBSERVED]** Edge functions are the only code that uses `SUPABASE_SERVICE_ROLE_KEY` (`send-otp`, `verify-otp`, `razorpay-verify-payment` — src: `supabase/functions/*/index.ts`), which bypasses RLS entirely.
- **[OBSERVED]** `supabase/config.toml` sets `verify_jwt = false` for 9 of 13 edge functions (`virtual-tryon`, `generate-banner-image`, `ai-recommendations`, `image-analysis`, `pincode-lookup`, `sync-algolia`, `social-post-webhook`, `razorpay-create-order`, `razorpay-verify-payment`, `pinterest-token-exchange`), meaning Supabase's platform-level JWT gate is disabled for these — any caller (not just an authenticated app user) can invoke them over the public HTTPS endpoint. **[SECURITY-SENSITIVE]**

## 2. The Anon/Publishable Key Model

- **[OBSERVED]** `src/integrations/supabase/client.ts:6-7` builds the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Both are bundled into the client JS and are **intentionally public** (the publishable/anon key is Supabase's public API key model, not a secret).
- **[CONFIRMED]** All authorization for data reachable via this key is enforced **only by Postgres RLS policies** (see 42/52). There is no additional app-layer authorization for direct table reads/writes from the SPA.
- **[INFERRED]** Because the anon key is public, any actor can script direct PostgREST calls to `https://<project>.supabase.co/rest/v1/<table>` with the same key extracted from the bundle — RLS is the sole real gate for that path.

## 3. Enforcement Points — where security actually happens

| Layer | What enforces access | Evidence |
|---|---|---|
| Browser SPA / React Router | **UI-only** route guards (`ProtectedRoute`, `RoleProtectedRoute`, `SellerAuthRoute`) — redirect only, no data protection | `src/components/auth/*.tsx` |
| PostgREST (direct table access) | Postgres RLS policies, `has_role()` SECURITY DEFINER function | `/tmp/extract/db.txt` POLICIES section |
| Postgres Storage | Storage bucket RLS on `storage.objects` (per-bucket policies) | `/tmp/extract/db.txt` storage policy rows |
| Edge Functions (verify_jwt=true) | Supabase platform JWT verification before function code runs | `mcp` function only relies on OAuth issuer; **[UNKNOWN]** which functions have verify_jwt=true (not listed in config.toml ⇒ default true) — appears to be none of the payment/AI functions |
| Edge Functions (verify_jwt=false) | **No platform check** — function code must self-validate; most do only input-shape validation, not identity | `send-otp`, `verify-otp`, `razorpay-*`, AI functions |
| Edge function business logic | Ad hoc: HMAC signature check (razorpay-verify-payment), phone regex (send-otp), OTP hash+expiry (verify-otp) | see 55_SECURITY_GAPS |
| External APIs | Razorpay signature verification is the only cryptographic trust check; Pinterest/Algolia/Make rely on server-held secrets, not further validated |  |

## 4. Layered Defence Map

```
Layer 1  Network/TLS           -> Supabase/Vercel-managed HTTPS. [ASSUMED, not verified in code]
Layer 2  Anon Key Gate         -> Public by design; not a real gate, rate limiting unknown. GAP: no rate limiting observed anywhere.
Layer 3  Supabase Auth (JWT)   -> Applies only where verify_jwt=true (most edge functions have it FALSE). GAP.
Layer 4  RLS Policies          -> Primary authorization boundary for all direct table/storage access (see 52).
Layer 5  Edge Function Logic   -> Custom code; inconsistent input validation; uses service-role which bypasses Layer 4 entirely. GAP.
Layer 6  Client-side Guards    -> UX only (ProtectedRoute/RoleProtectedRoute); NOT a security control. Must not be relied upon.
```

## 5. Per-Surface Protection Summary

- **Public catalog data** (products, categories, designers, vendors): protected by `status='live' AND is_available=true` RLS predicates — correctly scoped to public data. [CONFIRMED]
- **Seller data** (products, discounts, orders, payouts, support_tickets): RLS scopes by `sellers.user_id = auth.uid()`. [CONFIRMED] But dev-mode client code (`DEV_SELLER_ID` constant) can bypass the *intended* seller identity in the UI layer while RLS still enforces on the DB side — see 52 for detail. [SECURITY-SENSITIVE]
- **Admin data**: gated by `has_role(auth.uid(),'admin')` in RLS; also gated client-side via `RoleProtectedRoute`/`AdminLogin`. Genuine defence-in-depth here because RLS independently checks role. [CONFIRMED]
- **Payments**: total protected by nothing except client-computed values sent to `razorpay-create-order`/`razorpay-verify-payment` — no server-side recomputation of cart totals from `products`/`order_items` before charging or before persisting `orders.total`. **[SECURITY-SENSITIVE][CRITICAL — detailed in 55]**
- **OTP/phone auth**: protected only by function-local logic (rate limit 60s, 5 attempts, 5 min expiry) inside `send-otp`/`verify-otp`; no platform JWT gate; edge function uses service role to directly manipulate `auth.users` via `supabase.auth.admin`. [SECURITY-SENSITIVE]
- **AI/image functions** (`virtual-tryon`, `image-analysis`, `ai-recommendations`, `generate-banner-image`): `verify_jwt=false`, no auth check observed inside function bodies beyond payload shape ⇒ open to anonymous invocation and potential cost/resource abuse. [SECURITY-SENSITIVE]

## 6. Gaps Flagged (see 55 for full register)

- No server-side re-validation of order pricing before payment/order persistence. [CRITICAL]
- `verify_jwt=false` on payment- and AI-cost-bearing functions with no compensating auth check. [HIGH]
- Service-role key used inside `razorpay-verify-payment` to write orders without idempotency or replay protection (same signature could be replayed to insert a duplicate order). [HIGH]
- Client-side-only route guards create no real protection if RLS/function checks are themselves weak (defence-in-depth is inconsistent across the app, strong for admin tables, weak for payments/OTP).
- CORS is `Access-Control-Allow-Origin: '*'` on every edge function observed. [MEDIUM]

# 51 — Authentication

## 0. Identity ID map [CONFIRMED]

```
auth.users.id  (Supabase Auth, GoTrue)
   |
   +--> profiles.id            (1:1, PK = auth.users.id, no separate FK column, joined by equality)
   +--> sellers.user_id        (1:N in schema, business logic treats as 1:1 per user)
   +--> user_roles.user_id     (1:N — a user can hold multiple app_role rows)
   +--> tryon_history.user_id  (nullable FK, guest try-on allowed)
   +--> user_addresses.user_id
   +--> orders.customer_id     (= auth.users.id of buyer)
```
No table stores a separate "identity" or "account" concept unifying phone/email/Google logins — **auth.users.id is the sole identity anchor**, and Supabase Auth creates a *new* `auth.users` row per distinct credential unless code explicitly links them.

## 1. Signup / Login / Logout — `src/contexts/AuthContext.tsx`

- **Email/password signup** — `signUpWithEmail()` (`AuthContext.tsx:168-193`):
  ENTRY: SellerSignup.tsx form → IDENTITY: `supabase.auth.signUp({email,password})` creates new `auth.users` row → VERIFICATION: none observed (no forced email confirmation flow in code; Supabase project setting controls this, **[UNKNOWN]** whether email confirmation is enforced server-side) → SESSION: Supabase issues session immediately on signUp response → PROFILE: **no `profiles` row is created here** — only `sellers` and `user_roles` rows are inserted (lines 175-187) → ROLE: hardcoded `role: 'seller'` inserted unconditionally → ACCESS: `isAuthenticated = !!session` true immediately.
  **[CONFLICT]** This signup path is only exposed via seller entry points (`SellerSignup.tsx`) but lives in the shared `AuthContext`, so any consumer of `signUpWithEmail` gets a seller record — there's no consumer/customer email-password signup path in the codebase; customers only get Google or phone OTP. **[OBSERVED]**

- **Email/password login** — `signInWithEmail()` (`AuthContext.tsx:158-166`): thin wrapper over `supabase.auth.signInWithPassword`. No MFA, no lockout, no phone/role branching.

- **Logout** — `AuthContext.tsx:195-200`: `supabase.auth.signOut()` + local state clear. No server-side session revocation list, no explicit "revoke all sessions" — matches Supabase default behavior (refresh token invalidated).

## 2. Session storage & refresh

- **[OBSERVED]** Session persistence is delegated to `@supabase/supabase-js`'s default (localStorage) *except* on Lovable preview surfaces, where `src/integrations/supabase/previewAuthStorage.ts` (auto-generated, "Do not edit it directly") brokers the auth token via `postMessage` to the parent editor frame so multiple preview iframes share one login (`brokeredPreviewStorage()`).
  - Restricts target origins to a strict allow-list regex (`lovable.dev`, `gptengineer.app`, plus dev localhost:3000) and validates the project ID only from a non-user-controlled hostname position — designed to prevent token exfiltration to an untrusted embedding origin. [CONFIRMED, by code reading]
  - Falls back to plain `localStorage` off preview zones or when not framed — i.e., **in production the session token is stored in localStorage**, susceptible to XSS-based token theft if any XSS exists elsewhere in the app (see 55/83).
- Refresh: handled transparently by supabase-js's `onAuthStateChange`/auto-refresh; `AuthContext.tsx:41-56` just re-fetches the profile on every auth event.

## 3. Google OAuth — canonical origin logic

- `AuthContext.tsx:27-31` `getCanonicalAuthOrigin()`: strips a leading `www.` from `window.location.hostname` before constructing `redirect_uri`, because "`www.` hosts are not allow-listed" in the OAuth app config. **[OBSERVED, SECURITY-SENSITIVE-adjacent]**: this is a workaround for an incomplete redirect allow-list rather than a security control; if the allow-list itself is misconfigured (e.g., wildcarded), OAuth redirect could be hijacked. The code does not sanitize `protocol`/`port`, trusting `window.location` fully — normal for browser-run OAuth redirects, but worth flagging since it constructs the redirect URI from client-controlled `window.location`, and relies entirely on Supabase/Google's server-side allow-list to reject mismatches (`errorMsg.includes('redirect_uri_mismatch')` handling at line 137 shows failures are expected/handled, not prevented).
- Flow: ENTRY (GoogleSignInButton) → IDENTITY: `lovable.auth.signInWithOAuth("google", {redirect_uri})` (`src/integrations/lovable/index.ts`) → VERIFICATION: Google + Supabase Auth server-side → SESSION: `supabase.auth.setSession(result.tokens)` (`src/integrations/lovable/index.ts:23`) → PROFILE: `fetchUserProfile` creates UI state from `profiles` row if present, else falls back to `session.user.user_metadata` and marks `isNewUser=true` → ROLE: none assigned automatically by Google login (no code inserts `user_roles` on Google sign-in) → ACCESS: `isAuthenticated=true`.
  **[CONFLICT]** No `profiles` row is programmatically created on any auth path shown (`signUpWithEmail` doesn't insert one; Google path doesn't either) — profile creation must occur elsewhere (e.g., `Onboarding.tsx`, not read in this scope) or a DB trigger. **[UNKNOWN — needs Onboarding.tsx/trigger check]**. If no trigger exists, RLS policy `profiles: Users can insert own profile (auth.uid()=id)` implies the client is expected to insert its own profile row, but this insert call site was not found in the AuthContext.

## 4. Phone OTP — `send-otp` / `verify-otp` edge functions + `otp_verifications` table

ENTRY: some UI phone-login component (not in AuthContext; only Checkout/other phone-collection code call OTP APIs per file grep) → IDENTITY: `send-otp` (`supabase/functions/send-otp/index.ts`) validates `^[6-9]\d{9}$`, generates 6-digit OTP, SHA-256 hashes `otp+phone`, stores in `otp_verifications` with 5-min expiry, **returns `demoOtp` in the JSON response** (`index.ts` return payload: `demoOtp: otp // Remove in production`) — **[SECURITY-SENSITIVE][CRITICAL]**: the OTP is exposed to any caller of the function, defeating OTP verification as an identity check entirely, since `verify_jwt=false` on this function and CORS is `*`.
VERIFICATION: `verify-otp` (`supabase/functions/verify-otp/index.ts`) checks hash match, expiry, attempts<5 (delete-and-fail beyond that).
SESSION: On success, function looks up/creates a `auth.users` record keyed by synthetic email `${phone}@ogura.phone.auth` via `supabase.auth.admin` (service role), uses `generateLink({type:'magiclink'})` + `supabase.auth.verifyOtp({token_hash,type:'magiclink'})` server-side to mint a real session, or returns `session: null` with the raw `existingUser.id` for the client to (presumably) exchange for a session — code past line ~150 not fully re-read but architecture is clear.
PROFILE: updates `profiles.name/phone` if a name is supplied, only for existing users.
ROLE: not assigned in visible code.
IDENTITY LINKAGE: **[CONFLICT]** — a phone login creates/uses a *separate* `auth.users` row (email `<phone>@ogura.phone.auth`) distinct from any Google or email/password account for the same real person. There is no lookup-by-phone-across-providers or account-merge logic anywhere in the read code. **The intended "Google + phone OTP + email/password converge into one identity" model is NOT implemented** — each auth method produces an independent `auth.users.id`, and `profiles`/`sellers`/`orders` will fragment per method unless a human manually reconciles by phone/email string matching. [CONFLICT — this is the single biggest identity-model gap.]
"Phone verified at checkout" model: **[UNKNOWN/MISSING]** — no code observed gating checkout on phone OTP verification status; `Checkout.tsx` collects `shipping_address.mobile` from `user_addresses` records without any OTP re-verification step at that point.

## 5. Password reset / email verification

- **[MISSING]** No `resetPasswordForEmail`/`updateUser` password-reset flow was found via the Supabase call inventory (`/tmp/extract/code.txt` SUPABASE CALLS list) — no password-reset UI or function call exists in the scanned code. Recovery must rely on Supabase's default email link if enabled in project settings, but the app has no dedicated reset page routed in `CustomerApp.tsx`/`SellerApp.tsx`.
- **[UNKNOWN]** Whether Supabase project enforces email confirmation before allowing login (a project-level Auth setting not visible in code).

## 6. Account linking / duplicate prevention

- **[MISSING]** No code performs identity linking (e.g., `supabase.auth.linkIdentity`) or duplicate-account detection by email/phone across providers. Given `signUpWithEmail` also silently attaches `seller`/`sellers` rows, a user who signs up via email, then later logs in via Google with the same email, will get **two separate `auth.users` records** unless Supabase's own "same email different provider" merge setting is active at the project level (behavior not observable from code).

## 7. Guest sessions

- **[OBSERVED]** `VirtualTryOn.tsx`/`useVirtualTryOn.ts` call `supabase.auth.getUser()` before optionally inserting into `tryon_history`; `tryon_history.user_id` is nullable, so guest (unauthenticated) try-ons are supported and simply store `user_id = null`. Cart/Wishlist use `localStorage`-only guest state (`WishlistContext.tsx`), not Supabase, so those are pure client-side guest sessions with no server persistence and no security relevance beyond XSS-readable localStorage.

## 8. Session expiry

- **[INFERRED]** Standard Supabase JWT expiry + refresh-token rotation (supabase-js default: ~1 hour access token, auto-refreshed). No custom expiry/idle-timeout logic found in app code.

## 9. Protected Routes

| Guard | File | Behavior |
|---|---|---|
| `ProtectedRoute` | `src/components/auth/ProtectedRoute.tsx` | Redirects to `/login` if `!isAuthenticated`. No role check. Used for `/dashboard,/onboarding,/profile,/wishlist,/cart,/checkout,/order-confirmation` (`CustomerApp.tsx:75-81`). |
| `RoleProtectedRoute` | `src/components/auth/RoleProtectedRoute.tsx` | Redirects to `loginPath` if unauthenticated; shows "Access Denied" UI (does not navigate away) if `!hasRole(requiredRole)`. **Client-side only** — the underlying route content still mounts unless the component itself blocks rendering, which it does here by returning the denial UI instead of children — but this is enforced purely in React, not by any server check. |
| `SellerAuthRoute` | `src/components/auth/SellerAuthRoute.tsx` | Redirects unauthenticated users to `/join`. **Does not check seller role at all** — any authenticated user (including a pure `consumer`) passes this guard. Actual seller-page routes in `SellerApp.tsx` use `WrappedRoute` (not this component per grep of AdminApp/SellerApp `WrappedRoute` uses) — **[UNKNOWN]** exact wiring of `SellerAuthRoute` vs `WrappedRoute`; needs cross-check with `WrappedRoute` definition. |

`AdminApp.tsx` routes use a `WrappedRoute` wrapper (not `RoleProtectedRoute` by name) around all `/admin/*` pages except `/admin/login`; `AdminLogin.tsx` itself checks `hasRole('admin')` client-side after auth to redirect or show "Access Restricted" (`AdminLogin.tsx:22-29,38-56`). This is again a **UI convenience gate** — the true admin authorization boundary is the RLS `has_role(auth.uid(),'admin')` predicate on each admin-managed table.

## 10. Admin auth — `src/pages/admin/AdminLogin.tsx`

Google OAuth only (`GoogleSignInButton`), no separate admin credential system, no separate admin session type. Any Google-authenticated user reaching `/admin/login` who happens to hold an `admin` `user_roles` row is redirected in; there is no invite-only signup restriction for admin — an admin role must be granted by a human/DB operation (`user_roles` INSERT), since there is no self-service admin signup path (correct design), but also no code enforces MFA for this highly privileged path. [OBSERVED]

## 11. Seller auth — `SellerLogin.tsx` / `SellerSignup.tsx`

Email/password (`signInWithEmail`/`signUpWithEmail`) + Google. `SellerSignup` calls the shared `signUpWithEmail`, which (per §1) auto-creates a `sellers` row with `application_status: 'approved'` and a `seller` `user_roles` row — **[SECURITY-SENSITIVE]**: **any person who signs up with email/password anywhere `signUpWithEmail` is reachable becomes an approved seller with no admin review**, bypassing the `seller_applications` admin-approval workflow that exists elsewhere in the schema (`seller_applications.status`, RLS `Admins can update applications`). This directly conflicts with the apparent intended flow (apply → admin review → approval) documented by the `seller_applications` table and its RLS policies. **[CONFLICT][HIGH]**

## 12. MCP OAuth — `src/lib/mcp/index.ts`, `src/pages/OAuthConsent.tsx`

- `mcp/index.ts` defines an MCP server (`@lovable.dev/mcp-js`) with `auth: auth.oauth.issuer({issuer: https://<project>.supabase.co/auth/v1, acceptedAudiences: "authenticated"})` — delegates OAuth issuance entirely to Supabase Auth as the issuer; MCP tools (`search-products`, `get-product`, `list-my-orders`) presumably run with the caller's Supabase JWT, so `list-my-orders` is bounded by the same `orders` RLS as the SPA. [INFERRED — tool implementations not read]
- `OAuthConsent.tsx` (route `/.lovable/oauth/consent`) implements the user-facing consent screen for third-party MCP clients: requires an existing Supabase session (redirects to `/login?next=...` if none), then calls beta `supabase.auth.oauth.{getAuthorizationDetails,approveAuthorization,denyAuthorization}`. Consent decisions are delegated server-side to Supabase Auth; the SPA does not itself mint tokens. Reasonable trust model: [CONFIRMED] no visible flaw, but the `OAuthApi` type is hand-cast (`as unknown as {oauth: OAuthApi}`), indicating this is an unstable/beta API — **[UNKNOWN]** guarantees provided by Supabase here.

## 13. Summary of CONFLICTs vs. intended identity model

| Intended | Actual |
|---|---|
| Google + phone OTP + email/password converge into one identity | **[CONFLICT]** Each method creates a distinct `auth.users` row; no linking/merge logic exists. |
| Phone verified at checkout | **[CONFLICT/MISSING]** No OTP re-verification observed at checkout; phone number is just a free-text field on `user_addresses`. |
| Seller accounts go through application + admin approval | **[CONFLICT]** `signUpWithEmail` self-approves sellers, bypassing `seller_applications` review. |
| OTP is a real second factor / identity proof | **[CONFLICT/CRITICAL]** `send-otp` returns the OTP value directly in its JSON response (`demoOtp`), making it usable by anyone who can call the (unauthenticated, CORS `*`) function. |

# 52 — Authorization

Cross-reference: `docs/system-extraction/DATABASE/42_*` for full RLS listing (this doc summarizes and analyzes it).

## 1. Role model

- **[CONFIRMED]** `app_role` is a Postgres enum (referenced as `'admin'::app_role`, `'seller'::app_role` in policies; `USER-DEFINED` type on `user_roles.role`). Observed values in use: `admin`, `seller`; the frontend `AppRole` type (`src/hooks/useUserRole.ts:5`) adds `consumer`. **[UNKNOWN]** whether `consumer` is ever actually inserted into `user_roles` — no INSERT of role `consumer` found in scanned code; a user with zero `user_roles` rows is implicitly treated as a consumer by absence of role, not by an explicit row.
- **[CONFIRMED]** `user_roles` table: `id, user_id, role, created_at`. Multiple rows per user allowed (no unique constraint observed in the column dump) — a user could hold both `seller` and `admin`.
- **[CONFIRMED]** `has_role(auth.uid(), role)` is a SECURITY DEFINER Postgres function used throughout RLS `qual`/`with_check` expressions (`designers`, `influencer_videos`, `products`, `sellers`, `vendors`, `user_roles`, `seller_applications`, `brand_waitlist_applications`). This is the single authorization primitive for admin-gated tables. Its use of SECURITY DEFINER is required to avoid infinite RLS recursion when checking `user_roles` from within a policy on another table — standard, correct Supabase pattern. [CONFIRMED-by-convention; function body not directly dumped but inferred from its usage pattern and name matching Supabase's documented helper].

## 2. `useUserRole` hook — client-side role read

`src/hooks/useUserRole.ts`: on auth ready, `SELECT role FROM user_roles WHERE user_id = auth.uid()` directly against PostgREST (protected by RLS policy `user_roles: Users can view own roles`). Returns `{roles, hasRole, isLoading}`. **This is purely informational for UI branching** — it cannot be used to grant DB access; genuine enforcement is the RLS predicate on the *target* table, not this hook. [CONFIRMED]

## 3. Route guards (client-side only — no server enforcement)

| Guard | Enforcement | Bypassable via? |
|---|---|---|
| `ProtectedRoute` | Checks `isAuthenticated` | Direct PostgREST/API calls, bypassing UI entirely — RLS is the real gate |
| `RoleProtectedRoute` | Checks `hasRole(requiredRole)` from `useUserRole` | Same — UI-only; RLS is the real gate |
| `SellerAuthRoute` | Checks `isAuthenticated` **only**, no role check | Any authenticated non-seller reaches wrapped seller pages' UI shell (though their data fetches will be RLS-empty) |
| `AdminLogin` self-check | `hasRole('admin')` gates redirect, not data | n/a — UI only |

**[SECURITY-SENSITIVE]**: none of these guards should be treated as an authorization boundary; every one is client-executed JS, trivially bypassed by calling Supabase REST/functions directly with a valid session token. The real boundary in every case is DB RLS. This is architecturally acceptable **only if RLS is complete**, which it is not (see below).

## 4. RLS-based authorization per table (summary; full list in DATABASE/42)

| Table | Public/anon | Authenticated (owner) | Admin | Notes |
|---|---|---|---|---|
| products | SELECT if `status='live' AND is_available` | seller: SELECT/INSERT/UPDATE/DELETE own (`seller_id` via `sellers.user_id=auth.uid()`) | ALL via `has_role(admin)` | No policy restricts seller INSERT price/status content — a seller can set `status='live'` themselves (see gaps) |
| product_variants | SELECT if parent product live | seller: ALL on own | — (no explicit admin policy seen) | |
| orders | none anon | customer: SELECT own, INSERT with `customer_id=auth.uid()`; seller: SELECT/UPDATE own (`seller_id`) | none explicit | **No admin policy on `orders`** — admins cannot read orders via RLS unless also owner; likely handled via service-role in a function/dashboard, not RLS. [MISSING] |
| order_items | none anon | customer: SELECT/INSERT via parent order; seller: SELECT via parent order | none | INSERT `with_check` only checks `order_id` belongs to customer, **does not validate price/quantity fields against `products`/`product_variants`** — client can insert arbitrary `unit_price`/`total_price`. [SECURITY-SENSITIVE][CRITICAL — see 55] |
| profiles | none anon | owner: SELECT/INSERT/UPDATE own | none | No admin read policy on profiles — admins cannot query customer profiles via RLS. |
| sellers | none anon | owner: SELECT/UPDATE own, INSERT own | ALL via has_role(admin) | `application_status` is client-writable by seller on their own row (UPDATE policy has no column-level restriction) — a seller could self-approve/self-verify (`is_verified`) if not blocked elsewhere. [SECURITY-SENSITIVE] |
| seller_applications | INSERT open to anon+authenticated | none (no owner-read policy) | admin SELECT/UPDATE | Consistent with an application-then-approve model — but bypassed by `signUpWithEmail` auto-approval path (see 51 CONFLICT). |
| user_roles | none anon | owner: SELECT own only | ALL via has_role(admin) | Only admins can INSERT roles via RLS — **but `AuthContext.signUpWithEmail` inserts a `user_roles` row directly as the signing-up user** (`supabase.from('user_roles').insert({user_id: data.user.id, role:'seller'})`), which would need a permissive INSERT policy for non-admins or it silently fails. **[CONFLICT]** — either (a) there exists an INSERT policy not captured in this policy dump allowing self-insert, or (b) this insert fails RLS and self-signup seller role assignment silently no-ops (error not surfaced to user; code does `await` without checking the error at `AuthContext.tsx:184-187`). Needs a live-DB check; documented as [CONFLICT/UNKNOWN pending verification]. |
| user_addresses | none | owner: full CRUD own | none | |
| tryon_history | none | owner (incl. null for guest at insert time bypasses `auth.uid()=user_id`? actually `user_id` must equal `auth.uid()`, so anonymous inserts with `user_id=null` would fail `auth.uid()=user_id` unless `auth.uid()` is also null for anon — meaning guest try-on writes silently fail RLS for anon callers) | none | **[CONFLICT]** with the "guest sessions" description in 51 — `VirtualTryOn.tsx` attempts insert regardless of auth state, but RLS `auth.uid() = user_id` cannot be satisfied when both are null in Postgres (`NULL = NULL` is not true), so anonymous try-on history inserts are expected to fail row-security, meaning the app likely swallows this error. |
| discounts | anon SELECT of active | seller: ALL own | none explicit | |
| categories/vendors/designers/delivery_zones/influencer_videos | public SELECT (active) | — | admin ALL | Standard public catalog data. |
| brand_waitlist_applications | anon+auth INSERT | none | admin SELECT | |
| payouts | none | seller SELECT own | none | No seller/admin write policy shown for payouts SELECT-only for seller — consistent with payouts being system/admin-generated (outside this dump). |
| support_tickets | none | seller SELECT/INSERT/UPDATE own | none | |

## 5. Storage bucket policies

| Bucket | SELECT | INSERT | UPDATE/DELETE |
|---|---|---|---|
| tryon-images | public | any authenticated user | owner-delete (authenticated) |
| influencer-videos | public | any authenticated user | any authenticated user (update+delete) |
| product-images | public | **any authenticated user, no seller-ownership check, no folder restriction on INSERT** (`with_check: bucket_id='product-images'`) | DELETE restricted to `auth.uid() = storage.foldername(name)[1]` (path-prefix ownership) |

**[SECURITY-SENSITIVE][HIGH]**: `product-images` INSERT policy allows **any authenticated user** (any consumer, not just approved sellers) to upload arbitrary files into the shared product-images bucket with no path/ownership constraint on write (only delete is ownership-scoped). This permits non-sellers to pollute/host arbitrary public files under this bucket, and allows a seller to write into another seller's folder path on upload (since the with_check doesn't scope the folder at all, unlike delete). Cross-ref 55.

## 6. Edge function authorization

| Function | verify_jwt | Internal auth check | Effective authorization |
|---|---|---|---|
| razorpay-create-order | false | none | **Anyone with the public endpoint URL can create a Razorpay order** (cost/spam risk against Razorpay account, not direct fund loss) |
| razorpay-verify-payment | false | HMAC signature check against Razorpay secret only | Verifies payment authenticity, but **not caller identity** — `order_data.customer_id` is taken verbatim from the request body and inserted into `orders.customer_id`, so a caller who obtains someone else's valid Razorpay payment/order id triplet could attribute the order to an arbitrary `customer_id`. Uses service-role, so this insert bypasses the `orders` RLS `with_check (auth.uid()=customer_id)` entirely. **[CRITICAL]** |
| send-otp / verify-otp | false | phone format / OTP hash+expiry only | No caller-identity check at all (by design, since it's pre-auth); relies on OTP secrecy, which is broken by `demoOtp` leak (see 51) |
| virtual-tryon, image-analysis, ai-recommendations, generate-banner-image | false | none observed beyond payload shape | Any anonymous caller can invoke Lovable AI Gateway–backed functions, burning `LOVABLE_API_KEY` quota |
| pincode-lookup, ip-geolocation | false/not listed | none | Low-sensitivity, acceptable to be open |
| pinterest-token-exchange | false | none beyond code presence | Exchanges Pinterest client secret server-side; endpoint itself must be called with a real OAuth `code`, limiting abuse value but still open surface |
| sync-algolia | false | none observed | Should be restricted to admin/service use; open invocation could let anyone trigger a full catalog resync (Algolia admin key usage, potential cost/rate abuse) |
| social-post-webhook | false | none observed (webhook) | No shared-secret/HMAC check on incoming Make.com webhook observed — spoofable [SECURITY-SENSITIVE] |
| mcp | delegated to Supabase OAuth issuer (`acceptedAudiences: "authenticated"`) | Supabase-verified JWT | The only edge function type with real bearer-token verification of caller identity |

## 7. Dev-mode seller fallback — `DEV_SELLER_ID`

**[SECURITY-SENSITIVE][HIGH]** Found in `src/components/seller-dashboard/pages/{DashboardAddProduct,DashboardDiscounts,DashboardProducts,DashboardSettings}.tsx`:
```
const DEV_SELLER_ID = "07edb482-2c8e-4711-8cda-d2f3a87b790a";
...
.then(({ data }) => setSellerId(data?.id || DEV_SELLER_ID));
```
- Pattern: the component queries `sellers` for a row matching `user_id = auth.uid()`; if none is found (`.maybeSingle()` returns null/no data), it **falls back to a hardcoded UUID** and proceeds to use it as `sellerId` for subsequent product/discount CRUD calls.
- Risk: this is a leftover development convenience. In production, any authenticated user with no seller profile who reaches the seller dashboard (e.g., via `SellerAuthRoute`, which — per §3 — does not check seller role) will have the UI operate against `DEV_SELLER_ID`'s data context. Whether this results in actual cross-tenant writes depends entirely on RLS: `products`/`discounts` policies scope by `seller_id IN (SELECT id FROM sellers WHERE user_id=auth.uid())`, so an insert/update targeting `DEV_SELLER_ID` as `seller_id` will be **rejected by RLS unless the logged-in dev/test user's `auth.uid()` genuinely maps to that seller row** — meaning in production this fallback most likely just produces confusing RLS-denied errors rather than a live cross-tenant bypass, **but it is still hardcoded production-shipped test data (a specific real or seed seller UUID) that should not exist in client bundle code**, and if that seller row is a real active seller, every failed-lookup user's dashboard silently attempts to read/write that specific seller's product/discount data (reads would succeed only if RLS also permits, e.g., public "live products" SELECT policy on `products`, but discount/product management calls would fail write, not read-only exposure of others' non-public discounts). **[INFERRED risk level — exact blast radius depends on runtime RLS behavior not exercised here].**

## 8. Capability matrix — Role x Resource x Operation

| Resource | Consumer | Seller (own) | Admin | Anon |
|---|---|---|---|---|
| products (live) | Read | CRUD own | CRUD all | Read |
| products (non-live) | — | Read/CRUD own | CRUD all | — |
| orders | Create own, Read own | Read/Update own (as seller) | **No RLS admin path** [MISSING] | — |
| order_items | Read/insert via own order | Read via own order | none | — |
| sellers profile | — | Read/Update own (incl. verification/status fields) | CRUD all | — |
| seller_applications | Submit (insert) | — | Read/Update (approve) | Submit (insert) |
| user_roles | Read own | Read own | CRUD all | — |
| discounts | Read active | CRUD own | none explicit | Read active |
| product-images storage | — | Upload (any authenticated, not seller-checked) | — | Read |
| profiles | Read/Update own | same | **No admin read policy** [MISSING] | — |
| payments (Razorpay functions) | Invoke (unauthenticated call allowed) | same | same | Invoke |

## 9. Client-side-only authorization instances (flagged)

1. `ProtectedRoute`, `RoleProtectedRoute`, `SellerAuthRoute`, `AdminLogin` role check — all React-only gates.
2. `useUserRole` — read-only convenience hook, not an enforcement mechanism.
3. `DEV_SELLER_ID` fallback — client-side identity substitution with no server-side equivalent concept.
4. Checkout total computation (`Checkout.tsx` — discount %, delivery fee, `finalTotal`) — computed entirely client-side and sent to `razorpay-create-order`/`razorpay-verify-payment` with no server recomputation from `products`/`discounts` tables. **[CRITICAL — see 55]**

# 53 — Secrets & Environment Inventory

All values REDACTED. Classification legend: PUBLIC_CONFIG / PRIVATE_CONFIG / SECRET / CREDENTIAL / TOKEN / WEBHOOK_SECRET / SERVICE_ROLE.

| Variable | Required | Location | Purpose | Service | Fallback | References | Class | Risk |
|---|---|---|---|---|---|---|---|---|
| VITE_SUPABASE_URL=REDACTED | Required | Frontend (bundled) | Supabase project REST/Auth base URL | Supabase | none (app breaks) | `src/integrations/supabase/client.ts:6` | PUBLIC_CONFIG | Low — meant to be public |
| VITE_SUPABASE_PUBLISHABLE_KEY=REDACTED | Required | Frontend (bundled) | Anon/publishable API key for PostgREST/Auth | Supabase | none | `src/integrations/supabase/client.ts:7` | PUBLIC_CONFIG | Low by design; RLS must be complete (it is not — see 52/55) |
| VITE_SUPABASE_PROJECT_ID=REDACTED | Required for MCP | Frontend (bundled) | Constructs MCP OAuth issuer URL | Supabase | `"project-ref-unset"` string fallback | `src/lib/mcp/index.ts:6` | PUBLIC_CONFIG | Low |
| SUPABASE_URL=REDACTED | Required | Edge functions | Server-side Supabase base URL for admin client | Supabase | none | `send-otp`, `verify-otp`, `razorpay-verify-payment` | PRIVATE_CONFIG | Low (URL only) |
| SUPABASE_SERVICE_ROLE_KEY=REDACTED | Required | Edge functions | Bypasses RLS; used for OTP user admin ops and order writes | Supabase | none — functions 500 if missing | `send-otp`, `verify-otp`, `razorpay-verify-payment` | SERVICE_ROLE | **CRITICAL if ever exposed to client** — currently server-only per code reading, but any edge function bug that echoes env or logs objects broadly is a leak vector. Also: `verify_jwt=false` on `razorpay-verify-payment` means an unauthenticated caller triggers service-role-privileged DB writes. |
| RAZORPAY_KEY_ID=REDACTED | Required | Edge functions (`razorpay-create-order`) | Razorpay public key id | Razorpay | function returns 500 if missing | `razorpay-create-order/index.ts:15` | PRIVATE_CONFIG (semi-public — Razorpay key_id is designed to be exposed to the client at checkout time) | Low — returned intentionally in response (`key_id` field) for Razorpay Checkout.js to use client-side. Not a secret by Razorpay's model. |
| RAZORPAY_KEY_SECRET=REDACTED | Required | Edge functions (`razorpay-create-order`, `razorpay-verify-payment`) | Razorpay API secret / HMAC signing key | Razorpay | function returns 500 if missing | both functions | SECRET | High if leaked — enables order/payment API abuse and signature forgery. Server-only in code as read. |
| LOVABLE_API_KEY=REDACTED | Required | Edge functions | Auth to Lovable AI Gateway | Lovable Cloud | not handled explicitly (would error) | `ai-recommendations`, `generate-banner-image`, `image-analysis` | SECRET | Medium — reachable functions have `verify_jwt=false` and no internal auth check, so **anyone can trigger AI Gateway calls that consume this key's quota/budget**, an indirect abuse vector even though the key itself stays server-side. |
| PINTEREST_CLIENT_ID=REDACTED | Required for Pinterest login | Edge function (`pinterest-token-exchange`) | OAuth client id | Pinterest | none | `pinterest-token-exchange/index.ts:25` | CREDENTIAL | Low-medium (client ids are semi-public in OAuth) |
| PINTEREST_CLIENT_SECRET=REDACTED | Required | Edge function | OAuth client secret | Pinterest | none | `pinterest-token-exchange/index.ts:26` | SECRET | Medium — leak allows Pinterest app impersonation |
| VITE_PINTEREST_CLIENT_ID=REDACTED | Referenced in scope of work; **[UNKNOWN — not found in ENV VARS USED grep]** | Frontend | Likely used to build the Pinterest OAuth authorize URL client-side | Pinterest | — | not found in `/tmp/extract/code.txt` env grep — needs direct grep confirmation | PUBLIC_CONFIG | Low if truly just a client id |
| ALGOLIA_ADMIN_KEY=REDACTED | Required for `sync-algolia` | Edge function | Write access to Algolia index | Algolia | not visible in truncated grep, but function name implies use | `supabase/functions/sync-algolia/index.ts` (749 lines, not fully read) | SECRET | High if leaked — full index read/write/delete. Function has `verify_jwt=false`; if it internally trusts request without further auth, **any caller could trigger index resync or, if the function exposes the key or unsafe operations, tamper with search index**. **[UNKNOWN — sync-algolia body not fully reviewed in this pass]**. |
| MAKE_WEBHOOK_URL=REDACTED | Used by `social-post-webhook` and/or `socialPostService.ts` | Edge function / frontend service | Make.com automation webhook target | Make.com | — | `src/services/socialPostService.ts` (invokes `social-post-webhook` function), function itself not fully confirmed to hold this var in the truncated env grep | WEBHOOK_SECRET-adjacent (URL, not a shared secret) | Medium — if the URL alone is treated as authentication (typical Make.com pattern), and this function has `verify_jwt=false` and no HMAC, both inbound and outbound spoofing risk exists. |
| SUPABASE_JWKS | Referenced in scope of work; **[UNKNOWN — not found in any grep hit]** | n/a | Likely unused/not present in this project; may be a generic checklist item | — | — | not found | n/a | n/a — mark [MISSING/NOT-USED] |
| SUPABASE_DB_URL | Referenced in scope of work; **[UNKNOWN — not found in grep]** | n/a | Not observed in code (only used for the psql extraction tooling, not app code) | — | — | not found in app/functions | n/a | n/a |
| HUGGINGFACE_API_TOKEN | Referenced in scope of work; **[UNKNOWN — not found in grep]** | n/a | Not observed in current edge function code (AI functions use `LOVABLE_API_KEY`, not HuggingFace, per grep) | — | — | none found | n/a | Document as **[MISSING/NOT-USED]** — scope-of-work anticipated it but code doesn't reference it |

## Findings: secrets potentially exposed to the client bundle

1. **`razorpay-create-order` returns `key_id` in its JSON response** (`razorpay-create-order/index.ts:76`, `RAZORPAY_KEY_ID`). **[BY DESIGN, not a flaw]** — Razorpay's Checkout.js requires the key id client-side; this is the intended usage pattern for Razorpay's `key_id` (not the secret). Included here for completeness per instructions. Severity: INFORMATIONAL.
2. **`send-otp` returns `demoOtp` (the actual OTP value) in its API response** (`send-otp/index.ts` response body: `demoOtp: otp // Remove in production`). This is a genuine secret (the OTP itself, meant to prove phone possession) returned directly to any caller of a `verify_jwt=false`, CORS-`*` endpoint. **Severity: CRITICAL.** This fully defeats the phone-verification security property.
3. **CORS `Access-Control-Allow-Origin: '*'`** is present on every edge function reviewed (`send-otp`, `verify-otp`, `razorpay-create-order`, `razorpay-verify-payment`, and by consistent pattern likely all others) — combined with `verify_jwt=false`, this means these endpoints are callable from any web origin, not just the OGURA SPA. Severity: MEDIUM (amplifies every other finding above).
4. No hardcoded API keys/tokens were found embedded directly in `src/**` beyond the intentionally-public Supabase URL/anon key and Google OAuth client-side SVG/branding (no secret literal strings found in the reviewed source).
5. `DEV_SELLER_ID` (`07edb482-2c8e-4711-8cda-d2f3a87b790a`) is a hardcoded UUID shipped in the client bundle — not a "secret" in the classic sense, but it is sensitive internal test/seed data baked into production JS. See 52 §7. Severity: LOW-MEDIUM (information disclosure of an internal identifier + fallback-behavior risk).

## Notes on `.env` variable names (names only, no values read)

Per directive, only variable *names* were inspected via grep of source code (`Deno.env.get(...)`, `import.meta.env....`) rather than reading any `.env` file contents directly — this table is derived from those code references, not from a `.env` dump.

# 54 — Data Privacy

## 1. PII Inventory

| Table.column | PII type | Who can read (RLS) | Retention/Deletion |
|---|---|---|---|
| profiles.name/email/phone/avatar_url/city/state/country/pincode/lat/lng | Identity + precise location | Owner only (`auth.uid()=id`); **no admin SELECT policy** [MISSING] | No deletion/retention logic found (no cron/edge function purges profiles). [MISSING] |
| user_addresses.full_name/mobile/pincode/address_line/city/state/landmark | Full postal address + phone | Owner only | No retention policy; addresses persist indefinitely, no soft-delete/anonymization on account deletion (no account-deletion flow found at all). [MISSING] |
| seller_applications.full_name/email/phone/city/portfolio_link/sample_images | Applicant identity/contact | Admin (SELECT), applicant cannot read own submission (no owner-SELECT policy) — applicants cannot see status of their own application via API without an admin) [OBSERVED anomaly] | No retention/deletion policy. [MISSING] |
| brand_waitlist_applications.brand_name/phone/handle_or_website/city | Contact info | Admin only (SELECT); submitter cannot re-read | No retention/deletion. [MISSING] |
| sellers.gstin/pan_number/bank_account_number/bank_ifsc/bank_name | **Financial/government ID (highly sensitive)** | Owner (seller) SELECT/UPDATE own; Admin ALL | Stored in plaintext columns (no encryption-at-rest abstraction visible beyond Postgres default); no masking on read (owner sees full PAN/account number back on every SELECT *). No retention policy. [SECURITY-SENSITIVE][MISSING retention] |
| otp_verifications.phone/otp_hash/attempts | Phone number + hashed OTP | No RLS policy found in dump (table likely has RLS disabled or is service-role-only, matching it being written exclusively via edge functions with service role) — **[UNKNOWN]** whether RLS is enabled on this table at all; if RLS is off and no policy restricts it, and if it were ever reachable via anon key, phone numbers would be exposed. Needs confirmation via `RLS ENABLED` dump (table not listed in the truncated section captured). [UNKNOWN — flag for follow-up] | OTP rows are deleted on: expiry-detected read, max-attempts exceeded, and on issuing a new OTP for the same phone (`send-otp` deletes prior unverified rows). No general TTL/cron sweep of stale rows. |
| orders.shipping_address (jsonb: full_name, mobile, address_line, city, state, pincode, landmark) | Full name + phone + postal address, denormalized per order | Customer (own), Seller (their orders) | No redaction/retention; permanent copy independent of `user_addresses` lifecycle (i.e., deleting an address does not touch historical orders — acceptable for order history, but no documented retention/deletion policy exists for old orders either). [MISSING] |
| tryon_history.model_image_url/product_image_url/result_image_url | User-uploaded photos (potentially biometric/likeness data — a person's photo used for virtual try-on) | Owner (`auth.uid()=user_id`) SELECT/INSERT/DELETE | User can self-delete rows; underlying Storage objects in `tryon-images` bucket are **publicly readable** (`Public can view try-on images` policy) regardless of the `tryon_history` row's RLS — i.e., **the row metadata is private but the actual image file is publicly fetchable by anyone who knows/guesses the URL**. [SECURITY-SENSITIVE] Images uploaded by guests (`user_id=null`) cannot be deleted by the "owner" at all (no identity to match), effectively **undeletable PII images**. [MISSING deletion path for guest images] |

## 2. Consent & Legal Copy

- **[OBSERVED]** Routes exist for `/privacy` (`PrivacyPolicy.tsx`) and `/terms` (`TermsOfUse.tsx`) (`CustomerApp.tsx:63-64`) — presence confirmed via routing; content not reviewed in this pass. **[UNKNOWN]** whether the policy text accurately reflects actual third-party sharing (Algolia, Make.com, Replicate/Lovable AI, Pinterest, Razorpay) enumerated below.
- **[MISSING]** No cookie-consent banner or explicit consent capture mechanism found in routes/components inventory.
- **[MISSING]** No visible "download my data" / "delete my account" self-service flow in any reviewed route.

## 3. Third-party data sharing

| Third party | Data shared | Mechanism | Governance observed |
|---|---|---|---|
| Razorpay | Customer email, mobile, order amount, order items | `razorpay-create-order`/`razorpay-verify-payment` edge functions, server-to-server | Necessary for payment processing; standard PCI-scope offload (card data never touches OGURA servers — Razorpay Checkout.js handles card entry) |
| Algolia | Product catalog (and possibly other indexed fields) via `sync-algolia`; customer-side search queries go directly from browser to Algolia using client search key (typical react-instantsearch pattern) | Edge function push (admin key) + client-side search calls | **[UNKNOWN]** whether any customer PII is inadvertently included in indexed records; not verified from `sync-algolia` body (not fully read) |
| Replicate / Lovable AI Gateway (`LOVABLE_API_KEY`) | Uploaded try-on images (`model_image_url`, `product_image_url`), possibly containing a user's photo/likeness, sent to `virtual-tryon`/`image-analysis` functions for processing | Edge function → external AI API | No consent capture specific to AI image processing beyond assumed generic ToS/Privacy Policy coverage — **[MISSING]** explicit AI-processing disclosure not confirmed in reviewed code |
| Pinterest | OAuth authorization code + client secret exchanged server-side; likely publishes/reads Pinterest account data for seller marketing features | `pinterest-token-exchange` function | Standard OAuth pattern |
| Make.com | Social post content pushed via `social-post-webhook`/`socialPostService.ts` | Outbound webhook, `MAKE_WEBHOOK_URL` | No signing/verification observed on the outbound or inbound path |

## 4. Cross-border processing

- **[INFERRED]** Supabase project (`project_id` in `config.toml`) region not determined from code; Razorpay is India-focused (amounts in INR, Indian phone/pincode formats hardcoded), suggesting primary user base is India, but Supabase/Algolia/Replicate/Lovable AI Gateway infrastructure region is **[UNKNOWN]** and could process Indian PII (including bank/GST/PAN data) outside India with no documented data-residency control in code.

## 5. Privacy gaps summary

1. **[MISSING]** No account/data deletion flow anywhere in the app for `profiles`, `user_addresses`, `orders`, `sellers` financial fields, or `tryon_history` (guest images especially — undeletable).
2. **[SECURITY-SENSITIVE]** `tryon-images` and `product-images` storage buckets are fully public-read; any URL leak (log, referrer, share) exposes a user's uploaded photo permanently, with no expiry.
3. **[SECURITY-SENSITIVE]** Seller bank/GST/PAN data stored in plaintext relational columns, readable in full by the seller themselves on every fetch (no server-side masking such as showing only last 4 digits).
4. **[MISSING]** No retention policy/expiry on `otp_verifications`, `seller_applications`, `brand_waitlist_applications` — indefinite retention of contact PII for people who may never become customers/sellers.
5. **[MISSING]** No documented/implemented consent capture for AI image processing of user photos.
6. No admin SELECT policy on `profiles` or `orders` broadly — while this *limits* exposure (good for privacy), it also means the admin panel (`AdminApp.tsx` — `AdminSellers`, `AdminProducts`, etc.) likely relies on service-role edge functions or Supabase dashboard access for any customer-order support, a path not captured/audited in these docs. **[UNKNOWN — needs check of Admin* pages' data access method]**.
