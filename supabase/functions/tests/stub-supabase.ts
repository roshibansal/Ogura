// Stubs the Supabase client so the real edge function can be exercised offline.
const PRODUCTS = [
  { id: "p-lehenga", title: "Bandhani Lehenga", price: 11999, is_available: true },
  { id: "p-kurta",   title: "Cotton Kurta Set",  price: 2499,  is_available: true },
  { id: "p-gone",    title: "Withdrawn Piece",   price: 4999,  is_available: false },
];
const DISCOUNTS = [
  { code: "FEST10",   type: "percentage", value: 10,    status: "active", min_purchase: null, usage_limit: null, usage_count: 0 },
  { code: "FLAT500",  type: "flat",       value: 500,   status: "active", min_purchase: null, usage_limit: null, usage_count: 0 },
  { code: "BIGSPEND", type: "flat",       value: 500,   status: "active", min_purchase: 99999, usage_limit: null, usage_count: 0 },
  { code: "USEDUP",   type: "flat",       value: 500,   status: "active", min_purchase: null, usage_limit: 5, usage_count: 5 },
];

export const createClient = () => ({
  from(table: string) {
    const q: any = {
      _table: table, _eqs: {} as Record<string, unknown>, _ins: [] as string[],
      select() { return q; },
      eq(col: string, val: unknown) { q._eqs[col] = val; return q; },
      in(_col: string, vals: string[]) { q._ins = vals; return q; },
      insert() { return Promise.resolve({ error: null }); },
      maybeSingle() {
        if (table === "discounts") {
          const row = DISCOUNTS.find(
            (d) => d.code === q._eqs.code && d.status === (q._eqs.status ?? d.status),
          );
          return Promise.resolve({ data: row ?? null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      then(res: (v: unknown) => void) {
        if (table === "products") {
          return Promise.resolve({
            data: PRODUCTS.filter((p) => q._ins.includes(p.id)), error: null,
          }).then(res);
        }
        return Promise.resolve({ data: [], error: null }).then(res);
      },
    };
    return q;
  },
});
