# 40 — Database Schema (schema `public`)

Source: live `information_schema` dump (`/tmp/extract/db.txt`), `supabase/migrations/*.sql`, `src/integrations/supabase/types.ts`, application code (`rg`). [CONFIRMED] = seen in live DB dump. [OBSERVED] = seen only in migration/code, not independently re-verified live. [INFERRED] = deduced, not directly stated.

Managed schemas **not owned by this app** and out of scope for recreation-from-scratch except as FK targets:
- `auth.users` — Supabase Auth managed table. Referenced by `profiles.id`, `sellers.user_id`, `user_roles.user_id`, `orders.customer_id`, `tryon_history.user_id`. [CONFIRMED]
- `storage.objects` / `storage.buckets` — Supabase Storage managed schema. See `46_STORAGE_ARCHITECTURE.md`.

Total public tables: **20** (19 requested + `product_variants` already included). Row-Level Security is **ON for all 20 public tables** [CONFIRMED].

---

## Enum: `app_role`
```sql
app_role: 'consumer' | 'seller' | 'admin'
```
[CONFIRMED via types.ts]. Definition SQL (`CREATE TYPE app_role AS ENUM (...)`) is **not present in the tracked migration files** — it predates the migration history captured in `supabase/migrations/` [MISSING: source DDL]. Used by `user_roles.role` only.

---

## 1. brand_waitlist_applications
**Purpose**: Public lead-capture form for brands wanting to join the marketplace ("brand waitlist"), separate from the seller/designer approval flow. [OBSERVED from JoinUs.tsx]

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | system | admin | no |
| brand_name | text | NO | | brand/store name | anon form submit | admin | no |
| handle_or_website | text | NO | | Instagram handle or website URL | anon | admin | no |
| what_you_make | text | NO | | free-text product description | anon | admin | no |
| city | text | NO | | applicant city | anon | admin | no |
| brand_age | text | NO | | how long brand has existed (bucketed text) | anon | admin | no |
| sell_channels | text[] | NO | `'{}'` | multi-select of existing sales channels | anon | admin | no |
| monthly_orders | text | YES | | bucketed order-volume text | anon | admin | no |
| phone | text | NO | | contact phone | anon | admin | **yes (PII)** |
| created_at | timestamptz | NO | now() | submission time | system | admin | no |

- PK: `brand_waitlist_applications_pkey (id)`.
- FKs: none.
- Unique/Check: none beyond PK.
- Indexes: PK only.
- RLS: **ON**. Policies (2): `Anyone can submit a waitlist application` (INSERT, `anon,authenticated`, `WITH CHECK true`); `Admins can view waitlist applications` (SELECT, `authenticated`, `USING has_role(auth.uid(),'admin')`). No UPDATE/DELETE policy for anyone — **[SECURITY-SENSITIVE]** admins cannot process the queue in-app (no status column at all).
- Triggers/functions: none.
- App files: `src/pages/JoinUs.tsx` (insert only, `.from("brand_waitlist_applications" as any)` pattern likely — verify exact call). No admin UI found reading this table in `src/pages/admin/*` [MISSING: admin consumer UI].
- Sensitive fields: `phone` (PII).
- Lifecycle: permanent/append-only lead list; no deletion path via app or DB (no DELETE policy) → **disposable but never disposed**.
- Row count: **1** [CONFIRMED].
- Confidence: HIGH.

---

## 2. categories
**Purpose**: Hierarchical product category taxonomy (self-referencing tree) used for browsing/filtering; separate from the free-text `products.category` column.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | admin | public | no |
| name | text | NO | | display name, globally unique | admin | public | no |
| slug | text | NO | | URL slug, globally unique | admin | public | no |
| parent_id | uuid | YES | | self-FK to `categories.id` for subcategories | admin | public | no |
| sort_order | integer | YES | 0 | manual ordering | admin | public | no |
| is_active | boolean | YES | true | visibility toggle | admin | public | no |
| created_at | timestamptz | YES | now() | | system | public | no |

- PK: `categories_pkey (id)`.
- FKs: `categories_parent_id_fkey (parent_id) -> categories(id)` (self-referencing, no ON DELETE clause ⇒ default `NO ACTION`).
- Unique: `categories_slug_key (slug)`, `categories_name_key (name)`.
- Indexes: PK + the two unique indexes only (no index on `parent_id` despite it being an FK — **[PROPOSED]** add one for tree lookups).
- RLS: **ON**. Policy (1 found live): `Anyone can view active categories` (SELECT, public, `is_active = true`). **No INSERT/UPDATE/DELETE/admin policy exists in the live policy dump** — **[SECURITY-SENSITIVE/CONFLICT]**: `products.category_id` FKs to this table but there is no visible way for admins to manage categories through RLS (must be done via service role / SQL editor only).
- Triggers: none captured for this table.
- App files: category filters/dropdowns are largely done via `products.category` text field per `rg` results, not `category_id` — **[INFERRED]** `categories` table is a newer/parallel taxonomy not yet wired everywhere.
- Sensitive fields: none.
- Row count: **8** [CONFIRMED].
- Confidence: MEDIUM (admin write path unclear).

---

## 3. delivery_zones
**Purpose**: Pincode-level serviceability lookup (deliverable Y/N, delivery days, express availability) for checkout/PDP delivery-estimate widgets.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | admin/seed | public | no |
| pincode | text | NO | | 6-digit Indian PIN code, unique | admin/seed | public | no |
| city | text | YES | | derived city name | admin/seed | public | no |
| state | text | YES | | derived state name | admin/seed | public | no |
| is_deliverable | boolean | YES | true | serviceability flag | admin/seed | public | no |
| delivery_days | integer | YES | 5 | standard ETA in days | admin/seed | public | no |
| express_available | boolean | YES | false | express shipping flag | admin/seed | public | no |
| created_at | timestamptz | YES | now() | | system | public | no |

- PK: `delivery_zones_pkey (id)`. Unique: `delivery_zones_pincode_key (pincode)`.
- FKs: none.
- Indexes: PK + unique(pincode) only.
- RLS: **ON**. Policy (1): `Anyone can view delivery zones` (SELECT, public, `true`). No write policy visible ⇒ writes are seed/service-role only.
- App files: pincode-lookup edge function (`supabase/functions/pincode-lookup/index.ts`) likely reads/queries this or an external API — **[UNKNOWN without reading function body in detail]**.
- Sensitive: none.
- Row count: **20** [CONFIRMED] — small seed set, likely major-city coverage only.
- Confidence: HIGH.

---

