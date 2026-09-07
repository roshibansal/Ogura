import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, TrendingUp, IndianRupee, Loader2, PlusCircle } from "lucide-react";


interface Stats {
  total: number;
  live: number;
  pending: number;
  orders: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
}

interface RecentProduct {
  id: string;
  title: string;
  price: number;
  status: string | null;
  images: any;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  submitted: "bg-yellow-100 text-yellow-800",
  live: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const SellerDashboardHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0, live: 0, pending: 0, orders: 0, revenueThisMonth: 0, revenueLastMonth: 0,
  });
  const [recent, setRecent] = useState<RecentProduct[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);

      let sellerId: string | null = null;
      if (user?.id) {
        const { data } = await supabase
          .from("sellers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        sellerId = data?.id ?? null;
      }
      if (!sellerId) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [productsRes, ordersRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, title, price, status, images, created_at")
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, total, status, created_at")
          .eq("seller_id", sellerId),
      ]);

      if (!active) return;
      const products = productsRes.data ?? [];

      let orders: any[] = [];
      try {
        const { data: suborders, error: subErr } = await (supabase as any)
          .from("seller_orders")
          .select("id, seller_payable, seller_subtotal, status, created_at")
          .eq("seller_id", sellerId);

        if (!subErr && suborders && suborders.length > 0) {
          orders = suborders.map((s: any) => ({
            id: s.id,
            total: Number(s.seller_payable || s.seller_subtotal || 0),
            status: s.status,
            created_at: s.created_at,
          }));
        }
      } catch {
        // Fallback to legacy orders
      }

      if (orders.length === 0) {
        orders = ordersRes.data ?? [];
      }

      const isPending = (s: string | null) => s === "pending" || s === "submitted";
      const revenueIn = (from: string, to?: string) =>
        orders
          .filter((o) => {
            if (!o.created_at || o.status === "cancelled") return false;
            if (o.created_at < from) return false;
            if (to && o.created_at >= to) return false;
            return true;
          })
          .reduce((sum, o) => sum + (o.total ?? 0), 0);

      setStats({
        total: products.length,
        live: products.filter((p) => p.status === "live").length,
        pending: products.filter((p) => isPending(p.status)).length,
        orders: orders.length,
        revenueThisMonth: revenueIn(startThisMonth),
        revenueLastMonth: revenueIn(startLastMonth, startThisMonth),
      });
      setRecent(products.slice(0, 5) as RecentProduct[]);
      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, [user?.id]);

  const growth = stats.revenueLastMonth > 0
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
    : null;

  const firstImage = (images: any) =>
    Array.isArray(images) && images.length > 0 ? images[0] : "/placeholder.svg";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {user?.name?.split(" ")[0] || "Seller"}!
        </h1>
        <p className="text-muted-foreground">Here's an overview of your store.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">
              {stats.live} live, {stats.pending} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-xs text-muted-foreground">
              {stats.orders === 0 ? "No orders yet" : "All time"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{stats.revenueThisMonth.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {growth === null ? "—" : `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`}
            </p>
            <p className="text-xs text-muted-foreground">vs. last month</p>
          </CardContent>
        </Card>
      </div>

      {stats.total === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Start by adding your first product to your store. Once approved, it will be visible to customers.
            </p>
            <Button asChild className="gap-2">
              <Link to="/seller/products/new">
                <PlusCircle className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Products</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/seller/products">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img
                  src={firstImage(p.images)}
                  alt={p.title}
                  className="h-10 w-10 rounded object-cover bg-muted"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{p.price?.toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge variant="secondary" className={statusColors[p.status || "draft"]}>
                  {p.status || "draft"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerDashboardHome;
