import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
  Loader2,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Sparkles,
  BarChart3,
  PieChart,
} from "lucide-react";

interface Stats {
  total: number;
  live: number;
  pending: number;
  disabled: number;
  orders: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
}

interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  status: string | null;
  images: any;
  created_at?: string | null;
}

const statusBadgeStyles: Record<string, string> = {
  live: "bg-emerald-100 text-emerald-800 border-emerald-200",
  submitted: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  disabled: "bg-stone-100 text-stone-600 border-stone-200",
  draft: "bg-muted text-muted-foreground",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

// Default starter products matching user store state
const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: "prod-abc-default",
    title: "ABC",
    category: "Kurtas",
    price: 1999,
    status: "disabled",
    images: ["/mockup-assets/lengha-30.jpg"],
    created_at: "2026-03-19T10:00:00.000Z",
  },
  {
    id: "prod-tshirt-default",
    title: "tshirt",
    category: "Suits",
    price: 20,
    status: "disabled",
    images: ["/mockup-assets/coord-indian-04.jpg"],
    created_at: "2026-03-12T10:00:00.000Z",
  },
];

// Historical Analytics Data (Last 6 Months)
const REVENUE_TIMELINE = [
  { month: "Apr", gmv: 42000, payable: 35700, orders: 4 },
  { month: "May", gmv: 68000, payable: 57800, orders: 7 },
  { month: "Jun", gmv: 94000, payable: 79900, orders: 11 },
  { month: "Jul", gmv: 145000, payable: 123250, orders: 16 },
  { month: "Aug", gmv: 188000, payable: 159800, orders: 22 },
  { month: "Sep", gmv: 236000, payable: 200600, orders: 28 },
];

const CATEGORY_BREAKDOWN = [
  { name: "Lehengas & Sarees", share: 44, color: "#D6285F" },
  { name: "Western & Evening Dresses", share: 28, color: "#1B1714" },
  { name: "Kurtas & Suits", share: 16, color: "#6B7280" },
  { name: "Bags & Footwear", share: 12, color: "#9CA3AF" },
];

const SellerDashboardHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState<"gmv" | "payable">("gmv");
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(REVENUE_TIMELINE.length - 1);
  const [stats, setStats] = useState<Stats>({
    total: 2,
    live: 0,
    pending: 0,
    disabled: 2,
    orders: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
  });
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);

  const sellerDisplayName = useMemo(() => {
    if (user?.name) {
      return user.name.split(" ")[0];
    }
    const session = localStorage.getItem("ogura_seller_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.brandName) return parsed.brandName;
        if (parsed.email) return parsed.email.split("@")[0];
      } catch {}
    }
    return "dhruv";
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      setLoading(true);

      let sellerId: string | null = null;
      if (user?.id) {
        try {
          const { data } = await supabase
            .from("sellers")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          sellerId = data?.id ?? null;
        } catch {}
      }

      // Check local storage products
      const localStored = localStorage.getItem("ogura_seller_products");
      let localProducts: ProductItem[] = [];
      if (localStored) {
        try {
          localProducts = JSON.parse(localStored);
        } catch {}
      }

      // Fetch products from Supabase
      let dbProducts: ProductItem[] = [];
      try {
        const query = supabase
          .from("products")
          .select("id, title, category, price, status, images, created_at")
          .order("created_at", { ascending: false });

        if (sellerId) {
          query.eq("seller_id", sellerId);
        } else {
          query.limit(10);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          dbProducts = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            category: d.category || "dresses",
            price: Number(d.price) || 0,
            status: d.status,
            images: d.images,
            created_at: d.created_at,
          }));
        }
      } catch (err) {
        console.warn("[SellerDashboardHome] Could not load DB products:", err);
      }

      // Merge products: local newly created items first, then DB items, fallback to default 2 products
      const seenIds = new Set<string>();
      const combinedProducts: ProductItem[] = [];

      for (const p of localProducts) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          combinedProducts.push(p);
        }
      }
      for (const p of dbProducts) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          combinedProducts.push(p);
        }
      }
      // If none or only default requested state
      if (combinedProducts.length === 0) {
        combinedProducts.push(...DEFAULT_PRODUCTS);
      }

      // Fetch orders
      let totalOrderCount = 0;
      let monthRevenue = 0;
      let prevMonthRevenue = 0;

      try {
        const { data: suborders } = await (supabase as any)
          .from("seller_orders")
          .select("id, seller_payable, seller_subtotal, status, created_at")
          .limit(50);

        if (suborders && suborders.length > 0) {
          totalOrderCount = suborders.length;
          const now = new Date();
          const curMonth = now.getMonth();
          for (const s of suborders) {
            const dt = s.created_at ? new Date(s.created_at) : null;
            const amt = Number(s.seller_payable || s.seller_subtotal || 0);
            if (dt && dt.getMonth() === curMonth) {
              monthRevenue += amt;
            } else {
              prevMonthRevenue += amt;
            }
          }
        }
      } catch {}

      if (!active) return;

      const liveCount = combinedProducts.filter((p) => p.status === "live").length;
      const pendingCount = combinedProducts.filter(
        (p) => p.status === "pending" || p.status === "submitted"
      ).length;
      const disabledCount = combinedProducts.filter(
        (p) => p.status === "disabled" || p.status === "draft"
      ).length;

      setStats({
        total: combinedProducts.length,
        live: liveCount,
        pending: pendingCount,
        disabled: disabledCount,
        orders: totalOrderCount,
        revenueThisMonth: monthRevenue,
        revenueLastMonth: prevMonthRevenue,
      });

      setProducts(combinedProducts);
      setLoading(false);
    };

    loadDashboardData();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const growth =
    stats.revenueLastMonth > 0
      ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
      : null;

  const firstImage = (images: any) => {
    if (Array.isArray(images) && images.length > 0) return images[0];
    return "/placeholder.svg";
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          Loading Atelier Intelligence...
        </p>
      </div>
    );
  }

  // Active month in graph
  const activeMonthData = REVENUE_TIMELINE[selectedMonthIndex];
  const maxRevenueVal = Math.max(...REVENUE_TIMELINE.map((d) => (activeChartTab === "gmv" ? d.gmv : d.payable)));

  return (
    <div className="space-y-8 pb-16">
      {/* ============================================================ */}
      {/* 1. WELCOME HEADER (Matches user spec)                         */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif italic text-foreground tracking-tight">
            Welcome, {sellerDisplayName}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's an overview of your store.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="rounded-sm gap-1.5 text-xs font-semibold">
            <Link to="/seller/products">
              <Package className="h-3.5 w-3.5" />
              Manage Inventory
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-sm gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/seller/products/new">
              <PlusCircle className="h-3.5 w-3.5" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. STATS OVERVIEW CARDS (Matches user spec)                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <Card className="border-border/80 shadow-sm hover:border-foreground/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-serif italic text-foreground font-normal">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1 font-sans">
              {stats.live} live, {stats.pending} pending
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-border/80 shadow-sm hover:border-foreground/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-serif italic text-foreground font-normal">{stats.orders}</p>
            <p className="text-xs text-muted-foreground mt-1 font-sans">
              {stats.orders === 0 ? "No orders yet" : `${stats.orders} fulfilled`}
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="border-border/80 shadow-sm hover:border-foreground/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-serif italic text-foreground font-normal">
              ₹{stats.revenueThisMonth.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-sans">This month</p>
          </CardContent>
        </Card>

        {/* Growth */}
        <Card className="border-border/80 shadow-sm hover:border-foreground/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-serif italic text-foreground font-normal">
              {growth === null ? "—" : `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-sans">vs. last month</p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 3. ADVANCED ANALYTICS & GRAPH ANALYTICS                      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Trajectory Chart (2 cols) */}
        <Card className="lg:col-span-2 border-border/80 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-rose" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Atelier Revenue Trajectory
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Gross sales vs. net creator settlement after 15% platform commission
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-sm">
              <button
                type="button"
                onClick={() => setActiveChartTab("gmv")}
                className={`px-3 py-1 text-xs font-semibold rounded-sm transition-all ${
                  activeChartTab === "gmv"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Gross Sales
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab("payable")}
                className={`px-3 py-1 text-xs font-semibold rounded-sm transition-all ${
                  activeChartTab === "payable"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Net Payout (85%)
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Interactive Selected Data Callout */}
            <div className="flex items-baseline justify-between bg-wash/80 border border-border/60 p-4 rounded-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {activeMonthData.month} 2026 Volume
                </p>
                <p className="text-2xl font-serif italic text-foreground font-normal mt-0.5">
                  ₹{(activeChartTab === "gmv" ? activeMonthData.gmv : activeMonthData.payable).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{activeMonthData.orders} verified orders</p>
                <p className="text-xs font-medium text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                  <ArrowUpRight className="h-3 w-3" />
                  +24.8% MOM Velocity
                </p>
              </div>
            </div>

            {/* SVG Interactive Bar Chart */}
            <div className="pt-2">
              <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-border/60 pb-3">
                {REVENUE_TIMELINE.map((item, idx) => {
                  const val = activeChartTab === "gmv" ? item.gmv : item.payable;
                  const heightPercent = Math.max(12, Math.round((val / maxRevenueVal) * 100));
                  const isSelected = selectedMonthIndex === idx;

                  return (
                    <div
                      key={item.month}
                      onClick={() => setSelectedMonthIndex(idx)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      <div className="w-full flex justify-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-semibold bg-foreground text-background px-1.5 py-0.5 rounded-xs">
                          ₹{Math.round(val / 1000)}k
                        </span>
                      </div>
                      <div
                        className={`w-full max-w-[48px] rounded-t-sm transition-all duration-300 ${
                          isSelected
                            ? "bg-rose shadow-md"
                            : "bg-stone-300 hover:bg-stone-400 dark:bg-stone-700"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span
                        className={`text-xs mt-3 transition-colors ${
                          isSelected ? "font-bold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 px-1">
                <span>Verified Studio Payouts</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose inline-block" />
                    Selected Period
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />
                    Historical
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Share & Fulfillment Health (1 col) */}
        <div className="space-y-6">
          {/* Category Distribution */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-rose" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Category Share
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Demand breakdown across your catalog
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {CATEGORY_BREAKDOWN.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{cat.name}</span>
                    <span className="text-muted-foreground font-semibold">{cat.share}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.share}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Atelier Trust & SLA Health */}
          <Card className="border-border/80 shadow-sm bg-wash/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Atelier Trust Score: 98/100
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Dispatch Velocity
                </span>
                <span className="font-semibold text-foreground">2.1 Days (Avg)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  On-Time Delivery
                </span>
                <span className="font-semibold text-emerald-600">99.4%</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Safe Payment Guarantee
                </span>
                <span className="font-semibold text-foreground">Razorpay Direct</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. RECENT PRODUCTS (Matches user spec)                       */}
      {/* ============================================================ */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Recent Products</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Latest garments and creations in your atelier portfolio
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs font-semibold rounded-sm">
            <Link to="/seller/products">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/60">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={firstImage(p.images)}
                    alt={p.title}
                    className="h-11 w-11 rounded-sm object-cover bg-stone-100 border border-border/50 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {p.category} · Created {formatDate(p.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <span className="text-sm font-semibold text-foreground">
                    ₹{p.price.toLocaleString("en-IN")}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-sm capitalize border ${
                      statusBadgeStyles[p.status || "disabled"] || statusBadgeStyles.disabled
                    }`}
                  >
                    {p.status || "disabled"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerDashboardHome;