## 4. designers
**Purpose**: Curated "designer/boutique" storefront entities — one of three possible product owners (designer / vendor / seller model). Appears seeded with demo data.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | admin | public | no |
| name | text | NO | | person's name | admin | public | no |
| brand_name | text | NO | | brand/studio name | admin | public | no |
| city | text | NO | | | admin | public | no |
| category | text | NO | | free-text category (not FK to `categories`) | admin | public | no |
| price_range | text | NO | | free-text tier (e.g. "Luxury") | admin | public | no |
| instagram_link | text | YES | | | admin | public | no |
| followers | integer | YES | 0 | Instagram follower count (display only) | admin | public | no |
| contact_number | text | YES | | | admin | public | **yes (PII)** |
| email | text | YES | | | admin | public | **yes (PII)** |
| profile_image | text | YES | | image URL | admin | public | no |
| product_images | jsonb | YES | `'[]'` | array of image URLs (gallery) | admin | public | no |
| description | text | YES | | | admin | public | no |
| created_at | timestamptz | NO | now() | | system | public | no |
| updated_at | timestamptz | NO | now() | auto-updated by trigger | trigger | public | no |
| slug | text | NO | | URL slug, unique | admin | public | no |
| banner_image | text | YES | | | admin | public | no |
| collection_name | text | YES | | | admin | public | no |

- PK: `designers_pkey (id)`. Unique: `designers_slug_key (slug)`.
- FKs: none inbound to this table's own columns; `products.designer_id -> designers.id ON DELETE CASCADE`.
- Indexes: `idx_designers_category`, `idx_designers_brand_name`, `idx_designers_city`, `idx_designers_slug` (duplicate of unique slug index — redundant).
- RLS: **ON**. Original migration granted broad `authenticated` INSERT/UPDATE/DELETE with `USING/CHECK (true)` (any logged-in user could edit any designer) [SECURITY-SENSITIVE — see 42]. A later migration tightens this to `Admins can manage designers` (ALL, `has_role(...,'admin')`) which is what the **live** policy dump shows, alongside `Anyone can view designers` (SELECT, public, true). Treat the earlier broad policy as **historical/superseded** unless confirmed still present — live dump shows only the 2 admin-scoped policies, so superseded. [CONFIRMED via live dump]
- Triggers: `update_designers_updated_at` (BEFORE UPDATE, sets `updated_at = now()`).
- App files: `src/hooks/useDesignerProducts.ts`, designer profile pages, `product_images`/`profile_image` display components.
- Sensitive: `contact_number`, `email` are publicly SELECT-able (policy `true`) — **[SECURITY-SENSITIVE]** PII exposed to anon via public SELECT.
- Row count: **9** (4 from initial seed migration + more added later) [CONFIRMED].
- Confidence: HIGH.

---

## 5. discounts
**Purpose**: Seller-scoped coupon/discount codes.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | seller | seller/public(active) | no |
| seller_id | uuid | NO | | FK -> sellers.id, cascade delete | seller | seller/public | no |
| code | text | NO | | coupon code string | seller | seller/public | no |
| type | text | NO | | discount type (percentage/flat — not DB-enforced) | seller | seller/public | no |
| value | numeric | NO | 0 | discount amount/percent | seller | seller/public | no |
| applies_to | text | YES | 'all' | scope of discount | seller | seller/public | no |
| min_quantity | integer | YES | 0 | | seller | seller/public | no |
| min_purchase | integer | YES | 0 | minimum order amount | seller | seller/public | no |
| start_date | timestamptz | YES | now() | | seller | seller/public | no |
| end_date | timestamptz | YES | | | seller | seller/public | no |
| usage_limit | integer | YES | | | seller | seller/public | no |
| usage_count | integer | YES | 0 | **not incremented by any DB trigger** — must be app-maintained | seller/app | seller/public | no |
| status | text | NO | 'active' | lifecycle flag | seller | seller/public | no |
| created_at | timestamptz | YES | now() | | system | seller | no |
| updated_at | timestamptz | YES | now() | **no trigger found wiring this to auto-update** [MISSING trigger] | seller | seller | no |

- PK: `discounts_pkey`. FK: `discounts_seller_id_fkey (seller_id) -> sellers(id) ON DELETE CASCADE`.
- Check/Unique: none on `code` — **[SECURITY-SENSITIVE/BUG-RISK]** no uniqueness constraint on `code` per seller or globally; duplicate codes possible.
- Indexes: PK only — no index on `seller_id` despite being the primary filter column in every RLS policy and query — **[PROPOSED]** add `idx_discounts_seller_id`.
- RLS: **ON**. Policies: `Anyone can view active discounts` (SELECT, `anon,authenticated`, `status='active' AND (end_date IS NULL OR end_date>now())`); `Sellers can manage own discounts` (ALL, public, `seller_id IN (SELECT id FROM sellers WHERE user_id=auth.uid())`).
- Triggers/functions touching it: none confirmed (no `update_updated_at_column` trigger found for `discounts` in migrations grep) — **[MISSING]** `updated_at` likely stale after edits.
- App files: seller dashboard discount management pages (`src/pages/seller/...`, `src/components/seller-dashboard/...` — not individually enumerated here).
- Sensitive: none.
- Row count: **2** [CONFIRMED].
- Confidence: MEDIUM-HIGH.

---

## 6. influencer_videos
**Purpose**: CMS-style content table powering an influencer/shoppable-video carousel on the storefront.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | admin | public | no |
| video_filename | text | NO | | filename/path in `influencer-videos` bucket | admin | public | no |
| poster_url | text | YES | | thumbnail image URL | admin | public | no |
| caption | text | NO | | | admin | public | no |
| link | text | NO | `'/collections/dresses'` | click-through destination | admin | public | no |
| sort_order | integer | NO | 0 | display order | admin | public | no |
| is_active | boolean | NO | true | visibility toggle | admin | public | no |
| created_at | timestamptz | NO | now() | | system | public | no |
| updated_at | timestamptz | NO | now() | trigger-maintained | trigger | public | no |

- PK only; no FKs.
- RLS: **ON**. `Anyone can view active influencer videos` (SELECT, public, `is_active=true`); `Admins can manage influencer videos` (ALL, authenticated, `has_role(...,'admin')`).
- Triggers: `update_influencer_videos_updated_at` (BEFORE UPDATE).
- Storage link: `video_filename` resolves against `influencer-videos` bucket (public); `poster_url` likely a full public URL string, not a bucket-relative path — **[INFERRED]**.
- App files: home page video carousel component (not individually greped by name — inferred from table purpose and `link` default value referencing `/collections/dresses`).
- Row count: **5** [CONFIRMED].
- Confidence: MEDIUM.

---

