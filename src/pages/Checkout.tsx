import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  ChevronRight, 
  ShoppingBag, 
  Shield, 
  Truck,
  CreditCard,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { useToast } from "@/hooks/use-toast";
import { AddressSelectionModal } from "@/components/AddressSelectionModal";
import { AddressCard } from "@/components/AddressCard";
import { supabase } from "@/integrations/supabase/client";
import type { UserAddress } from "@/types";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { items, subtotal, tax, total, clearCart } = useCart();
  const { user } = useAuth();
  const { selectedAddress, setSelectedAddress, setShowAddressModal, showAddressModal } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: string; code: string; type: string; value: number } | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const itemsByAtelier = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach((item) => {
      const atelierName = item.product.brand || "Independent Atelier";
      if (!map.has(atelierName)) map.set(atelierName, []);
      map.get(atelierName)!.push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddress(address);
    toast({
      title: "Delivery Address Selected",
      description: `Delivering to ${address.city}, ${address.pincode}`,
    });
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setApplyingDiscount(true);
    try {
      const { data, error } = await (supabase as any)
        .from("discounts")
        .select("*")
        .eq("code", discountCode.trim().toUpperCase())
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) {
        toast({ title: "Invalid code", description: "This discount code is not valid.", variant: "destructive" });
        setApplyingDiscount(false);
        return;
      }

      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        toast({ title: "Code expired", description: "This discount has reached its usage limit.", variant: "destructive" });
        setApplyingDiscount(false);
        return;
      }

      if (data.min_purchase && subtotal < data.min_purchase) {
        toast({ title: "Minimum not met", description: `Minimum purchase of ₹${data.min_purchase} required.`, variant: "destructive" });
        setApplyingDiscount(false);
        return;
      }

      let amount = 0;
      if (data.type === "free_shipping") {
        amount = deliveryFee;
      } else if (data.type.includes("percentage")) {
        amount = Math.round(subtotal * (data.value / 100));
      } else {
        amount = Math.min(data.value, subtotal);
      }

      setDiscountAmount(amount);
      setAppliedDiscount({ id: data.id, code: data.code, type: data.type, value: data.value });
      toast({ title: "Discount applied!", description: `You saved ₹${amount}` });
    } catch {
      toast({ title: "Error", description: "Could not apply discount.", variant: "destructive" });
    } finally {
      setApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountCode("");
  };

  const deliveryFee = 0;
  const finalTotal = total + deliveryFee - discountAmount;

  const handlePayment = async () => {
    if (!selectedAddress) {
      setShowAddressModal(true);
      return;
    }

    if (!razorpayLoaded) {
      toast({
        title: "Please wait",
        description: "Payment system is loading...",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create Razorpay order with authoritative item payload
      const { data: orderResponse, error: orderError } = await supabase.functions.invoke(
        'razorpay-create-order',
        {
          body: {
            amount: finalTotal,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            items: items.map(item => ({
              product_id: item.product.id,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
            })),
            notes: {
              customer_email: user?.email,
              items_count: items.length,
              deliveryFee,
              discount: discountAmount,
            },
          },
        }
      );

      if (orderError || !orderResponse?.success) {
        throw new Error(orderResponse?.error || 'Failed to create order');
      }

      // Prepare order data for verification
      const orderData = {
        customer_id: user?.id,
        subtotal: Math.round(subtotal),
        shipping_fee: deliveryFee,
        discount: Math.round(discountAmount),
        total: Math.round(finalTotal),
        shipping_address: {
          full_name: selectedAddress.full_name,
          mobile: selectedAddress.mobile,
          address_line: selectedAddress.address_line,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          landmark: selectedAddress.landmark,
        },
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: Math.round(item.product.price),
          total_price: Math.round(item.product.price * item.quantity),
          size: item.size,
          color: item.color,
        })),
      };

      // Configure Razorpay options
      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'Ogura Fashion',
        description: `Order of ${items.length} item(s)`,
        order_id: orderResponse.order_id,
        handler: async function (response: any) {
          // Verify payment on server
          try {
            const { data: verifyResponse, error: verifyError } = await supabase.functions.invoke(
              'razorpay-verify-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_data: orderData,
                },
              }
            );

            if (verifyError || !verifyResponse?.success) {
              throw new Error(verifyResponse?.error || 'Payment verification failed');
            }

            // Clear cart and redirect to confirmation
            clearCart();
            navigate('/order-confirmation', {
              state: {
                orderNumber: verifyResponse.order_number,
                paymentId: verifyResponse.payment_id,
                total: finalTotal,
                address: selectedAddress,
                items: items,
              },
            });

          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Error",
              description: "Payment verification failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: selectedAddress.full_name,
          email: user?.email || '',
          contact: selectedAddress.mobile,
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment. Your cart is still saved.",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCE8EE] text-[#5A0A26] selection:bg-gold selection:text-ink">
      <Header />
      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-8 py-10 w-full">
        {/* Checkout Steps */}
        <div className="flex items-center gap-2 text-sm font-semibold text-[#5A0A26]/80 mb-6">
          <span>Shopping Bag</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#5A0A26] font-bold">Checkout</span>
          <ChevronRight className="h-4 w-4" />
          <span>Confirmation</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-normal mb-8 text-[#5A0A26]">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section */}
            <div className="p-6 rounded-sm bg-white/95 border border-[#E2D1A3] shadow-[0_0_14px_rgba(226,209,163,0.18)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-sm bg-[#5A0A26]/5 flex items-center justify-center border border-[#E2D1A3]/60">
                    <MapPin className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#5A0A26]">Delivery Address</h2>
                    <p className="text-sm text-[#5A0A26]/75">Direct atelier delivery to your doorstep</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddressModal(true)}
                  className="rounded-sm border-[#E2D1A3] font-bold text-sm text-[#5A0A26]"
                >
                  {selectedAddress ? 'Change Address' : 'Add Address'}
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
                  className="w-full border-2 border-dashed border-[#E2D1A3] rounded-sm p-6 flex flex-col items-center justify-center gap-2 text-[#5A0A26]/70 hover:border-gold hover:text-[#5A0A26] transition-colors"
                >
                  <MapPin className="h-8 w-8 text-gold" />
                  <span className="font-bold text-base">Add Delivery Address</span>
                  <span className="text-xs">Enter your delivery address and pincode for accurate studio dispatch</span>
                </button>
              )}
            </div>

            {/* Order Items */}
            <div className="p-6 rounded-sm bg-white/95 border border-[#E2D1A3] shadow-[0_0_14px_rgba(226,209,163,0.18)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-sm bg-[#5A0A26]/5 flex items-center justify-center border border-[#E2D1A3]/60">
                  <ShoppingBag className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#5A0A26]">Order Items ({items.length})</h2>
                  <p className="text-sm text-[#5A0A26]/75">Verified pieces direct from makers</p>
                </div>
              </div>

              <div className="space-y-6">
                {itemsByAtelier.map(([atelier, atelierItems]) => (
                  <div key={atelier} className="rounded-lg border border-black/5 bg-warm-white/40 p-4">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5">
                      <span className="text-xs uppercase tracking-wider font-semibold text-rose">
                        Studio {atelier}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {atelierItems.length} {atelierItems.length === 1 ? "creation" : "creations"}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {atelierItems.map((item) => (
                        <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-4">
                          <div className="w-16 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-1">{item.product.name}</h3>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                              <span>Size: {item.size}</span>
                              <span>Color: {item.color}</span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                            <p className="font-semibold text-sm mt-1.5 text-ink">
                              ₹{(item.product.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="p-6 sticky top-24 rounded-sm bg-white/95 border border-[#E2D1A3] shadow-[0_0_18px_rgba(226,209,163,0.22)]">
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#5A0A26] mb-4">Payment Summary</h2>

              {/* Discount Code */}
              {!appliedDiscount && (
                <div className="flex gap-2 mb-5">
                  <Input
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value)}
                    className="uppercase text-sm rounded-sm border-[#E2D1A3]"
                    onKeyDown={e => e.key === "Enter" && handleApplyDiscount()}
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyDiscount} disabled={applyingDiscount} className="rounded-sm border-[#E2D1A3] font-bold text-xs">
                    {applyingDiscount ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}

              <div className="space-y-3 text-sm sm:text-base font-medium">
                <div className="flex justify-between text-[#5A0A26]/85">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#5A0A26]/85">
                  <span>Express Studio Delivery</span>
                  <span className="text-emerald-700 font-bold">FREE</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span className="flex items-center gap-1">
                      Discount ({appliedDiscount.code})
                      <button onClick={removeDiscount} className="text-xs underline text-red-700 hover:text-red-900 ml-1">Remove</button>
                    </span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-[#E2D1A3]/60 pt-3 flex justify-between font-bold text-xl text-[#5A0A26]">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                className="w-full mt-6 py-4 text-sm sm:text-base font-extrabold uppercase tracking-wider rounded-sm bg-[#FFA41C] hover:bg-[#FF8F00] text-[#0F1111] border border-[#FF8F00] shadow-md transition" 
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing || !razorpayLoaded}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing Safe Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{finalTotal.toLocaleString()}
                  </>
                )}
              </Button>

              {/* Trust Badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>100% Secure Payment</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Free delivery on orders above ₹999</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Easy 7-day returns</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Accepted Payment Methods</p>
                <div className="flex gap-2">
                  <div className="h-8 px-2 rounded border flex items-center justify-center text-xs font-medium">
                    UPI
                  </div>
                  <div className="h-8 px-2 rounded border flex items-center justify-center text-xs font-medium">
                    Cards
                  </div>
                  <div className="h-8 px-2 rounded border flex items-center justify-center text-xs font-medium">
                    NetBanking
                  </div>
                  <div className="h-8 px-2 rounded border flex items-center justify-center text-xs font-medium">
                    Wallets
                  </div>
                </div>
              </div>
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
