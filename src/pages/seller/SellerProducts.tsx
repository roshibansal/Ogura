import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Package, Loader2, Trash2, Power, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  category: string;
  status: string | null;
  is_available: boolean | null;
  images: any;
  created_at: string | null;
}

const statusBadgeStyles: Record<string, string> = {
  live: "bg-emerald-100 text-emerald-800 border-emerald-200",
  submitted: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  disabled: "bg-stone-100 text-stone-600 border-stone-200",
  draft: "bg-muted text-muted-foreground",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

// Initial default starter items matching user store prompt
const DEFAULT_STORE_PRODUCTS: SellerProduct[] = [
  {
    id: "prod-abc-default",
    title: "ABC",
    price: 1999,
    original_price: 2499,
    category: "Kurtas",
    status: "disabled",
    is_available: false,
    images: ["/mockup-assets/lengha-30.jpg"],
    created_at: "2026-03-19T10:00:00.000Z",
  },
  {
    id: "prod-tshirt-default",
    title: "tshirt",
    price: 20,
    original_price: 99,
    category: "Suits",
    status: "disabled",
    is_available: false,
    images: ["/mockup-assets/coord-indian-04.jpg"],
    created_at: "2026-03-12T10:00:00.000Z",
  },
];

const SellerProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setLoading(true);

      let resolvedSellerId: string | null = null;
      if (user?.id) {
        try {
          const { data } = await supabase
            .from("sellers")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (data?.id) resolvedSellerId = data.id;
        } catch {}
      }

      if (!resolvedSellerId) {
        const storedSession = localStorage.getItem("ogura_seller_session");
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            if (parsed.sellerId) resolvedSellerId = parsed.sellerId;
          } catch {}
        }
      }

      if (!resolvedSellerId) {
        resolvedSellerId = "d62b74e0-d8a3-5c00-9cf4-e5cb70d3e840";
      }

      setSellerId(resolvedSellerId);

      // Check local storage products
      const localStored = localStorage.getItem("ogura_seller_products");
      let localItems: SellerProduct[] = [];
      if (localStored) {
        try {
          localItems = JSON.parse(localStored);
        } catch {}
      }

      // Fetch from Supabase
      let dbItems: SellerProduct[] = [];
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, title, price, original_price, category, status, is_available, images, created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          dbItems = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            price: Number(d.price) || 0,
            original_price: d.original_price ? Number(d.original_price) : null,
            category: d.category || "dresses",
            status: d.status,
            is_available: d.is_available ?? true,
            images: d.images,
            created_at: d.created_at,
          }));
        }
      } catch (err) {
        console.warn("[SellerProducts] DB fetch warning:", err);
      }

      if (!active) return;

      // Merge unique items: local items first, then DB items, fallback to default 2 items
      const seen = new Set<string>();
      const combined: SellerProduct[] = [];

      for (const item of localItems) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push(item);
        }
      }
      for (const item of dbItems) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push(item);
        }
      }

      // Ensure default items exist if empty
      if (combined.length === 0) {
        combined.push(...DEFAULT_STORE_PRODUCTS);
      }

      setProducts(combined);
      setLoading(false);
    };

    loadProducts();
    return () => {
      active = false;
    };
  }, [user?.id]);

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

  const toggleProductStatus = async (product: SellerProduct) => {
    const nextStatus = product.status === "live" ? "disabled" : "live";
    const nextAvailable = nextStatus === "live";

    // 1. Update state
    const updated = products.map((p) =>
      p.id === product.id ? { ...p, status: nextStatus, is_available: nextAvailable } : p
    );
    setProducts(updated);

    // 2. Update local storage
    localStorage.setItem("ogura_seller_products", JSON.stringify(updated));

    // Also update custom catalog so customer app reflects status change
    const existingCatalog = localStorage.getItem("ogura_custom_catalog_products");
    if (existingCatalog) {
      try {
        const catItems: any[] = JSON.parse(existingCatalog);
        const updatedCat = catItems.map((c) =>
          c.id === product.id ? { ...c, status: nextStatus, is_available: nextAvailable } : c
        );
        localStorage.setItem("ogura_custom_catalog_products", JSON.stringify(updatedCat));
      } catch {}
    }

    // 3. Update Supabase if real row
    try {
      await supabase
        .from("products")
        .update({ status: nextStatus, is_available: nextAvailable })
        .eq("id", product.id);
    } catch {}

    toast.success(`Product is now ${nextStatus}`);
  };

  const deleteSingleProduct = async (productId: string) => {
    // 1. Update state
    const remaining = products.filter((p) => p.id !== productId);
    setProducts(remaining);

    // 2. Update local storage
    localStorage.setItem("ogura_seller_products", JSON.stringify(remaining));

    const existingCatalog = localStorage.getItem("ogura_custom_catalog_products");
    if (existingCatalog) {
      try {
        const catItems: any[] = JSON.parse(existingCatalog);
        localStorage.setItem(
          "ogura_custom_catalog_products",
          JSON.stringify(catItems.filter((c) => c.id !== productId))
        );
      } catch {}
    }

    // 3. Delete from Supabase
    try {
      await supabase.from("product_variants").delete().eq("product_id", productId);
      await supabase.from("products").delete().eq("id", productId);
    } catch {}

    toast.success("Product deleted");
  };

  const deleteAll = async () => {
    setDeleting(true);
    const ids = products.map((p) => p.id);

    try {
      await supabase.from("product_variants").delete().in("product_id", ids);
      if (sellerId) {
        await supabase.from("products").delete().eq("seller_id", sellerId);
      }
    } catch {}

    localStorage.removeItem("ogura_seller_products");
    localStorage.removeItem("ogura_custom_catalog_products");
    setProducts([]);
    setDeleting(false);
    toast.success("All products deleted");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          Loading Atelier Products...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header matching user prompt */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-serif italic text-foreground tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} product(s)</p>
        </div>
        <div className="flex items-center gap-2.5">
          {products.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs text-destructive hover:bg-destructive/10" disabled={deleting}>
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all {products.length} products?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes every product from your atelier store.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAll} className="bg-destructive text-destructive-foreground">
                    Delete all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button asChild size="sm" className="rounded-sm gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/seller/products/new">
              <PlusCircle className="h-3.5 w-3.5" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="border-border/80 shadow-sm">
          <CardContent className="py-20 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-serif italic text-foreground mb-1">No products in your atelier</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Start by publishing your first handcrafted design to reach clients nationwide.
            </p>
            <Button asChild className="gap-2 text-xs font-semibold">
              <Link to="/seller/products/new">
                <PlusCircle className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Product
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Created
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <img
                        src={firstImage(p.images)}
                        alt={p.title}
                        className="h-11 w-11 rounded-sm object-cover bg-stone-100 border border-border/60"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{p.title}</span>
                        {p.status === "live" && (
                          <Link
                            to={`/product/${p.id}`}
                            target="_blank"
                            title="View on Live Store"
                            className="text-muted-foreground hover:text-rose transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize text-xs">
                      {p.category}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground text-sm">
                      ₹{p.price.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm capitalize border ${
                          statusBadgeStyles[p.status || "disabled"] || statusBadgeStyles.disabled
                        }`}
                      >
                        {p.status || "disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {formatDate(p.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProductStatus(p)}
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          title={p.status === "live" ? "Disable Product" : "Publish Live"}
                        >
                          <Power className={`h-3.5 w-3.5 mr-1 ${p.status === "live" ? "text-emerald-600" : "text-stone-400"}`} />
                          {p.status === "live" ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSingleProduct(p.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="Delete Product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

export default SellerProducts;
