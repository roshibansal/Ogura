import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleMoveToCart = (product: typeof items[0]) => {
    const size = product.sizes?.[0] || "Free Size";
    const rawColor = product.colors?.[0];
    const color = typeof rawColor === "string" ? rawColor : (rawColor?.name || "Studio Original");
    addItem(product, size, color, 1);
    removeItem(product.id);
    toast({ title: "Moved to bag", description: `${product.name} (${size} · ${color}) added to your shopping bag` });
  };


  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <Heart className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Save your favorite items here</p>
            <Button onClick={() => navigate('/collections')}>Browse Collections</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Wishlist ({items.length} items)</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product) => (
            <Card key={product.id} className="group overflow-hidden">
              <div
                className="aspect-[3/4] relative overflow-hidden bg-muted cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(product.id);
                    toast({ title: "Removed from wishlist" });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-3">
                <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-sm font-semibold mb-3">₹{product.price.toLocaleString()}</p>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleMoveToCart(product)}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Move to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
