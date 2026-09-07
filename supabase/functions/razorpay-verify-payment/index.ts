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
  const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return expectedSignature === signature;
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

    // Step 3: Authoritative Database Re-Validation of Products & Prices
    const productIds = rawItems.map((it: any) => it.product_id);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, title, price, seller_id, brand, is_available')
      .in('id', productIds);

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      console.error('[VerifyPayment] Error querying products:', prodErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to validate product data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const dbProductMap = new Map<string, any>();
    dbProducts.forEach(p => dbProductMap.set(p.id, p));

    // Step 4: Atomic Inventory Validation & Reservation
    const validatedItems: any[] = [];
    let authoritativeSubtotal = 0;

    for (const item of rawItems) {
      const dbProd = dbProductMap.get(item.product_id);
      if (!dbProd) {
        throw new Error(`Product ${item.product_id} not found in catalog`);
      }

      const unitPrice = typeof dbProd.price === 'number' ? dbProd.price : 0;
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const lineTotal = unitPrice * quantity;
      authoritativeSubtotal += lineTotal;

      // Find matching variant in product_variants
      let variantId = item.variant_id || null;
      let variantRecord = null;

      if (!variantId && item.size) {
        let vQuery = supabase
          .from('product_variants')
          .select('id, stock_quantity, size, color_name')
          .eq('product_id', dbProd.id)
          .eq('size', item.size);

        if (item.color) {
          vQuery = vQuery.ilike('color_name', item.color);
        }

        const { data: matchedVariants } = await vQuery.limit(1);
        if (matchedVariants && matchedVariants.length > 0) {
          variantRecord = matchedVariants[0];
          variantId = variantRecord.id;
        }
      } else if (variantId) {
        const { data: vRow } = await supabase
          .from('product_variants')
          .select('id, stock_quantity, size, color_name')
          .eq('id', variantId)
          .maybeSingle();
        variantRecord = vRow;
      }

      // Atomic inventory check & decrement using authoritative RPC with fallback
      if (variantRecord && typeof variantRecord.stock_quantity === 'number') {
        let stockDeducted = false;

        // Attempt RPC first
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('reserve_and_decrement_variant_stock', {
            p_variant_id: variantRecord.id,
            p_quantity: quantity
          });

          if (!rpcErr && rpcRes && rpcRes.length > 0 && rpcRes[0].success) {
            stockDeducted = true;
            console.log(`[VerifyPayment] RPC decremented variant ${variantRecord.id}. New stock: ${rpcRes[0].new_stock}`);
          }
        } catch (rpcEx: any) {
          console.warn('[VerifyPayment] RPC error, falling back to conditional update:', rpcEx.message);
        }

        // Fallback to atomic conditional update if RPC didn't execute
        if (!stockDeducted) {
          if (variantRecord.stock_quantity < quantity) {
            console.error(`[VerifyPayment] Insufficient stock for variant ${variantId}: available ${variantRecord.stock_quantity}, requested ${quantity}`);
          } else {
            const { error: decError } = await supabase
              .from('product_variants')
              .update({ 
                stock_quantity: Math.max(0, variantRecord.stock_quantity - quantity),
                updated_at: new Date().toISOString()
              })
              .eq('id', variantRecord.id)
              .gte('stock_quantity', quantity);

            if (decError) {
              console.error(`[VerifyPayment] Failed to decrement variant ${variantRecord.id}:`, decError);
            } else {
              console.log(`[VerifyPayment] Atomically decremented variant ${variantRecord.id} by ${quantity}`);
            }
          }
        }
      }

      validatedItems.push({
        product_id: dbProd.id,
        variant_id: variantId,
        seller_id: dbProd.seller_id,
        brand: dbProd.brand || 'OGURA Atelier',
        title: dbProd.title,
        quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
        size: item.size || 'Free Size',
        color: item.color || 'Studio Original',
      });
    }

    const shippingFee = order_data.shipping_fee || 0;
    const discount = order_data.discount || 0;
    const authoritativeTotal = Math.max(0, authoritativeSubtotal + shippingFee - discount);

    // Step 5: Insert Parent Order into `orders`
    const orderNumber = `OGR${Date.now().toString(36).toUpperCase()}`;
    const primarySellerId = validatedItems[0]?.seller_id || order_data.customer_id;

    const { data: parentOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: order_data.customer_id,
        seller_id: primarySellerId, // Backward compatibility column
        subtotal: authoritativeSubtotal,
        shipping_fee: shippingFee,
        discount: discount,
        total: authoritativeTotal,
        shipping_address: order_data.shipping_address,
        status: 'confirmed',
        tracking_id: razorpay_payment_id,
      })
      .select()
      .single();

    if (orderError || !parentOrder) {
      console.error('[VerifyPayment] Failed to save parent order:', orderError);
      return new Response(
        JSON.stringify({
          success: true,
          payment_verified: true,
          order_saved: false,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          error: 'Order save failed, please contact support with payment ID',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 6: Partition Items by Seller into Suborders (`seller_orders`)
    const sellerGroups = new Map<string, any[]>();
    for (const item of validatedItems) {
      const sId = item.seller_id || primarySellerId;
      if (!sellerGroups.has(sId)) {
        sellerGroups.set(sId, []);
      }
      sellerGroups.get(sId)!.push(item);
    }

    const createdSuborders: any[] = [];
    const STANDARD_COMMISSION_RATE = 15.00; // 15% standard commission

    for (const [sellerId, items] of sellerGroups.entries()) {
      const sellerSubtotal = items.reduce((sum, it) => sum + it.total_price, 0);
      const commissionAmount = Math.round(sellerSubtotal * (STANDARD_COMMISSION_RATE / 100));
      const sellerPayable = sellerSubtotal - commissionAmount;

      try {
        const { data: suborder, error: subError } = await supabase
          .from('seller_orders')
          .insert({
            parent_order_id: parentOrder.id,
            seller_id: sellerId,
            seller_subtotal: sellerSubtotal,
            commission_rate: STANDARD_COMMISSION_RATE,
            commission_amount: commissionAmount,
            seller_payable: sellerPayable,
            status: 'confirmed',
            fulfillment_status: 'unfulfilled',
          })
          .select()
          .single();

        if (subError) {
          console.warn('[VerifyPayment] seller_orders insert warning (table might be pending migration):', subError.message);
        } else if (suborder) {
          createdSuborders.push(suborder);
          // Link suborder ID to items for this seller
          items.forEach(it => { it.seller_order_id = suborder.id; });
        }
      } catch (err: any) {
        console.warn('[VerifyPayment] seller_orders exception:', err.message);
      }
    }

    // Step 7: Insert Order Items into `order_items`
    const orderItemsToInsert = validatedItems.map(item => ({
      order_id: parentOrder.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      size: item.size,
      color: item.color,
      ...(item.seller_order_id ? { seller_order_id: item.seller_order_id } : {}),
      ...(item.seller_id ? { seller_id: item.seller_id } : {}),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('[VerifyPayment] Failed to save order items:', itemsError);
    } else {
      console.log(`[VerifyPayment] Successfully saved ${orderItemsToInsert.length} order items for order ${parentOrder.order_number}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_verified: true,
        order_saved: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        order_number: parentOrder.order_number,
        db_order_id: parentOrder.id,
        suborders_count: createdSuborders.length,
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
