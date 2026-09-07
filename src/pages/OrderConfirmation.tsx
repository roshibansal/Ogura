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

          {/* Order Items */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Order Items ({state.items.length})</h2>
            </div>
            <div className="space-y-4">
              {state.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-16 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-1">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>Size: {item.size}</span>
                      <span>Color: {item.color}</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">
                    ₹{(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>

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
