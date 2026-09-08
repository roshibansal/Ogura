import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

// Deterministic pricing, mirroring normalizeCatalogPrice() in
// src/lib/adapters/productAdapter.ts. The server never trusts the browser about
// money, so it recomputes the charge from the catalogue — which means these
// bands must stay identical to the client's, or the amount taken at checkout
// will not match the price the customer saw.
//
//   Lehengas, Sarees              4,400 - 5,400
//   Indo-Western, Indian Co-ords  2,400 - 3,400
//   Everything else               1,900 - 3,400
const PRICE_BANDS: Record<string, number[]> = {
  Lehengas: [4399, 4599, 4699, 4899, 4999, 5199, 5299, 5399],
  Sarees: [4399, 4599, 4699, 4899, 4999, 5199, 5299, 5399],
  "Indo-Western": [2399, 2599, 2699, 2899, 2999, 3199, 3299, 3399],
  "Indian Co-ords": [2399, 2599, 2699, 2899, 2999, 3199, 3299, 3399],
};

const DEFAULT_BAND = [1899, 1999, 2099, 2199, 2299, 2399, 2599, 2799, 2999, 3199, 3399];

function mapCategoryToBand(rawCategory?: string | null): number[] {
  const c = (rawCategory || "").toLowerCase().trim();
  if (c.includes("lehenga") || c.includes("ghagra")) return PRICE_BANDS.Lehengas;
  if (c.includes("saree") || c.includes("sari")) return PRICE_BANDS.Sarees;
  if (c.includes("indo-western") || c.includes("indowestern") || c.includes("fusion")) {
    return PRICE_BANDS["Indo-Western"];
  }
  if (
    c.includes("indian co-ord") || c.includes("kurta set") ||
    c.includes("ethnic set") || c.includes("anarkali set") ||
    c.includes("co-ord") || c.includes("coord")
  ) {
    // "western co-ord" is priced with everything else.
    if (c.includes("western co-ord") || c.includes("pant suit")) return DEFAULT_BAND;
    return PRICE_BANDS["Indian Co-ords"];
  }
  return DEFAULT_BAND;
}

function getAuthoritativeSamplePrice(
  rawPrice?: number | null,
  idOrTitle?: string | number | null,
  category?: string | null
): number {
  const str = String(idOrTitle || rawPrice || "item");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const band = mapCategoryToBand(category);
  return band[Math.abs(hash) % band.length];
}


    // Client-supplied amount is explicitly discarded to enforce server financial authority
    const { currency = 'INR', receipt, notes, items, customer_id, shipping_address, discount_code } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must contain at least one item' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database service credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const productIds = items.map((it: any) => it.product_id).filter(Boolean);

    // Reconstruct authoritative charge from database
    const { data: dbProducts, error: dbErr } = await supabase
      .from('products')
      .select('id, title, price, is_available, category')
      .in('id', productIds);

    if (dbErr || !dbProducts || dbProducts.length === 0) {
      console.error('[CreateOrder] Failed to query products from database:', dbErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to validate order products against catalog' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const dbMap = new Map<string, any>(dbProducts.map((p: any) => [p.id, p]));

    let computedSubtotal = 0;
    for (const it of items) {
      const dbProd = dbMap.get(it.product_id);
      if (!dbProd) {
        return new Response(
          JSON.stringify({ success: false, error: `Product ${it.product_id} not found in catalog` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      if (dbProd.is_available === false) {
        return new Response(
          JSON.stringify({ success: false, error: `Product ${dbProd.title || it.product_id} is currently unavailable` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const authoritativeUnitPrice = getAuthoritativeSamplePrice(dbProd.price, dbProd.id || dbProd.title, dbProd.category);
      const qty = Math.max(1, parseInt(it.quantity) || 1);
      computedSubtotal += authoritativeUnitPrice * qty;
    }

    // Delivery is free across the catalogue today. Deriving it here rather than
    // from `notes` means a tampered client cannot invent a negative fee.
    const deliveryFee = 0;

    // The client sends a discount CODE, never an amount. The value is looked up
    // and revalidated here, because `notes.discount` is attacker-controlled: a
    // forged request could otherwise claim a discount equal to the whole basket
    // and check out a 12,000 rupee piece for the price of the delivery fee.
    let discount = 0;
    if (discount_code) {
      const { data: promo } = await supabase
        .from('discounts')
        .select('code, type, value, status, min_purchase, usage_limit, usage_count')
        .eq('code', String(discount_code).trim().toUpperCase())
        .eq('status', 'active')
        .maybeSingle();

      const usable =
        promo &&
        (!promo.usage_limit || (promo.usage_count ?? 0) < promo.usage_limit) &&
        (!promo.min_purchase || computedSubtotal >= promo.min_purchase);

      if (usable) {
        if (promo.type === 'free_shipping') {
          discount = deliveryFee;
        } else if (String(promo.type).includes('percentage')) {
          discount = Math.round(computedSubtotal * (Number(promo.value) / 100));
        } else {
          discount = Math.min(Number(promo.value), computedSubtotal);
        }
      } else {
        console.warn('[CreateOrder] Discount code rejected server-side:', discount_code);
      }
    }

    // Never let a discount reduce the charge below a real payable amount.
    discount = Math.min(Math.max(0, discount), computedSubtotal);
    const finalChargeAmount = computedSubtotal + deliveryFee - discount;

    if (!finalChargeAmount || finalChargeAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid order amount after server calculation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Razorpay expects amount in paise (smallest currency unit)
    const amountInPaise = Math.round(finalChargeAmount * 100);

    const orderPayload = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    // Create order via Razorpay API
    const authHeader = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[CreateOrder] Razorpay order creation failed:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: errorData.error?.description || 'Failed to create order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const orderData = await response.json();

    // Persist pre-payment checkout session snapshot for asynchronous webhook recovery
    try {
      await supabase
        .from('payment_orders')
        .insert({
          razorpay_order_id: orderData.id,
          customer_id: customer_id || notes?.customer_id || null,
          items: items,
          subtotal: computedSubtotal,
          shipping_fee: deliveryFee,
          discount: discount,
          total: finalChargeAmount,
          currency: orderData.currency || currency,
          shipping_address: shipping_address || null,
          status: 'created',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      console.log(`[CreateOrder] Saved payment_orders session snapshot for Razorpay order ${orderData.id}`);
    } catch (snapErr: any) {
      console.warn('[CreateOrder] payment_orders session snapshot notice:', snapErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        key_id: RAZORPAY_KEY_ID, // Public key for frontend
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CreateOrder] Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
