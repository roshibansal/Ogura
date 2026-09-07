import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Package, 
  MapPin, 
  Copy,
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, UserAddress } from "@/types";

interface OrderConfirmationState {
  orderNumber: string;
  paymentId: string;
  total: number;
  address: UserAddress;
  items: CartItem[];
}

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const state = location.state as OrderConfirmationState | null;

  // Redirect if no order data
  useEffect(() => {
    if (!state?.orderNumber) {
      navigate('/');
    }
  }, [state, navigate]);

  const copyOrderNumber = () => {
    if (state?.orderNumber) {
      navigator.clipboard.writeText(state.orderNumber);
      toast({
        title: "Copied!",
        description: "Order number copied to clipboard",
      });
    }
  };

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-ink grain selection:bg-clay selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-5 py-12 w-full">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your order. We've received your payment and will process your order shortly.
            </p>
          </div>

          {/* Order Number Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                <p className="text-xl font-bold font-mono">{state.orderNumber}</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyOrderNumber}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Payment ID</p>
                <p className="font-medium font-mono text-xs">{state.paymentId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-bold text-lg">₹{state.total.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Delivery Address</h2>
            </div>
            <div className="text-sm">
              <p className="font-medium">{state.address.full_name}</p>
              <p className="text-muted-foreground mt-1">
                {state.address.address_line}
                {state.address.landmark && `, ${state.address.landmark}`}
              </p>
              <p className="text-muted-foreground">
                {state.address.city}, {state.address.state} - {state.address.pincode}
              </p>
              <p className="text-muted-foreground mt-2">
                Phone: {state.address.mobile}
              </p>
            </div>
          </Card>

          {/* Multi-Atelier Suborder Tracking & Items */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-lg font-bold">Atelier Parcels ({state.items.length} {state.items.length === 1 ? 'item' : 'items'})</h2>
              </div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Multi-Seller Fulfilment</span>
            </div>

            {Object.entries(
              state.items.reduce((acc, item) => {
                const atelier = item.product.brand || 'OGURA Atelier';
                if (!acc[atelier]) {
                  acc[atelier] = [];
                }
                acc[atelier].push(item);
                return acc;
              }, {} as Record<string, typeof state.items>)
            ).map(([atelierName, atelierItems]) => (
              <Card key={atelierName} className="p-5 border border-ink/10 bg-white/80 backdrop-blur-sm rounded-none shadow-sm">
                <div className="flex flex-wrap items-center justify-between border-b border-ink/10 pb-3 mb-4 gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Dispatched directly by</span>
                    <h3 className="font-serif font-bold text-base text-ink">{atelierName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200/50">
                      Confirmed · Preparing at Studio
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {atelierItems.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <div className="w-16 h-20 rounded overflow-hidden bg-muted flex-shrink-0 border border-ink/5">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1 text-ink">{item.product.name}</h4>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                          <span>Size: <strong className="text-ink">{item.size}</strong></span>
                          <span>Color: <strong className="text-ink">{item.color}</strong></span>
                          <span>Qty: <strong className="text-ink">{item.quantity}</strong></span>
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-ink whitespace-nowrap">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-ink/5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Suborder fulfillment</span>
                  <span className="font-medium text-ink">Independent Direct Courier</span>
                </div>
              </Card>
            ))}
          </div>

          {/* What's Next */}
          <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
            <h2 className="font-semibold mb-3">What's Next?</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">1</span>
                <span>You'll receive an order confirmation email shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">2</span>
                <span>Your order will be prepared and shipped within 2-3 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">3</span>
                <span>You'll receive tracking updates via SMS and email</span>
              </li>
            </ul>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link to="/dashboard">
                Track Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/collections">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