## 7. order_items
**Purpose**: Line items of an order — one row per product/variant/quantity purchased.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | customer (checkout) | customer/seller | no |
| order_id | uuid | NO | | FK -> orders.id, cascade delete | customer | customer/seller | no |
| product_id | uuid | NO | | FK -> products.id | customer | customer/seller | no |
| variant_id | uuid | YES | | FK -> product_variants.id | customer | customer/seller | no |
| quantity | integer | NO | | must be > 0 (CHECK) | customer | customer/seller | no |
| unit_price | integer | NO | | price at time of purchase, in minor currency units (paise) — **[INFERRED]** | customer | customer/seller | no |
| total_price | integer | NO | | `unit_price * quantity`, **not DB-enforced** (no CHECK/generated column) | customer | customer/seller | no |
| size | text | YES | | denormalized snapshot of chosen size | customer | customer/seller | no |
| color | text | YES | | denormalized snapshot of chosen color | customer | customer/seller | no |
| created_at | timestamptz | YES | now() | | system | customer/seller | no |

- PK: `order_items_pkey`. FKs: `order_id -> orders(id) ON DELETE CASCADE`; `product_id -> products(id)` (no cascade — deleting a product with existing order items will fail/ be blocked, `NO ACTION`); `variant_id -> product_variants(id)` (no cascade).
- Check: `order_items_quantity_check (quantity > 0)`.
- Indexes: PK only — **no index on `order_id` or `product_id`** despite both being FKs and join keys — **[PROPOSED]** add `idx_order_items_order_id`, `idx_order_items_product_id`.
- RLS: **ON**. `Customers can insert order items` (INSERT, public, `WITH CHECK order_id IN (SELECT id FROM orders WHERE customer_id=auth.uid())`); `Sellers can view order items for their orders` (SELECT via join sellers/orders); `Customers can view own order items` (SELECT via orders.customer_id). **No UPDATE/DELETE policy for anyone** — order items are immutable post-creation by RLS design [OBSERVED].
- App files: checkout flow inserts; seller order-detail views; customer order-history views.
- Row count: **0** [CONFIRMED] — no real orders placed yet (pre-launch/demo state).
- Confidence: HIGH.

---

## 8. orders
**Purpose**: Customer orders placed against a single seller (one seller per order — no multi-seller cart splitting at this level).

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | customer | customer/seller | no |
| order_number | text | NO | | human-readable unique order code | customer/app | customer/seller | no |
| customer_id | uuid | NO | | FK -> auth.users(id) | customer | customer/seller | no |
| seller_id | uuid | NO | | FK -> sellers.id | customer | customer/seller | no |
| status | text | NO | 'new' | lifecycle state, CHECK-constrained | customer(create)/seller(update) | customer/seller | no |
| subtotal | integer | NO | | minor-unit amount | customer | customer/seller | no |
| shipping_fee | integer | YES | 0 | | customer | customer/seller | no |
| discount | integer | YES | 0 | | customer/app | customer/seller | no |
| total | integer | NO | | **not DB-computed**, trusted from client/app at insert time | customer | customer/seller | **yes (financial)** |
| tracking_id | text | YES | | courier tracking number | seller | customer/seller | no |
| shipping_carrier | text | YES | | | seller | customer/seller | no |
| shipping_address | jsonb | NO | | full delivery address snapshot (name/phone/address/pincode) | customer | customer/seller | **yes (PII, embedded jsonb — no column-level protection)** |
| created_at | timestamptz | YES | now() | | system | customer/seller | no |
| accepted_at / packed_at / shipped_at / delivered_at / cancelled_at | timestamptz | YES | | status-transition timestamps, **not auto-set by any trigger** — app must set them manually alongside `status` [MISSING trigger] | seller | customer/seller | no |

- PK: `orders_pkey`. Unique: `orders_order_number_key`. FKs: `seller_id -> sellers(id)`; `customer_id -> auth.users(id)`.
- Check: `orders_status_check` — status ∈ `{new, accepted, packed, shipped, delivered, cancelled}`.
- Indexes: `idx_orders_seller_id`, `idx_orders_customer_id`, `idx_orders_status` — well covered.
- RLS: **ON**. `Customers can view own orders` (SELECT, `auth.uid()=customer_id`); `Customers can create orders` (INSERT, `WITH CHECK auth.uid()=customer_id`); `Sellers can view orders for their products` (SELECT via sellers.user_id); `Sellers can update orders for their products` (UPDATE via sellers.user_id, **no WITH CHECK** — a seller can update ANY column including `total`, `shipping_address`, `customer_id` on their own orders, not just `status`) — **[SECURITY-SENSITIVE]** overly broad UPDATE grant, no column-level restriction. Also **no UPDATE policy for customers** (e.g., cannot cancel their own order) and **no DELETE policy for anyone**.
- App files: checkout (`src/hooks` / cart pages), seller order management pages, `razorpay-create-order` / `razorpay-verify-payment` edge functions likely create/update orders around payment [OBSERVED, not line-verified].
- Sensitive: `shipping_address` jsonb contains name/phone/address (PII); `total`/`subtotal` financial data.
- Row count: **0** [CONFIRMED] — no completed checkouts yet.
- Confidence: HIGH.

---

## 9. otp_verifications
**Purpose**: Server-side store for phone-OTP login (used by `send-otp`/`verify-otp` edge functions). Not customer-facing; accessed only via service-role edge functions.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | edge fn (service role) | edge fn | no |
| phone | text | NO | | recipient phone number | edge fn | edge fn | **yes (PII)** |
| otp_hash | text | NO | | SHA-256(otp+phone) hex digest | edge fn | edge fn | **yes (secret material)** |
| expires_at | timestamptz | NO | | 5-minute expiry | edge fn | edge fn | no |
| attempts | integer | YES | | verify attempt counter, max 5 enforced in app logic | edge fn | edge fn | no |
| verified | boolean | YES | | | edge fn | edge fn | no |
| created_at | timestamptz | YES | now() | | system | edge fn | no |

- PK only. No FKs.
- Indexes: `idx_otp_phone`, `idx_otp_expires`.
- RLS: **ON**, but **zero policies exist** for any role (0 rows for this table in the policy dump) — table is reachable **only via service-role key** (edge functions), which bypasses RLS entirely. This is by design per migration comment ("edge functions use service role, no public access needed") but means: **any future client-side/anon-key query against this table always fails-closed** [CONFIRMED safe by default].
- Triggers/functions: `cleanup_expired_otps()` — `SECURITY DEFINER`, `BEFORE INSERT ... FOR EACH STATEMENT`, deletes all rows where `expires_at < now()` on every insert (opportunistic cleanup, not a cron job).
- App files: `supabase/functions/send-otp/index.ts` (insert, rate-limit check, delete old unverified), `supabase/functions/verify-otp/index.ts` (select, hash compare, increment attempts, delete on expiry/max-attempts).
- Sensitive: `phone` (PII), `otp_hash` (hash of a secret — SHA-256 with no salt/pepper beyond phone number is weak against offline brute force since OTP space is only 10^6; mitigated by 5-attempt cap and expiry) — **[SECURITY-SENSITIVE]**.
- Row count: **1** [CONFIRMED] — likely a stale/expired test row not yet cleaned (cleanup only runs on next INSERT).
- Confidence: HIGH.

