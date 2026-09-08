import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HMAC SHA256 signature verification
async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const message = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = signatureArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');

  return expectedSignature === signature;
}

// Deterministic sample pricing generator (mirrors catalog pricing and razorpay-create-order)
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
    const cheapPrices = [
      1299, 1399, 1499, 1599, 1699, 1799, 1899, 1999, 2199, 2299, 2499, 2599, 2799, 2899, 2999
    ];
    return cheapPrices[absHash % cheapPrices.length];
  } else if (ratio < 0.85) {
    const midPrices = [
      3299, 3499, 3699, 3999, 4299, 4499, 4799, 4999, 5299, 5499, 5899
    ];
    return midPrices[absHash % midPrices.length];
  } else {
    const highPrices = [
      6499, 6999, 7499, 7999, 8499, 8999, 9499, 9999, 10499, 11499, 11999
    ];
    return highPrices[absHash % highPrices.length];
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: 'Razorpay secret not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_data, // Cart items, shipping address, etc.
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing payment verification data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 1: Cryptographic Signature Verification
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      console.error('[VerifyPayment] Payment signature verification failed');
      return new Response(
        JSON.stringify({ success: false, error: 'Payment verification failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!order_data || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: true, payment_verified: true, order_saved: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 2: Idempotency Check — Prevent duplicate orders on retries
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, total')
      .eq('tracking_id', razorpay_payment_id)
      .maybeSingle();

    if (existingOrder) {
      console.log(`[VerifyPayment] Idempotent hit: Order already created for payment ${razorpay_payment_id}`);
      return new Response(
        JSON.stringify({
          success: true,
          payment_verified: true,
          order_saved: true,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          order_number: existingOrder.order_number,
          db_order_id: existingOrder.id,
          idempotent: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawItems = Array.isArray(order_data.items) ? order_data.items : [];
    if (rawItems.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order must contain at least one item' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 3: Atomic Checkout Confirmation via single PostgreSQL transaction
    const { data: atomicResult, error: atomicErr } = await supabase.rpc('confirm_checkout_atomic', {
      p_razorpay_order_id: razorpay_order_id,
      p_razorpay_payment_id: razorpay_payment_id,
      p_order_data: order_data,
    });

    if (atomicErr || !atomicResult?.success) {
      console.error('[VerifyPayment] Atomic checkout confirmation failed:', atomicErr || atomicResult?.error);
      throw new Error(atomicErr?.message || atomicResult?.error || 'Atomic checkout confirmation failed');
    }

    console.log(`[VerifyPayment] Successfully confirmed atomic checkout for order ${atomicResult.order_number}`);

    return new Response(
      JSON.stringify({
        success: true,
        payment_verified: true,
        order_saved: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        order_number: atomicResult.order_number,
        db_order_id: atomicResult.order_id,
        suborders_count: atomicResult.suborders_count || 0,
        idempotent: atomicResult.idempotent || false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[VerifyPayment] Payment verification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
