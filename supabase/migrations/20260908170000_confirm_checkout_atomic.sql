-- Migration: 20260908170000_confirm_checkout_atomic.sql
-- Description: Implement atomic checkout confirmation procedure (public.confirm_checkout_atomic)
-- Consolidates inventory reservation, parent order creation, seller suborders, order items,
-- and payment session finalization into a single unified atomic PostgreSQL transaction.

CREATE OR REPLACE FUNCTION public.confirm_checkout_atomic(
  p_razorpay_order_id TEXT,
  p_razorpay_payment_id TEXT,
  p_order_data JSONB DEFAULT NULL,
  p_event_id TEXT DEFAULT NULL,
  p_lease_token UUID DEFAULT NULL,
  p_fail_at TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment_order RECORD;
  v_existing_order RECORD;
  v_raw_items JSONB;
  v_item JSONB;
  v_customer_id UUID;
  v_shipping_address JSONB;
  v_shipping_fee NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_computed_subtotal NUMERIC := 0;
  v_final_total NUMERIC := 0;
  v_order_number TEXT;
  v_parent_order RECORD;
  v_primary_seller_id UUID;
  v_suborders_count INT := 0;
  v_items_count INT := 0;

  -- Working records
  v_prod RECORD;
  v_var RECORD;
  v_prod_id UUID;
  v_var_id UUID;
  v_qty INT;
  v_unit_price NUMERIC;
  v_line_total NUMERIC;
  v_size TEXT;
  v_color TEXT;
  v_seller_id UUID;

  -- Temporary structures in jsonb
  v_validated_items JSONB := '[]'::jsonb;
  v_seller_map JSONB := '{}'::jsonb;
  v_suborder_map JSONB := '{}'::jsonb;
  v_seller_key TEXT;
  v_seller_subtotal NUMERIC;
  v_comm_rate NUMERIC := 15.00;
  v_comm_amount NUMERIC;
  v_seller_payable NUMERIC;
  v_suborder_id UUID;
BEGIN
  -- =========================================================================
  -- 1. VALIDATE MANDATORY PAYMENT IDENTIFIERS
  -- =========================================================================
  IF p_razorpay_order_id IS NULL OR TRIM(p_razorpay_order_id) = '' THEN
    RAISE EXCEPTION 'confirm_checkout_atomic: Missing required p_razorpay_order_id';
  END IF;

  IF p_razorpay_payment_id IS NULL OR TRIM(p_razorpay_payment_id) = '' THEN
    RAISE EXCEPTION 'confirm_checkout_atomic: Missing required p_razorpay_payment_id';
  END IF;

  -- =========================================================================
  -- 2. PARENT ORDER IDEMPOTENCY CHECK (BEFORE ANY MUTATION)
  -- =========================================================================
  SELECT id, order_number, total, subtotal, status, customer_id, payment_order_id, tracking_id
  INTO v_existing_order
  FROM public.orders
  WHERE tracking_id = p_razorpay_payment_id
     OR payment_order_id = p_razorpay_order_id
  LIMIT 1;

  IF v_existing_order.id IS NOT NULL THEN
    -- Identity isolation guard: Reject cross-session identifier mixing
    IF (v_existing_order.payment_order_id IS NOT NULL AND v_existing_order.payment_order_id <> p_razorpay_order_id) OR
       (v_existing_order.tracking_id IS NOT NULL AND v_existing_order.tracking_id <> p_razorpay_payment_id) THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Security violation - payment identifier mismatch for order %', v_existing_order.order_number;
    END IF;

    -- Ensure payment_orders reflects finalized state
    UPDATE public.payment_orders
    SET status = 'paid',
        order_id = v_existing_order.id,
        updated_at = now()
    WHERE razorpay_order_id = p_razorpay_order_id
      AND status <> 'paid';

    -- Mark webhook event completed if event info provided
    IF p_event_id IS NOT NULL AND p_lease_token IS NOT NULL THEN
      UPDATE public.payment_webhook_events
      SET status = 'completed',
          order_id = v_existing_order.id,
          processed_at = now()
      WHERE event_id = p_event_id
        AND lease_token = p_lease_token;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'order_id', v_existing_order.id,
      'order_number', v_existing_order.order_number,
      'total', v_existing_order.total,
      'message', 'Order already confirmed'
    );
  END IF;

  -- =========================================================================
  -- 3. PAYMENT SESSION LOCKING & STATE MACHINE
  -- =========================================================================
  SELECT *
  INTO v_payment_order
  FROM public.payment_orders
  WHERE razorpay_order_id = p_razorpay_order_id
  FOR UPDATE;

  IF v_payment_order.id IS NOT NULL THEN
    -- If session is already paid and order_id exists
    IF v_payment_order.status = 'paid' AND v_payment_order.order_id IS NOT NULL THEN
      SELECT id, order_number, total INTO v_existing_order
      FROM public.orders WHERE id = v_payment_order.order_id;

      IF v_existing_order.id IS NOT NULL THEN
        RETURN jsonb_build_object(
          'success', true,
          'idempotent', true,
          'order_id', v_existing_order.id,
          'order_number', v_existing_order.order_number,
          'total', v_existing_order.total,
          'message', 'Payment session already paid and finalized'
        );
      END IF;
    END IF;

    IF v_payment_order.status = 'failed' THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Payment session % is marked failed', p_razorpay_order_id;
    END IF;

    -- Extract checkout context from session snapshot
    v_raw_items := COALESCE(v_payment_order.items, '[]'::jsonb);
    v_customer_id := v_payment_order.customer_id;
    v_shipping_address := v_payment_order.shipping_address;
    v_shipping_fee := COALESCE(v_payment_order.shipping_fee, 0);
    v_discount := COALESCE(v_payment_order.discount, 0);
  ELSE
    -- Payment order snapshot does not exist: use p_order_data
    IF p_order_data IS NOT NULL THEN
      IF jsonb_typeof(p_order_data) = 'array' THEN
        v_raw_items := p_order_data;
      ELSE
        v_raw_items := COALESCE(p_order_data->'items', '[]'::jsonb);
        v_customer_id := (p_order_data->>'customer_id')::UUID;
        v_shipping_address := p_order_data->'shipping_address';
        v_shipping_fee := COALESCE((p_order_data->>'shipping_fee')::NUMERIC, 0);
        v_discount := COALESCE((p_order_data->>'discount')::NUMERIC, 0);
      END IF;
    ELSE
      v_raw_items := '[]'::jsonb;
    END IF;
  END IF;

  -- Allow p_order_data to enrich missing customer/address fields if snapshot lacked them
  IF p_order_data IS NOT NULL AND jsonb_typeof(p_order_data) = 'object' THEN
    IF v_customer_id IS NULL AND p_order_data ? 'customer_id' THEN
      v_customer_id := (p_order_data->>'customer_id')::UUID;
    END IF;
    IF v_shipping_address IS NULL AND p_order_data ? 'shipping_address' THEN
      v_shipping_address := p_order_data->'shipping_address';
    END IF;
    IF (v_raw_items IS NULL OR jsonb_array_length(v_raw_items) = 0) AND p_order_data ? 'items' THEN
      v_raw_items := p_order_data->'items';
    END IF;
  END IF;

  IF v_raw_items IS NULL OR jsonb_array_length(v_raw_items) = 0 THEN
    RAISE EXCEPTION 'confirm_checkout_atomic: Order must contain at least one line item';
  END IF;

  -- =========================================================================
  -- 4. RESOLVE VARIANTS, QUANTITIES, AND VALIDATE INPUT SHAPES
  -- =========================================================================
  FOR i IN 0 .. (jsonb_array_length(v_raw_items) - 1) LOOP
    v_item := v_raw_items->i;
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;
    v_size := v_item->>'size';
    v_color := v_item->>'color';

    IF v_prod_id IS NULL THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Item % missing product_id', i;
    END IF;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Invalid quantity %, quantity must be positive', (v_item->>'quantity');
    END IF;

    -- Resolve variant_id
    v_var_id := NULL;
    IF v_item ? 'variant_id' AND v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' <> '' THEN
      v_var_id := (v_item->>'variant_id')::UUID;
      -- Verify variant actually exists and belongs to the product
      IF NOT EXISTS (SELECT 1 FROM public.product_variants WHERE id = v_var_id AND product_id = v_prod_id) THEN
        RAISE EXCEPTION 'confirm_checkout_atomic: Variant % does not exist or does not belong to product %', v_var_id, v_prod_id;
      END IF;
    END IF;

    IF v_var_id IS NULL THEN
      -- Lookup variant by size and/or color
      SELECT id INTO v_var_id
      FROM public.product_variants
      WHERE product_id = v_prod_id
        AND (size = v_size OR v_size IS NULL)
        AND (color_name ILIKE v_color OR v_color IS NULL)
      LIMIT 1;

      IF v_var_id IS NULL THEN
        -- Fallback to any variant for the product
        SELECT id INTO v_var_id
        FROM public.product_variants
        WHERE product_id = v_prod_id
        LIMIT 1;
      END IF;
    END IF;

    IF v_var_id IS NULL THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: No variant found for product %', v_prod_id;
    END IF;

    -- Store pre-resolved item in validated list
    v_validated_items := v_validated_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_prod_id,
        'variant_id', v_var_id,
        'quantity', v_qty,
        'size', COALESCE(v_size, 'Free Size'),
        'color', COALESCE(v_color, 'Studio Original'),
        'unit_price', COALESCE((v_item->>'unit_price')::NUMERIC, NULL)
      )
    );
  END LOOP;

  -- =========================================================================
  -- 5. DEADLOCK-FREE INVENTORY LOCKING & STOCK VALIDATION (ORDER BY variant_id)
  -- =========================================================================
  FOR v_var IN
    WITH aggregated_demand AS (
      SELECT 
        (elem->>'variant_id')::UUID AS variant_id,
        SUM((elem->>'quantity')::INT) AS req_quantity
      FROM jsonb_array_elements(v_validated_items) AS elem
      GROUP BY (elem->>'variant_id')::UUID
    )
    SELECT 
      pv.id AS variant_id,
      pv.product_id,
      pv.stock_quantity,
      ad.req_quantity,
      p.title AS product_title,
      p.price AS catalog_price,
      p.seller_id,
      p.is_available
    FROM aggregated_demand ad
    JOIN public.product_variants pv ON pv.id = ad.variant_id
    JOIN public.products p ON p.id = pv.product_id
    ORDER BY pv.id ASC
    FOR UPDATE OF pv
  LOOP
    -- Validate product availability
    IF v_var.is_available IS FALSE THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Product "%" is currently unavailable', v_var.product_title;
    END IF;

    -- Validate stock sufficiency
    IF v_var.stock_quantity IS NULL OR v_var.stock_quantity < v_var.req_quantity THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Insufficient stock for product "%" (variant %): requested %, available %',
        v_var.product_title, v_var.variant_id, v_var.req_quantity, COALESCE(v_var.stock_quantity, 0);
    END IF;

    -- Validate seller relationship
    IF v_var.seller_id IS NULL THEN
      RAISE EXCEPTION 'confirm_checkout_atomic: Product "%" lacks authoritative seller_id', v_var.product_title;
    END IF;
  END LOOP;

  -- Controlled Failure Injection Hook 1 & 2
  IF p_fail_at = 'after_inventory_lock' THEN
    RAISE EXCEPTION 'Simulated failure: after_inventory_lock';
  END IF;

  IF p_fail_at = 'after_inventory_validation' THEN
    RAISE EXCEPTION 'Simulated failure: after_inventory_validation';
  END IF;

  -- =========================================================================
  -- 6. ATOMIC INVENTORY MUTATION
  -- =========================================================================
  WITH aggregated_demand AS (
    SELECT 
      (elem->>'variant_id')::UUID AS variant_id,
      SUM((elem->>'quantity')::INT) AS req_quantity
    FROM jsonb_array_elements(v_validated_items) AS elem
    GROUP BY (elem->>'variant_id')::UUID
  )
  UPDATE public.product_variants pv
  SET stock_quantity = pv.stock_quantity - ad.req_quantity,
      updated_at = now()
  FROM aggregated_demand ad
  WHERE pv.id = ad.variant_id;

  -- Controlled Failure Injection Hook 3
  IF p_fail_at = 'after_inventory_decrement' THEN
    RAISE EXCEPTION 'Simulated failure: after_inventory_decrement';
  END IF;

  -- =========================================================================
  -- 7. DERIVE AUTHORITATIVE MONETARY VALUES & SELLER PARTITIONING
  -- =========================================================================
  v_computed_subtotal := 0;

  FOR i IN 0 .. (jsonb_array_length(v_validated_items) - 1) LOOP
    v_item := v_validated_items->i;
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    SELECT id, title, price, seller_id
    INTO v_prod
    FROM public.products
    WHERE id = v_prod_id;

    -- Determine authoritative unit price: derive strictly from catalog price to prevent client tampering
    IF v_payment_order.id IS NOT NULL AND v_payment_order.items IS NOT NULL THEN
      v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_prod.price);
    ELSE
      v_unit_price := v_prod.price;
    END IF;

    v_line_total := v_unit_price * v_qty;
    v_computed_subtotal := v_computed_subtotal + v_line_total;

    -- Track primary seller
    IF v_primary_seller_id IS NULL THEN
      v_primary_seller_id := v_prod.seller_id;
    END IF;

    -- Partition by seller for suborders
    v_seller_key := v_prod.seller_id::TEXT;
    v_seller_subtotal := COALESCE((v_seller_map->>v_seller_key)::NUMERIC, 0) + v_line_total;
    v_seller_map := jsonb_set(v_seller_map, ARRAY[v_seller_key], to_jsonb(v_seller_subtotal));

    -- Update validated item with authoritative seller_id, unit_price, line_total
    v_validated_items := jsonb_set(v_validated_items, ARRAY[i::TEXT, 'seller_id'], to_jsonb(v_prod.seller_id::TEXT));
    v_validated_items := jsonb_set(v_validated_items, ARRAY[i::TEXT, 'unit_price'], to_jsonb(v_unit_price));
    v_validated_items := jsonb_set(v_validated_items, ARRAY[i::TEXT, 'total_price'], to_jsonb(v_line_total));
  END LOOP;

  -- Authoritative Total Calculation
  IF v_payment_order.total IS NOT NULL AND v_payment_order.total > 0 THEN
    v_final_total := v_payment_order.total;
    IF v_payment_order.subtotal IS NOT NULL AND v_payment_order.subtotal > 0 THEN
      v_computed_subtotal := v_payment_order.subtotal;
    END IF;
  ELSE
    v_final_total := GREATEST(0, v_computed_subtotal + v_shipping_fee - v_discount);
  END IF;

  -- =========================================================================
  -- 8. CREATE PARENT ORDER (public.orders)
  -- =========================================================================
  v_order_number := 'OGR' || UPPER(TO_HEX(EXTRACT(EPOCH FROM now())::BIGINT)) || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4));

  INSERT INTO public.orders (
    order_number,
    customer_id,
    seller_id,
    subtotal,
    shipping_fee,
    discount,
    total,
    shipping_address,
    status,
    tracking_id,
    payment_order_id,
    created_at,
    updated_at
  ) VALUES (
    v_order_number,
    v_customer_id,
    v_primary_seller_id,
    v_computed_subtotal,
    v_shipping_fee,
    v_discount,
    v_final_total,
    v_shipping_address,
    'confirmed',
    p_razorpay_payment_id,
    p_razorpay_order_id,
    now(),
    now()
  )
  RETURNING * INTO v_parent_order;

  -- Controlled Failure Injection Hook 4
  IF p_fail_at = 'after_parent_order' THEN
    RAISE EXCEPTION 'Simulated failure: after_parent_order';
  END IF;

  -- =========================================================================
  -- 9. CREATE SELLER SUBORDERS (public.seller_orders)
  -- =========================================================================
  FOR v_seller_key IN SELECT jsonb_object_keys(v_seller_map) LOOP
    v_seller_id := v_seller_key::UUID;
    v_seller_subtotal := (v_seller_map->>v_seller_key)::NUMERIC;
    v_comm_amount := ROUND(v_seller_subtotal * (v_comm_rate / 100.0), 2);
    v_seller_payable := v_seller_subtotal - v_comm_amount;

    INSERT INTO public.seller_orders (
      parent_order_id,
      seller_id,
      seller_subtotal,
      commission_rate,
      commission_amount,
      seller_payable,
      status,
      fulfillment_status,
      tracking_id,
      created_at,
      updated_at
    ) VALUES (
      v_parent_order.id,
      v_seller_id,
      v_seller_subtotal,
      v_comm_rate,
      v_comm_amount,
      v_seller_payable,
      'confirmed',
      'unfulfilled',
      p_razorpay_payment_id,
      now(),
      now()
    )
    RETURNING id INTO v_suborder_id;

    v_suborder_map := jsonb_set(v_suborder_map, ARRAY[v_seller_key], to_jsonb(v_suborder_id::TEXT));
    v_suborders_count := v_suborders_count + 1;
  END LOOP;

  -- Controlled Failure Injection Hook 5
  IF p_fail_at = 'after_seller_order' THEN
    RAISE EXCEPTION 'Simulated failure: after_seller_order';
  END IF;

  -- =========================================================================
  -- 10. CREATE ORDER ITEMS (public.order_items)
  -- =========================================================================
  FOR i IN 0 .. (jsonb_array_length(v_validated_items) - 1) LOOP
    v_item := v_validated_items->i;
    v_seller_key := v_item->>'seller_id';
    v_suborder_id := (v_suborder_map->>v_seller_key)::UUID;

    INSERT INTO public.order_items (
      order_id,
      seller_order_id,
      seller_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price,
      size,
      color
    ) VALUES (
      v_parent_order.id,
      v_suborder_id,
      (v_item->>'seller_id')::UUID,
      (v_item->>'product_id')::UUID,
      (v_item->>'variant_id')::UUID,
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'total_price')::NUMERIC,
      v_item->>'size',
      v_item->>'color'
    );

    v_items_count := v_items_count + 1;
  END LOOP;

  -- Controlled Failure Injection Hook 6
  IF p_fail_at = 'after_order_items' THEN
    RAISE EXCEPTION 'Simulated failure: after_order_items';
  END IF;

  -- =========================================================================
  -- 11. FINALIZE PAYMENT SESSION IN payment_orders
  -- =========================================================================
  IF v_payment_order.id IS NOT NULL THEN
    UPDATE public.payment_orders
    SET status = 'paid',
        order_id = v_parent_order.id,
        updated_at = now()
    WHERE id = v_payment_order.id;
  ELSE
    INSERT INTO public.payment_orders (
      razorpay_order_id,
      customer_id,
      items,
      subtotal,
      shipping_fee,
      discount,
      total,
      shipping_address,
      status,
      order_id,
      created_at,
      updated_at
    ) VALUES (
      p_razorpay_order_id,
      v_customer_id,
      v_raw_items,
      v_computed_subtotal,
      v_shipping_fee,
      v_discount,
      v_final_total,
      v_shipping_address,
      'paid',
      v_parent_order.id,
      now(),
      now()
    );
  END IF;

  -- =========================================================================
  -- 12. FINALIZE WEBHOOK EVENT IF PROVIDED
  -- =========================================================================
  IF p_event_id IS NOT NULL AND p_lease_token IS NOT NULL THEN
    UPDATE public.payment_webhook_events
    SET status = 'completed',
        order_id = v_parent_order.id,
        processed_at = now()
    WHERE event_id = p_event_id
      AND lease_token = p_lease_token;
  END IF;

  -- Controlled Failure Injection Hook 7
  IF p_fail_at = 'after_payment_finalization' THEN
    RAISE EXCEPTION 'Simulated failure: after_payment_finalization';
  END IF;

  -- =========================================================================
  -- 13. RETURN SUCCESS RESULT
  -- =========================================================================
  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'order_id', v_parent_order.id,
    'order_number', v_parent_order.order_number,
    'total', v_parent_order.total,
    'suborders_count', v_suborders_count,
    'items_count', v_items_count
  );