---

## 10. payouts
**Purpose**: Seller payout/settlement batches referencing a set of paid orders.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | admin/system | seller | no |
| seller_id | uuid | NO | | FK -> sellers.id | admin/system | seller | no |
| amount | integer | NO | | minor-unit payout amount | admin/system | seller | **yes (financial)** |
| order_ids | jsonb | YES | | array of order UUIDs included in this payout — **not an FK-enforced relationship**, just a jsonb array of ids | admin/system | seller | no |
| payout_date | timestamptz | YES | | | admin/system | seller | no |
| processed_at | timestamptz | YES | | | admin/system | seller | no |
| settlement_cycle | text | YES | | e.g. weekly/monthly label | admin/system | seller | no |
| status | text | NO | 'pending' | CHECK-constrained | admin/system | seller | no |
| transaction_reference | text | YES | | bank/gateway reference | admin/system | seller | **yes (financial reference)** |
| created_at | timestamptz | YES | now() | | system | seller | no |

- PK, FK `seller_id -> sellers(id)`. Check: `payouts_status_check` — status ∈ `{pending, processing, completed, failed}`.
- Indexes: PK, `idx_payouts_seller_id`.
- RLS: **ON**. Only policy: `Sellers can view own payouts` (SELECT). **No INSERT/UPDATE/DELETE policy for anyone** ⇒ payouts can only be created/modified via service-role (admin backend or a not-yet-built admin UI) — **[MISSING]** no admin management UI found in `src/pages/admin/*` for payouts.
- App files: seller dashboard payouts view (read-only).
- Sensitive: `amount`, `transaction_reference` (financial).
- Row count: **0** [CONFIRMED].
- Confidence: MEDIUM-HIGH.

---

## 11. product_variants
**Purpose**: Size/color SKU-level variants of a product with independent stock and optional price override.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | seller | public(live products)/seller | no |
| product_id | uuid | NO | | FK -> products.id, cascade delete | seller | public/seller | no |
| size | text | NO | | | seller | public/seller | no |
| color_name | text | NO | | | seller | public/seller | no |
| color_hex | text | YES | | swatch hex code | seller | public/seller | no |
| sku | text | YES | | | seller | public/seller | no |
| stock_quantity | integer | YES | | must be >= 0 (CHECK) | seller | public/seller | no |
| price_override | numeric | YES | | overrides `products.price` for this variant | seller | public/seller | no |
| created_at / updated_at | timestamptz | YES | now() | no trigger confirmed for updated_at | seller | seller | no |

- PK. FK: `product_id -> products(id) ON DELETE CASCADE`. Unique composite: `product_variants_product_id_size_color_name_key (product_id, size, color_name)` — enforces one row per size/color combo per product. Check: `stock_quantity >= 0`.
- Indexes: PK, unique composite, `idx_product_variants_product_id`.
- RLS: **ON**. `Sellers can manage own product variants` (ALL, via products→sellers join on `sellers.user_id=auth.uid()`); `Anyone can view variants of live products` (SELECT, via products where `status='live' AND is_available=true`).
- App files: seller product edit forms; PDP size/color selectors; `order_items.variant_id` references this table.
- Row count: **0** [CONFIRMED] — despite 36 products existing, no variant rows exist yet: either products don't use variants yet or variant creation UI is unused/incomplete — **[OBSERVED anomaly]**.
- Confidence: HIGH.

---

## 12. products
**Purpose**: Central product catalog. Can be owned by a `designer`, a `vendor`, or a `seller` (three parallel ownership models coexist) — see `41_DATABASE_RELATIONSHIPS.md` for the orphan-risk analysis.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | seller/admin | public(live)/seller/admin | no |
| title | text | NO | | | seller | public | no |
| description | text | YES | | | seller | public | no |
| short_description | text | YES | | | seller | public | no |
| category | text | NO | | free-text category label (legacy/primary) | seller | public | no |
| category_id | uuid | YES | | FK -> categories.id (newer, optional, parallel taxonomy) | seller | public | no |
| price | numeric | NO | | current selling price | seller | public | no |
| original_price | numeric | YES | | MRP/strike-through price | seller | public | no |
| images | jsonb | YES | | array of image URLs | seller | public | no |
| colors | jsonb | YES | | array of color option strings/objects (legacy denorm; overlaps with `product_variants`) | seller | public | no |
| sizes | jsonb | YES | | array of size options (legacy denorm; overlaps with `product_variants`) | seller | public | no |
| occasion_tags | jsonb | YES | | array of tag strings | seller | public | no |
| style_tags | jsonb | YES | | array of tag strings | seller | public | no |
| fabric | text | YES | | | seller | public | no |
| material | text | YES | | | seller | public | no |
| care_instructions | text | YES | | | seller | public | no |
| is_available | boolean | YES | | in-stock/visibility toggle | seller | public | no |
| is_made_to_order | boolean | YES | | | seller | public | no |
| is_returnable | boolean | YES | | | seller | public | no |
| dispatch_days | integer | YES | | | seller | public | no |
| status | text | YES | | moderation/lifecycle state | seller(create)/admin(moderate) | public(if live)/seller/admin | no |
| rejection_reason | text | YES | | admin feedback on rejection | admin | seller | no |
| designer_id | uuid | YES | | FK -> designers.id, ON DELETE CASCADE | admin | public | no |
| vendor_id | uuid | YES | | FK -> vendors.id, ON DELETE CASCADE | admin | public | no |
| seller_id | uuid | YES | | FK -> sellers.id (no cascade specified ⇒ NO ACTION) | seller | public/seller | no |
| created_at / updated_at | timestamptz | YES | now() | updated_at trigger-maintained | system/trigger | public | no |

