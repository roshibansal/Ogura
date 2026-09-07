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

    const { amount, currency = 'INR', receipt, notes, items } = await req.json();

    let finalChargeAmount = Number(amount);

    // Rule 1 Enforcement: Reconstruct authoritative amount from database if items provided
    if (Array.isArray(items) && items.length > 0 && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const productIds = items.map((it: any) => it.product_id);
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, price, is_available')
          .in('id', productIds);

        if (dbProducts && dbProducts.length > 0) {
          const pMap = new Map(dbProducts.map((p: any) => [p.id, p.price]));
          let computedSubtotal = 0;
          for (const it of items) {
            const pPrice = Number(pMap.get(it.product_id) || 0);
            computedSubtotal += pPrice * Math.max(1, parseInt(it.quantity) || 1);
          }
          const deliveryFee = Number(notes?.deliveryFee || 0);
          const discount = Number(notes?.discount || 0);
          const authoritativeTotal = Math.max(0, computedSubtotal + deliveryFee - discount);
          
          if (authoritativeTotal > 0) {
            finalChargeAmount = authoritativeTotal;
          }
        }
      } catch (err: any) {
        console.warn('[CreateOrder] Server-side price check fallback to client amount:', err.message);
      }
    }

    if (!finalChargeAmount || finalChargeAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid order amount' }),
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
