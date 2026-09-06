# 60 — External Integrations Inventory

Scope: every outbound/inbound network dependency actually wired into code, verified by reading source. Nothing here is inferred from marketing copy alone.

---

## 1. Supabase / Lovable Cloud (primary backend)
- **SERVICE**: Supabase (Lovable Cloud-provisioned) — Postgres + Auth + Storage + Edge Functions.
- **PURPOSE**: Sole application database, auth provider, file storage, and serverless function host. [CONFIRMED]
- **CALLER**: `src/integrations/supabase/client.ts:12` — `createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {...})`. Used everywhere via `import { supabase } from "@/integrations/supabase/client"`.
- **PROJECT ID**: `yudzgkrjsstqbfrrrrly` (supabase/config.toml:1, and matches `VITE_SUPABASE_URL=https://yudzgkrjsstqbfrrrrly.supabase.co`).
- **TRIGGER**: every page/component/hook that reads or writes app data.
- **AUTH METHOD**: anon/publishable JWT key on client; service-role key inside edge functions only (server-side).
- **ENV VARS**: `VITE_SUPABASE_URL=REDACTED (project URL, not secret)`, `VITE_SUPABASE_PUBLISHABLE_KEY=REDACTED (anon key, public by design)`, `SUPABASE_URL=REDACTED`, `SUPABASE_PUBLISHABLE_KEY=REDACTED` (duplicated non-VITE_ copies in `.env`), `SUPABASE_SERVICE_ROLE_KEY=REDACTED` (edge-function-only, type=secret, used_by=razorpay-verify-payment, send-otp, verify-otp, sync-algolia; required=yes; risk=full DB bypass of RLS if leaked) [SECURITY-SENSITIVE].
- **CRITICALITY**: hard dependency — app cannot function without it.