- PK: `products_pkey`. Checks: `products_status_check` — status ∈ `{draft, submitted, under_review, live, rejected, disabled}`; `product_must_have_owner` — `designer_id IS NOT NULL OR vendor_id IS NOT NULL OR seller_id IS NOT NULL` (business rule: every product must have at least one owner type; does **not** prevent a product having 2 or 3 owners simultaneously — see orphan-risk in doc 41).
- Indexes: `idx_products_category`, `idx_products_is_available`, `idx_products_price`, `idx_products_seller_id`, `idx_products_status`, `idx_products_designer_id`. **No index on `vendor_id` or `category_id`** — [PROPOSED] add both.
- RLS: **ON**. `Admins can manage all products` (ALL, `has_role(...,'admin')`); `Anyone can view live products` (SELECT, `status='live' AND is_available=true`); `Sellers can view own products` (SELECT via sellers.user_id); `Sellers can insert own products` (INSERT WITH CHECK via sellers.user_id); `Sellers can update own products` (UPDATE via sellers.user_id, **no WITH CHECK** — seller could flip `status` to `'live'` themselves bypassing admin moderation) — **[SECURITY-SENSITIVE]**; `Sellers can delete own products` (DELETE via sellers.user_id).
- Triggers: `update_products_updated_at` (BEFORE UPDATE).
- App files: `src/lib/mcp/tools/search-products.ts`, `src/lib/mcp/tools/get-product.ts`, `src/hooks/useDesignerProducts.ts`, `src/pages/Collections.tsx`, `src/pages/ProductDetail.tsx`, `src/pages/seller/SellerAddProduct.tsx`, `src/pages/admin/AdminProducts.tsx`, `src/pages/admin/AdminApprovals.tsx`, `src/pages/seller/SellerProducts.tsx`, `src/components/seller-dashboard/pages/DashboardAddProduct.tsx`, `src/components/seller-dashboard/pages/DashboardProducts.tsx`.
- Sensitive: none directly (no PII), but `rejection_reason` may contain internal admin notes.
- Row count: **36** [CONFIRMED].
- Confidence: HIGH.

---

## 13. profiles
**Purpose**: 1:1 extension of `auth.users` holding app-level profile/contact/location data; auto-created by `handle_new_user()` trigger on signup.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | | PK = FK -> auth.users(id) ON DELETE CASCADE | trigger(insert)/user(update) | self | no |
| name | text | YES | | | trigger/user | self | **yes (PII)** |
| phone | text | YES | | unique | trigger/user | self | **yes (PII)** |
| email | text | YES | | | trigger/user | self | **yes (PII)** |
| avatar_url | text | YES | | | trigger/user | self | no |
| city / state / country / pincode | text | YES | | | user | self | **yes (location PII)** |
| latitude / longitude | numeric | YES | | geolocation (from `ip-geolocation` fn likely) | user/system | self | **yes (precise location)** |
| is_onboarded | boolean | YES | false | onboarding-flow flag | user/trigger | self | no |
| created_at / updated_at | timestamptz | YES | now() | trigger-maintained updated_at | system/trigger | self | no |

- PK/FK: `profiles_id_fkey (id) -> auth.users(id) ON DELETE CASCADE`. Unique: `profiles_phone_key (phone)`.
- Indexes: PK, unique(phone).
- RLS: **ON**. `Users can view own profile`, `Users can update own profile`, `Users can insert own profile` — all `auth.uid() = id`. No admin override policy — **[OBSERVED]** admins cannot view other users' profiles via RLS directly (must use service role, e.g. in `AdminSellers.tsx` join or a server-side function).
- Triggers/functions: `on_auth_user_created` (AFTER INSERT ON `auth.users`) → `handle_new_user()` (SECURITY DEFINER) inserts a profiles row, populating name/phone/email/avatar_url from `raw_user_meta_data`/OAuth, with `is_onboarded=false`, using `ON CONFLICT (id) DO UPDATE` (idempotent upsert — handles OAuth re-auth or race with manual insert). Also `update_profiles_updated_at` trigger.
- App files: `src/contexts/AuthContext.tsx` and most authenticated pages/hooks.
- Sensitive: name/phone/email/city/state/pincode/lat/long — substantial PII surface, but access is self-scoped only.
- Row count: **17** [CONFIRMED] — should roughly track `auth.users` count (managed schema, not independently verifiable here).
- Confidence: HIGH.

---

## 14. seller_applications
**Purpose**: Public-facing seller-onboarding application form (distinct from `sellers` table and from `brand_waitlist_applications`; this is the more detailed apply flow, e.g. `SellerApply.tsx`/`JoinUs.tsx`).

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | anon | admin | no |
| full_name | text | NO | | | anon | admin | **yes (PII)** |
| brand_name | text | NO | | | anon | admin | no |
| email | text | NO | | | anon | admin | **yes (PII)** |
| phone | text | NO | | | anon | admin | **yes (PII)** |
| city | text | NO | | | anon | admin | no |
| category | text | NO | | | anon | admin | no |
| portfolio_link | text | YES | | | anon | admin | no |
| sample_images | jsonb | YES | `'[]'` | array of uploaded sample image URLs (uploaded to `product-images` bucket per `SellerApply.tsx`/`JoinUs.tsx`) | anon | admin | no |
| status | text | NO | 'pending' | application review status | anon(create,'pending' only)/admin(update) | admin | no |
| created_at | timestamptz | NO | now() | | system | admin | no |

- PK only. No FKs (does not link to `sellers` even after approval — approval is a manual admin action creating a separate `sellers` row, **not** an automated conversion) — **[OBSERVED]**.
- RLS: **ON**. `Anyone can submit application` (INSERT, `anon,authenticated`, `WITH CHECK true`); `Admins can view applications` (SELECT, authenticated, admin); `Admins can update applications` (UPDATE, authenticated, admin). No DELETE policy.
- App files: `src/pages/SellerApply.tsx`, `src/pages/JoinUs.tsx` (insert + image upload), admin review UI (not explicitly greped, likely `src/pages/admin/AdminSellers.tsx` or a dedicated approvals page like `AdminApprovals.tsx` which is confirmed used for `products`; seller_applications approval UI not confirmed — **[MISSING/UNKNOWN]** exact admin page).
- Sensitive: full_name/email/phone (PII).
- Row count: **12** [CONFIRMED].
- Confidence: MEDIUM-HIGH.

---

## 15. sellers
**Purpose**: Approved seller/merchant accounts (1:1 with an `auth.users` row), holding storefront profile + banking/tax details.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | user | self/admin | no |
| user_id | uuid | NO | | FK -> auth.users(id) ON DELETE CASCADE, unique (1:1) | user(insert)/self | self/admin | no |
| brand_name | text | NO | | | self | public(indirect via products)/self/admin | no |
| city | text | NO | | | self | self/admin | no |
| seller_type | text | NO | | CHECK ∈ `{independent_designer, studio_owner}` | self | self/admin | no |
| description | text | YES | | | self | self/admin | no |
| instagram_handle | text | YES | | | self | self/admin | no |
| profile_image / banner_image | text | YES | | | self | self/admin | no |
| gstin | text | YES | | GST tax ID | self | self/admin | **yes (tax ID — do not expose value)** |
| pan_number | text | YES | | PAN tax ID | self | self/admin | **yes (tax ID — do not expose value)** |
| bank_account_number | text | YES | | | self | self/admin | **yes (bank detail — critical)** |
| bank_ifsc | text | YES | | | self | self/admin | **yes (bank detail)** |
| bank_name | text | YES | | | self | self/admin | no (low-sensitivity alone) |
| application_status | text | NO | | CHECK ∈ `{pending, approved, rejected}` | self(create='pending')/admin(update) | self/admin/public(indirectly gates product visibility) | no |
| is_verified | boolean | YES | | admin verification flag, set true alongside `application_status='approved'` in `AdminSellers.tsx` | admin | self/admin | no |
| is_active | boolean | YES | | | admin | self/admin | no |
| created_at / updated_at | timestamptz | YES | now() | | system | self/admin | no |

