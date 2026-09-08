import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-razorpay-event-id',
};

// Cryptographic HMAC SHA256 signature verification over raw request body text
async function verifyWebhookSignature(
  bodyText: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(bodyText);

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

    return expectedSignature.toLowerCase() === signature.toLowerCase();
  } catch (err: any) {
    console.error('[Webhook] Error verifying signature:', err.message);
    return false;
  }
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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    // Phase 5: Strictly require server-side RAZORPAY_WEBHOOK_SECRET
    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error('[Webhook] Missing RAZORPAY_WEBHOOK_SECRET in environment');
      return new Response(
        JSON.stringify({ success: false, error: 'Server webhook secret not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Webhook] Missing Supabase service role credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Database service credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Read raw body text BEFORE any parsing
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';
    const eventIdHeader = req.headers.get('x-razorpay-event-id');

    if (!signature) {
      console.warn('[Webhook] Request rejected: missing x-razorpay-signature header');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing webhook signature header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 1: Cryptographic HMAC Signature Verification (Zero-trust policy)
    const isSignatureValid = await verifyWebhookSignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);
    if (!isSignatureValid) {
      console.error('[Webhook] Cryptographic signature verification failed');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid webhook signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 2: Parse verified payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const eventType = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const paymentId = paymentEntity?.id || null;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id || null;

    const eventId = eventIdHeader || payload.id || `${eventType}_${paymentId || razorpayOrderId || Date.now()}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // =========================================================================
    // Step 3: Truly Atomic Event Claim with Crash-Safe Lease State Machine
    // =========================================================================
    // Invariants:
    // 1. Fresh claim: INSERT with UNIQUE constraint on event_id.
    // 2. Fresh active lease: Cannot be stolen by concurrent workers.
    // 3. Stale/expired lease: Worker A crashed -> Worker B can atomically reclaim.
    // 4. Fencing token: Prevents zombie worker late writes from corrupting state.
    // 5. Bounded retries: Enforced by max_attempts.
    // =========================================================================
    const workerLeaseToken = crypto.randomUUID();
    const LEASE_DURATION_MS = 60 * 1000; // 60 seconds
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + LEASE_DURATION_MS).toISOString();

    let eventClaimAcquired = false;
    let currentLeaseToken = workerLeaseToken;
    let existingEventRecord: any = null;

    try {
      // 3A: Attempt initial atomic event claim
      const { data: insertedEvent, error: insertError } = await supabase
        .from('payment_webhook_events')
        .insert({
          event_id: eventId,
          event_type: eventType,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentId,
          status: 'processing',
          payload: payload,
          attempt_count: 1,
          max_attempts: 5,
          lease_token: workerLeaseToken,
          processing_started_at: now.toISOString(),
          lease_expires_at: leaseExpiresAt,
          created_at: now.toISOString(),
        })
        .select('id, status, order_id, lease_token, attempt_count, max_attempts, lease_expires_at')
        .maybeSingle();

      if (!insertError && insertedEvent) {
        eventClaimAcquired = true;
        currentLeaseToken = insertedEvent.lease_token || workerLeaseToken;
      } else {
        // Unique conflict on event_id: Inspect existing record for lease status
        const { data: existingEvent } = await supabase
          .from('payment_webhook_events')
          .select('id, status, order_id, lease_token, attempt_count, max_attempts, lease_expires_at')
          .eq('event_id', eventId)
          .maybeSingle();
        existingEventRecord = existingEvent;
      }
    } catch (err: any) {
      console.warn('[Webhook] Event initial claim error:', err.message);
    }

    if (!eventClaimAcquired && existingEventRecord) {
      // If already completed or ignored, return idempotent success immediately
      if (existingEventRecord.status === 'completed' || existingEventRecord.status === 'ignored') {
        return new Response(
          JSON.stringify({
            success: true,
            idempotent: true,
            event_id: eventId,
            order_id: existingEventRecord.order_id,
            message: 'Event already processed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check lease status for crash recovery
      const isLeaseExpired = existingEventRecord.lease_expires_at
        ? new Date(existingEventRecord.lease_expires_at).getTime() <= Date.now()
        : false;

      const attempts = existingEventRecord.attempt_count || 1;
      const maxAttempts = existingEventRecord.max_attempts || 5;

      if (existingEventRecord.status === 'processing') {
        if (!isLeaseExpired) {
          // Fresh active lease: Another worker is legitimately executing. Do NOT steal!
          // Poll briefly in case active worker finishes
          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise((r: (val?: unknown) => void) => setTimeout(r, 300));
            const { data: pollEvent } = await supabase
              .from('payment_webhook_events')
              .select('id, status, order_id')
              .eq('event_id', eventId)
              .maybeSingle();

            if (pollEvent?.status === 'completed' || pollEvent?.status === 'ignored') {
              return new Response(
                JSON.stringify({
                  success: true,
                  idempotent: true,
                  event_id: eventId,
                  order_id: pollEvent.order_id,
                  message: 'Event processed by concurrent worker'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
              );
            }
          }

          // Active lease held by concurrent worker: acknowledge delivery without side effects
          return new Response(
            JSON.stringify({
              success: true,
              idempotent: true,
              event_id: eventId,
              message: 'Event claimed by active concurrent worker'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else {
          // Stale/expired lease: Worker A crashed or stalled!
          if (attempts < maxAttempts) {
            console.warn(`[Webhook] Stale processing lease detected for ${eventId} (attempt ${attempts}/${maxAttempts}). Reclaiming atomically...`);
            const nextAttempt = attempts + 1;
            const newExpiresAt = new Date(Date.now() + LEASE_DURATION_MS).toISOString();

            const { data: reclaimedEvent, error: reclaimError } = await supabase
              .from('payment_webhook_events')
              .update({
                status: 'processing',
                attempt_count: nextAttempt,
                lease_token: workerLeaseToken,
                processing_started_at: new Date().toISOString(),
                lease_expires_at: newExpiresAt,
                error: `Reclaimed from expired lease (attempt ${nextAttempt})`
              })
              .eq('event_id', eventId)
              .eq('status', 'processing')
              .lte('lease_expires_at', new Date().toISOString())
              .select('id, status, order_id, lease_token, attempt_count')
              .maybeSingle();

            if (!reclaimError && reclaimedEvent) {
              console.log(`[Webhook] Stale lease successfully reclaimed for ${eventId} with token ${workerLeaseToken}`);
              eventClaimAcquired = true;
              currentLeaseToken = workerLeaseToken;
            } else {
              console.log(`[Webhook] Reclaim race lost for ${eventId}; another worker claimed or completed.`);
              return new Response(
                JSON.stringify({ success: true, idempotent: true, event_id: eventId, message: 'Reclaim race resolved' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
              );
            }
          } else {
            console.error(`[Webhook] Event ${eventId} exceeded max retry attempts (${attempts}/${maxAttempts}). Marked permanently failed.`);
            return new Response(
              JSON.stringify({ success: false, error: 'Event permanently failed after max attempts', terminal: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
        }
      } else if (existingEventRecord.status === 'failed') {
        // Retryable failed event
        if (attempts < maxAttempts) {
          console.log(`[Webhook] Retrying failed event ${eventId} (attempt ${attempts + 1}/${maxAttempts})...`);
          const nextAttempt = attempts + 1;
          const newExpiresAt = new Date(Date.now() + LEASE_DURATION_MS).toISOString();

          const { data: reclaimedEvent, error: retryError } = await supabase
            .from('payment_webhook_events')
            .update({
              status: 'processing',
              attempt_count: nextAttempt,
              lease_token: workerLeaseToken,
              processing_started_at: new Date().toISOString(),
              lease_expires_at: newExpiresAt,
            })
            .eq('event_id', eventId)
            .eq('status', 'failed')
            .select('id, status, order_id, lease_token, attempt_count')
            .maybeSingle();

          if (!retryError && reclaimedEvent) {
            eventClaimAcquired = true;
            currentLeaseToken = workerLeaseToken;
          }
        } else {
          return new Response(
            JSON.stringify({ success: false, error: 'Event permanently failed after max attempts', terminal: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }
    }

    if (!eventClaimAcquired) {
      return new Response(
        JSON.stringify({ success: true, idempotent: true, event_id: eventId, message: 'Event claim not acquired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // =========================================================================
    // Step 4: Handle Supported Events
    // =========================================================================
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (!paymentId && !razorpayOrderId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Webhook payload missing payment and order identifiers' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // 4A: Check if order was already confirmed (e.g. by synchronous browser verification)
      let existingOrder = null;
      if (paymentId) {
        const { data: ordByPayment } = await supabase
          .from('orders')
          .select('id, order_number, total')
          .eq('tracking_id', paymentId)
          .maybeSingle();
        existingOrder = ordByPayment;
      }

      if (!existingOrder && razorpayOrderId) {
        const { data: ordByOrder } = await supabase
          .from('orders')
          .select('id, order_number, total')
          .eq('payment_order_id', razorpayOrderId)
          .maybeSingle();
        existingOrder = ordByOrder;
      }

      if (existingOrder) {
        console.log(`[Webhook] Order already confirmed in DB for payment ${paymentId} (Order: ${existingOrder.order_number})`);
        // Mark webhook event completed with fencing token
        await supabase
          .from('payment_webhook_events')
          .update({
            status: 'completed',
            order_id: existingOrder.id,
            processed_at: new Date().toISOString()
          })
          .eq('event_id', eventId)
          .eq('lease_token', currentLeaseToken);

        return new Response(
          JSON.stringify({
            success: true,
            idempotent: true,
            order_id: existingOrder.id,
            order_number: existingOrder.order_number,
            message: 'Order already confirmed by client verification'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // 4B: ASYNCHRONOUS RECOVERY FLOW (Browser dropped / missing OGURA order)
      console.log(`[Webhook] Missing OGURA order detected for captured payment ${paymentId}. Executing server-side recovery...`);

      // Retrieve session snapshot from payment_orders with atomic lease acquisition
      let paymentOrder = null;
      if (razorpayOrderId) {
        // Atomically transition status from 'created' or stale 'processing' to 'processing'
        const leaseTimeoutIso = new Date(Date.now() - LEASE_DURATION_MS).toISOString();
        const { data: acquiredSession } = await supabase
          .from('payment_orders')
          .update({
            status: 'processing',
            lease_expires_at: new Date(Date.now() + LEASE_DURATION_MS).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_order_id', razorpayOrderId)
          .or(`status.eq.created,and(status.eq.processing,updated_at.lte.${leaseTimeoutIso})`)
          .select()
          .maybeSingle();

        if (acquiredSession) {
          paymentOrder = acquiredSession;
        } else {
          // If lease not acquired, inspect current state to resolve concurrency
          const { data: currentSession } = await supabase
            .from('payment_orders')
            .select('*')
            .eq('razorpay_order_id', razorpayOrderId)
            .maybeSingle();

          if (currentSession?.status === 'paid' && currentSession?.order_id) {
            console.log(`[Webhook] Concurrent race resolved: order ${currentSession.order_id} already confirmed.`);
            await supabase
              .from('payment_webhook_events')
              .update({
                status: 'completed',
                order_id: currentSession.order_id,
                processed_at: new Date().toISOString()
              })
              .eq('event_id', eventId)
              .eq('lease_token', currentLeaseToken);

            return new Response(
              JSON.stringify({
                success: true,
                idempotent: true,
                order_id: currentSession.order_id,
                message: 'Order already confirmed by concurrent processor'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }

          if (currentSession?.status === 'processing') {
            // A concurrent process is currently active. Wait briefly for completion
            for (let i = 0; i < 5; i++) {
              await new Promise((r: (val?: unknown) => void) => setTimeout(r, 400));
              const { data: pollSession } = await supabase
                .from('payment_orders')
                .select('*')
                .eq('razorpay_order_id', razorpayOrderId)
                .maybeSingle();

              if (pollSession?.status === 'paid' && pollSession?.order_id) {
                await supabase
                  .from('payment_webhook_events')
                  .update({
                    status: 'completed',
                    order_id: pollSession.order_id,
                    processed_at: new Date().toISOString()
                  })
                  .eq('event_id', eventId)
                  .eq('lease_token', currentLeaseToken);

                return new Response(
                  JSON.stringify({
                    success: true,
                    idempotent: true,
                    order_id: pollSession.order_id,
                    message: 'Order confirmed by concurrent processor'
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                );
              }
            }
          }

          paymentOrder = currentSession;
        }
      }

      if (!paymentOrder) {
        console.warn(`[Webhook] No payment_orders snapshot found for ${razorpayOrderId}. Checking order metadata notes...`);
        // Fallback to Razorpay order notes if available
        const notes = orderEntity?.notes || paymentEntity?.notes || {};
        if (notes?.customer_id) {
          paymentOrder = {
            customer_id: notes.customer_id,
            items: [],
            total: (paymentEntity?.amount || 0) / 100,
            subtotal: (paymentEntity?.amount || 0) / 100,
            shipping_fee: Number(notes.deliveryFee) || 0,
            discount: Number(notes.discount) || 0,
            shipping_address: null,
          };
        }
      }

      if (!paymentOrder) {
        const errorMsg = `Unable to recover order: No checkout session snapshot found for Razorpay order ${razorpayOrderId}`;
        console.error(`[Webhook] ${errorMsg}`);
        await supabase
          .from('payment_webhook_events')
          .update({ status: 'failed', error: errorMsg })
          .eq('event_id', eventId)
          .eq('lease_token', currentLeaseToken);

        return new Response(
          JSON.stringify({ success: false, error: errorMsg }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 to acknowledge Razorpay delivery
        );
      }

      // Validate payment amount in paise against authoritative snapshot total
      const paymentAmountPaise = Number(paymentEntity?.amount || orderEntity?.amount || 0);
      const expectedAmountPaise = Math.round(Number(paymentOrder.total) * 100);

      if (paymentAmountPaise > 0 && expectedAmountPaise > 0 && paymentAmountPaise !== expectedAmountPaise) {
        const mismatchMsg = `Amount mismatch: Received ${paymentAmountPaise} paise, expected ${expectedAmountPaise} paise`;
        console.error(`[Webhook] ${mismatchMsg}`);
        await supabase
          .from('payment_webhook_events')
          .update({ status: 'failed', error: mismatchMsg })
          .eq('event_id', eventId)
          .eq('lease_token', currentLeaseToken);

        return new Response(
          JSON.stringify({ success: false, error: mismatchMsg }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Re-verify items & execute atomic checkout confirmation procedure
      const { data: atomicResult, error: atomicErr } = await supabase.rpc('confirm_checkout_atomic', {
        p_razorpay_order_id: razorpayOrderId,
        p_razorpay_payment_id: paymentId,
        p_order_data: paymentOrder,
        p_event_id: eventId,
        p_lease_token: currentLeaseToken,
      });

      if (atomicErr || !atomicResult?.success) {
        const recoveryErr = atomicErr?.message || atomicResult?.error || 'Atomic checkout confirmation failed during webhook recovery';
        console.error(`[Webhook Recovery] ${recoveryErr}`);
        await supabase
          .from('payment_webhook_events')
          .update({ status: 'failed', error: recoveryErr })
          .eq('event_id', eventId)
          .eq('lease_token', currentLeaseToken);
        throw new Error(recoveryErr);
      }

      console.log(`[Webhook Recovery] Successfully recovered order ${atomicResult.order_number} for payment ${paymentId} via confirm_checkout_atomic`);

      return new Response(
        JSON.stringify({
          success: true,
          recovered: true,
          order_id: atomicResult.order_id,
          order_number: atomicResult.order_number,
          payment_id: paymentId,
          idempotent: atomicResult.idempotent || false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (eventType === 'payment.failed') {
      console.log(`[Webhook] Payment failed notification received for payment ${paymentId}`);
      if (razorpayOrderId) {
        await supabase
          .from('payment_orders')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('razorpay_order_id', razorpayOrderId);
      }

      await supabase
        .from('payment_webhook_events')
        .update({
          status: 'completed',
          error: payload.payload?.payment?.entity?.error_description || 'Payment failed',
          processed_at: new Date().toISOString()
        })
        .eq('event_id', eventId)
        .eq('lease_token', currentLeaseToken);

      return new Response(
        JSON.stringify({ success: true, handled: true, event: 'payment.failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Default: acknowledge other non-payment events as ignored
    await supabase
      .from('payment_webhook_events')
      .update({ status: 'ignored', processed_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('lease_token', currentLeaseToken);

    return new Response(
      JSON.stringify({ success: true, acknowledged: true, event: eventType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('[Webhook] Critical execution error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