## 2. External "Seller Center" Supabase project (cross-project read API)
- **SERVICE**: A *second*, separate Supabase project (`pyesltzkemtranachpne.supabase.co`), not the same project as the main app (`yudzgkrjsstqbfrrrrly`). [CONFIRMED]
- **PURPOSE**: Read-only product feed — appears to be a companion "Seller Center" app publishing products this storefront displays as "brand store" / "new arrivals" inventory.
- **CALLER files**: `src/lib/brandStores.ts:3`, `src/pages/Collections.tsx:25`, `src/pages/ProductDetail.tsx:108`, `src/components/SellerNewArrivals.tsx:6`.
- **ENDPOINT**: `GET https://pyesltzkemtranachpne.supabase.co/functions/v1/products`.
- **TRIGGER**: page load of Collections, ProductDetail, Brand Store pages, and the SellerNewArrivals homepage widget.
- **REQUEST**: plain unauthenticated `fetch()`, no API key/header sent in observed call sites (function's `verify_jwt` setting is on the *other* project, unknown to this repo).
- **AUTH METHOD**: [UNKNOWN] — no Authorization header set from this codebase; function may be public (`verify_jwt=false` on the other project, unconfirmed since that project's config isn't in this repo).
- **INPUT**: none (GET, no params observed).
- **OUTPUT**: JSON array of product objects, mapped via `mapApiProduct()` in `brandStores.ts` into `BrandStoreProduct`.
- **DATABASE EFFECT**: none — read-only, not written back to this project's DB.
- **FAILURE**: [OBSERVED] no explicit retry; failures presumably fall back to static/mock catalog (`ProductDetail.tsx` wraps in try/catch per typical pattern — verify per call site).
- **RETRY / TIMEOUT**: [MISSING] no retry or timeout logic wraps these `fetch()` calls.
- **SECURITY RISK**: [SECURITY-SENSITIVE] hard-coded cross-tenant dependency on infrastructure not owned/documented by this repo; if that project is deleted, renamed, or its function auth changes, four pages silently break with no fallback UX guarantee documented.
- **CRITICALITY**: soft/optional for core cart-and-checkout flow, but hard dependency for Brand Store / New Arrivals / part of Collections & ProductDetail content.

## 3. Google OAuth (via Lovable Cloud Auth, not raw Google SDK)
- **SERVICE**: Google Sign-In, brokered through `@lovable.dev/cloud-auth-js`.
- **PURPOSE**: Social login for customers.
- **CALLER**: `src/contexts/AuthContext.tsx:129` → `lovable.auth.signInWithOAuth("google", {...})`; wrapper defined in `src/integrations/lovable/index.ts:9-27` which calls `lovableAuth.signInWithOAuth(provider, opts)` then `supabase.auth.setSession(result.tokens)`.
- **TRIGGER**: user clicks `GoogleSignInButton` (`src/components/auth/GoogleSignInButton.tsx`).
- **AUTH METHOD**: OAuth redirect flow managed entirely inside the `@lovable.dev/cloud-auth-js` package; **no Google Client ID/Secret appears anywhere in this repo** — credentials are held by the Lovable Cloud platform, not by this codebase. [CONFIRMED absence in repo] [INFERRED managed by Lovable Cloud]
- **INPUT**: provider name (`"google"`), optional `redirect_uri`.
- **OUTPUT**: `{ redirected }` or `{ error }` or Supabase session tokens, which are then installed into the Supabase JS client's session via `setSession`.
- **DATABASE EFFECT**: creates/updates `auth.users` row in the primary Supabase project; a `profiles` row is expected to be created via trigger (not verified in this doc — see 71/72 for trigger inventory if present).
- **FAILURE**: `signInWithOAuth` returns `{error}`, surfaced to UI via toast (not traced further here).
- **ENV VARS**: none present in this repo for Google — [MISSING] from an app-rebuild perspective; a from-scratch rebuild off-Lovable-Cloud would need `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` configured in a real OAuth provider [CONFLICT with "just works" assumption].
- **CRITICALITY**: optional (alternative to phone-OTP and email/password login).

## 4. Razorpay (payment gateway)
See **61_PAYMENT.md** for the full trace. Summary:
- **SERVICE**: Razorpay Orders API + Checkout.js widget.
- **CALLER files**: `supabase/functions/razorpay-create-order/index.ts`, `supabase/functions/razorpay-verify-payment/index.ts`, `src/pages/Checkout.tsx`.
- **ENDPOINT**: `https://api.razorpay.com/v1/orders` (server-side order creation); client-side loads `https://checkout.razorpay.com/v1/checkout.js` (Checkout.tsx:52).
- **AUTH METHOD**: HTTP Basic auth with `RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET` (base64) for order creation; HMAC-SHA256 signature check for verification.
- **ENV VARS**: `RAZORPAY_KEY_ID=REDACTED` (type=public-ish key id, used_by=razorpay-create-order, razorpay-verify-payment's response echo; required=yes), `RAZORPAY_KEY_SECRET=REDACTED` (type=secret, used_by=both razorpay-* functions; required=yes; risk=can forge orders/refunds if leaked) [SECURITY-SENSITIVE].
- **WEBHOOK**: [MISSING] — no Razorpay server-to-server webhook endpoint exists in `supabase/functions/`; verification is entirely client-driven (browser calls verify function after Checkout.js `handler` fires). This is a payment-integrity gap, detailed in 61.
- **CRITICALITY**: hard dependency for any real payment; no alternate payment method exists in code.

## 5. Virtual Try-On models — Hugging Face Space (IDM-VTON), *not* Replicate
- **SERVICE**: Hugging Face-hosted Gradio Space `yisol/idm-vton` at `https://yisol-idm-vton.hf.space`. [CONFIRMED] No Replicate API calls exist anywhere in the repo — the task brief's mention of "Replicate and/or HuggingFace" resolves to **HuggingFace only**. [CONFLICT with brief's Replicate assumption — no Replicate code found]
- **CALLER**: `supabase/functions/virtual-tryon/index.ts` (full trace in 62_AI_AND_STUDIO.md).
- **AUTH METHOD**: `Authorization: Bearer ${HUGGINGFACE_API_TOKEN}` sent to the HF Space's Gradio queue endpoints.
- **ENV VARS**: `HUGGINGFACE_API_TOKEN=REDACTED` (type=secret, used_by=virtual-tryon, required=yes, risk=quota abuse/billing on HF account if leaked).
- **PROTOCOL**: Gradio SSE queue protocol (`/queue/join` then `/queue/data`), `fn_index: 2`, hardcoded `denoise_steps: 30`, `seed: 42`.
- **TIMEOUT**: 90 seconds hard cap (`MAX_WAIT_MS = 90_000`).
- **CRITICALITY**: optional — a discrete "Virtual Try-On" feature; rest of storefront functions without it. Reliant on a public community Space with no SLA (cold starts / 503 explicitly handled as "loading").

## 6. Lovable AI Gateway (LLM + image-generation)
- **SERVICE**: `https://ai.gateway.lovable.dev/v1/chat/completions` — OpenAI-compatible gateway provided by Lovable Cloud.
- **PURPOSE / CALLERS**:
  - `supabase/functions/ai-recommendations/index.ts` — model `google/gemini-2.5-flash`, text-only, returns JSON array of product IDs.
  - `supabase/functions/image-analysis/index.ts` — model `google/gemini-2.5-flash` with multimodal `image_url` input (base64), two sequential calls (analyze image → match products).
  - `supabase/functions/generate-banner-image/index.ts` — model `google/gemini-2.5-flash-image-preview`, `modalities: ["image","text"]`, returns a generated banner image.
- **AUTH METHOD**: `Authorization: Bearer ${LOVABLE_API_KEY}`.
- **ENV VARS**: `LOVABLE_API_KEY=REDACTED` (type=secret/platform-issued, used_by=ai-recommendations, image-analysis, generate-banner-image; required=yes; risk=abuse of AI credits if leaked).
- **FAILURE HANDLING**: all three functions explicitly branch on HTTP 429 (rate limit) and (banner function only) 402 (payment/credits required), returning structured JSON errors to the client rather than throwing raw 500s.
- **RETRY**: [MISSING] none of the three functions retry on failure; caller (frontend) also does not retry these three (contrast with virtual-tryon's client-side retry loop).
- **CRITICALITY**: optional/soft — recommendations, image search, and banner generation degrade to empty arrays/errors without breaking checkout or browsing.

## 7. Algolia (search)
- **SERVICE**: Algolia Search (`algoliasearch/lite` client).
- **CALLER**: `src/lib/algoliaClient.ts:5` — `algoliasearch("KEBAEMMQPI", "765787a04065dd199e268ba75e81e34f")`; App ID and **search-only** API key are hardcoded directly in frontend source (not env vars). Code comment self-documents this is intentional ("safe to expose... search permissions only").
- **INDEX**: `ogura-products` (`ALGOLIA_INDEX_NAME`).
- **SYNC PATH**: `supabase/functions/sync-algolia/index.ts` — generates a large static/synthetic product catalog (dresses/tops/bottoms/outerwear/footwear/accessories/bags, ~700 items) and pushes to Algolia. This function's write-side Admin API key is presumably a separate secret (not observed in the first 500 lines read; assume `ALGOLIA_ADMIN_API_KEY` env var is needed for the write half — [UNKNOWN], recommend confirming in Supabase function secrets).
- **CRITICALITY**: hard dependency for the `/search` and Algolia-powered PLP components (`src/components/search/*`); optional for the rest of the storefront which uses direct Supabase queries.

## 8. Pinterest API v5
- **SERVICE**: Pinterest OAuth + Boards/Pins API.
- **CALLER**: `supabase/functions/pinterest-token-exchange/index.ts` (server-side OAuth code exchange), plus frontend components `ConnectPinterestButton.tsx`, `PinterestBoardModal.tsx`, `UserPinterestBoards.tsx`, `SaveToPinterestButton.tsx` (not fully read in this pass — token-exchange function confirms API v5 usage: `https://api.pinterest.com/v5/oauth/token`).
- **AUTH METHOD**: HTTP Basic auth with `PINTEREST_CLIENT_ID:PINTEREST_CLIENT_SECRET` for token exchange; resulting `access_token` returned to the client for subsequent direct Pinterest API calls from the browser (implied — token is handed back to frontend, not stored server-side in the reviewed function).
- **ENV VARS**: `PINTEREST_CLIENT_ID=REDACTED`, `PINTEREST_CLIENT_SECRET=REDACTED` (both secret, used_by=pinterest-token-exchange, required=yes).
- **SECURITY RISK**: [SECURITY-SENSITIVE] access token is returned directly to the browser in the JSON response and presumably stored in client-side state/localStorage for later direct Pinterest calls — token lifetime/storage/rotation was not verified further in this pass.
- **CRITICALITY**: optional — "Save to Pinterest" social feature.

## 9. Make.com webhook (social posting)
- **SERVICE**: Make.com (Integromat) inbound webhook.
- **CALLER**: `supabase/functions/social-post-webhook/index.ts`, invoked from `src/services/socialPostService.ts` → `supabase.functions.invoke("social-post-webhook", {...})`.
- **ENDPOINT**: `Deno.env.get("MAKE_WEBHOOK_URL")` (dynamic; not hardcoded).
- **ENV VARS**: `MAKE_WEBHOOK_URL=REDACTED` (type=secret-ish URL, used_by=social-post-webhook, required=yes; risk=SSRF/spoofed social posts if leaked/misconfigured, low severity).
- **TRIGGER**: "custom_design_created" / "custom_order_confirmed" events fired from Made-to-Order design flows.
- **REQUEST**: flattened JSON payload (title, description, image, url, designer info, customization fields) POSTed with `Content-Type: application/json`, no signing/HMAC on the outbound call.
- **FAILURE**: fire-and-forget — `triggerSocialPost()` catches all errors and returns `false`; does not block the calling UI flow.
- **CRITICALITY**: optional/cosmetic marketing automation.

## 10. IP Geolocation
- **SERVICE**: `ip-api.com` (free tier, no key, documented 45 req/min limit) called server-side.
- **CALLER**: `supabase/functions/ip-geolocation/index.ts:24` — `http://ip-api.com/json/${clientIP}?fields=status,message,country,regionName,city`. Note: **plain HTTP, not HTTPS** [SECURITY-SENSITIVE — IP-based geolocation query sent unencrypted, low-severity data but still a plaintext leak of visitor IP to an intermediary].
- **AUTH METHOD**: none (no API key).
- **FAILURE**: on `status:"fail"` or any exception, hardcoded fallback to `Delhi, Delhi, India`.
- **ENV VARS**: none.
- **CRITICALITY**: optional — feeds default location for delivery-check UI; falls back safely.

## 11. Pincode Lookup (India Post)
- **SERVICE**: `https://api.postalpincode.in/pincode/{pincode}` — free Indian government-adjacent public API, no key.
- **CALLER**: `supabase/functions/pincode-lookup/index.ts`.
- **VALIDATION**: server-side regex `^\d{6}$` before calling out.
- **CRITICALITY**: optional convenience (auto-fill city/state during address entry); manual entry fallback exists per error message text ("enter details manually").

## 12. Spline (3D)
- **SERVICE**: Spline embedded 3D scene via iframe.
- **CALLER**: `src/components/Spline3DBackground.tsx:6` — `src='https://my.spline.design/fashiontech-jQgcNhhdhO3bpc6NgnyW2CKN/'`.
- **AUTH METHOD**: none — public Spline share link embedded as an `<iframe>` (or similar; not confirmed further).
- **CRITICALITY**: optional/cosmetic; purely decorative background on marketing surfaces.

## 13. Maps
[MISSING] — no Google Maps / Mapbox / Leaflet integration found anywhere in `src` (searched for map SDK imports; only found the `LuxuryStoreLocator`/`StoreLocator` components which, based on file names, likely render a static store list rather than an interactive map — not independently confirmed with map tile requests).

## 14. MCP (Model Context Protocol) clients
- **SERVICE**: `@lovable.dev/mcp-js` (v0.24.0) — two roles:
  1. **Build-time Vite plugin**: `vite.config.ts:5,10` — `mcpPlugin()` from `@lovable.dev/mcp-js/stacks/supabase/vite`, auto-generates `supabase/functions/mcp/index.ts` from `src/lib/mcp/**` at build time.
  2. **Runtime MCP server**: deployed as the `mcp` edge function (auto-generated, "do not edit" banner), defining at least one tool (`search-products`, per `src/lib/mcp/tools/search-products.ts` bundled reference) using `zod@^3.23.8` for schema validation.
- **PURPOSE**: exposes a Model-Context-Protocol tool surface (e.g., for AI agents/assistants) backed by the same Supabase project via `src/lib/mcp/supabase.ts` (separate lightweight client factory reading `SUPABASE_URL`/`VITE_SUPABASE_URL` and a publishable key).
- **CRITICALITY**: optional / platform tooling — not part of the customer-facing checkout or browsing path.

---

## Consolidated ENV VAR register (redacted)

| VAR | Type | Used by | Required | Risk |
|---|---|---|---|---|
| VITE_SUPABASE_URL | public URL | frontend supabase client | yes | none (public) |
| VITE_SUPABASE_PUBLISHABLE_KEY | public anon key | frontend supabase client | yes | low (RLS-scoped) |
| SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY | duplicate non-VITE copies | build tooling / legacy | yes | low |
| SUPABASE_SERVICE_ROLE_KEY | secret | razorpay-verify-payment, send-otp, verify-otp, sync-algolia | yes | [SECURITY-SENSITIVE] full RLS bypass |
| RAZORPAY_KEY_ID | key id | razorpay-create-order, razorpay-verify-payment | yes | low |
| RAZORPAY_KEY_SECRET | secret | razorpay-create-order, razorpay-verify-payment | yes | [SECURITY-SENSITIVE] |
| HUGGINGFACE_API_TOKEN | secret | virtual-tryon | yes | medium (quota/billing abuse) |
| LOVABLE_API_KEY | secret | ai-recommendations, image-analysis, generate-banner-image | yes | medium (AI credit abuse) |
| PINTEREST_CLIENT_ID | secret | pinterest-token-exchange | yes | low |
| PINTEREST_CLIENT_SECRET | secret | pinterest-token-exchange | yes | [SECURITY-SENSITIVE] |
| MAKE_WEBHOOK_URL | secret-ish URL | social-post-webhook | yes | low |
| ALGOLIA admin key (write side of sync-algolia) | secret | sync-algolia | [UNKNOWN — not confirmed present] | medium if exists |

# 61 — Payment Extraction (Razorpay)

## Components involved
- `src/pages/Checkout.tsx` — client-side cart total math, discount application, Razorpay Checkout.js invocation.
- `supabase/functions/razorpay-create-order/index.ts` — creates a Razorpay order server-side.
- `supabase/functions/razorpay-verify-payment/index.ts` — verifies HMAC signature and writes `orders`/`order_items` rows using the **service role key**.
- `discounts` table (migration `20260312041856_...sql`) — coupon validation.

## Full trace: CUSTOMER → CART → TOTAL → PAYMENT ORDER → PROVIDER → VERIFICATION → ORDER → INVENTORY → SELLER SPLIT → LEDGER → REFUND/PAYOUT

| Step | Status | Evidence |
|---|---|---|
| CUSTOMER adds to cart | [CONFIRMED] | `CartContext` (not fully re-read here, referenced via `useCart()` in Checkout.tsx:38) |
| CART → subtotal/tax/total | [CONFIRMED] | `Checkout.tsx:38` destructures `subtotal, tax, total` from `useCart()`. Computed **entirely client-side** in the cart context. |
| Delivery fee rule | [CONFIRMED] | `Checkout.tsx:128`: `const deliveryFee = subtotal >= 999 ? 0 : 99;` — hardcoded threshold, **client-side only**, not re-validated on server. |
| Discount code validation | [CONFIRMED, partially server-checked] | `Checkout.tsx:76-121` queries `discounts` table directly from the **browser** using the anon key (`supabase.from("discounts").select(...)`), checks `status`, `usage_limit` vs `usage_count`, `min_purchase`. This is a **read** against real DB data (good), but the *discount amount calculation* (`amount = subtotal * value/100` etc.) happens **in the browser** (`Checkout.tsx:104-113`) and that computed `discountAmount` is what gets sent onward — never recomputed/verified server-side. |
| `finalTotal` computation | [CONFIRMED — CLIENT-SIDE, SEVERITY: HIGH] | `Checkout.tsx:129`: `const finalTotal = total + deliveryFee - discountAmount;`. This is the amount sent to `razorpay-create-order` as `amount`. **No server-side recomputation of price from authoritative product prices, quantities, or discount rules exists anywhere in the payment path.** |
| PAYMENT ORDER creation | [CONFIRMED] | `Checkout.tsx:153-165` invokes edge function `razorpay-create-order` with `{ amount: finalTotal, currency, receipt, notes }`. The edge function (`razorpay-create-order/index.ts:34`) only checks `amount > 0` — **it does not know or check what's actually in the cart**, it trusts whatever number the browser sends. [SECURITY-SENSITIVE — HIGH SEVERITY: a modified client can request a Razorpay order for any positive amount, e.g. ₹1, regardless of real cart value.] |
| PROVIDER (Razorpay) | [CONFIRMED] | Order created via Basic-auth POST to `https://api.razorpay.com/v1/orders`, amount converted to paise (`Math.round(amount*100)`). Razorpay Checkout.js widget opened client-side with `order_id`, `key_id` (public). |
| VERIFICATION | [CONFIRMED — CORRECTLY IMPLEMENTED] | `razorpay-verify-payment/index.ts:11-30` implements HMAC-SHA256 over `${order_id}|${payment_id}` using `RAZORPAY_KEY_SECRET`, comparing hex digest to `razorpay_signature` from the client. This is the **correct** Razorpay verification algorithm and is done server-side — this part is sound. |
| ORDER creation in DB | [CONFIRMED] | On valid signature, `razorpay-verify-payment/index.ts:95-109` inserts into `orders` using the **service-role client**, with fields `order_number` (`OGR${Date.now().toString(36).toUpperCase()}` — see idempotency note below), `customer_id`, `seller_id` (falls back to `customer_id` if not provided — **data-integrity bug**, see below), `subtotal`, `shipping_fee`, `discount`, `total`, `shipping_address`, `status: 'new'`, **`tracking_id: razorpay_payment_id`** — confirms the brief's note: **the `tracking_id` column is repurposed to store the Razorpay payment ID, not a courier tracking number.** [CONFIRMED, SEVERITY: schema/semantic conflict — `tracking_id` cannot later hold a real courier AWB without a new column or overwriting the payment reference]. |
| order_items insert | [CONFIRMED] | `razorpay-verify-payment/index.ts:127-142` inserts `order_items` rows (`product_id, quantity, unit_price, total_price, size, color`) from **client-supplied `order_data.items`**, again unverified against server-side product records — prices come straight from the browser's cart state. [SECURITY-SENSITIVE — client-controlled `unit_price`/`total_price` are trusted verbatim and stored as the order-of-record even though the *payment amount* was separately (and also client-controlled) sent to Razorpay; the two numbers are never cross-checked against each other or against the `products` table price.] |
| INVENTORY decrement | [MISSING] | No stock/inventory decrement call exists in `razorpay-verify-payment`. No reference to a `product.stock` or `inventory` update anywhere in the payment path. |
| SELLER SPLIT / commission | [MISSING] | `seller_id` is naively set to `order_data.seller_id || order_data.customer_id` (a customer ID used as a seller ID fallback — clear bug/placeholder), and no per-item seller attribution, no commission percentage, no split calculation exists. Multi-seller carts are not handled — the whole order is written with a single `seller_id`. |
| LEDGER | [MISSING] | No `ledger`, `transactions`, or `payments` table found in migrations; the only durable record of a successful charge is the `orders.tracking_id` field holding the Razorpay payment ID string. There is no dedicated payments/ledger table to reconcile against Razorpay settlement reports. |
| RECONCILIATION | [MISSING] | No scheduled job, edge function, or webhook reconciles Razorpay's records against `orders`. The **only** confirmation of payment success is the one-time client → `razorpay-verify-payment` call triggered by the Checkout.js JS `handler` callback. |
| REFUNDS / partial refunds | [MISSING] | No `razorpay-refund` (or similarly named) edge function exists. No refunds/credit-note table. No UI action anywhere calls Razorpay's refund API. |
| SELLER SETTLEMENTS / PAYOUTS | [MISSING] | `DashboardTransfers.tsx` exists under seller-dashboard pages (name suggests payout UI) but no server-side payout/settlement processing code, no payout table, and no bank-transfer or Razorpay Route/X integration was found. [Recommend inspecting `DashboardTransfers.tsx` directly if payout UI copy needs auditing — likely displays static/mock data]. |

## Idempotency & Retry / Failure & Partial-State Paths
- **Idempotency**: [MISSING]. `razorpay-create-order` generates a `receipt` from `Date.now()` client-side and accepts whatever `amount` is passed with no idempotency key check; a user could double-click "Pay" and create two Razorpay orders for the same cart (Razorpay itself would still require two separate successful payments, limiting duplicate-charge risk, but duplicate **order rows** in the DB are possible if `razorpay-verify-payment` is called twice for genuinely different order_ids from a retried flow).
- **Partial-state / "payment succeeded but order not saved"**: [CONFIRMED — EXPLICITLY HANDLED BUT UNRESOLVED]. `razorpay-verify-payment/index.ts:112-125`: if the `orders` insert fails after signature verification succeeds, the function returns `success: true, payment_verified: true, order_saved: false, error: 'Order save failed, please contact support'`. **This is a known, acknowledged partial-failure state with no automated recovery path** — the customer has been charged, Razorpay has the money, but no order exists in the DB; resolution is manual ("contact support"). [SECURITY/BUSINESS-SENSITIVE — money collected with no corresponding order].
- **Retry**: [MISSING] no automatic retry of the `orders` insert, no dead-letter queue, no alerting hook on this failure branch (see 73_MONITORING_LOGGING.md).
- **Timeout**: neither Razorpay function sets an explicit fetch timeout; relies on Deno/undici defaults.

## Client-controlled monetary fields — trust audit

| Field | Where computed | Sent by client to | Server re-validates? | Trust verdict |
|---|---|---|---|---|
| `subtotal` | CartContext (client) | razorpay-create-order (indirectly via `finalTotal`), razorpay-verify-payment (`order_data.subtotal`) | No | **Untrusted, but stored as-is** |
| `deliveryFee` | `Checkout.tsx:128` (client, hardcoded ₹999 free-ship threshold) | both functions | No | **Untrusted** |
| `discountAmount` | `Checkout.tsx:104-113` (client computes % / flat / free-shipping value from a real `discounts` row, but the arithmetic itself is client-side) | both functions | No — the discount **row** is validated (`status`, `usage_limit`, `min_purchase`), but the **derived rupee amount** is not recomputed server-side | **Partially trusted** (code is real, math is not re-verified) |
| `finalTotal` / `amount` sent to Razorpay | `Checkout.tsx:129` | `razorpay-create-order` | Only checked for `> 0` | **Untrusted — HIGH SEVERITY**: this is the literal amount charged to the customer's card/UPI, fully attacker-controllable via browser devtools/API replay. |
| `order_data.items[].unit_price` / `total_price` | Cart item state (client) | `razorpay-verify-payment` | No — inserted verbatim into `order_items` | **Untrusted — HIGH SEVERITY**: the permanent order record's pricing is whatever the browser claims, not the live `products.price`. |
| `order_data.total` | client | `razorpay-verify-payment` → `orders.total` | No | **Untrusted** |
| Discount `usage_count` increment | — | — | [MISSING] no evidence the edge function increments `discounts.usage_count` after a successful order, so the `usage_limit` check is likely **not actually enforced across multiple orders** (a coupon could be reused past its limit) [CONFLICT with intended discount-limit feature]. |

## Overall severity summary
[SECURITY-SENSITIVE — CRITICAL]: The **entire order amount and line-item pricing is client-authoritative**. Razorpay's HMAC signature only proves that *a* payment of *some* amount was completed and matches the order Razorpay itself created — but that Razorpay order's amount was itself set from an unchecked client value. An attacker can:
1. Add high-value items to cart.
2. Intercept/modify the `amount` sent to `razorpay-create-order` to a trivial value (e.g. ₹1).
3. Pay the trivial amount, get a valid Razorpay signature for that trivial-amount order.
4. Submit the *original* high-value `order_data.items` to `razorpay-verify-payment`, which will insert them as a legitimate paid order because verification only checks the signature math, not that the paid amount matches the items' total.

This is a full payment-bypass vulnerability given the current code. Recommend server-side price recomputation from the `products` table before both order creation and verification — currently [MISSING].

# 62 — AI & "Studio" Features

## Feature: Virtual Try-On
USER (uploads/selects human+garment image) → FRONTEND (`useVirtualTryOn.ts`, `VirtualTryOn.tsx`, `VirtualTryOnDialog.tsx`) uploads file to Supabase Storage bucket `tryon-images` (public bucket, migration `20251108170146_...sql`) → gets public URL → BACKEND `supabase/functions/virtual-tryon/index.ts` → AI PROVIDER: Hugging Face Space `yisol/idm-vton` via Gradio SSE queue protocol, `fn_index:2`, params `auto-masking=true, is_checked_crop=false, denoise_steps=30, seed=42` (all hardcoded, not user-tunable) → RESPONSE: base64 PNG streamed back → VALIDATION: none beyond checking `output.data[0]` exists → STORAGE: [MISSING] the generated try-on image is **not persisted** anywhere (no upload of the result back to `tryon-images` or any bucket) → DATABASE: [MISSING] **no `tryon_history` table exists** in migrations (only the storage bucket + RLS policies for uploads were found: `20251108170146` and `20251108171434`). A `TryOnHistory.tsx` component exists in `src/components/` but has no backing table to read from — [CONFLICT]: the component name implies persisted history, but no schema supports it, meaning it likely reads from local/component state only or is non-functional. → CREDIT ACCOUNTING: [MISSING] no credits/quota system limits try-on usage. → UI: result shown via `TryOnResult.tsx`, retried with a 90s client-side polling loop (`RETRY_DELAY_MS=3000`) that treats HF cold-start/quota errors as "loading" and retries in-place.

Failure handling: `isLoadingMessage()` regex-matches `/loading|warming|busy|queue|starting|cold start|503|timeout/i` to distinguish transient states from hard failures; hard failures surface a destructive toast.

## Feature: AI Recommendations
USER browses a product/brand/search/category → FRONTEND calls `supabase.functions.invoke('ai-recommendations', ...)` (call sites not exhaustively enumerated in this pass, e.g. `RecommendationCarousel.tsx`) → BACKEND `ai-recommendations/index.ts` builds one of four prompts (similar/brand/search/category) → AI PROVIDER: Lovable AI Gateway, model **`google/gemini-2.5-flash`** → RESPONSE: freeform text expected to contain a JSON array → VALIDATION: regex-extracts `[...]` and `JSON.parse`s it, falling back to `[]` on failure → STORAGE/DATABASE: none — purely request/response, nothing persisted → CREDIT ACCOUNTING: [MISSING] → UI: `RecommendationCarousel` renders matched products (skeleton loader `RecommendationSkeleton.tsx` while pending).

Exact prompt (search example, `ai-recommendations/index.ts:83-90`):
```
You are a fashion recommendation AI. A user searched for: "${query}"
From this product catalog, select the 8 most relevant products that match the search intent...
Response format: ["id1", "id2", "id3", ...]
```

## Feature: Image Analysis (visual search)
USER uploads a photo (`ImageUploadZone.tsx`, `ImageSearchDialog.tsx`) → FRONTEND base64-encodes and invokes `image-analysis` → BACKEND makes **two sequential** Lovable AI Gateway calls, both model `google/gemini-2.5-flash`: (1) multimodal analysis extracting `{category, colors, style, pattern, material}` from the image; (2) text-only matching against the product catalog using those attributes → RESPONSE parsed with regex+JSON.parse, defaulting to `{category:'dresses', colors:['black'], style:'casual', pattern:'solid', material:'cotton'}` on parse failure → no storage/DB/credit accounting → UI renders matched products.

## Feature: Generate Banner Image
CALLER: `LaunchStudio`/admin banner tooling (exact frontend call site not traced further in this pass) → BACKEND `generate-banner-image/index.ts` → AI PROVIDER: Lovable AI Gateway, model **`google/gemini-2.5-flash-image-preview`**, `modalities:["image","text"]` → RESPONSE: `choices[0].message.images[0].image_url.url` → returned directly to caller; **not saved to Storage or DB** by this function itself (any persistence would be the caller's responsibility, not confirmed here) → explicit 429/402 handling (402 = "Payment required. Please add credits." — implies Lovable AI Gateway has its own platform-level credit metering, but this app does not surface or track that per-user).

## Comparison against the "OGURA Studio: 8 generation modes, brand profile/brand fetch, media library, marketplace push, credits" concept

| Documented/expected concept | Actual implementation | Verdict |
|---|---|---|
| 8 generation modes | Only 4 distinct AI-backed capabilities exist in code: virtual try-on, ai-recommendations, image-analysis, generate-banner-image | [MISSING]/[CONFLICT] — no evidence of 8 modes; no mode-switcher UI or generation-type enum beyond `type: 'similar'|'brand'|'search'|'category'` inside ai-recommendations (a routing parameter, not "generation modes") |
| Brand profile / brand fetch | No edge function or table for brand-profile ingestion/fetching was found (`brands` concept exists only as a display/browse feature — `Brands.tsx`, `BrandDetail.tsx` — not an AI brand-profile builder) | [MISSING] |
| Media library | No `media_library` table or asset-management UI/API found | [MISSING] |
| Marketplace push | No integration pushes AI-generated assets to any external marketplace | [MISSING] |
| Credits (accounting) | No credits table, no per-user/per-seller quota, no debit/consumption tracking anywhere in the codebase for any AI feature | [MISSING] — **there is no credit accounting in this application at all.** The only "credits" concept surfaced is the *platform-level* Lovable AI Gateway 402 response text, which is not tied to any in-app ledger. |

**Conclusion**: the "OGURA Studio" concept as described is **not implemented**. What exists is four narrow, independent AI-assisted features (try-on, recommendations, visual search, banner generation) wired directly to Lovable AI Gateway / Hugging Face, with no unifying "Studio" UI, no credits, no brand-profile pipeline, and no marketplace-push mechanism.

# 63 — Email / WhatsApp / SMS Messaging Surfaces

## OTP (SMS) — `send-otp` / `verify-otp`
- **Provider used**: [CONFIRMED] **none — simulated.** `supabase/functions/send-otp/index.ts:94-104` generates a 6-digit OTP, hashes it (SHA-256 of `otp+phone`), stores it in `otp_verifications`, and **returns the plaintext OTP directly in the API response** as `demoOtp: otp`, with an explicit code comment: `// In production, integrate with SMS provider here: // await sendSMS(phone, ...)`. **No SMS is ever actually sent.** [SECURITY-SENSITIVE — CRITICAL: any client calling this endpoint receives the valid OTP in the JSON response, making phone-number "verification" not a proof of phone possession at all.]
- Rate limiting: 60-second cooldown between requests per phone (checked via `otp_verifications` table).
- Verification (`verify-otp/index.ts`): SHA-256 hash comparison, 5-minute expiry, max 5 attempts before forcing a new OTP. On success, creates/looks up a Supabase Auth user keyed by a synthetic email `${phone}@ogura.phone.auth`, and signs them in via a one-time `generateLink({type:'magiclink'})` + `verifyOtp({type:'magiclink'})` exchange — a real Supabase session is issued despite no real SMS delivery ever having occurred.
- **CRITICALITY**: hard dependency for the phone-login flow as coded, but is a stub/demo implementation, not production SMS delivery. [MISSING] any real SMS provider (Twilio/MSG91/etc.).

## WhatsApp deep links (`wa.me`)
All are `https://wa.me/...` links opened via `window.open`/`<a href>` — no WhatsApp Business API integration, just prefilled-chat links:
- `src/pages/Stores.tsx:62` — `https://wa.me/${store.whatsapp}` (per-store number from `src/data/stores.ts`, e.g. `+919876543210`), no prefilled text.
- `src/pages/BrandWaitlist.tsx:451,468` — `https://wa.me/917742698970?text=${encodeURIComponent("Hi Ogura, I'd like to join the Seller Program.")}`.
- `src/components/SocialShareButtons.tsx:20` — generic share link `https://wa.me/?text=...` (opens WhatsApp with no fixed recipient, standard share-to-WhatsApp pattern).
- `src/components/waitlist/WaitlistForm.tsx:58-60` — `whatsappHref()` builds `https://wa.me/${WHATSAPP_NUMBER}?text=...` (constant not shown in this pass; likely same `+91 77426 98970` seller-program number).

## Mailto links
- `brands@ogura.in` — `src/pages/Contact.tsx:52,80` (prefilled subject/body from a contact form's fields).
- `careers@ogura.in`: **not found under this exact address** — instead `src/pages/Careers.tsx:589,652,835` uses a `CAREERS_EMAIL` constant (value not resolved in this pass; verify it equals `careers@ogura.in` before relying on this in other docs) [UNKNOWN — constant value not directly viewed].
- `foundercares@ogura.in` — `src/pages/PrivacyPolicy.tsx:57,73` (privacy contact, not brands/careers as the task brief assumed) [CONFLICT with brief's assumed address list — an additional address, `foundercares@ogura.in`, exists that wasn't in the brief].
- Per-designer `mailto:${designer.email}` — `src/pages/DesignerProfilePage.tsx:151`, `src/pages/DesignerDetail.tsx:125` (dynamic, from designer records, not a fixed OGURA address).
- Generic share mailto — `src/components/SocialShareButtons.tsx:38`.

## Make.com social posting
See `61_INTEGRATIONS.md` §9 / `socialPostService.ts` for full detail. Two event types trigger it: `custom_design_created`, `custom_order_confirmed`, both fired from Made-to-Order design flows, both fire-and-forget with no retry.

## Transactional email
[MISSING] — no email-sending provider (Resend/SendGrid/Postmark/SES/Supabase built-in SMTP) integration was found anywhere in `supabase/functions/` or `src/`. Order confirmations, shipping notifications, password resets (beyond Supabase Auth's own default email templates, which are platform-managed and not customized in this repo) all appear to have **no custom transactional email**.

## Notification templates
[MISSING] — no notification-template table or templating system exists. The only "template-like" text found is the hardcoded OTP log line `` `OTP for +91${phone}: ${otp}` `` (server console only, never emailed/texted) and the Make.com social payload field mapping (not a message template per se, just a data payload for an external automation to format).

# 64 — Logistics: Delivery & Location

## delivery_zones table
Migration `20260121081121_46cf0a09-d885-4281-a0a6-2037456b40d7.sql` creates `public.delivery_zones (id, pincode UNIQUE, city, state, is_deliverable, delivery_days, express_available, created_at)`, RLS: public SELECT for everyone. Seeded with ~19 hardcoded major-city pincodes (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Ahmedabad, Pune, Jaipur, Lucknow, Nagpur, Kochi, Bhubaneswar). [CONFIRMED] Any pincode not in this seed list is, by construction, absent from the table — component behavior for "unknown pincode" governs whether that's treated as non-deliverable or unchecked (see DeliveryChecker below).

## DeliveryChecker component
`src/components/DeliveryChecker.tsx` — calls `checkDelivery(pincode)` from `LocationContext`, auto-triggers when `location.pincode` changes, debounced by requiring exactly 6 digits before checking. Renders a compact and full variant. The actual delivery-eligibility query logic lives in `LocationContext` (queries `delivery_zones` by pincode — implementation not fully re-read in this pass beyond the component's consumption of `checkDelivery`/`DeliveryInfo`).

## pincode-lookup edge function
`supabase/functions/pincode-lookup/index.ts` — validates 6-digit format, calls `https://api.postalpincode.in/pincode/{pincode}` (India Post public API, no key), returns `{city, state, country, postOfficeName}`. This is for **address auto-fill**, separate from `delivery_zones` (deliverability check). Two independent pincode paths exist: one for "can we ship here" (delivery_zones, DB-backed, ~19 rows) and one for "what's this pincode's city/state" (India Post API, comprehensive/live).

## ip-geolocation edge function
`supabase/functions/ip-geolocation/index.ts` — reads `x-forwarded-for`/`x-real-ip`, queries `http://ip-api.com/json/{ip}` (plain HTTP, no key, 45 req/min free tier), falls back to hardcoded `Delhi, Delhi, India` on any failure or private/local IP. Used to pre-populate `LocationContext` on first visit before the user manually confirms/changes location.

## LocationContext
`src/contexts/LocationContext.tsx` — central provider wrapping the app (`App.tsx`); manages `location`, `selectedAddress`, `showAddressModal`, `showManualSelector`, and exposes `checkDelivery()`. Coordinates IP geolocation (initial guess) → `ManualLocationSelector`/`LocationPermissionModal` (user override) → `pincode-lookup` (address-form autofill) → `delivery_zones` (shippability check) → `DeliveryChecker`/`HeaderLocationIndicator` (UI surfaces).

## Address management
`user_addresses` table (migration `20260121083507_...sql`): `id, user_id, full_name, mobile, pincode, address_line, city, state, landmark, address_type ('home'|'work'), is_default, timestamps`. RLS scoped to `auth.uid() = user_id`. Managed via `AddressForm.tsx`, `AddressCard.tsx`, `AddressSelectionModal.tsx`.

## Shipping fee rules
[CONFIRMED, CLIENT-SIDE ONLY] `src/pages/Checkout.tsx:128`: flat rule — `subtotal >= 999 ? 0 : ₹99`. No zone-based, weight-based, or carrier-rate-based shipping calculation exists; the `delivery_days`/`express_available` columns in `delivery_zones` are informational only (shown to the user) and **do not feed into the actual shipping fee charged** — [CONFLICT] a zone marked non-`express_available` or with 5-day delivery is charged the same flat fee as a 2-day express zone.

## Courier/tracking fields on orders
`orders.tracking_id` — [CONFIRMED] **repurposed to store the Razorpay payment ID** (`razorpay-verify-payment/index.ts:105`: `tracking_id: razorpay_payment_id`), not a courier AWB/tracking number. `shipping_carrier` — [UNKNOWN/not located]: no column named `shipping_carrier` was found in the migrations reviewed; if referenced in seller-dashboard order UI it would currently have no backing schema confirmed in this pass. No courier/logistics-provider API integration (Shiprocket, Delhivery, etc.) exists anywhere in the codebase. **Carrier integration: [MISSING].**

# 65 — Analytics & Tracking Reality Check

## What exists
- **No analytics SDK is installed.** `package.json` dependency list (see `72_DEPENDENCIES.md`) contains no `posthog-js`, `mixpanel`, `segment`, `@vercel/analytics`, `google-analytics`/`gtag`, `react-ga`, or any pixel library.
- **No `gtag`/`fbq`/pixel snippets** found in `index.html` or anywhere in `src` (searched for `gtag(`, `dataLayer`, `fbq(`, `pixel` — none present beyond unrelated CSS/asset names).
- The only "tracking-adjacent" code is **`console.*` logging** scattered through edge functions and some frontend hooks (e.g., `useVirtualTryOn.ts` logs upload/progress events, edge functions log request lifecycle) — this is developer debug output, not business analytics, and is only visible via Supabase function logs / browser devtools, not aggregated anywhere.
- SEO/meta tracking tags exist (`index.html`) — Open Graph and Twitter Card meta tags, plus `twitter:site content="@ogura_fashion"` — these affect social-share previews only, not analytics.
- `sync-algolia` and Algolia search itself provide Algolia's own built-in search-analytics dashboard **only for search queries run through Algolia** (index `ogura-products`) — this is the one piece of quasi-analytics that exists, and it's scoped narrowly to search usage, not general site/business events. [CONFIRMED, narrow scope]

## [MISSING] register of business-critical events not tracked

| Event | Tracked? | Why it matters |
|---|---|---|
| Page views | [MISSING] | No visibility into traffic volume, top pages, or bounce/drop-off across the funnel. |
| Product views (PDP impressions) | [MISSING] | Cannot measure product popularity, merchandising effectiveness, or feed real "trending"/"recommended" signals (the AI recommendation prompts use static catalog data, not actual view/click behavior). |
| Add-to-cart | [MISSING] | No cart-abandonment measurement possible; no funnel step between browse→cart is observable. |
| Checkout started / address selected / discount applied | [MISSING] | No visibility into where users drop off in checkout, which is especially risky given the payment-integrity issues documented in `61_PAYMENT.md` — failed/abandoned payments are invisible. |
| Payment success/failure | [MISSING] | Beyond `console.error` inside the edge function (server logs only, not queryable business metric), there is no dashboard-visible payment success rate, no alerting on spikes in `order_saved:false` partial-failure states. |
| Seller events (product listed, order received, payout requested) | [MISSING] | No seller-side analytics beyond whatever `DashboardAnalytics.tsx` renders directly from live DB queries (that's a live-data dashboard, not an event-tracking/analytics pipeline — different concern). |
| AI feature usage (try-on attempts, recommendation impressions/clicks, image-search usage) | [MISSING] | No way to measure adoption or ROI of the four AI features documented in `62_AI_AND_STUDIO.md`, and combined with the total absence of credit accounting, there is **no usage-based cost control or reporting at all** for AI spend. |
| Errors / client-side exceptions | [MISSING] | No error-tracking SDK (Sentry, Bugsnag, etc.); errors are only visible as `console.error` in the browser console of whichever user experienced them, or in Supabase function logs for backend errors — nothing is aggregated or alerted on. |
| Search queries & zero-result searches | Partially [CONFIRMED] via Algolia's own dashboard (if enabled on the Algolia account) — but this repo does not surface that data anywhere in-app (no admin analytics page reads Algolia's analytics API). |

**Bottom line**: this application has **no product/business analytics layer**. All "analytics"-sounding admin dashboard pages (`DashboardAnalytics.tsx`, `AdminDashboardHome.tsx`) should be assumed to be live operational queries against the Supabase DB (orders, products, sellers counts) rather than true event-tracking analytics, unless independently verified otherwise.