- PK. FK `user_id -> auth.users(id) ON DELETE CASCADE`. Unique `sellers_user_id_key (user_id)`.
- RLS: **ON**. `Sellers can view own profile` (SELECT, `auth.uid()=user_id`); `Sellers can update own profile` (UPDATE, `auth.uid()=user_id`, **no WITH CHECK** — a seller can update their own `application_status`, `is_verified`, and bank fields with no restriction since the policy applies to ALL columns) — **[SECURITY-SENSITIVE / privilege-escalation risk]**: a seller could self-approve (`application_status='approved'`, `is_verified=true`) via a direct PATCH call, since RLS only checks row ownership, not which columns changed; `Admins can manage all sellers` (ALL, admin); `Users can insert seller application` (INSERT, `WITH CHECK auth.uid()=user_id`).
- App files: `src/pages/admin/AdminSellers.tsx` (admin approve action sets `application_status:'approved', is_verified:true`), `src/pages/seller/SellerSettings.tsx` (displays `application_status`), `src/contexts/AuthContext.tsx` references `application_status:'approved'` (context/demo?).
- Sensitive: `gstin`, `pan_number`, `bank_account_number`, `bank_ifsc` — high-sensitivity financial/tax PII, protected only by row-ownership RLS (self + admin), no extra column masking.
- Row count: **1** [CONFIRMED].
- Confidence: HIGH.

---

## 16. support_tickets
**Purpose**: Seller-raised support/help-desk tickets, optionally tied to an order and/or product.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | seller | seller | no |
| seller_id | uuid | NO | | FK -> sellers.id | seller | seller | no |
| subject | text | NO | | | seller | seller | no |
| description | text | NO | | | seller | seller | no |
| status | text | NO | 'open' | CHECK ∈ `{open, in_progress, resolved}` | seller(create)/? (no admin/support-role update path visible) | seller | no |
| order_id | uuid | YES | | FK -> orders.id | seller | seller | no |
| product_id | uuid | YES | | FK -> products.id | seller | seller | no |
| created_at / updated_at | timestamptz | YES | now() | | system | seller | no |

- RLS: **ON**. `Sellers can view own tickets`, `Sellers can create tickets`, `Sellers can update own tickets` — all scoped to own `seller_id`. **No admin/support-staff SELECT or UPDATE policy at all** — **[SECURITY-SENSITIVE / functional gap]**: with no `admin` role in the app_role enum having explicit ticket-management rights beyond nothing, support tickets are effectively invisible to anyone except the filing seller unless read via service role.
- App files: not individually greped; presumed seller-dashboard support page.
- Row count: **0** [CONFIRMED].
- Confidence: MEDIUM.

---

## 17. tryon_history
**Purpose**: Stores results of the AI virtual try-on feature (model photo + product photo → generated composite image).

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | user/edge fn | self | no |
| user_id | uuid | YES | | FK -> auth.users(id), **nullable** (allows anonymous try-on history?) | user | self | no |
| model_image_url | text | NO | | URL of uploaded user/model photo, stored in `tryon-images` bucket | user | self | **yes (personal photo)** |
| product_image_url | text | NO | | source product image | system | self | no |
| result_image_url | text | NO | | AI-generated composite | edge fn (`virtual-tryon`) | self | **yes (personal photo, derived)** |
| model_name / product_name | text | YES | | display labels | user | self | no |
| created_at | timestamptz | YES | now() | | system | self | no |

