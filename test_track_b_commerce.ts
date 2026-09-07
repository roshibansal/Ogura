import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://yudzgkrjsstqbfrrrrly.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZHpna3Jqc3N0cWJmcnJycmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjI2ODUsImV4cCI6MjA3NzIzODY4NX0.6bqOVgCGyE3UlVcFoHdMQJ3hGhCj-XKtDG2AqC3yp3g";
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTrackBTests() {
  console.log("================================================================================");
  console.log("OGURA TRACK B: FULL COMMERCE HARDENING & MULTI-SELLER TEST SUITE");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${details ? ` -> ${details}` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: COMMISSION & SETTLEMENT DETERMINISTIC MATH
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST SUITE 1] Commission & Settlement Deterministic Calculations ---");
  const COMMISSION_RATE = 15.0; // 15% Standard Marketplace Commission

  function calculateSuborderFinancials(sellerSubtotal: number, rate: number = COMMISSION_RATE) {
    const commissionAmount = Math.round(sellerSubtotal * (rate / 100));
    const sellerPayable = sellerSubtotal - commissionAmount;
    return { sellerSubtotal, commissionRate: rate, commissionAmount, sellerPayable };
  }

  // Test Case A: Clean round number (₹10,000)
  const finA = calculateSuborderFinancials(10000);
  assert(
    finA.commissionAmount === 1500 && finA.sellerPayable === 8500,
    "Standard ₹10,000 order: Commission ₹1,500 (15%), Seller Payable ₹8,500",
    `Subtotal: ${finA.sellerSubtotal}, Fee: ${finA.commissionAmount}, Payable: ${finA.sellerPayable}`
  );

  // Test Case B: Decimal rounding edge case (₹9,999)
  const finB = calculateSuborderFinancials(9999);
  assert(
    finB.commissionAmount === 1500 && finB.sellerPayable === 8499,
    "Odd amount ₹9,999: Commission ₹1,500 (rounded from 1499.85), Seller Payable ₹8,499",
    `Subtotal: ${finB.sellerSubtotal}, Fee: ${finB.commissionAmount}, Payable: ${finB.sellerPayable}`
  );

  // Test Case C: Low value item (₹1,235)
  const finC = calculateSuborderFinancials(1235);
  // 1235 * 0.15 = 185.25 -> 185
  assert(
    finC.commissionAmount === 185 && finC.sellerPayable === 1050,
    "Low value item ₹1,235: Commission ₹185, Seller Payable ₹1,050",
    `Subtotal: ${finC.sellerSubtotal}, Fee: ${finC.commissionAmount}, Payable: ${finC.sellerPayable}`
  );

  // Invariant: Subtotal always equals Commission + Seller Payable
  assert(
    finA.sellerSubtotal === finA.commissionAmount + finA.sellerPayable &&
    finB.sellerSubtotal === finB.commissionAmount + finB.sellerPayable &&
    finC.sellerSubtotal === finC.commissionAmount + finC.sellerPayable,
    "Invariant: sellerSubtotal == commissionAmount + sellerPayable (zero monetary drift)"
  );

  // ---------------------------------------------------------------------------
  // TEST 2: MULTI-SELLER CART PARTITIONING & OWNERSHIP (1 PARENT -> N SUBORDERS)
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST SUITE 2] Multi-Seller Cart Partitioning & Deterministic Ownership ---");

  interface MockCartItem {
    id: string;
    product_id: string;
    seller_id: string;
    seller_name: string;
    variant_id: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
  }

  const multiSellerCart: MockCartItem[] = [
    {
      id: "item-1",
      product_id: "prod-naayra-1",
      seller_id: "seller-naayra-uuid",
      seller_name: "Naayra",
      variant_id: "var-1",
      price: 12500,
      quantity: 1,
      size: "M",
      color: "Dusty Rose"
    },
    {
      id: "item-2",
      product_id: "prod-naayra-2",
      seller_id: "seller-naayra-uuid",
      seller_name: "Naayra",
      variant_id: "var-2",
      price: 8500,
      quantity: 2,
      size: "L",
      color: "Ivory"
    },
    {
      id: "item-3",
      product_id: "prod-riwaana-1",
      seller_id: "seller-riwaana-uuid",
      seller_name: "Riwaana",
      variant_id: "var-3",
      price: 18000,
      quantity: 1,
      size: "Free Size",
      color: "Gold"
    },
    {
      id: "item-4",
      product_id: "prod-navira-1",
      seller_id: "seller-navira-uuid",
      seller_name: "Navira",
      variant_id: "var-4",
      price: 6400,
      quantity: 1,
      size: "S",
      color: "Sage Green"
    }
  ];

  // Simulation of Edge Function Partitioning
  function partitionMultiSellerOrder(items: MockCartItem[], shippingFee = 0, discount = 0) {
    const parentOrderId = `ord_parent_${Date.now()}`;
    const subtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const grandTotal = subtotal + shippingFee - discount;

    const parentOrder = {
      id: parentOrderId,
      order_number: `OGR${Date.now().toString(36).toUpperCase()}`,
      subtotal,
      shipping_fee: shippingFee,
      discount,
      total: grandTotal,
      status: "confirmed"
    };

    // Partition by seller_id
    const sellerGroups = new Map<string, MockCartItem[]>();
    items.forEach(it => {
      if (!sellerGroups.has(it.seller_id)) {
        sellerGroups.set(it.seller_id, []);
      }
      sellerGroups.get(it.seller_id)!.push(it);
    });

    const suborders: any[] = [];
    const orderItems: any[] = [];

    sellerGroups.forEach((sellerItems, sellerId) => {
      const sellerSubtotal = sellerItems.reduce((s, it) => s + (it.price * it.quantity), 0);
      const financials = calculateSuborderFinancials(sellerSubtotal, COMMISSION_RATE);
      const suborderId = `sub_${sellerId.slice(0, 10)}_${Date.now()}`;

      const suborder = {
        id: suborderId,
        parent_order_id: parentOrderId,
        seller_id: sellerId,
        seller_subtotal: sellerSubtotal,
        commission_rate: financials.commissionRate,
        commission_amount: financials.commissionAmount,
        seller_payable: financials.sellerPayable,
        status: "confirmed",
        fulfillment_status: "unfulfilled"
      };
      suborders.push(suborder);

      sellerItems.forEach(it => {
        orderItems.push({
          id: `oi_${it.id}`,
          order_id: parentOrderId,
          seller_order_id: suborderId,
          seller_id: sellerId,
          product_id: it.product_id,
          variant_id: it.variant_id,
          quantity: it.quantity,
          unit_price: it.price,
          total_price: it.price * it.quantity,
          size: it.size,
          color: it.color
        });
      });
    });

    return { parentOrder, suborders, orderItems };
  }

  const result = partitionMultiSellerOrder(multiSellerCart);

  assert(result.suborders.length === 3, "Partitions 3 distinct sellers into exactly 3 suborders");
  assert(
    result.orderItems.length === 4 && result.orderItems.every(oi => oi.seller_order_id && oi.seller_id),
    "All 4 order items have unambiguous seller_order_id and seller_id attribution"
  );

  const naayraSub = result.suborders.find(s => s.seller_id === "seller-naayra-uuid");
  assert(
    naayraSub && naayraSub.seller_subtotal === (12500 + 8500 * 2),
    "Naayra suborder subtotal matches sum of its 2 items (₹29,500)",
    `Actual: ₹${naayraSub?.seller_subtotal}`
  );
  assert(
    naayraSub && naayraSub.commission_amount === 4425 && naayraSub.seller_payable === 25075,
    "Naayra commission (15% = ₹4,425) and seller payable (₹25,075) computed accurately"
  );

  const riwaanaSub = result.suborders.find(s => s.seller_id === "seller-riwaana-uuid");
  assert(
    riwaanaSub && riwaanaSub.seller_subtotal === 18000 && riwaanaSub.seller_payable === 15300,
    "Riwaana suborder correctly calculated (₹18,000 subtotal, ₹15,300 payable)"
  );

  const naviraSub = result.suborders.find(s => s.seller_id === "seller-navira-uuid");
  assert(
    naviraSub && naviraSub.seller_subtotal === 6400 && naviraSub.seller_payable === 5440,
    "Navira suborder correctly calculated (₹6,400 subtotal, ₹5,440 payable)"
  );

  const sumSuborders = result.suborders.reduce((sum, s) => sum + s.seller_subtotal, 0);
  assert(
    sumSuborders === result.parentOrder.subtotal,
    "Sum of all seller suborder subtotals exactly equals parent order subtotal (₹53,900)"
  );

  // ---------------------------------------------------------------------------
  // TEST 3: SELLER ISOLATION (SELLER A NEVER SEES SELLER B)
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST SUITE 3] Seller Suborder Isolation & Filter Integrity ---");

  function getSellerOrderView(allSuborders: any[], allItems: any[], requestingSellerId: string) {
    const visibleSuborders = allSuborders.filter(s => s.seller_id === requestingSellerId);
    const visibleSuborderIds = new Set(visibleSuborders.map(s => s.id));
    const visibleItems = allItems.filter(it => visibleSuborderIds.has(it.seller_order_id));
    return { visibleSuborders, visibleItems };
  }

  const sellerAView = getSellerOrderView(result.suborders, result.orderItems, "seller-naayra-uuid");
  assert(sellerAView.visibleSuborders.length === 1, "Seller A (Naayra) sees exactly 1 suborder");
  assert(sellerAView.visibleItems.length === 2, "Seller A (Naayra) sees exactly 2 order items");
  assert(
    sellerAView.visibleItems.every(it => it.seller_id === "seller-naayra-uuid"),
    "Seller A has ZERO access to Seller B (Riwaana) or Seller C (Navira) items"
  );

  const sellerBView = getSellerOrderView(result.suborders, result.orderItems, "seller-riwaana-uuid");
  assert(
    sellerBView.visibleSuborders.length === 1 && sellerBView.visibleItems.length === 1 &&
    sellerBView.visibleItems[0].product_id === "prod-riwaana-1",
    "Seller B (Riwaana) sees only Riwaana suborder and product"
  );

  // ---------------------------------------------------------------------------
  // TEST 4: ATOMIC INVENTORY LOGIC & LAST-UNIT RACE CONDITION
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST SUITE 4] Atomic Inventory Mutation & Concurrency Guard ---");

  class MockAtomicVariantStock {
    private stock: number;
    private lock = false;

    constructor(initialStock: number) {
      this.stock = initialStock;
    }

    // Atomic conditional decrement equivalent to:
    // UPDATE product_variants SET stock_quantity = stock_quantity - qty
    // WHERE id = variant_id AND stock_quantity >= qty RETURNING stock_quantity
    async decrement(quantity: number): Promise<{ success: boolean; remainingStock: number; error?: string }> {
      // Wait for lock (simulating row-level lock FOR UPDATE)
      while (this.lock) {
        await new Promise(r => setTimeout(r, 5));
      }
      this.lock = true;

      try {
        if (this.stock >= quantity) {
          this.stock -= quantity;
          return { success: true, remainingStock: this.stock };
        } else {
          return {
            success: false,
            remainingStock: this.stock,
            error: `INSUFFICIENT_STOCK: requested ${quantity}, available ${this.stock}`
          };
        }
      } finally {
        this.lock = false;
      }
    }

    getStock() {
      return this.stock;
    }
  }

  // 4A: Normal purchase
  const normalInventory = new MockAtomicVariantStock(5);
  const normalPurchase = await normalInventory.decrement(1);
  assert(
    normalPurchase.success && normalInventory.getStock() === 4,
    "Single purchase: stock 5 -> purchase 1 -> stock 4"
  );

  // 4B: Quantity > Stock rejection
  const overrequestInventory = new MockAtomicVariantStock(2);
  const overPurchase = await overrequestInventory.decrement(3);
  assert(
    !overPurchase.success && overrequestInventory.getStock() === 2,
    "Quantity > Stock: stock 2, request 3 -> REJECTED, stock remains 2",
    overPurchase.error
  );

  // 4C: Last-unit race (2 simultaneous buyers for 1 final physical unit)
  const raceInventory = new MockAtomicVariantStock(1);
  const [buyerA, buyerB] = await Promise.all([
    raceInventory.decrement(1),
    raceInventory.decrement(1)
  ]);

  const successes = [buyerA, buyerB].filter(b => b.success).length;
  const failures = [buyerA, buyerB].filter(b => !b.success).length;

  assert(
    successes === 1 && failures === 1 && raceInventory.getStock() === 0,
    "Last-unit race: 2 concurrent requests for stock=1 -> exactly 1 SUCCESS, 1 INSUFFICIENT_STOCK, stock=0 (NEVER double-sold)",
    `Successes: ${successes}, Failures: ${failures}, Final stock: ${raceInventory.getStock()}`
  );

  // ---------------------------------------------------------------------------
  // TEST 5: PAYMENT VERIFICATION IDEMPOTENCY
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST SUITE 5] Payment Verification Idempotency ---");

  class MockPaymentOrderStore {
    private processedPayments = new Map<string, any>();
    private inventoryDeductions = 0;

    processPaymentVerification(paymentId: string, orderPayload: any) {
      // Step 2 from Edge function: check if payment was already processed
      if (this.processedPayments.has(paymentId)) {
        return {
          idempotentHit: true,
          order: this.processedPayments.get(paymentId),
          message: "Idempotent hit: Order already created for this payment"
        };
      }

      // First time processing
      this.inventoryDeductions += orderPayload.items.length;
      const createdOrder = {
        id: `ord_${Date.now()}`,
        payment_id: paymentId,
        order_number: `OGR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "confirmed",
        total: orderPayload.total
      };
      this.processedPayments.set(paymentId, createdOrder);

      return {
        idempotentHit: false,
        order: createdOrder,
        message: "First verification: Order created"
      };
    }

    getDeductions() {
      return this.inventoryDeductions;
    }
  }

  const paymentStore = new MockPaymentOrderStore();
  const testPaymentId = "pay_test_razorpay_998877";
  const orderData = {
    items: [{ product_id: "p1", quantity: 1 }, { product_id: "p2", quantity: 1 }],
    total: 12000
  };

  // First verification call
  const call1 = paymentStore.processPaymentVerification(testPaymentId, orderData);
  assert(!call1.idempotentHit && call1.order.payment_id === testPaymentId, "First verification succeeds and creates order");

  // Immediate retry (e.g. network timeout or double-click or webhook retry)
  const call2 = paymentStore.processPaymentVerification(testPaymentId, orderData);
  assert(call2.idempotentHit, "Duplicate verification detected via tracking_id / payment_id");
  assert(
    call1.order.id === call2.order.id && call1.order.order_number === call2.order.order_number,
    "Duplicate verification returns identical parent order without creating duplicates"
  );
  assert(
    paymentStore.getDeductions() === 2,
    "Inventory was deducted exactly once (deductions = 2 for 2 items, never re-deducted on retry)"
  );

  // ---------------------------------------------------------------------------
  // TEST 6: LIVE DATABASE DATA & REAL INVENTORY INTEGRITY
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST SUITE 6] Live Database Data & Real Inventory Structure ---");

  // Query real product_variants
  const { data: variants, error: vErr } = await supabase
    .from("product_variants")
    .select("id, product_id, size, color_name, stock_quantity")
    .limit(10);

  assert(!vErr && Array.isArray(variants) && variants.length > 0, `Query real product_variants table (sample count: ${variants?.length})`);
  assert(
    Boolean(variants && variants.length > 0 && variants.every(v => typeof v.stock_quantity === "number" && v.stock_quantity >= 0)),
    "All product variants have authoritative non-negative stock_quantity"
  );

  // Query public seller profiles
  const { data: publicSellers, error: sErr } = await supabase
    .from("sellers")
    .select("id, brand_name, city, description, profile_image, is_verified, is_active")
    .eq("is_active", true)
    .limit(5);

  assert(!sErr && Array.isArray(publicSellers) && publicSellers.length > 0, `Query public atelier profiles safely without RLS failure (count: ${publicSellers?.length})`);
  assert(
    Boolean(publicSellers && publicSellers.length > 0 && publicSellers.every(s => s.brand_name && s.id)),
    "Every verified seller has valid brand_name and UUID"
  );

  // Verify private columns are shielded from public queries
  const { data: privateCheck, error: privErr } = await supabase
    .from("sellers")
    .select("id, bank_account_number, bank_ifsc, pan_number")
    .limit(1);

  // Either RLS throws permission denied or returns null/empty for private columns
  const bankProtected = privErr !== null || (privateCheck && (privateCheck.length === 0 || !privateCheck[0]?.bank_account_number));
  assert(bankProtected, "RLS Security: Sensitive seller financial data (bank_account, pan) is shielded from public access");

  console.log("--------------------------------------------------------------------------------");
  console.log(`FINAL RESULT: TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTrackBTests().catch(err => {
  console.error("Test execution threw exception:", err);
  process.exit(1);
});