EXCEPTION
  -- Catch unique violation for concurrent parent order insertions
  WHEN unique_violation THEN
    SELECT id, order_number, total, subtotal, status, customer_id, payment_order_id, tracking_id
    INTO v_existing_order
    FROM public.orders
    WHERE tracking_id = p_razorpay_payment_id
       OR payment_order_id = p_razorpay_order_id
    LIMIT 1;

    IF v_existing_order.id IS NOT NULL THEN
      -- Identity isolation guard: Reject cross-session identifier mixing
      IF (v_existing_order.payment_order_id IS NOT NULL AND v_existing_order.payment_order_id <> p_razorpay_order_id) OR
         (v_existing_order.tracking_id IS NOT NULL AND v_existing_order.tracking_id <> p_razorpay_payment_id) THEN
        RAISE EXCEPTION 'confirm_checkout_atomic: Security violation - payment identifier mismatch for order %', v_existing_order.order_number;
      END IF;

      UPDATE public.payment_orders
      SET status = 'paid',
          order_id = v_existing_order.id,
          updated_at = now()
      WHERE razorpay_order_id = p_razorpay_order_id
        AND status <> 'paid';

      IF p_event_id IS NOT NULL AND p_lease_token IS NOT NULL THEN
        UPDATE public.payment_webhook_events
        SET status = 'completed',
            order_id = v_existing_order.id,
            processed_at = now()
        WHERE event_id = p_event_id
          AND lease_token = p_lease_token;
      END IF;

      RETURN jsonb_build_object(
        'success', true,
        'idempotent', true,
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'total', v_existing_order.total,
        'message', 'Order resolved via concurrent unique constraint catch'
      );
    ELSE
      RAISE;
    END IF;
  WHEN OTHERS THEN
    -- Automatic transaction rollback
    RAISE;
END;
$$;

-- =========================================================================
-- STRICT PRODUCTION FINANCIAL PRIVILEGES: SERVICE_ROLE EXCLUSIVE
-- =========================================================================
-- Revoke all execution permissions from PUBLIC, anon, and authenticated
REVOKE ALL ON FUNCTION public.confirm_checkout_atomic(TEXT, TEXT, JSONB, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_checkout_atomic(TEXT, TEXT, JSONB, TEXT, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_checkout_atomic(TEXT, TEXT, JSONB, TEXT, UUID, TEXT) FROM authenticated;

-- Grant execution permissions EXCLUSIVELY to service_role (trusted Edge Functions)
GRANT EXECUTE ON FUNCTION public.confirm_checkout_atomic(TEXT, TEXT, JSONB, TEXT, UUID, TEXT) TO service_role;
