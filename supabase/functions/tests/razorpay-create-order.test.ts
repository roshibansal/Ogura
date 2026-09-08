// Run:  deno run --allow-net --allow-env --allow-read supabase/functions/tests/razorpay-create-order.test.ts
//
// Boots the real create-order function against stubbed Supabase and Razorpay
// so the money logic can be checked without deploying or charging anything.
// Boots the REAL create-order function with stubbed Supabase + Razorpay,
// then asserts what it would charge for a set of adversarial payloads.
const captured: any[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any) => {
  const url = String(input);
  if (url.includes("api.razorpay.com")) {
    const body = JSON.parse(init.body);
    captured.push(body);
    return new Response(JSON.stringify({ id: "order_STUB", amount: body.amount, currency: body.currency }), { status: 200 });
  }
  return realFetch(input, init);
}) as any;

Deno.env.set("RAZORPAY_KEY_ID", "rzp_test_STUB");
Deno.env.set("RAZORPAY_KEY_SECRET", "stub-secret");
Deno.env.set("SUPABASE_URL", "https://stub.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "stub-service-key");

let handler: (req: Request) => Promise<Response>;
// Rewrite serve() to hand us the handler instead of binding a port, and point
// the Supabase import at the stub. The rest of the function is untouched.
const src = await Deno.readTextFile(new URL("../razorpay-create-order/index.ts", import.meta.url));
const patched = src
  .replace(
    'import { serve } from "https://deno.land/std@0.168.0/http/server.ts";',
    "const serve = (h) => { globalThis.__handler = h; };",
  )
  .replace(
    "'https://esm.sh/@supabase/supabase-js@2'",
    JSON.stringify(new URL("./stub-supabase.ts", import.meta.url).href),
  );
await import("data:application/typescript;base64," + btoa(unescape(encodeURIComponent(patched))));
handler = (globalThis as any).__handler;

const post = async (body: unknown) => {
  captured.length = 0;
  const res = await handler(new Request("http://x/", { method: "POST", body: JSON.stringify(body) }));
  return { status: res.status, body: await res.json(), sentToRazorpay: captured[0] ?? null };
};

const rupees = (r: any) => (r.sentToRazorpay ? r.sentToRazorpay.amount / 100 : null);
let pass = 0, fail = 0;
const check = (name: string, cond: boolean, detail: string) => {
  console.log(`${cond ? "  PASS" : "  FAIL"}  ${name}${cond ? "" : "  -> " + detail}`);
  cond ? pass++ : fail++;
};

console.log("\nPRICE AUTHORITY");
let r = await post({ amount: 1, currency: "INR" });
check("client-named price with no items is refused", r.status === 400 && !r.sentToRazorpay, JSON.stringify(r.body));

r = await post({ items: [{ product_id: "p-lehenga", quantity: 1 }], amount: 1 });
check("client 'amount: 1' is ignored for a real basket", rupees(r) !== null && rupees(r) > 1000, `charged ${rupees(r)}`);
const full = rupees(r);
console.log(`         server computed Rs ${full} for the lehenga`);

console.log("\nDISCOUNT AUTHORITY");
r = await post({ items: [{ product_id: "p-lehenga", quantity: 1 }], notes: { discount: 999999, deliveryFee: 0 } });
check("forged notes.discount cannot zero the basket", rupees(r) === full, `charged ${rupees(r)}, expected ${full}`);

r = await post({ items: [{ product_id: "p-lehenga", quantity: 1 }], discount_code: "NOTREAL" });
check("unknown discount code changes nothing", rupees(r) === full, `charged ${rupees(r)}`);

r = await post({ items: [{ product_id: "p-lehenga", quantity: 1 }], discount_code: "FEST10" });
check("valid 10% code applies server-side", rupees(r) === full - Math.round(full! * 0.1), `charged ${rupees(r)}`);

r = await post({ items: [{ product_id: "p-lehenga", quantity: 1 }], discount_code: "BIGSPEND" });
check("code below its minimum purchase is refused", rupees(r) === full, `charged ${rupees(r)}`);

r = await post({ items: [{ product_id: "p-lehenga", quantity: 1 }], discount_code: "USEDUP" });
check("code past its usage limit is refused", rupees(r) === full, `charged ${rupees(r)}`);

console.log("\nCATALOGUE INTEGRITY");
r = await post({ items: [{ product_id: "p-gone", quantity: 1 }] });
check("unavailable product is refused", r.status === 400 && !r.sentToRazorpay, JSON.stringify(r.body));

r = await post({ items: [{ product_id: "does-not-exist", quantity: 1 }] });
check("unknown product is refused", r.status === 400 && !r.sentToRazorpay, JSON.stringify(r.body));

r = await post({ items: [{ product_id: "p-kurta", quantity: 3 }] });
const one = 
  (await post({ items: [{ product_id: "p-kurta", quantity: 1 }] })).sentToRazorpay.amount / 100;
check("quantity multiplies correctly", rupees(await post({ items: [{ product_id: "p-kurta", quantity: 3 }] })) === one * 3, "");

r = await post({ items: [{ product_id: "p-kurta", quantity: -5 }] });
check("negative quantity cannot create a credit", rupees(r) !== null && rupees(r)! > 0, `charged ${rupees(r)}`);

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail) Deno.exit(1);
