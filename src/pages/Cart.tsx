import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, MapPin, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "@/contexts/LocationContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AddressSelectionModal } from "@/components/AddressSelectionModal";
import { AddressCard } from "@/components/AddressCard";
import type { UserAddress } from "@/types";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, tax, total } = useCart();
  const { selectedAddress, setSelectedAddress, setShowAddressModal, showAddressModal } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckout = () => {
    // Navigate to checkout page
    navigate('/checkout');
  };

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddress(address);
    toast({
      title: "Delivery Address Selected",
      description: `Delivering to ${address.city}, ${address.pincode}`,
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory text-ink grain flex flex-col selection:bg-clay selection:text-white">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-5 py-24 flex items-center justify-center">
          <div className="text-center max-w-md">
            <ShoppingBag className="mx-auto h-16 w-16 text-ink-soft/40 mb-4" />
            <h2 className="font-display text-3xl font-normal mb-2">Your shopping bag is empty</h2>
            <p className="text-sm text-ink-soft mb-6">Explore our curated collections of bespoke boutique wear.</p>
            <Button onClick={() => navigate('/collections')} className="rounded-full bg-ink px-7 py-3 text-xs font-medium text-ivory hover:bg-clay transition">Browse Designs</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-ink grain flex flex-col selection:bg-clay selection:text-white">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-5 py-12 w-full">
        <h1 className="font-display text-3xl sm:text-4xl font-normal mb-8">Shopping Bag ({items.length} {items.length === 1 ? 'piece' : 'pieces'})</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Delivery Address Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Delivery Address</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAddressModal(true)}
                  className="text-primary"
                >
                  {selectedAddress ? 'Change' : 'Add'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              {selectedAddress ? (
                <AddressCard 
                  address={selectedAddress} 
                  selectable={false}
                  showActions={false}
                />
              ) : (
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <MapPin className="h-8 w-8" />
                  <span className="font-medium">Add Delivery Address</span>
                  <span className="text-sm">Click to add your delivery address</span>
                </button>
              )}
            </Card>

            {/* Cart Items */}
            {items.map((item) => (
              <Card key={`${item.product.id}-${item.size}-${item.color}`} className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-32 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                      </div>
                      <p className="font-bold whitespace-nowrap">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                      <span>Size: {item.size}</span>
                      <span>Color: {item.color}</span>
                      <span>₹{item.product.price.toLocaleString()} each</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.product.id, item.size, item.color)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>


              <Button 
                className="w-full mb-3" 
                size="lg"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/collections')}
              >
                Continue Shopping
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      {/* Address Selection Modal */}
      <AddressSelectionModal
        open={showAddressModal}
        onOpenChange={setShowAddressModal}
        onAddressSelect={handleAddressSelect}
        selectedAddressId={selectedAddress?.id}
      />
    </div>
  );
}