- PK. FK `user_id -> auth.users(id)` (no ON DELETE specified ⇒ NO ACTION — **[SECURITY-SENSITIVE minor]** orphaned rows possible if a user's auth row could otherwise be deleted independent of cascade elsewhere, though `profiles` cascades; this FK does not).
- Indexes: `idx_tryon_history_user_id`, `idx_tryon_history_created_at DESC` (supports "recent history" queries).
- RLS: **ON**. `Users can view their own try-on history`, `insert their own`, `delete their own` — all `auth.uid()=user_id`. Because `user_id` is nullable and not enforced by WITH CHECK to be non-null, **[SECURITY-SENSITIVE]**: a row with `user_id IS NULL` matches none of these policies (`auth.uid() = NULL` is never true) — such rows become permanently inaccessible via RLS to everyone except service role; also nothing stops an authenticated request from inserting `user_id = NULL` and effectively "hiding" a row from itself/others (self-inflicted, low impact) or, if the app ever trusted client-supplied `user_id`, from writing into another user's history without a WITH CHECK... but WITH CHECK here *is* `auth.uid()=user_id`, so that specific IDOR is blocked.
- App files: `src/hooks/useVirtualTryOn.ts` (upload to storage + insert), `supabase/functions/virtual-tryon/index.ts`.
- Sensitive: personal photos (model images) — biometric/personal-likeness data, publicly reachable if the `tryon-images` bucket is public (see doc 46) even though the DB row is private — **[SECURITY-SENSITIVE]** URL alone may allow unauthenticated viewing.
- Row count: **5** [CONFIRMED].
- Confidence: HIGH.

---

## 18. user_addresses
**Purpose**: Customer saved shipping addresses (multiple per user, one may be default).

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | user | self | no |
| user_id | uuid | NO | | (no FK constraint listed in dump to auth.users — **[OBSERVED gap]**, unlike `profiles`/`sellers`/`orders`) | user | self | no |
| full_name | text | NO | | | user | self | **yes (PII)** |
| mobile | text | NO | | | user | self | **yes (PII)** |
| pincode | text | NO | | | user | self | no |
| address_line | text | NO | | | user | self | **yes (PII)** |
| city / state | text | NO | | | user | self | no |
| landmark | text | YES | | | user | self | **yes (PII)** |
| address_type | text | YES | 'home' | CHECK ∈ `{home, work}` | user | self | no |
| is_default | boolean | YES | false | **no partial-unique constraint** ensuring only one default per user — [PROPOSED] | user | self | no |
| created_at / updated_at | timestamptz | YES | now() | trigger-maintained updated_at | system/trigger | self | no |

- PK only; **`user_id` has no declared FK constraint** in the CONSTRAINTS dump — **[SECURITY-SENSITIVE/DATA-INTEGRITY]** unlike other user-owned tables, referential integrity to `auth.users` is not DB-enforced here (relies entirely on RLS + app correctness).
- Check: `user_addresses_address_type_check`.
- RLS: **ON**. Full CRUD scoped to `auth.uid() = user_id` (SELECT/INSERT/UPDATE/DELETE all present).
- Triggers: `update_user_addresses_updated_at`.
- App files: checkout address book, profile/address management pages.
- Row count: **5** [CONFIRMED].
- Confidence: HIGH.

---

## 19. user_roles
**Purpose**: Role-based access control table (separate from `profiles` by design — standard Supabase pattern to avoid privilege escalation via a self-editable `profiles.role` column).

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | admin | self/admin | no |
| user_id | uuid | NO | | FK -> auth.users(id) ON DELETE CASCADE | admin | self/admin | no |
| role | app_role | NO | | enum: consumer/seller/admin | admin | self/admin | **yes (authorization-critical)** |
| created_at | timestamptz | YES | now() | | system | self/admin | no |

- PK. FK `user_roles_user_id_fkey (user_id) -> auth.users(id) ON DELETE CASCADE`. Unique composite `user_roles_user_id_role_key (user_id, role)` — a user may hold multiple distinct roles but not duplicate the same role twice.
- Indexes: PK, unique composite, `idx_user_roles_user_id`.
- RLS: **ON**. `Users can view own roles` (SELECT, `auth.uid()=user_id`); `Admins can manage all roles` (ALL, admin). **No self-INSERT policy** — a user cannot grant themselves any role via the client (good) — new-signup default role assignment (if any) must happen via `handle_new_user()` or service role, but `handle_new_user()` (as captured) only inserts into `profiles`, **not** `user_roles` — **[OBSERVED]** meaning new users get **no row in `user_roles`** by default; `has_role()` checks would return false for everyone until an admin explicitly grants a role. Row count of 0 confirms this.
- Functions touching it: `has_role(_user_id uuid, _role app_role) RETURNS boolean` — used pervasively across policies as `public.has_role(auth.uid(), 'admin')`. **Its SQL source is not present in the tracked migration files** [MISSING: source DDL] — by strong convention (Supabase Lovable default pattern) it is `SECURITY DEFINER STABLE` and does `SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)`; this is an **[INFERRED]**, not confirmed, definition — see doc 43.
- App files: gate logic in `AuthContext.tsx` / admin route guards (role checks likely also duplicated in front-end for UX, backed by RLS for real enforcement).
- Row count: **0** [CONFIRMED] — **[SECURITY-SENSITIVE finding]**: with 0 rows, no user currently holds the `admin` role at the DB level; any admin-only UI currently gated purely client-side (e.g., checking a hardcoded email or a `profiles` flag) would be **spoofable**, while true `has_role()`-gated RLS policies are simply inaccessible to everyone right now. This also means the "1 seller" row's approval flow shown in `AdminSellers.tsx` cannot actually be performed by anyone through RLS in the current data state, unless the acting user is queried via `auth.uid()` matching an admin JWT claim outside this table, or admin actions go through a service-role edge function/admin panel not captured here.
- Confidence: HIGH (schema/policy), MEDIUM (interpretation of admin-provisioning gap).

---

## 20. vendors
**Purpose**: Third "owner" type for products — appears to represent bulk/wholesale or platform-managed brand storefronts distinct from designer/seller.

| Column | Type | Null | Default | Semantics | Writers | Readers | Sensitive |
|---|---|---|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK | admin | public | no |
| name | text | NO | | | admin | public | no |
| slug | text | NO | | unique | admin | public | no |
| logo | text | YES | | | admin | public | no |
| banner_image | text | YES | | | admin | public | no |
| description | text | YES | | | admin | public | no |
| is_active | boolean | YES | true | | admin | public | no |
| created_at / updated_at | timestamptz | NO | now() | trigger-maintained | system/trigger | public | no |

- PK, unique `vendors_slug_key`.
- RLS: **ON**. `Admins can manage vendors` (ALL, admin); `Anyone can view vendors` (SELECT, `true` — no `is_active` filter, unlike `categories`/`influencer_videos`) — **[OBSERVED inconsistency]** inactive vendors remain publicly visible/queryable.
- Triggers: `update_vendors_updated_at`.
- App files: `products.vendor_id` FK; vendor storefront pages (not individually greped).
- Row count: **3** [CONFIRMED].
- Confidence: HIGH.

---

## Cross-table summary table

| Table | Rows | RLS | Policies | PK | FKs out | Sensitive cols |
|---|---|---|---|---|---|---|
| brand_waitlist_applications | 1 | ON | 2 | id | — | phone |
| categories | 8 | ON | 1 | id | parent_id→categories | — |
| delivery_zones | 20 | ON | 1 | id | — | — |
| designers | 9 | ON | 2 | id | — | contact_number, email |
| discounts | 2 | ON | 2 | id | seller_id→sellers | — |
| influencer_videos | 5 | ON | 2 | id | — | — |
| order_items | 0 | ON | 3 | id | order_id→orders, product_id→products, variant_id→product_variants | — |
| orders | 0 | ON | 4 | id | seller_id→sellers, customer_id→auth.users | shipping_address, total |
| otp_verifications | 1 | ON | 0 | id | — | phone, otp_hash |
| payouts | 0 | ON | 1 | id | seller_id→sellers | amount, transaction_reference |
| product_variants | 0 | ON | 2 | id | product_id→products | — |
| products | 36 | ON | 6 | id | category_id→categories, designer_id→designers, seller_id→sellers, vendor_id→vendors | — |
| profiles | 17 | ON | 3 | id | id→auth.users | name, phone, email, location |
| seller_applications | 12 | ON | 3 | id | — | full_name, email, phone |
| sellers | 1 | ON | 4 | id | user_id→auth.users | gstin, pan_number, bank_* |
| support_tickets | 0 | ON | 3 | id | seller_id→sellers, order_id→orders, product_id→products | — |
| tryon_history | 5 | ON | 3 | id | user_id→auth.users | model_image_url, result_image_url |
| user_addresses | 5 | ON | 4 | id | (none declared) | full_name, mobile, address_line, landmark |
| user_roles | 0 | ON | 2 | id | user_id→auth.users | role |
| vendors | 3 | ON | 2 | id | — | — |

Total live policy count from dump: **50** [CONFIRMED, "(50 rows)" footer].

# 41 — Database Relationship Graph

## ASCII ER overview
```text
auth.users (managed)
  ├─1:1─ profiles(id)
  ├─1:1─ sellers(user_id)
  ├─1:N─ user_roles(user_id)
  ├─1:N─ orders(customer_id)
  └─1:N─ tryon_history(user_id, nullable, no FK cascade)

categories(parent_id) ──self-FK──> categories(id)          [tree]
categories(id) <──(category_id, optional)── products

designers(id) <──CASCADE── products(designer_id)
vendors(id)   <──CASCADE── products(vendor_id)
sellers(id)   <──(no cascade)── products(seller_id)
   [products.CHECK product_must_have_owner: designer_id OR vendor_id OR seller_id NOT NULL]

sellers(id) ──CASCADE──> discounts(seller_id)
sellers(id) ────────────> orders(seller_id)
sellers(id) ────────────> payouts(seller_id)
sellers(id) ────────────> support_tickets(seller_id)

products(id) ──CASCADE──> product_variants(product_id)
products(id) ────────────> order_items(product_id)
products(id) ────────────> support_tickets(product_id, nullable)

orders(id) ──CASCADE──> order_items(order_id)
orders(id) ────────────> support_tickets(order_id, nullable)
product_variants(id) ──> order_items(variant_id, nullable)

[UNDECLARED / implicit relationships — not enforced by FK]
products.category (text)        ~~~ categories.slug|name   (string match, not FK)
products.images (jsonb[])       ~~~ storage.objects (product-images bucket URLs)
products.colors/sizes (jsonb)   ~~~ product_variants (color_name/size) — parallel/duplicate data models
products.occasion_tags/style_tags (jsonb) ~~~ free-form tag strings, no taxonomy table
orders.shipping_address (jsonb) ~~~ user_addresses (no FK; snapshot copy, may diverge)
payouts.order_ids (jsonb array) ~~~ orders.id (array of UUIDs, no FK enforcement)
designers.product_images / profile_image / banner_image ~~~ external/unsplash + storage URLs (not scoped to any bucket)
influencer_videos.video_filename ~~~ storage 'influencer-videos' bucket object name
tryon_history.model_image_url / result_image_url ~~~ storage 'tryon-images' bucket object name
seller_applications.sample_images (jsonb) ~~~ storage 'product-images' bucket (per SellerApply.tsx upload path)
sellers <-> seller_applications: NO FK/link at all. Approval is a manual, disconnected admin action
  creating a new `sellers` row; the two tables never reference each other.
razorpay-create-order / razorpay-verify-payment edge functions <-> Razorpay external API "order" objects,
  referenced only by orders.tracking_id/shipping_carrier style free fields (no dedicated payment table found — [MISSING] payments/transactions table)
```

## Explicit FK inventory (`table.column -> table.column`)

| FK | Cardinality | ON DELETE | Notes |
|---|---|---|---|
| categories.parent_id -> categories.id | 1(parent)–N(children) | NO ACTION | self-referencing tree |
| products.category_id -> categories.id | N–1 | NO ACTION | optional, parallel to products.category text |
| products.designer_id -> designers.id | N–1 | CASCADE | deleting a designer deletes all their products |
| products.vendor_id -> vendors.id | N–1 | CASCADE | deleting a vendor deletes all their products |
| products.seller_id -> sellers.id | N–1 | NO ACTION | deleting a seller blocked while products exist (or leaves FK violation risk) |
| product_variants.product_id -> products.id | N–1 | CASCADE | |
| order_items.order_id -> orders.id | N–1 | CASCADE | |
| order_items.product_id -> products.id | N–1 | NO ACTION | |
| order_items.variant_id -> product_variants.id | N–1 (nullable) | NO ACTION | |
| orders.seller_id -> sellers.id | N–1 | NO ACTION | |
| orders.customer_id -> auth.users.id | N–1 | NO ACTION | |
| discounts.seller_id -> sellers.id | N–1 | CASCADE | |
| payouts.seller_id -> sellers.id | N–1 | NO ACTION | |
| support_tickets.seller_id -> sellers.id | N–1 | NO ACTION | |
| support_tickets.order_id -> orders.id | N–1 (nullable) | NO ACTION | |
| support_tickets.product_id -> products.id | N–1 (nullable) | NO ACTION | |
| profiles.id -> auth.users.id | 1–1 | CASCADE | |
| sellers.user_id -> auth.users.id | 1–1 | CASCADE | unique(user_id) |
| user_roles.user_id -> auth.users.id | N–1 (unique per role) | CASCADE | |
| tryon_history.user_id -> auth.users.id | N–1 (nullable) | NO ACTION | |
| orders.customer_id, sellers.user_id, order_items.* etc | — | — | see table above |

`user_addresses.user_id` has **no declared FK** to `auth.users` — relationship is implicit/app-enforced only [OBSERVED gap].

## Orphan-risk relationships

1. **products with multiple owners simultaneously** — the CHECK constraint `product_must_have_owner` only requires *at least one* of `designer_id`/`vendor_id`/`seller_id`; nothing prevents a product having all three set, which every RLS policy and every frontend query must then correctly disambiguate (which owner "wins" for display/permissions is app logic, not DB-enforced). **[SECURITY-SENSITIVE / data-integrity]**: a product with both `seller_id=A` and `designer_id=B` set would pass `Sellers can update own products` for seller A even if conceptually it should be a curated/admin-only designer product.
2. **products.seller_id has no ON DELETE behavior** — deleting a `sellers` row while products reference it will raise a FK violation (blocks seller deletion) unless application deletes/reassigns products first. No CASCADE, no SET NULL.
3. **order_items.product_id / variant_id have NO ACTION** — a product or variant can never be deleted once ordered (protects order history, but also means soft-delete/status flags are the only viable removal path — consistent with `products.status='disabled'`).
4. **orders.shipping_address is a jsonb snapshot, not linked to `user_addresses`** — if a user edits/deletes their address book entry, historical orders are unaffected (good for audit) but there is no way to trace an order back to a specific saved address row.
5. **payouts.order_ids (jsonb array) is unenforced** — IDs referenced there could point to non-existent or already-modified orders; no trigger validates membership, no join possible without app-side parsing.
6. **tryon_history.user_id nullable with no ON DELETE** — rows with NULL user_id are RLS-orphaned (inaccessible to any authenticated user); rows with non-null user_id are not cleaned up if the user is later deleted from auth.users (no CASCADE declared, unlike profiles/sellers/user_roles).
7. **seller_applications ↔ sellers disconnection** — no FK/shared key; an "approved" application and its corresponding `sellers` row are two independent objects correlated only by matching name/email/phone in admin's head — **[SECURITY-SENSITIVE / process-integrity]** duplicate or inconsistent seller records are possible.
8. **user_addresses.user_id unconstrained** — could reference a non-existent user id with no DB-level rejection (though RLS `auth.uid()=user_id` limits practical exploitation to the acting user's own id).
