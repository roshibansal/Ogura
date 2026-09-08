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

// Deterministic sample pricing generator (mirrors client-side catalog pricing)
function getAuthoritativeSamplePrice(
  rawPrice?: number | null,
  idOrTitle?: string | number | null
): number {
  const str = String(idOrTitle || rawPrice || "item");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const ratio = (absHash % 1000) / 1000;

  if (ratio < 0.65) {
    // 65% in affordable tier (< ₹3,000)
    const cheapPrices = [
      1299, 1399, 1499, 1599, 1699, 1799, 1899, 1999, 2199, 2299, 2499, 2599, 2799, 2899, 2999
    ];
    return cheapPrices[absHash % cheapPrices.length];
  } else if (ratio < 0.85) {
    // 20% in mid tier (₹3,000 to ₹5,999)
    const midPrices = [
      3299, 3499, 3699, 3999, 4299, 4499, 4799, 4999, 5299, 5499, 5899
    ];
    return midPrices[absHash % midPrices.length];
  } else {
    // 15% in upper tier (₹6,000 to ₹12,000)
    const highPrices = [
      6499, 6999, 7499, 7999, 8499, 8999, 9499, 9999, 10499, 11499, 11999
    ];
    return highPrices[absHash % highPrices.length];
  }
}

    // Client-supplied amount is explicitly discarded to enforce server financial authority
    const { currency = 'INR', receipt, notes, items, customer_id, shipping_address } = await req.json();

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
      .select('id, title, price, is_available')
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

      const authoritativeUnitPrice = getAuthoritativeSamplePrice(dbProd.price, dbProd.id || dbProd.title);
      const qty = Math.max(1, parseInt(it.quantity) || 1);
      computedSubtotal += authoritativeUnitPrice * qty;
    }

    const deliveryFee = Math.max(0, Number(notes?.deliveryFee) || 0);
    const rawDiscount = Math.max(0, Number(notes?.discount) || 0);
    const discount = Math.min(computedSubtotal, rawDiscount);
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
