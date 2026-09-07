import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string | null;
  customer_id: string;
}

const orderStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  accepted: "bg-yellow-100 text-yellow-800",
  packed: "bg-orange-100 text-orange-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const SellerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchOrders = async () => {
      // First get seller id
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!seller) {
        setLoading(false);
        return;
      }

      // Track B: Query seller_orders (Suborders) first for strict seller isolation
      try {
        const { data: suborders, error: subErr } = await (supabase as any)
          .from("seller_orders")
          .select("id, parent_order_id, status, fulfillment_status, seller_subtotal, seller_payable, tracking_id, created_at, orders(order_number, customer_id)")
          .eq("seller_id", seller.id)
          .order("created_at", { ascending: false });

        if (!subErr && suborders && suborders.length > 0) {
          setOrders(suborders.map((s: any) => ({
            id: s.id,
            order_number: s.orders?.order_number || `SUB-${s.id.slice(0, 8)}`,
            status: s.status || "confirmed",
            total: Number(s.seller_payable || s.seller_subtotal || 0),
            created_at: s.created_at,
            customer_id: s.orders?.customer_id || "",
          })));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("[SellerOrders] Falling back to orders table:", err);
      }

      // Backward compatibility fallback to legacy orders
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at, customer_id")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load orders");
        console.error(error);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} order(s)</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No orders yet</h3>
            <p className="text-sm text-muted-foreground">
              Orders will appear here once customers purchase your products.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.order_number}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={orderStatusColors[o.status] || ""}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{o.total.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SellerOrders;
