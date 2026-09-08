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
      <div className="min-h-screen bg-white text-[#5A0A26] flex flex-col selection:bg-gold selection:text-ink">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-5 py-24 flex items-center justify-center">
          <div className="text-center max-w-md bg-white/95 p-8 rounded-sm border border-[#EAE3D9] shadow-[0_0_16px_rgba(226,209,163,0.22)]">
            <ShoppingBag className="mx-auto h-16 w-16 text-[#D6285F] mb-4" />
            <h2 className="font-serif text-3xl font-normal mb-2 text-[#5A0A26]">Your shopping bag is empty</h2>
            <p className="text-sm text-[#5A0A26]/80 mb-6">Explore our curated collections of bespoke boutique wear.</p>
            <Button onClick={() => navigate('/collections')} className="rounded-sm bg-[#D6285F] hover:bg-[#B01F4C] px-8 py-3.5 text-sm font-extrabold text-white uppercase tracking-wider transition border border-[#B01F4C] shadow-sm">Browse Designs</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#5A0A26] flex flex-col selection:bg-gold selection:text-ink">
      <Header />
      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-8 py-10 w-full">
        <h1 className="font-serif text-3xl sm:text-5xl font-normal mb-6 text-[#5A0A26]">Shopping Bag ({items.length} {items.length === 1 ? 'piece' : 'pieces'})</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {/* Delivery Address Section */}
            <div className="p-5 rounded-sm bg-white/95 border border-[#EAE3D9] shadow-[0_0_14px_rgba(226,209,163,0.18)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gold" />
                  <span className="font-bold text-base text-[#5A0A26]">Delivery Address</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAddressModal(true)}
                  className="text-gold font-bold hover:text-gold/80"
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
                  className="w-full border-2 border-dashed border-[#EAE3D9] rounded-sm p-6 flex flex-col items-center justify-center gap-2 text-[#5A0A26]/70 hover:border-gold hover:text-[#5A0A26] transition-colors"
                >
                  <MapPin className="h-8 w-8 text-gold" />
                  <span className="font-bold text-sm">Add Delivery Address</span>
                  <span className="text-xs">Click to enter your delivery pincode and address</span>
                </button>
              )}
            </div>

            {/* Cart Items */}
            {items.map((item) => (
              <div key={`${item.product.id}-${item.size}-${item.color}`} className="p-5 rounded-sm bg-white/95 border border-[#EAE3D9] shadow-[0_0_14px_rgba(226,209,163,0.18)]">
                <div className="flex gap-5">
                  <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-sm overflow-hidden bg-stone border border-[#EAE3D9]/60 flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-serif text-lg sm:text-xl font-normal text-[#5A0A26]">{item.product.name}</h3>
                        <p className="text-sm font-semibold text-[#5A0A26]/75">{item.product.brand}</p>
                      </div>
                      <p className="font-bold text-lg sm:text-xl text-[#5A0A26] whitespace-nowrap">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[#5A0A26]/75 mb-4 font-medium">
                      <span>Size: <strong className="text-[#5A0A26]">{item.size}</strong></span>
                      <span>Color: <strong className="text-[#5A0A26]">{item.color}</strong></span>
                      <span>₹{item.product.price.toLocaleString()} each</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-sm border-[#EAE3D9]"
                          onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold text-base">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-sm border-[#EAE3D9]"
                          onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.product.id, item.size, item.color)}
                        className="text-red-700 hover:text-red-900 font-bold"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 sticky top-24 rounded-sm bg-white/95 border border-[#EAE3D9] shadow-[0_0_18px_rgba(226,209,163,0.22)]">
              <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#5A0A26] mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6 text-sm sm:text-base font-medium">
                <div className="flex justify-between text-[#5A0A26]/85">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#5A0A26]/85">
                  <span>Studio Delivery</span>
                  <span className="text-emerald-700 font-bold">FREE</span>
                </div>
                <div className="border-t border-[#EAE3D9]/60 pt-3 flex justify-between font-bold text-xl text-[#5A0A26]">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                className="w-full mb-3 py-4 text-sm sm:text-base font-extrabold uppercase tracking-wider rounded-sm bg-[#D6285F] hover:bg-[#B01F4C] text-white border border-[#B01F4C] shadow-md transition" 
                size="lg"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                className="w-full py-3 text-sm font-bold text-[#5A0A26] rounded-sm border-[#EAE3D9] hover:bg-white"
                onClick={() => navigate('/collections')}
              >
                Continue Shopping
              </Button>
            </div>
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
